-- ============================================================================
-- 🚀 DLPP LEGAL CASE MANAGEMENT SYSTEM - PRODUCTION SCHEMA
-- ============================================================================
-- INSTRUCTIONS TO RUN THIS SCHEMA:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor (left sidebar)
-- 4. Click "New query"
-- 5. Copy this ENTIRE file and paste it into the editor
-- 6. Click "RUN" button (or press Ctrl+Enter / Cmd+Enter)
-- 7. Wait for completion (takes 15-45 seconds)
-- 8. Check the output for "Schema Installation Complete!" message
--
-- WHAT THIS DOES:
-- ✅ Creates 24 tables (cases, documents, costs, RBAC, etc.)
-- ✅ Sets up 30+ indexes for performance
-- ✅ Creates 4 utility functions
-- ✅ Sets up 7 automated triggers
-- ✅ Seeds initial data (groups, modules, categories)
-- ✅ Configures permissions (RLS disabled for development)
--
-- AFTER RUNNING:
-- 1. Create storage bucket: 'case-documents' (see instructions below)
-- 2. Sign up through the app or create admin user
-- 3. Assign yourself to Super Admin group
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: DROP EXISTING OBJECTS (Clean install)
-- ============================================================================
-- This ensures no conflicts with existing tables/functions

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.cost_alerts CASCADE;
DROP TABLE IF EXISTS public.litigation_cost_history CASCADE;
DROP TABLE IF EXISTS public.litigation_cost_documents CASCADE;
DROP TABLE IF EXISTS public.litigation_costs CASCADE;
DROP TABLE IF EXISTS public.cost_categories CASCADE;
DROP TABLE IF EXISTS public.case_compliance_links CASCADE;
DROP TABLE IF EXISTS public.compliance_recommendations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.case_history CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.land_parcels CASCADE;
DROP TABLE IF EXISTS public.evidence CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.court_orders CASCADE;
DROP TABLE IF EXISTS public.parties CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.group_module_permissions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.check_returnable_date_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_returnable_date_event() CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission(UUID, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 3: CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USER MANAGEMENT
-- ----------------------------------------------------------------------------

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'legal_officer', 'registrar', 'survey_officer', 'director', 'auditor')) DEFAULT 'legal_officer',
  department TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- RBAC (Role-Based Access Control)
-- ----------------------------------------------------------------------------

-- Groups table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules table
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(100) NOT NULL,
    module_key VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    route VARCHAR(200),
    parent_module_id UUID REFERENCES public.modules(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group-Module Permissions
CREATE TABLE public.group_module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_print BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, module_id)
);

-- User-Group assignments
CREATE TABLE public.user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, group_id)
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- CASE MANAGEMENT
-- ----------------------------------------------------------------------------

-- Cases table
CREATE TABLE public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Basic Information
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Classification
  status TEXT CHECK (status IN ('under_review', 'in_court', 'mediation', 'tribunal', 'judgment', 'closed', 'settled')) DEFAULT 'under_review',
  case_type TEXT CHECK (case_type IN ('tort', 'compensation_claim', 'fraud', 'judicial_review', 'dispute', 'court_matter', 'title_claim', 'administrative_review', 'other')) DEFAULT 'other',
  matter_type TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  region TEXT,

  -- DLPP Role and Workflow
  dlpp_role TEXT CHECK (dlpp_role IN ('defendant', 'plaintiff')) DEFAULT 'defendant',
  track_number TEXT,
  case_origin TEXT,

  -- Filing Information
  proceeding_filed_date DATE,
  documents_served_date DATE,
  court_documents_type TEXT,

  -- Returnable Date
  returnable_date TIMESTAMP WITH TIME ZONE,
  returnable_type TEXT,

  -- Assignment
  assigned_officer_id UUID REFERENCES public.profiles(id),
  officer_assigned_date DATE,
  division_responsible TEXT,
  sol_gen_officer TEXT,
  dlpp_action_officer TEXT,
  assignment_footnote TEXT,

  -- Legal Details
  allegations TEXT,
  reliefs_sought TEXT,
  opposing_lawyer_name TEXT,
  section5_notice BOOLEAN DEFAULT false,

  -- Land Information
  land_description TEXT,
  zoning TEXT,
  survey_plan_no TEXT,
  lease_type TEXT,
  lease_commencement_date DATE,
  lease_expiration_date DATE,

  -- Audit Fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Parties
CREATE TABLE public.parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  party_type TEXT CHECK (party_type IN ('individual', 'company', 'government_entity', 'other')) DEFAULT 'individual',
  role TEXT CHECK (role IN ('plaintiff', 'defendant', 'witness', 'third_party', 'other')) DEFAULT 'other',
  contact_info JSONB,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Court Orders
CREATE TABLE public.court_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  court_reference TEXT NOT NULL,
  parties_to_proceeding TEXT,
  order_date DATE NOT NULL,
  order_type TEXT CHECK (order_type IN ('interlocutory', 'final', 'consent', 'default', 'other')) DEFAULT 'other',
  terms TEXT NOT NULL,
  conclusion_grounds TEXT,
  outcome TEXT,
  document_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- DOCUMENT MANAGEMENT
-- ----------------------------------------------------------------------------

-- Documents
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT CHECK (document_type IN ('filing', 'affidavit', 'correspondence', 'survey_report', 'contract', 'evidence', 'court_order', 'pleading', 'other')) DEFAULT 'other',
  document_category TEXT,
  is_confidential BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES public.documents(id)
);

-- Evidence
CREATE TABLE public.evidence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('photo', 'video', 'audio', 'other')) DEFAULT 'other',
  captured_at TIMESTAMP WITH TIME ZONE,
  gps_location JSONB,
  captured_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- LAND PARCELS
-- ----------------------------------------------------------------------------

CREATE TABLE public.land_parcels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  parcel_number TEXT NOT NULL,
  location TEXT,
  coordinates JSONB,
  area_sqm DECIMAL(15, 2),
  area_hectares DECIMAL(15, 4),
  survey_plan_url TEXT,
  land_type TEXT CHECK (land_type IN ('state_lease', 'customary', 'freehold', 'other')) DEFAULT 'other',
  current_use TEXT,
  zoning TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- TASKS AND EVENTS
-- ----------------------------------------------------------------------------

-- Tasks
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  completion_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Events
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT CHECK (event_type IN ('hearing', 'filing_deadline', 'response_deadline', 'meeting', 'mediation', 'conference', 'other')) DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  attendees JSONB,
  reminder_sent BOOLEAN DEFAULT false,
  auto_created BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- LITIGATION COSTS
-- ----------------------------------------------------------------------------

-- Cost Categories
CREATE TABLE public.cost_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_group VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Litigation Costs
CREATE TABLE public.litigation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,

    category_id UUID REFERENCES public.cost_categories(id),
    cost_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'PGK',

    date_incurred DATE NOT NULL,
    date_paid DATE,

    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('paid', 'unpaid', 'partial', 'waived', 'disputed')),
    amount_paid DECIMAL(15, 2) DEFAULT 0 CHECK (amount_paid >= 0),

    responsible_unit VARCHAR(255),
    responsible_authority VARCHAR(255),
    approved_by VARCHAR(255),

    description TEXT,
    reference_number VARCHAR(100),

    payee_name VARCHAR(255),
    payee_type VARCHAR(50),

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Cost Documents
CREATE TABLE public.litigation_cost_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_id UUID NOT NULL REFERENCES public.litigation_costs(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('invoice', 'receipt', 'quote', 'approval', 'other')) DEFAULT 'other',
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost History
CREATE TABLE public.litigation_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_id UUID NOT NULL REFERENCES public.litigation_costs(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Cost Alerts
CREATE TABLE public.cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    threshold_amount DECIMAL(15, 2),
    current_amount DECIMAL(15, 2),
    message TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- COMPLIANCE TRACKING
-- ----------------------------------------------------------------------------

-- Compliance Recommendations
CREATE TABLE public.compliance_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_text TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    source VARCHAR(100),
    date_issued DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Compliance Links
CREATE TABLE public.case_compliance_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES public.compliance_recommendations(id) ON DELETE CASCADE,
    compliance_status VARCHAR(20) CHECK (compliance_status IN ('compliant', 'non_compliant', 'partial', 'not_applicable')) DEFAULT 'not_applicable',
    notes TEXT,
    linked_by UUID REFERENCES auth.users(id),
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(case_id, recommendation_id)
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS AND HISTORY
-- ----------------------------------------------------------------------------

-- Case History
CREATE TABLE public.case_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('deadline', 'task', 'event', 'case_update', 'cost_alert', 'other')) DEFAULT 'other',
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- RBAC
CREATE INDEX idx_groups_name ON public.groups(group_name);
CREATE INDEX idx_modules_key ON public.modules(module_key);
CREATE INDEX idx_group_module_perms_group ON public.group_module_permissions(group_id);
CREATE INDEX idx_group_module_perms_module ON public.group_module_permissions(module_id);
CREATE INDEX idx_user_groups_user ON public.user_groups(user_id);
CREATE INDEX idx_user_groups_group ON public.user_groups(group_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);

-- Cases
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_case_type ON public.cases(case_type);
CREATE INDEX idx_cases_assigned_officer ON public.cases(assigned_officer_id);
CREATE INDEX idx_cases_created_at ON public.cases(created_at);
CREATE INDEX idx_cases_case_number ON public.cases(case_number);
CREATE INDEX idx_cases_returnable_date ON public.cases(returnable_date);

-- Related tables
CREATE INDEX idx_parties_case_id ON public.parties(case_id);
CREATE INDEX idx_court_orders_case_id ON public.court_orders(case_id);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);
CREATE INDEX idx_evidence_case_id ON public.evidence(case_id);
CREATE INDEX idx_land_parcels_case_id ON public.land_parcels(case_id);
CREATE INDEX idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_events_case_id ON public.events(case_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);

-- Litigation Costs
CREATE INDEX idx_litigation_costs_case_id ON public.litigation_costs(case_id);
CREATE INDEX idx_litigation_costs_category_id ON public.litigation_costs(category_id);
CREATE INDEX idx_litigation_costs_date_incurred ON public.litigation_costs(date_incurred);
CREATE INDEX idx_litigation_costs_payment_status ON public.litigation_costs(payment_status);
CREATE INDEX idx_litigation_costs_cost_type ON public.litigation_costs(cost_type);
CREATE INDEX idx_cost_documents_cost_id ON public.litigation_cost_documents(cost_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_case_history_case_id ON public.case_history(case_id);

-- ============================================================================
-- STEP 5: CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    module_key VARCHAR,
    can_create BOOLEAN,
    can_read BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    can_print BOOLEAN,
    can_approve BOOLEAN,
    can_export BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.module_key,
        BOOL_OR(gmp.can_create) as can_create,
        BOOL_OR(gmp.can_read) as can_read,
        BOOL_OR(gmp.can_update) as can_update,
        BOOL_OR(gmp.can_delete) as can_delete,
        BOOL_OR(gmp.can_print) as can_print,
        BOOL_OR(gmp.can_approve) as can_approve,
        BOOL_OR(gmp.can_export) as can_export
    FROM public.user_groups ug
    JOIN public.group_module_permissions gmp ON ug.group_id = gmp.group_id
    JOIN public.modules m ON gmp.module_id = m.id
    WHERE ug.user_id = p_user_id
      AND ug.is_active = true
      AND m.is_active = true
    GROUP BY m.module_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_module_key VARCHAR,
    p_permission VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT
        CASE p_permission
            WHEN 'create' THEN BOOL_OR(gmp.can_create)
            WHEN 'read' THEN BOOL_OR(gmp.can_read)
            WHEN 'update' THEN BOOL_OR(gmp.can_update)
            WHEN 'delete' THEN BOOL_OR(gmp.can_delete)
            WHEN 'print' THEN BOOL_OR(gmp.can_print)
            WHEN 'approve' THEN BOOL_OR(gmp.can_approve)
            WHEN 'export' THEN BOOL_OR(gmp.can_export)
            ELSE false
        END INTO has_perm
    FROM public.user_groups ug
    JOIN public.group_module_permissions gmp ON ug.group_id = gmp.group_id
    JOIN public.modules m ON gmp.module_id = m.id
    WHERE ug.user_id = p_user_id
      AND m.module_key = p_module_key
      AND ug.is_active = true
      AND m.is_active = true;

    RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check returnable date alerts
CREATE OR REPLACE FUNCTION check_returnable_date_alerts()
RETURNS TABLE(
  case_id UUID,
  case_number TEXT,
  title TEXT,
  returnable_date TIMESTAMP WITH TIME ZONE,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.case_number,
    c.title,
    c.returnable_date,
    EXTRACT(DAY FROM c.returnable_date - NOW())::INTEGER as days_until
  FROM public.cases c
  WHERE c.returnable_date IS NOT NULL
    AND c.returnable_date > NOW()
    AND c.returnable_date <= NOW() + INTERVAL '3 days'
    AND c.status NOT IN ('closed', 'settled')
  ORDER BY c.returnable_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create returnable date event
CREATE OR REPLACE FUNCTION auto_create_returnable_date_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.returnable_date IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.events
      WHERE case_id = NEW.id
        AND event_date = NEW.returnable_date
        AND auto_created = true
    ) THEN
      INSERT INTO public.events (
        case_id,
        event_type,
        title,
        description,
        event_date,
        location,
        auto_created,
        created_by
      ) VALUES (
        NEW.id,
        'hearing',
        COALESCE(NEW.returnable_type, 'Returnable Date') || ' - ' || NEW.case_number,
        'Case: ' || NEW.title || '. Matter type: ' || COALESCE(NEW.matter_type, 'N/A'),
        NEW.returnable_date,
        'Court',
        true,
        NEW.created_by
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_land_parcels_updated_at
    BEFORE UPDATE ON public.land_parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_court_orders_updated_at
    BEFORE UPDATE ON public.court_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_auto_create_returnable_event
    AFTER INSERT OR UPDATE OF returnable_date ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_returnable_date_event();

-- ============================================================================
-- STEP 7: CONFIGURE ROW LEVEL SECURITY (DISABLED FOR DEVELOPMENT)
-- ============================================================================

-- Disable RLS on all tables for development
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_module_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_cost_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_cost_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_compliance_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================================
-- STEP 8: SEED INITIAL DATA
-- ============================================================================

-- Insert cost categories
INSERT INTO public.cost_categories (code, name, description, category_group, display_order) VALUES
    ('LEGAL_INTERNAL', 'Legal Fees (Internal Counsel)', 'Fees for internal legal staff time and resources', 'Legal Fees', 1),
    ('LEGAL_EXTERNAL', 'Legal Fees (External Counsel)', 'Fees paid to external law firms and solicitors', 'Legal Fees', 2),
    ('COURT_FILING', 'Court Filing Fees', 'Fees for filing documents with the court', 'Court Fees', 3),
    ('COURT_PROCESSING', 'Court Processing Fees', 'Administrative court processing charges', 'Court Fees', 4),
    ('SETTLEMENT', 'Settlements', 'Agreed settlement amounts paid to resolve disputes', 'Settlements', 5),
    ('CONSENT_AWARD', 'Consent Awards', 'Court-approved consent judgment amounts', 'Settlements', 6),
    ('PENALTY', 'Penalties', 'Penalty payments ordered by court', 'Penalties', 7),
    ('COMPENSATION', 'Compensation Payments', 'Compensation paid to affected parties', 'Penalties', 8),
    ('DISBURSEMENT', 'Disbursements', 'Out-of-pocket expenses (travel, copying, etc.)', 'Disbursements', 9),
    ('INCIDENTAL', 'Incidental Legal Costs', 'Other miscellaneous legal-related costs', 'Disbursements', 10);

-- Insert default groups
INSERT INTO public.groups (group_name, description) VALUES
    ('Super Admin', 'Full system access with all permissions'),
    ('Legal Officer', 'Case management and legal operations'),
    ('Registrar', 'Document and filing management'),
    ('Survey Officer', 'Land parcel and survey management'),
    ('Director', 'Executive oversight and reporting'),
    ('Auditor', 'Read-only access for auditing purposes');

-- Insert default modules
INSERT INTO public.modules (module_name, module_key, description, icon, route, display_order) VALUES
    ('Dashboard', 'dashboard', 'Overview and statistics', 'LayoutDashboard', '/dashboard', 1),
    ('Cases', 'cases', 'Case management', 'Briefcase', '/cases', 2),
    ('Documents', 'documents', 'Document management', 'FileText', '/documents', 3),
    ('Land Parcels', 'land_parcels', 'Land parcel tracking', 'Map', '/land-parcels', 4),
    ('Calendar', 'calendar', 'Events and hearings', 'Calendar', '/calendar', 5),
    ('Tasks', 'tasks', 'Task management', 'CheckSquare', '/tasks', 6),
    ('Litigation Costs', 'litigation_costs', 'Cost tracking and reporting', 'DollarSign', '/litigation-costs', 7),
    ('Reports', 'reports', 'Reports and analytics', 'BarChart', '/reports', 8),
    ('Compliance', 'compliance', 'Compliance tracking', 'Shield', '/compliance', 9),
    ('Administration', 'admin', 'User and system administration', 'Settings', '/admin', 10);

-- Grant Super Admin full permissions on all modules
INSERT INTO public.group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
    g.id,
    m.id,
    true, true, true, true, true, true, true
FROM public.groups g
CROSS JOIN public.modules m
WHERE g.group_name = 'Super Admin';

-- Grant Legal Officer permissions (all except admin)
INSERT INTO public.group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
    g.id,
    m.id,
    true, true, true, true, true, false, true
FROM public.groups g
CROSS JOIN public.modules m
WHERE g.group_name = 'Legal Officer' AND m.module_key != 'admin';

-- ============================================================================
-- STEP 9: VERIFICATION
-- ============================================================================

-- Count tables created
SELECT
    '✅ Schema Installation Complete!' as status,
    COUNT(*) as total_tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Show summary
SELECT
    '📊 Summary' as info,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions,
    (SELECT COUNT(*) FROM cost_categories) as cost_categories,
    (SELECT COUNT(*) FROM groups) as groups,
    (SELECT COUNT(*) FROM modules) as modules;

-- ============================================================================
-- 🎉 INSTALLATION COMPLETE!
-- ============================================================================
--
-- NEXT STEPS:
--
-- 1. CREATE STORAGE BUCKET:
--    - Go to Storage in Supabase Dashboard
--    - Create bucket named: 'case-documents'
--    - Keep it private (unchecked)
--    - Then run storage policies (see DATABASE_SETUP_GUIDE_CONSOLIDATED.md)
--
-- 2. CREATE ADMIN USER:
--    - Sign up through your app OR
--    - Create user in Authentication → Users
--    - Then run this SQL (replace <user-id> with actual ID):
--
--      INSERT INTO public.user_groups (user_id, group_id)
--      SELECT '<user-id>', id FROM public.groups WHERE group_name = 'Super Admin';
--
-- 3. TEST THE APPLICATION:
--    - Login to the app
--    - Verify dashboard loads
--    - Create a test case
--    - Upload a document
--    - Check all modules are accessible
--
-- For detailed instructions, see: DATABASE_SETUP_GUIDE_CONSOLIDATED.md
--
-- ============================================================================

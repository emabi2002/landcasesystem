-- ============================================================================
-- DLPP Legal Case Management System - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This is the complete, consolidated schema for the Land Case Management System
-- Run this on a FRESH Supabase instance
-- ============================================================================
-- Version: 1.0
-- Date: 2026-02-28
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 1: USER MANAGEMENT
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- ============================================================================
-- PART 2: RBAC (Role-Based Access Control) SYSTEM
-- ============================================================================

-- Groups table (user roles)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules table (system features)
CREATE TABLE IF NOT EXISTS public.modules (
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

-- Group-Module Permissions (permission matrix)
CREATE TABLE IF NOT EXISTS public.group_module_permissions (
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

-- User-Group assignments (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, group_id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

-- ============================================================================
-- PART 3: CASE MANAGEMENT
-- ============================================================================

-- Cases table (enhanced with workflow fields)
CREATE TABLE IF NOT EXISTS public.cases (
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

  -- Returnable Date (hearing/appearance)
  returnable_date TIMESTAMP WITH TIME ZONE,
  returnable_type TEXT, -- directions hearing, substantive hearing, pre-trial conference, trial, mediation

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

-- Parties involved in cases
CREATE TABLE IF NOT EXISTS public.parties (
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
CREATE TABLE IF NOT EXISTS public.court_orders (
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

-- ============================================================================
-- PART 4: DOCUMENT MANAGEMENT
-- ============================================================================

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
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

-- Evidence (photos, videos, audio)
CREATE TABLE IF NOT EXISTS public.evidence (
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

-- ============================================================================
-- PART 5: LAND PARCELS
-- ============================================================================

-- Land Parcels
CREATE TABLE IF NOT EXISTS public.land_parcels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  parcel_number TEXT NOT NULL,
  location TEXT,
  coordinates JSONB, -- GeoJSON format: {"type": "Point", "coordinates": [lng, lat]}
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

-- ============================================================================
-- PART 6: TASKS AND EVENTS
-- ============================================================================

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
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

-- Events (hearings, filings, deadlines)
CREATE TABLE IF NOT EXISTS public.events (
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

-- ============================================================================
-- PART 7: LITIGATION COSTS
-- ============================================================================

-- Cost Categories
CREATE TABLE IF NOT EXISTS public.cost_categories (
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
CREATE TABLE IF NOT EXISTS public.litigation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,

    -- Cost Details
    category_id UUID REFERENCES public.cost_categories(id),
    cost_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'PGK',

    -- Date Information
    date_incurred DATE NOT NULL,
    date_paid DATE,

    -- Payment Status
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('paid', 'unpaid', 'partial', 'waived', 'disputed')),
    amount_paid DECIMAL(15, 2) DEFAULT 0 CHECK (amount_paid >= 0),

    -- Responsibility
    responsible_unit VARCHAR(255),
    responsible_authority VARCHAR(255),
    approved_by VARCHAR(255),

    -- Description
    description TEXT,
    reference_number VARCHAR(100),

    -- Vendor/Payee Information
    payee_name VARCHAR(255),
    payee_type VARCHAR(50),

    -- Audit Fields
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Litigation Cost Documents
CREATE TABLE IF NOT EXISTS public.litigation_cost_documents (
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

-- Litigation Cost History
CREATE TABLE IF NOT EXISTS public.litigation_cost_history (
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
CREATE TABLE IF NOT EXISTS public.cost_alerts (
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

-- ============================================================================
-- PART 8: COMPLIANCE AND TRACKING
-- ============================================================================

-- Compliance Recommendations
CREATE TABLE IF NOT EXISTS public.compliance_recommendations (
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
CREATE TABLE IF NOT EXISTS public.case_compliance_links (
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

-- ============================================================================
-- PART 9: NOTIFICATIONS AND HISTORY
-- ============================================================================

-- Case History
CREATE TABLE IF NOT EXISTS public.case_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
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
-- PART 10: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- RBAC
CREATE INDEX IF NOT EXISTS idx_groups_name ON public.groups(group_name);
CREATE INDEX IF NOT EXISTS idx_modules_key ON public.modules(module_key);
CREATE INDEX IF NOT EXISTS idx_group_module_perms_group ON public.group_module_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_module_perms_module ON public.group_module_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_user ON public.user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group ON public.user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);

-- Cases
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON public.cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON public.cases(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON public.cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_returnable_date ON public.cases(returnable_date);

-- Related tables
CREATE INDEX IF NOT EXISTS idx_parties_case_id ON public.parties(case_id);
CREATE INDEX IF NOT EXISTS idx_court_orders_case_id ON public.court_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON public.evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_case_id ON public.land_parcels(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_events_case_id ON public.events(case_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);

-- Litigation Costs
CREATE INDEX IF NOT EXISTS idx_litigation_costs_case_id ON public.litigation_costs(case_id);
CREATE INDEX IF NOT EXISTS idx_litigation_costs_category_id ON public.litigation_costs(category_id);
CREATE INDEX IF NOT EXISTS idx_litigation_costs_date_incurred ON public.litigation_costs(date_incurred);
CREATE INDEX IF NOT EXISTS idx_litigation_costs_payment_status ON public.litigation_costs(payment_status);
CREATE INDEX IF NOT EXISTS idx_litigation_costs_cost_type ON public.litigation_costs(cost_type);
CREATE INDEX IF NOT EXISTS idx_cost_documents_cost_id ON public.litigation_cost_documents(cost_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON public.case_history(case_id);

-- ============================================================================
-- PART 11: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_land_parcels_updated_at BEFORE UPDATE ON public.land_parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_court_orders_updated_at BEFORE UPDATE ON public.court_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_module_key VARCHAR,
    p_permission VARCHAR -- 'create', 'read', 'update', 'delete', 'print', 'approve', 'export'
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

-- Function to check returnable date alerts (3 days before)
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

-- Function to auto-create calendar event for returnable dates
CREATE OR REPLACE FUNCTION auto_create_returnable_date_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create event if returnable_date is set and not null
  IF NEW.returnable_date IS NOT NULL THEN
    -- Check if event already exists for this case and date
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
        'Case: ' || NEW.title || '. Matter type: ' || COALESCE(NEW.matter_type, 'N/A') || '. Alert set for 3 days before.',
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

-- Trigger for auto-creating returnable date events
CREATE TRIGGER trigger_auto_create_returnable_event
AFTER INSERT OR UPDATE OF returnable_date ON public.cases
FOR EACH ROW
EXECUTE FUNCTION auto_create_returnable_date_event();

-- ============================================================================
-- PART 12: ROW LEVEL SECURITY (RLS) - DISABLED FOR DEMO
-- ============================================================================
-- Note: For production, enable RLS and create proper policies
-- For development/demo purposes, RLS is DISABLED

-- Disable RLS on all tables
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
-- PART 13: INITIAL DATA SEEDING
-- ============================================================================

-- Insert default cost categories
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
    ('INCIDENTAL', 'Incidental Legal Costs', 'Other miscellaneous legal-related costs', 'Disbursements', 10)
ON CONFLICT (code) DO NOTHING;

-- Insert default groups
INSERT INTO public.groups (group_name, description) VALUES
    ('Super Admin', 'Full system access with all permissions'),
    ('Legal Officer', 'Case management and legal operations'),
    ('Registrar', 'Document and filing management'),
    ('Survey Officer', 'Land parcel and survey management'),
    ('Director', 'Executive oversight and reporting'),
    ('Auditor', 'Read-only access for auditing purposes')
ON CONFLICT (group_name) DO NOTHING;

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
    ('Administration', 'admin', 'User and system administration', 'Settings', '/admin', 10)
ON CONFLICT (module_key) DO NOTHING;

-- Grant Super Admin full permissions on all modules
INSERT INTO public.group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
    g.id,
    m.id,
    true, true, true, true, true, true, true
FROM public.groups g
CROSS JOIN public.modules m
WHERE g.group_name = 'Super Admin'
ON CONFLICT (group_id, module_id) DO NOTHING;

-- Grant Legal Officer permissions (all except admin)
INSERT INTO public.group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
    g.id,
    m.id,
    true, true, true, true, true, false, true
FROM public.groups g
CROSS JOIN public.modules m
WHERE g.group_name = 'Legal Officer' AND m.module_key != 'admin'
ON CONFLICT (group_id, module_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count tables created
SELECT
    'Tables Created' as info,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Show all tables
SELECT
    table_name,
    CASE
        WHEN table_name LIKE '%cost%' THEN 'Litigation Costs'
        WHEN table_name IN ('groups', 'modules', 'group_module_permissions', 'user_groups', 'audit_logs') THEN 'RBAC'
        WHEN table_name IN ('cases', 'parties', 'court_orders') THEN 'Case Management'
        WHEN table_name IN ('documents', 'evidence') THEN 'Documents'
        WHEN table_name IN ('tasks', 'events') THEN 'Tasks & Events'
        WHEN table_name IN ('notifications', 'case_history') THEN 'Notifications'
        WHEN table_name LIKE '%compliance%' THEN 'Compliance'
        ELSE 'Other'
    END as category
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY category, table_name;

-- ============================================================================
-- INSTALLATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create storage bucket: 'case-documents'
-- 2. Configure storage policies (see STORAGE_SETUP.md)
-- 3. Create first admin user
-- 4. Test the application
-- ============================================================================

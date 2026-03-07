-- ============================================================================
-- SUPER SIMPLE IDEMPOTENT MIGRATION
-- ============================================================================
-- This is the simplest possible migration - just creates tables if missing
-- No complex checks, no errors
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CREATE ALL TABLES (IF NOT EXISTS)
-- ============================================================================

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'legal_officer',
  department TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(100) NOT NULL,
    module_key VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    route VARCHAR(200),
    parent_module_id UUID REFERENCES modules(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Module Permissions
CREATE TABLE IF NOT EXISTS group_module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
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

-- User Groups
CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, group_id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Cases (minimal version first, then add columns)
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to cases table (idempotent - only adds if missing)
DO $$
BEGIN
  -- Add status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='status') THEN
    ALTER TABLE cases ADD COLUMN status TEXT DEFAULT 'under_review';
  END IF;

  -- Add case_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='case_type') THEN
    ALTER TABLE cases ADD COLUMN case_type TEXT DEFAULT 'other';
  END IF;

  -- Add matter_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='matter_type') THEN
    ALTER TABLE cases ADD COLUMN matter_type TEXT;
  END IF;

  -- Add priority
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='priority') THEN
    ALTER TABLE cases ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;

  -- Add region
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='region') THEN
    ALTER TABLE cases ADD COLUMN region TEXT;
  END IF;

  -- Add dlpp_role
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='dlpp_role') THEN
    ALTER TABLE cases ADD COLUMN dlpp_role TEXT DEFAULT 'defendant';
  END IF;

  -- Add track_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='track_number') THEN
    ALTER TABLE cases ADD COLUMN track_number TEXT;
  END IF;

  -- Add case_origin
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='case_origin') THEN
    ALTER TABLE cases ADD COLUMN case_origin TEXT;
  END IF;

  -- Add proceeding_filed_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='proceeding_filed_date') THEN
    ALTER TABLE cases ADD COLUMN proceeding_filed_date DATE;
  END IF;

  -- Add documents_served_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='documents_served_date') THEN
    ALTER TABLE cases ADD COLUMN documents_served_date DATE;
  END IF;

  -- Add court_documents_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='court_documents_type') THEN
    ALTER TABLE cases ADD COLUMN court_documents_type TEXT;
  END IF;

  -- Add returnable_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='returnable_date') THEN
    ALTER TABLE cases ADD COLUMN returnable_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add returnable_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='returnable_type') THEN
    ALTER TABLE cases ADD COLUMN returnable_type TEXT;
  END IF;

  -- Add assigned_officer_id (THE IMPORTANT ONE!)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='assigned_officer_id') THEN
    ALTER TABLE cases ADD COLUMN assigned_officer_id UUID REFERENCES profiles(id);
  END IF;

  -- Add officer_assigned_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='officer_assigned_date') THEN
    ALTER TABLE cases ADD COLUMN officer_assigned_date DATE;
  END IF;

  -- Add division_responsible
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='division_responsible') THEN
    ALTER TABLE cases ADD COLUMN division_responsible TEXT;
  END IF;

  -- Add sol_gen_officer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='sol_gen_officer') THEN
    ALTER TABLE cases ADD COLUMN sol_gen_officer TEXT;
  END IF;

  -- Add dlpp_action_officer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='dlpp_action_officer') THEN
    ALTER TABLE cases ADD COLUMN dlpp_action_officer TEXT;
  END IF;

  -- Add assignment_footnote
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='assignment_footnote') THEN
    ALTER TABLE cases ADD COLUMN assignment_footnote TEXT;
  END IF;

  -- Add allegations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='allegations') THEN
    ALTER TABLE cases ADD COLUMN allegations TEXT;
  END IF;

  -- Add reliefs_sought
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='reliefs_sought') THEN
    ALTER TABLE cases ADD COLUMN reliefs_sought TEXT;
  END IF;

  -- Add opposing_lawyer_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='opposing_lawyer_name') THEN
    ALTER TABLE cases ADD COLUMN opposing_lawyer_name TEXT;
  END IF;

  -- Add section5_notice
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='section5_notice') THEN
    ALTER TABLE cases ADD COLUMN section5_notice BOOLEAN DEFAULT false;
  END IF;

  -- Add land_description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='land_description') THEN
    ALTER TABLE cases ADD COLUMN land_description TEXT;
  END IF;

  -- Add zoning
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='zoning') THEN
    ALTER TABLE cases ADD COLUMN zoning TEXT;
  END IF;

  -- Add survey_plan_no
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='survey_plan_no') THEN
    ALTER TABLE cases ADD COLUMN survey_plan_no TEXT;
  END IF;

  -- Add lease_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='lease_type') THEN
    ALTER TABLE cases ADD COLUMN lease_type TEXT;
  END IF;

  -- Add lease_commencement_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='lease_commencement_date') THEN
    ALTER TABLE cases ADD COLUMN lease_commencement_date DATE;
  END IF;

  -- Add lease_expiration_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='lease_expiration_date') THEN
    ALTER TABLE cases ADD COLUMN lease_expiration_date DATE;
  END IF;
END $$;

-- Parties
CREATE TABLE IF NOT EXISTS parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  party_type TEXT DEFAULT 'individual',
  role TEXT DEFAULT 'other',
  contact_info JSONB,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Court Orders
CREATE TABLE IF NOT EXISTS court_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  court_reference TEXT NOT NULL,
  parties_to_proceeding TEXT,
  order_date DATE NOT NULL,
  order_type TEXT DEFAULT 'other',
  terms TEXT NOT NULL,
  conclusion_grounds TEXT,
  outcome TEXT,
  document_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT DEFAULT 'other',
  document_category TEXT,
  is_confidential BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id)
);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'other',
  captured_at TIMESTAMP WITH TIME ZONE,
  gps_location JSONB,
  captured_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Land Parcels
CREATE TABLE IF NOT EXISTS land_parcels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  parcel_number TEXT NOT NULL,
  location TEXT,
  coordinates JSONB,
  area_sqm DECIMAL(15, 2),
  area_hectares DECIMAL(15, 4),
  survey_plan_url TEXT,
  land_type TEXT DEFAULT 'other',
  current_use TEXT,
  zoning TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  completion_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  attendees JSONB,
  reminder_sent BOOLEAN DEFAULT false,
  auto_created BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost Categories
CREATE TABLE IF NOT EXISTS cost_categories (
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
CREATE TABLE IF NOT EXISTS litigation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    category_id UUID REFERENCES cost_categories(id),
    cost_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PGK',
    date_incurred DATE NOT NULL,
    date_paid DATE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    amount_paid DECIMAL(15, 2) DEFAULT 0,
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

-- Litigation Cost Documents
CREATE TABLE IF NOT EXISTS litigation_cost_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_id UUID NOT NULL REFERENCES litigation_costs(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'other',
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Litigation Cost History
CREATE TABLE IF NOT EXISTS litigation_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_id UUID NOT NULL REFERENCES litigation_costs(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Cost Alerts
CREATE TABLE IF NOT EXISTS cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    threshold_amount DECIMAL(15, 2),
    current_amount DECIMAL(15, 2),
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Recommendations
CREATE TABLE IF NOT EXISTS compliance_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_text TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    source VARCHAR(100),
    date_issued DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Compliance Links
CREATE TABLE IF NOT EXISTS case_compliance_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES compliance_recommendations(id) ON DELETE CASCADE,
    compliance_status VARCHAR(20) DEFAULT 'not_applicable',
    notes TEXT,
    linked_by UUID REFERENCES auth.users(id),
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(case_id, recommendation_id)
);

-- Case History
CREATE TABLE IF NOT EXISTS case_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'other',
  priority VARCHAR(20) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES (IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(group_name);
CREATE INDEX IF NOT EXISTS idx_modules_key ON modules(module_key);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON cases(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================================
-- DISABLE RLS (FOR DEVELOPMENT)
-- ============================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_module_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE land_parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE litigation_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_history DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- SEED DATA (ON CONFLICT DO NOTHING = IDEMPOTENT)
-- ============================================================================

-- Cost categories
INSERT INTO cost_categories (code, name, description, category_group, display_order) VALUES
    ('LEGAL_INTERNAL', 'Legal Fees (Internal)', 'Internal legal staff', 'Legal Fees', 1),
    ('LEGAL_EXTERNAL', 'Legal Fees (External)', 'External law firms', 'Legal Fees', 2),
    ('COURT_FILING', 'Court Filing Fees', 'Court filing fees', 'Court Fees', 3),
    ('SETTLEMENT', 'Settlements', 'Settlement payments', 'Settlements', 5),
    ('PENALTY', 'Penalties', 'Court ordered penalties', 'Penalties', 7)
ON CONFLICT (code) DO NOTHING;

-- Groups
INSERT INTO groups (group_name, description) VALUES
    ('Super Admin', 'Full system access'),
    ('Legal Officer', 'Case management'),
    ('Registrar', 'Document management'),
    ('Director', 'Executive oversight'),
    ('Auditor', 'Read-only access')
ON CONFLICT (group_name) DO NOTHING;

-- Modules
INSERT INTO modules (module_name, module_key, description, icon, route, display_order) VALUES
    ('Dashboard', 'dashboard', 'Overview', 'LayoutDashboard', '/dashboard', 1),
    ('Cases', 'cases', 'Case management', 'Briefcase', '/cases', 2),
    ('Documents', 'documents', 'Documents', 'FileText', '/documents', 3),
    ('Calendar', 'calendar', 'Events', 'Calendar', '/calendar', 4),
    ('Tasks', 'tasks', 'Tasks', 'CheckSquare', '/tasks', 5),
    ('Administration', 'admin', 'Administration', 'Settings', '/admin', 10)
ON CONFLICT (module_key) DO NOTHING;

-- Grant Super Admin permissions
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT g.id, m.id, true, true, true, true, true, true, true
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Super Admin'
ON CONFLICT (group_id, module_id) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Base schema created successfully!' as status;
SELECT 'Next: Run SCHEMA_MIGRATION_CANONICAL_WORKFLOW.sql' as next_step;

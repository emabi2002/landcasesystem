-- ============================================
-- LAND CASE MANAGEMENT SYSTEM (LCMS)
-- WORKFLOW-DRIVEN DATABASE SCHEMA
-- ============================================
-- This schema implements the 8-step workflow:
-- 1. Case Reception & Registration
-- 2. Directions Module
-- 3. Case Assignment Module
-- 4-5. Litigation Handling & Filing
-- 6. Manager Compliance & Internal Divisions
-- 7. Case Closure & Court Orders
-- 8. Notifications to Parties
-- ============================================
-- CORE PRINCIPLE: One master case → many specialized modules
-- All modules reference cases.id via case_id foreign key
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SECTION 1: USER & ROLE MODEL
-- ============================================

-- Users table (base user identity)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Roles table (system roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  role_name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User-roles junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  assigned_by UUID REFERENCES public.users(id),
  UNIQUE(user_id, role_id)
);

-- Insert standard roles
INSERT INTO public.roles (role_name, description) VALUES
  ('Secretary Lands', 'Secretary for Department of Lands & Physical Planning'),
  ('Director Legal Services', 'Director of Legal Services'),
  ('Manager Legal Services', 'Manager of Legal Services'),
  ('Litigation Officer', 'Legal Officer handling litigation cases'),
  ('Reception Staff', 'Reception/Registry clerk'),
  ('Division Officer', 'Officer from various divisions (Survey, Titles, etc.)'),
  ('System Administrator', 'System admin with full access')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================
-- SECTION 2: CORE - MASTER CASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Case classification
  case_type TEXT, -- e.g. "Section 160", "Summons", "Judicial Review"

  -- Dates
  received_date DATE, -- Date papers received at reception (Step 1)

  -- Status tracking
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered',
    'awaiting_directions',
    'assigned_to_officer',
    'in_progress',
    'awaiting_court_order',
    'awaiting_internal_compliance',
    'closed'
  )),

  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.cases IS 'Master cases table - anchor for all workflow modules';
COMMENT ON COLUMN public.cases.case_number IS 'Human-readable unique reference (e.g. LCMS-2025-0001)';
COMMENT ON COLUMN public.cases.status IS 'Current workflow status of the case';

CREATE INDEX IF NOT EXISTS idx_cases_case_number ON public.cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_received_date ON public.cases(received_date);

-- ============================================
-- SECTION 3: MODULE 1 - CASE RECEPTION & REGISTRATION (Step 1, 3, 3a, 3b)
-- ============================================

-- Table: case_intake_records
-- Records each set of papers received (one-to-many per case)
CREATE TABLE IF NOT EXISTS public.case_intake_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Reception details
  received_by UUID REFERENCES public.users(id) NOT NULL,
  received_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Document details
  document_type TEXT NOT NULL, -- Section 5 Notice, Search Warrant, Court Order, Summons, etc.
  source TEXT, -- "National Court", "Ombudsman Commission", "Police", etc.
  acknowledgement_number TEXT,

  -- Additional info
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.case_intake_records IS 'Step 1: Records of documents received at reception';
CREATE INDEX IF NOT EXISTS idx_intake_case_id ON public.case_intake_records(case_id);
CREATE INDEX IF NOT EXISTS idx_intake_received_date ON public.case_intake_records(received_date);

-- Table: case_intake_documents
-- Stores references to uploaded intake documents
CREATE TABLE IF NOT EXISTS public.case_intake_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  intake_record_id UUID REFERENCES public.case_intake_records(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  uploaded_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_intake_docs_record_id ON public.case_intake_documents(intake_record_id);

-- ============================================
-- SECTION 4: MODULE 2 - DIRECTIONS (Step 2)
-- ============================================

-- Table: directions
-- Records directions issued by authorities (many per case)
CREATE TABLE IF NOT EXISTS public.directions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Who issued the direction
  issued_by UUID REFERENCES public.users(id) NOT NULL,
  authority_role TEXT NOT NULL, -- "Secretary Lands", "Director Legal Services", "Manager Legal Services"
  direction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Direction content
  direction_type TEXT, -- "Open Court File", "Refer to Litigation", "Seek SG Advice", etc.
  content TEXT NOT NULL,
  reference_document_url TEXT, -- Optional scanned memo

  -- Next actions
  next_action_required TEXT,
  status_effect TEXT, -- Optional: how this affects case status

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.directions IS 'Step 2: Directions from Secretary/Director/Manager Legal - can be issued repeatedly over case lifetime';
CREATE INDEX IF NOT EXISTS idx_directions_case_id ON public.directions(case_id);
CREATE INDEX IF NOT EXISTS idx_directions_issued_by ON public.directions(issued_by);
CREATE INDEX IF NOT EXISTS idx_directions_date ON public.directions(direction_date);

-- ============================================
-- SECTION 5: MODULE 3 - CASE ASSIGNMENT (Step 3, 3a, 3b)
-- ============================================

-- Table: case_assignments
-- Tracks officer/lawyer assignments to cases
-- SUPPORTS MULTIPLE LAWYERS PER CASE - both new (3a) and existing (3b) cases
-- Tracks reassignments with full explanation
CREATE TABLE IF NOT EXISTS public.case_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Assignment details
  assigned_to UUID REFERENCES public.users(id) NOT NULL, -- Litigation officer/lawyer
  assigned_by UUID REFERENCES public.users(id) NOT NULL, -- Manager who assigned
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- New vs Existing case (Step 3a vs 3b)
  is_new_case BOOLEAN DEFAULT false, -- TRUE = new case (3a), FALSE = existing case (3b)

  -- Assignment type and reason
  assignment_type TEXT DEFAULT 'initial' CHECK (assignment_type IN (
    'initial',        -- First assignment for new case
    'additional',     -- Additional lawyer added to case (multiple lawyers)
    'reassignment',   -- Case reassigned from another lawyer
    'temporary',      -- Temporary coverage
    'lead_counsel'    -- Designated as lead on the case
  )),
  assignment_reason TEXT, -- General reason for assignment
  reassignment_explanation TEXT, -- REQUIRED when assignment_type = 'reassignment'

  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_by UUID REFERENCES public.users(id),
  ending_reason TEXT, -- Why assignment ended (completed, reassigned, etc.)

  -- Role on case (for multiple lawyers on same case)
  role_on_case TEXT, -- e.g., "Lead Counsel", "Co-Counsel", "Assisting Officer"

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.case_assignments IS 'Step 3: Officer/lawyer assignments - MULTIPLE lawyers per case supported, tracks new (3a) vs existing (3b) cases, full reassignment history';
COMMENT ON COLUMN public.case_assignments.is_new_case IS 'TRUE = New case (3a) requiring court file creation, FALSE = Existing case (3b)';
COMMENT ON COLUMN public.case_assignments.assignment_type IS 'Type: initial, additional (multiple lawyers), reassignment, temporary, lead_counsel';
COMMENT ON COLUMN public.case_assignments.reassignment_explanation IS 'REQUIRED explanation when assignment_type = reassignment - why case was reassigned';
COMMENT ON COLUMN public.case_assignments.role_on_case IS 'For multiple lawyers: Lead Counsel, Co-Counsel, Assisting Officer, etc.';

CREATE INDEX IF NOT EXISTS idx_assignments_case_id ON public.case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.case_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_is_active ON public.case_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_assignments_is_new_case ON public.case_assignments(is_new_case);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON public.case_assignments(assignment_type);

-- Table: case_files
-- Tracks physical/electronic file numbers (Step 3a - new case setup)
CREATE TABLE IF NOT EXISTS public.case_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- File numbers
  court_file_number TEXT,
  land_file_number TEXT,
  titles_file_number TEXT,

  -- Civil matter registration
  civil_matter_type TEXT, -- "Section 160", "Summons", "Case instituted by DLPP"

  -- Audit
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.case_files IS 'Step 3a: Court file, land file, titles file tracking for new cases';
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_files_case_id ON public.case_files(case_id);

-- ============================================
-- SECTION 6: MODULE 4-5 - LITIGATION HANDLING & FILING (Steps 4 & 5)
-- ============================================

-- Table: case_documents
-- All documents related to the case
CREATE TABLE IF NOT EXISTS public.case_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Upload details
  uploaded_by UUID REFERENCES public.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Document classification
  document_type TEXT NOT NULL, -- "Originating Summons", "Affidavit", "Court Order", "Letter to SG", "SG Advice"
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  description TEXT,

  -- Internal vs external
  is_internal BOOLEAN DEFAULT false,
  sent_to TEXT, -- "Solicitor-General", "Private Lawyer XYZ", etc.

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.case_documents IS 'Steps 4-5: All case documents - instruments, filings, correspondence';
CREATE INDEX IF NOT EXISTS idx_case_docs_case_id ON public.case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_docs_type ON public.case_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_case_docs_uploaded_at ON public.case_documents(uploaded_at);

-- Table: case_filings
-- Formal filings (court, SG, service)
CREATE TABLE IF NOT EXISTS public.case_filings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Filing details
  filed_by UUID REFERENCES public.users(id) NOT NULL,
  filed_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  filing_type TEXT NOT NULL, -- "Filed in Court", "Filed with SG", "Served on Plaintiff/Defendant"
  reference_number TEXT, -- Court registry reference or SG reference

  -- Associated document
  associated_document_id UUID REFERENCES public.case_documents(id),

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.case_filings IS 'Step 4-5: Formal filings and service records';
CREATE INDEX IF NOT EXISTS idx_filings_case_id ON public.case_filings(case_id);
CREATE INDEX IF NOT EXISTS idx_filings_date ON public.case_filings(filed_date);

-- Table: solicitor_general_updates
-- Communications and updates from SG/Private Lawyers
CREATE TABLE IF NOT EXISTS public.solicitor_general_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Source
  received_from TEXT NOT NULL, -- "Solicitor-General", "Private Lawyer Name"
  received_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Content
  summary_of_advice TEXT NOT NULL,
  next_steps TEXT,

  -- Associated document
  document_id UUID REFERENCES public.case_documents(id),

  -- Audit
  captured_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.solicitor_general_updates IS 'Step 5: Updates and advice from Solicitor-General and private lawyers';
CREATE INDEX IF NOT EXISTS idx_sg_updates_case_id ON public.solicitor_general_updates(case_id);
CREATE INDEX IF NOT EXISTS idx_sg_updates_date ON public.solicitor_general_updates(received_date);

-- ============================================
-- SECTION 7: MODULE 6 - MANAGER COMPLIANCE & INTERNAL DIVISIONS (Step 6)
-- ============================================

-- Table: manager_memos
-- Memos from Manager Legal to internal divisions
CREATE TABLE IF NOT EXISTS public.manager_memos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Memo details
  issued_by UUID REFERENCES public.users(id) NOT NULL, -- Manager Legal
  issued_to_division TEXT NOT NULL, -- "Survey Division", "Registrar of Titles", etc.
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Content
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  attached_order_id UUID REFERENCES public.case_documents(id), -- Court order attachment

  -- Compliance tracking
  due_date DATE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged', 'in_progress', 'completed')),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.manager_memos IS 'Step 6: Manager Legal memos to internal divisions for compliance';
CREATE INDEX IF NOT EXISTS idx_manager_memos_case_id ON public.manager_memos(case_id);
CREATE INDEX IF NOT EXISTS idx_manager_memos_division ON public.manager_memos(issued_to_division);
CREATE INDEX IF NOT EXISTS idx_manager_memos_status ON public.manager_memos(status);

-- Table: division_compliance_updates
-- Responses from internal divisions
CREATE TABLE IF NOT EXISTS public.division_compliance_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  memo_id UUID REFERENCES public.manager_memos(id) ON DELETE CASCADE NOT NULL,

  -- Update details
  updated_by UUID REFERENCES public.users(id) NOT NULL, -- Division officer
  update_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Status update
  status TEXT NOT NULL, -- "implemented", "partially implemented", "cannot comply"
  details TEXT NOT NULL,

  -- Attachments
  attachment_id UUID REFERENCES public.case_documents(id),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.division_compliance_updates IS 'Step 6: Division responses to Manager Legal memos';
CREATE INDEX IF NOT EXISTS idx_division_updates_memo_id ON public.division_compliance_updates(memo_id);

-- ============================================
-- SECTION 8: MODULE 7 - CASE CLOSURE & COURT ORDERS (Step 7)
-- ============================================

-- Table: court_orders
-- Final court orders and decisions
CREATE TABLE IF NOT EXISTS public.court_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Order details
  order_date DATE NOT NULL,
  order_type TEXT NOT NULL, -- "Default Judgment", "Summary Determination", "Dismissed", "Appeal granted", etc.
  order_text TEXT NOT NULL, -- Operative part of order

  -- Associated document
  document_id UUID REFERENCES public.case_documents(id), -- Scanned order

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.court_orders IS 'Step 7: Final court orders and judgments';
CREATE INDEX IF NOT EXISTS idx_court_orders_case_id ON public.court_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_court_orders_date ON public.court_orders(order_date);

-- Table: case_closure
-- Case closure record
CREATE TABLE IF NOT EXISTS public.case_closure (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Closure details
  closure_date DATE NOT NULL,
  closure_reason TEXT NOT NULL,
  closing_officer_id UUID REFERENCES public.users(id),

  -- Summary
  summary_of_findings TEXT,
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.case_closure IS 'Step 7: Case closure record - triggers status = closed';
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_closure_case_id ON public.case_closure(case_id);

-- Trigger to update case status on closure
CREATE OR REPLACE FUNCTION update_case_status_on_closure()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cases
  SET status = 'closed', updated_at = NOW()
  WHERE id = NEW.case_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_case_status_on_closure
  AFTER INSERT ON public.case_closure
  FOR EACH ROW
  EXECUTE FUNCTION update_case_status_on_closure();

-- ============================================
-- SECTION 9: MODULE 8 - NOTIFICATIONS TO PARTIES (Step 8)
-- ============================================

-- Table: parties
-- Parties to proceedings
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  party_name TEXT NOT NULL,
  party_type TEXT, -- "Individual", "Organization", "Government Entity"
  contact_details JSONB, -- Email, phone, address
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.parties IS 'Step 8: Parties to legal proceedings';

-- Table: case_parties
-- Junction table linking cases to parties
CREATE TABLE IF NOT EXISTS public.case_parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- "Plaintiff", "Defendant", "Interested Party"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(case_id, party_id, role)
);

COMMENT ON TABLE public.case_parties IS 'Junction table linking cases to parties with their roles';
CREATE INDEX IF NOT EXISTS idx_case_parties_case_id ON public.case_parties(case_id);
CREATE INDEX IF NOT EXISTS idx_case_parties_party_id ON public.case_parties(party_id);

-- Table: notifications
-- Final notifications to parties and SG
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Recipient
  recipient_party_id UUID REFERENCES public.parties(id), -- NULL if SG/other
  recipient_description TEXT, -- For SG or others not in parties list

  -- Notification details
  notification_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  channel TEXT, -- "letter", "email", "hand delivered"
  subject TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Associated document
  document_id UUID REFERENCES public.case_documents(id), -- Copy of letter

  -- Audit
  sent_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.notifications IS 'Step 8: Final notifications to parties, SG, and lawyers';
CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON public.notifications(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON public.notifications(notification_date);

-- ============================================
-- SECTION 10: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_intake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_intake_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitor_general_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_compliance_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_closure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for authenticated users initially)
CREATE POLICY "Allow all for authenticated users" ON public.cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_intake_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_intake_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.directions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_filings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.solicitor_general_updates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.manager_memos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.division_compliance_updates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.court_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_closure FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.parties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.case_parties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  WORKFLOW SCHEMA CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TABLES CREATED:';
  RAISE NOTICE '  ✅ Core: cases, users, roles, user_roles';
  RAISE NOTICE '  ✅ Module 1 (Reception): case_intake_records, case_intake_documents';
  RAISE NOTICE '  ✅ Module 2 (Directions): directions';
  RAISE NOTICE '  ✅ Module 3 (Assignment): case_assignments, case_files';
  RAISE NOTICE '  ✅ Module 4-5 (Litigation): case_documents, case_filings, solicitor_general_updates';
  RAISE NOTICE '  ✅ Module 6 (Compliance): manager_memos, division_compliance_updates';
  RAISE NOTICE '  ✅ Module 7 (Closure): court_orders, case_closure';
  RAISE NOTICE '  ✅ Module 8 (Notifications): parties, case_parties, notifications';
  RAISE NOTICE '';
  RAISE NOTICE 'ALL MODULES LINKED VIA case_id → cases.id';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS ENABLED ON ALL TABLES';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

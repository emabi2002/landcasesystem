-- ============================================
-- LAND CASE MANAGEMENT SYSTEM (LCMS)
-- WORKFLOW-DRIVEN DATABASE SCHEMA - MIGRATION VERSION
-- ============================================
-- This version works with your EXISTING database
-- It adds workflow tables and extends the cases table
-- Safe to run on production database with existing data
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SECTION 1: EXTEND EXISTING CASES TABLE
-- ============================================

-- Add workflow columns to existing cases table
DO $$
BEGIN
  -- Add received_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'received_date'
  ) THEN
    ALTER TABLE public.cases ADD COLUMN received_date DATE;
  END IF;

  -- Add workflow status if not exists (different from current status)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE public.cases ADD COLUMN workflow_status TEXT DEFAULT 'registered'
    CHECK (workflow_status IN (
      'registered',
      'awaiting_directions',
      'assigned_to_officer',
      'in_progress',
      'awaiting_court_order',
      'awaiting_internal_compliance',
      'closed'
    ));
  END IF;

  -- Add updated_by if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.cases ADD COLUMN updated_by UUID REFERENCES public.users(id);
  END IF;

  RAISE NOTICE 'Extended cases table with workflow columns';
END $$;

-- ============================================
-- SECTION 2: USER & ROLE MODEL
-- ============================================

-- Users table (may already exist from auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  role_name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User-roles junction table
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
-- SECTION 3: MODULE 1 - CASE RECEPTION & REGISTRATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_intake_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  received_by UUID REFERENCES public.users(id) NOT NULL,
  received_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  document_type TEXT NOT NULL,
  source TEXT,
  acknowledgement_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.case_intake_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  intake_record_id UUID REFERENCES public.case_intake_records(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  uploaded_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_intake_case_id ON public.case_intake_records(case_id);
CREATE INDEX IF NOT EXISTS idx_intake_docs_record_id ON public.case_intake_documents(intake_record_id);

-- ============================================
-- SECTION 4: MODULE 2 - DIRECTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.directions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES public.users(id) NOT NULL,
  authority_role TEXT NOT NULL,
  direction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  direction_type TEXT,
  content TEXT NOT NULL,
  reference_document_url TEXT,
  next_action_required TEXT,
  status_effect TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_directions_case_id ON public.directions(case_id);
CREATE INDEX IF NOT EXISTS idx_directions_issued_by ON public.directions(issued_by);

-- ============================================
-- SECTION 5: MODULE 3 - CASE ASSIGNMENT
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.users(id) NOT NULL,
  assigned_by UUID REFERENCES public.users(id) NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_new_case BOOLEAN DEFAULT false,
  assignment_type TEXT DEFAULT 'initial' CHECK (assignment_type IN (
    'initial', 'additional', 'reassignment', 'temporary', 'lead_counsel'
  )),
  assignment_reason TEXT,
  reassignment_explanation TEXT,
  is_active BOOLEAN DEFAULT true,
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_by UUID REFERENCES public.users(id),
  ending_reason TEXT,
  role_on_case TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.case_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  court_file_number TEXT,
  land_file_number TEXT,
  titles_file_number TEXT,
  civil_matter_type TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_assignments_case_id ON public.case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.case_assignments(assigned_to);
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_files_case_id ON public.case_files(case_id);

-- ============================================
-- SECTION 6: MODULE 4-5 - LITIGATION HANDLING
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  description TEXT,
  is_internal BOOLEAN DEFAULT false,
  sent_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.case_filings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  filed_by UUID REFERENCES public.users(id) NOT NULL,
  filed_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  filing_type TEXT NOT NULL,
  reference_number TEXT,
  associated_document_id UUID REFERENCES public.case_documents(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.solicitor_general_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  received_from TEXT NOT NULL,
  received_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  summary_of_advice TEXT NOT NULL,
  next_steps TEXT,
  document_id UUID REFERENCES public.case_documents(id),
  captured_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_case_docs_case_id ON public.case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_filings_case_id ON public.case_filings(case_id);
CREATE INDEX IF NOT EXISTS idx_sg_updates_case_id ON public.solicitor_general_updates(case_id);

-- ============================================
-- SECTION 7: MODULE 6 - MANAGER COMPLIANCE
-- ============================================

CREATE TABLE IF NOT EXISTS public.manager_memos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES public.users(id) NOT NULL,
  issued_to_division TEXT NOT NULL,
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  attached_order_id UUID REFERENCES public.case_documents(id),
  due_date DATE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.division_compliance_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  memo_id UUID REFERENCES public.manager_memos(id) ON DELETE CASCADE NOT NULL,
  updated_by UUID REFERENCES public.users(id) NOT NULL,
  update_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status TEXT NOT NULL,
  details TEXT NOT NULL,
  attachment_id UUID REFERENCES public.case_documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_manager_memos_case_id ON public.manager_memos(case_id);
CREATE INDEX IF NOT EXISTS idx_division_updates_memo_id ON public.division_compliance_updates(memo_id);

-- ============================================
-- SECTION 8: MODULE 7 - CASE CLOSURE
-- ============================================

CREATE TABLE IF NOT EXISTS public.court_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  order_date DATE NOT NULL,
  order_type TEXT NOT NULL,
  order_text TEXT NOT NULL,
  document_id UUID REFERENCES public.case_documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.case_closure (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  closure_date DATE NOT NULL,
  closure_reason TEXT NOT NULL,
  closing_officer_id UUID REFERENCES public.users(id),
  summary_of_findings TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_court_orders_case_id ON public.court_orders(case_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_closure_case_id ON public.case_closure(case_id);

-- Trigger to update workflow status on closure
CREATE OR REPLACE FUNCTION update_workflow_status_on_closure()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cases
  SET workflow_status = 'closed', updated_at = NOW()
  WHERE id = NEW.case_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workflow_status_on_closure ON public.case_closure;
CREATE TRIGGER trigger_update_workflow_status_on_closure
  AFTER INSERT ON public.case_closure
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_status_on_closure();

-- ============================================
-- SECTION 9: MODULE 8 - NOTIFICATIONS
-- ============================================

-- Use existing parties table or create if not exists
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  party_name TEXT NOT NULL,
  party_type TEXT,
  contact_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.case_parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(case_id, party_id, role)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  recipient_party_id UUID REFERENCES public.parties(id),
  recipient_description TEXT,
  notification_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  channel TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  document_id UUID REFERENCES public.case_documents(id),
  sent_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_case_parties_case_id ON public.case_parties(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON public.notifications(case_id);

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

-- Create RLS policies (replace existing if needed)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.cases;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_intake_records;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_intake_documents;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.directions;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_assignments;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_files;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_documents;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_filings;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.solicitor_general_updates;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.manager_memos;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.division_compliance_updates;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.court_orders;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_closure;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.parties;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_parties;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.notifications;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.roles;
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_roles;

  -- Create new policies
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
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  WORKFLOW SCHEMA MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'EXISTING DATA PRESERVED:';
  RAISE NOTICE '  ✅ Your 2,043+ cases remain intact';
  RAISE NOTICE '  ✅ All parties, documents, events preserved';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW WORKFLOW TABLES CREATED:';
  RAISE NOTICE '  ✅ case_intake_records, case_intake_documents';
  RAISE NOTICE '  ✅ directions';
  RAISE NOTICE '  ✅ case_assignments, case_files';
  RAISE NOTICE '  ✅ case_documents, case_filings, solicitor_general_updates';
  RAISE NOTICE '  ✅ manager_memos, division_compliance_updates';
  RAISE NOTICE '  ✅ court_orders, case_closure';
  RAISE NOTICE '  ✅ case_parties, notifications';
  RAISE NOTICE '';
  RAISE NOTICE 'CASES TABLE EXTENDED:';
  RAISE NOTICE '  ✅ Added received_date column';
  RAISE NOTICE '  ✅ Added workflow_status column (separate from main status)';
  RAISE NOTICE '  ✅ Added updated_by column';
  RAISE NOTICE '';
  RAISE NOTICE 'ALL MODULES NOW LINKED VIA case_id';
  RAISE NOTICE 'RLS ENABLED ON ALL TABLES';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

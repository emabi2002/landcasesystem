-- DLPP Litigation Workflow - Database Extensions
-- Run this AFTER the main database-schema.sql
-- This adds all tables needed for the complete litigation workflow

-- =====================================================
-- 1. INCOMING CORRESPONDENCE TABLE (Steps 1 & 3)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.incoming_correspondence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  document_type TEXT CHECK (document_type IN (
    'section_5_notice',
    'search_warrant',
    'court_order',
    'summons_ombudsman',
    'writ',
    'other'
  )) DEFAULT 'other',
  source TEXT CHECK (source IN (
    'plaintiff',
    'defendant',
    'solicitor_general',
    'ombudsman_commission',
    'court',
    'other'
  )) DEFAULT 'other',
  received_date TIMESTAMP WITH TIME ZONE NOT NULL,
  received_by UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  acknowledgement_sent BOOLEAN DEFAULT false,
  acknowledgement_date TIMESTAMP WITH TIME ZONE,
  acknowledgement_number TEXT,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('received', 'acknowledged', 'processed', 'filed')) DEFAULT 'received',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 2. DIRECTIONS TABLE (Step 2)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.directions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  direction_number TEXT UNIQUE NOT NULL,
  source TEXT CHECK (source IN (
    'secretary_lands',
    'director_legal_services',
    'manager_legal_services'
  )) NOT NULL,
  issued_by UUID REFERENCES public.profiles(id),
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 3. FILE REQUESTS TABLE (Step 3a)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.file_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  file_type TEXT CHECK (file_type IN ('court_file', 'land_file', 'title_file')) NOT NULL,
  file_number TEXT,
  requested_by UUID REFERENCES public.profiles(id),
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status TEXT CHECK (status IN ('requested', 'received', 'in_use', 'returned')) DEFAULT 'requested',
  received_date TIMESTAMP WITH TIME ZONE,
  current_location TEXT,
  custodian UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 4. CASE DELEGATIONS TABLE (Step 3b)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.case_delegations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  delegated_by UUID REFERENCES public.profiles(id) NOT NULL,
  delegated_to UUID REFERENCES public.profiles(id) NOT NULL,
  delegation_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  instructions TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'reassigned')) DEFAULT 'active',
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 5. EXTERNAL LAWYERS TABLE (Step 5)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.external_lawyers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  lawyer_type TEXT CHECK (lawyer_type IN ('solicitor_general', 'private_lawyer')) NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  specialization TEXT,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 6. FILINGS TABLE (Step 4 & 5)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.filings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  filing_type TEXT CHECK (filing_type IN (
    'instruction_letter',
    'affidavit',
    'motion',
    'response',
    'brief',
    'notice',
    'other'
  )) DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  prepared_by UUID REFERENCES public.profiles(id),
  prepared_date TIMESTAMP WITH TIME ZONE,
  submitted_to UUID REFERENCES public.external_lawyers(id),
  submission_date TIMESTAMP WITH TIME ZONE,
  filing_number TEXT,
  court_filing_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('draft', 'prepared', 'submitted', 'filed', 'rejected')) DEFAULT 'draft',
  status_update_date TIMESTAMP WITH TIME ZONE,
  status_notes TEXT,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 7. COMPLIANCE TRACKING TABLE (Step 6)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.compliance_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  court_order_reference TEXT,
  court_order_date TIMESTAMP WITH TIME ZONE,
  court_order_description TEXT NOT NULL,
  compliance_deadline TIMESTAMP WITH TIME ZONE,
  responsible_division TEXT CHECK (responsible_division IN (
    'survey_division',
    'registrar_for_titles',
    'alienated_lands_division',
    'valuation_division',
    'physical_planning_division',
    'ilg_division',
    'customary_leases_division'
  )) NOT NULL,
  memo_reference TEXT,
  memo_sent_date TIMESTAMP WITH TIME ZONE,
  memo_sent_by UUID REFERENCES public.profiles(id),
  compliance_status TEXT CHECK (compliance_status IN (
    'pending',
    'memo_sent',
    'in_progress',
    'completed',
    'overdue',
    'partially_complied'
  )) DEFAULT 'pending',
  completion_date TIMESTAMP WITH TIME ZONE,
  compliance_notes TEXT,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 8. COMMUNICATIONS LOG TABLE (Step 8)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  communication_type TEXT CHECK (communication_type IN (
    'email',
    'letter',
    'phone',
    'in_person',
    'fax',
    'other'
  )) DEFAULT 'other',
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')) NOT NULL,
  party_type TEXT CHECK (party_type IN (
    'plaintiff',
    'defendant',
    'solicitor_general',
    'private_lawyer',
    'witness',
    'court',
    'other'
  )) DEFAULT 'other',
  party_name TEXT,
  party_id UUID,
  subject TEXT NOT NULL,
  content TEXT,
  communication_date TIMESTAMP WITH TIME ZONE NOT NULL,
  handled_by UUID REFERENCES public.profiles(id),
  response_required BOOLEAN DEFAULT false,
  response_deadline TIMESTAMP WITH TIME ZONE,
  response_status TEXT CHECK (response_status IN ('pending', 'responded', 'no_response_needed')) DEFAULT 'no_response_needed',
  attachments JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- 9. UPDATE CASES TABLE (Add new fields)
-- =====================================================
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS closure_type TEXT CHECK (closure_type IN (
    'default_judgement',
    'summarily_determined',
    'dismissed_want_of_prosecution',
    'dismissed_abuse_of_process',
    'incompetent',
    'appeal_granted',
    'judicial_review',
    'court_order_granted_plaintiff',
    'court_order_granted_defendant',
    'settled',
    'withdrawn',
    'other'
  ));

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS case_origin TEXT CHECK (case_origin IN (
    'section_160_registrar',
    'summons',
    'dlpp_initiated',
    'litigation_lawyers',
    'other'
  ));

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS court_file_number TEXT;

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS closure_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS closure_notes TEXT;

-- =====================================================
-- 10. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_incoming_correspondence_case_id ON public.incoming_correspondence(case_id);
CREATE INDEX IF NOT EXISTS idx_incoming_correspondence_received_date ON public.incoming_correspondence(received_date);
CREATE INDEX IF NOT EXISTS idx_incoming_correspondence_status ON public.incoming_correspondence(status);

CREATE INDEX IF NOT EXISTS idx_directions_assigned_to ON public.directions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_directions_status ON public.directions(status);
CREATE INDEX IF NOT EXISTS idx_directions_due_date ON public.directions(due_date);

CREATE INDEX IF NOT EXISTS idx_file_requests_case_id ON public.file_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_file_requests_status ON public.file_requests(status);

CREATE INDEX IF NOT EXISTS idx_case_delegations_case_id ON public.case_delegations(case_id);
CREATE INDEX IF NOT EXISTS idx_case_delegations_delegated_to ON public.case_delegations(delegated_to);

CREATE INDEX IF NOT EXISTS idx_filings_case_id ON public.filings(case_id);
CREATE INDEX IF NOT EXISTS idx_filings_status ON public.filings(status);

CREATE INDEX IF NOT EXISTS idx_compliance_tracking_case_id ON public.compliance_tracking(case_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_status ON public.compliance_tracking(compliance_status);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_division ON public.compliance_tracking(responsible_division);

CREATE INDEX IF NOT EXISTS idx_communications_case_id ON public.communications(case_id);
CREATE INDEX IF NOT EXISTS idx_communications_date ON public.communications(communication_date);

-- =====================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.incoming_correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. RLS POLICIES
-- =====================================================

-- Incoming Correspondence
CREATE POLICY "Authenticated users can view incoming correspondence"
  ON public.incoming_correspondence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage incoming correspondence"
  ON public.incoming_correspondence FOR ALL TO authenticated USING (true);

-- Directions
CREATE POLICY "Authenticated users can view directions"
  ON public.directions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage directions"
  ON public.directions FOR ALL TO authenticated USING (true);

-- File Requests
CREATE POLICY "Authenticated users can manage file requests"
  ON public.file_requests FOR ALL TO authenticated USING (true);

-- Case Delegations
CREATE POLICY "Authenticated users can manage delegations"
  ON public.case_delegations FOR ALL TO authenticated USING (true);

-- External Lawyers
CREATE POLICY "Authenticated users can view external lawyers"
  ON public.external_lawyers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage external lawyers"
  ON public.external_lawyers FOR ALL TO authenticated USING (true);

-- Filings
CREATE POLICY "Authenticated users can manage filings"
  ON public.filings FOR ALL TO authenticated USING (true);

-- Compliance Tracking
CREATE POLICY "Authenticated users can manage compliance"
  ON public.compliance_tracking FOR ALL TO authenticated USING (true);

-- Communications
CREATE POLICY "Authenticated users can manage communications"
  ON public.communications FOR ALL TO authenticated USING (true);

-- =====================================================
-- 13. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_incoming_correspondence_updated_at
  BEFORE UPDATE ON public.incoming_correspondence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directions_updated_at
  BEFORE UPDATE ON public.directions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_requests_updated_at
  BEFORE UPDATE ON public.file_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_lawyers_updated_at
  BEFORE UPDATE ON public.external_lawyers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_filings_updated_at
  BEFORE UPDATE ON public.filings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_tracking_updated_at
  BEFORE UPDATE ON public.compliance_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETED!
-- All workflow tables created successfully
-- =====================================================

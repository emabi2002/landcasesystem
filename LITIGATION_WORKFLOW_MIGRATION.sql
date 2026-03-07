-- ============================================
-- LITIGATION CASE MANAGEMENT WORKFLOW MIGRATION
-- ============================================
-- This script aligns the system with the litigation workflow:
-- Para-Legal → Manager → Action Officer → Review → Filing → Progress → Judgment → Closure
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

RAISE NOTICE 'Starting Litigation Workflow Migration...';

-- ============================================
-- 1. UPDATE PROFILES TABLE - ADD LITIGATION ROLES
-- ============================================

RAISE NOTICE '1/8: Updating user roles for litigation workflow...';

-- Drop existing role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with litigation-specific roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'admin',
    'para_legal_officer',
    'manager_legal_services',
    'senior_legal_officer_litigation',
    'action_officer_litigation_lawyer',
    'legal_officer',
    'registrar',
    'survey_officer',
    'director',
    'auditor'
  ));

-- Add role descriptions column if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_description TEXT;

-- Update role descriptions
COMMENT ON COLUMN public.profiles.role IS 'User role in the system:
- para_legal_officer: Registers cases, uploads docs, sets alerts, closes cases
- manager_legal_services: Assigns action officers, reviews drafts
- senior_legal_officer_litigation: Same as manager, senior level
- action_officer_litigation_lawyer: Completes registration, drafts filings, updates progress, enters judgment
- admin: Full system access';

-- ============================================
-- 2. EXTEND CASES TABLE - ADD LITIGATION FIELDS
-- ============================================

RAISE NOTICE '2/8: Extending cases table with litigation-specific fields...';

-- Add workflow state (separate from status)
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS workflow_state TEXT
  DEFAULT 'REGISTERED'
  CHECK (workflow_state IN (
    'REGISTERED',           -- Para-Legal created case + initial docs
    'ASSIGNED',             -- Manager assigned Action Officer
    'REGISTRATION_COMPLETED', -- Action Officer completed details
    'DRAFTING',             -- Filings in draft/prepared
    'UNDER_REVIEW',         -- Manager reviewing drafts
    'APPROVED_FOR_FILING',  -- Manager approved
    'FILED',                -- Sealed docs uploaded / court filed
    'IN_PROGRESS',          -- Directions/PTC/trial/mediation
    'JUDGMENT_ENTERED',     -- Judgment entered
    'CLOSED'                -- Para-Legal completed closure
  ));

-- Add court file number (separate from internal case_number)
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS court_file_number TEXT;

-- Add mode of proceeding
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS mode_of_proceeding TEXT
  CHECK (mode_of_proceeding IN (
    'writ_of_summons',
    'originating_summons',
    'petition',
    'application',
    'notice_of_motion',
    'appeal',
    'judicial_review',
    'other'
  ));

-- Litigation contacts
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS plaintiff_lawyer_contact JSONB; -- {name, firm, phone, email, address}
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS osg_lawyer_contact JSONB;     -- {name, phone, email}

-- Case details
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS parties_description TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS allegations TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS legal_issues TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS reliefs_sought TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS damages_estimate NUMERIC(15,2);

-- Land references (for land litigation)
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS land_file_refs TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS title_file_refs TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS survey_refs TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS purchase_docs_refs TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS ilg_refs TEXT; -- Incorporated Land Group references

-- Closure fields
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS closure_type TEXT
  CHECK (closure_type IN (
    'dismissed',
    'withdrawn',
    'settled',
    'judicial_review_upheld',
    'judicial_review_dismissed',
    'appeal_allowed',
    'appeal_dismissed',
    'struck_out',
    'other'
  ));
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS closure_date DATE;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS closure_notes TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS court_order_date DATE;

-- Add indexes for litigation fields
CREATE INDEX IF NOT EXISTS idx_cases_workflow_state ON public.cases(workflow_state);
CREATE INDEX IF NOT EXISTS idx_cases_court_file_number ON public.cases(court_file_number);
CREATE INDEX IF NOT EXISTS idx_cases_mode_of_proceeding ON public.cases(mode_of_proceeding);
CREATE INDEX IF NOT EXISTS idx_cases_closure_date ON public.cases(closure_date);

-- ============================================
-- 3. CREATE CASE_DELEGATIONS TABLE (Assignment History)
-- ============================================

RAISE NOTICE '3/8: Creating case delegations (assignment) table...';

CREATE TABLE IF NOT EXISTS public.case_delegations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  assignment_type TEXT DEFAULT 'initial'
    CHECK (assignment_type IN ('initial', 'reassignment', 'additional')),
  assignment_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_case_delegations_case_id ON public.case_delegations(case_id);
CREATE INDEX IF NOT EXISTS idx_case_delegations_assigned_to ON public.case_delegations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_delegations_active ON public.case_delegations(is_active) WHERE is_active = true;

-- ============================================
-- 4. CREATE FILINGS TABLE (Court Documents)
-- ============================================

RAISE NOTICE '4/8: Creating filings table...';

CREATE TABLE IF NOT EXISTS public.filings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  filing_type TEXT NOT NULL
    CHECK (filing_type IN (
      'defence',
      'statement_disputed_facts',
      'statement_agreed_facts',
      'affidavit',
      'instruction_letter',
      'brief_out_request',
      'notice_of_motion',
      'written_submissions',
      'skeletal_arguments',
      'reply',
      'rejoinder',
      'other'
    )),
  filing_title TEXT NOT NULL,
  filing_subtype TEXT, -- additional classification
  description TEXT,

  -- Draft version
  draft_file_url TEXT,
  draft_uploaded_by UUID REFERENCES public.profiles(id),
  draft_uploaded_at TIMESTAMP WITH TIME ZONE,

  -- Sealed/Filed version
  sealed_file_url TEXT,
  sealed_uploaded_by UUID REFERENCES public.profiles(id),
  sealed_uploaded_at TIMESTAMP WITH TIME ZONE,

  -- Filing status
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'prepared', 'under_review', 'changes_requested', 'approved', 'filed')),

  court_filing_date DATE,
  court_filing_reference TEXT,

  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_filings_case_id ON public.filings(case_id);
CREATE INDEX IF NOT EXISTS idx_filings_type ON public.filings(filing_type);
CREATE INDEX IF NOT EXISTS idx_filings_status ON public.filings(status);
CREATE INDEX IF NOT EXISTS idx_filings_created_by ON public.filings(created_by);

-- ============================================
-- 5. CREATE FILING_REVIEWS TABLE (Manager Review Actions)
-- ============================================

RAISE NOTICE '5/8: Creating filing reviews table...';

CREATE TABLE IF NOT EXISTS public.filing_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filing_id UUID REFERENCES public.filings(id) ON DELETE CASCADE NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) NOT NULL,
  review_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  decision TEXT NOT NULL
    CHECK (decision IN ('changes_requested', 'approved', 'rejected')),
  comments TEXT,
  changes_required TEXT, -- specific changes requested
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_filing_reviews_filing_id ON public.filing_reviews(filing_id);
CREATE INDEX IF NOT EXISTS idx_filing_reviews_reviewed_by ON public.filing_reviews(reviewed_by);

-- ============================================
-- 6. CREATE CASE_PROGRESS_UPDATES TABLE (Stage Updates)
-- ============================================

RAISE NOTICE '6/8: Creating case progress updates table...';

CREATE TABLE IF NOT EXISTS public.case_progress_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  stage_type TEXT NOT NULL
    CHECK (stage_type IN (
      'leave_granted',
      'directions_hearing',
      'pre_trial_conference',
      'trial',
      'mediation',
      'arbitration',
      'settlement_conference',
      'interlocutory_application',
      'taxation_of_costs',
      'appeal_filed',
      'other'
    )),
  stage_title TEXT NOT NULL,
  stage_date DATE,
  description TEXT,
  outcome TEXT,
  next_steps TEXT,
  document_url TEXT,
  updated_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_progress_updates_case_id ON public.case_progress_updates(case_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_stage_type ON public.case_progress_updates(stage_type);
CREATE INDEX IF NOT EXISTS idx_progress_updates_updated_by ON public.case_progress_updates(updated_by);

-- ============================================
-- 7. CREATE JUDGMENTS AND COMPLIANCE TABLE
-- ============================================

RAISE NOTICE '7/8: Creating judgments and compliance table...';

CREATE TABLE IF NOT EXISTS public.case_judgments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  judgment_date DATE NOT NULL,
  judgment_type TEXT
    CHECK (judgment_type IN (
      'final_judgment',
      'interlocutory_judgment',
      'default_judgment',
      'consent_judgment',
      'summary_judgment',
      'ruling',
      'order',
      'other'
    )),
  decision_summary TEXT NOT NULL,
  terms_of_orders TEXT,
  judges_names TEXT,
  judgment_document_url TEXT,

  -- Compliance memo
  compliance_memo_url TEXT,
  compliance_memo_uploaded_by UUID REFERENCES public.profiles(id),
  compliance_memo_uploaded_at TIMESTAMP WITH TIME ZONE,
  compliance_notes TEXT,

  entered_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_judgments_case_id ON public.case_judgments(case_id);
CREATE INDEX IF NOT EXISTS idx_judgments_date ON public.case_judgments(judgment_date);
CREATE INDEX IF NOT EXISTS idx_judgments_type ON public.case_judgments(judgment_type);

-- ============================================
-- 8. UPDATE CASE_HISTORY TABLE FOR WORKFLOW TRANSITIONS
-- ============================================

RAISE NOTICE '8/8: Updating case history for workflow state tracking...';

-- Ensure case_history table has workflow_state_from and workflow_state_to
ALTER TABLE public.case_history ADD COLUMN IF NOT EXISTS workflow_state_from TEXT;
ALTER TABLE public.case_history ADD COLUMN IF NOT EXISTS workflow_state_to TEXT;

-- Create index for workflow transitions
CREATE INDEX IF NOT EXISTS idx_case_history_workflow_transition
  ON public.case_history(workflow_state_from, workflow_state_to);

-- ============================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================

RAISE NOTICE 'Creating helper functions...';

-- Function to validate workflow state transitions
CREATE OR REPLACE FUNCTION validate_workflow_transition(
  p_case_id UUID,
  p_user_id UUID,
  p_from_state TEXT,
  p_to_state TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;

  -- Para-Legal can: REGISTERED, JUDGMENT_ENTERED → CLOSED
  IF v_user_role = 'para_legal_officer' THEN
    IF (p_to_state = 'REGISTERED') OR
       (p_from_state = 'JUDGMENT_ENTERED' AND p_to_state = 'CLOSED') THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Manager/Senior can: REGISTERED → ASSIGNED, UNDER_REVIEW → APPROVED_FOR_FILING or DRAFTING
  IF v_user_role IN ('manager_legal_services', 'senior_legal_officer_litigation') THEN
    IF (p_from_state = 'REGISTERED' AND p_to_state = 'ASSIGNED') OR
       (p_from_state = 'UNDER_REVIEW' AND p_to_state IN ('APPROVED_FOR_FILING', 'DRAFTING')) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Action Officer can: multiple transitions
  IF v_user_role = 'action_officer_litigation_lawyer' THEN
    IF (p_from_state = 'ASSIGNED' AND p_to_state = 'REGISTRATION_COMPLETED') OR
       (p_from_state = 'REGISTRATION_COMPLETED' AND p_to_state = 'DRAFTING') OR
       (p_from_state = 'DRAFTING' AND p_to_state = 'UNDER_REVIEW') OR
       (p_from_state = 'APPROVED_FOR_FILING' AND p_to_state = 'FILED') OR
       (p_from_state = 'FILED' AND p_to_state = 'IN_PROGRESS') OR
       (p_from_state = 'IN_PROGRESS' AND p_to_state = 'JUDGMENT_ENTERED') THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Admin can do anything
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log workflow state changes
CREATE OR REPLACE FUNCTION log_workflow_state_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.workflow_state IS DISTINCT FROM NEW.workflow_state THEN
    INSERT INTO public.case_history (
      case_id,
      action,
      description,
      performed_by,
      workflow_state_from,
      workflow_state_to,
      metadata
    ) VALUES (
      NEW.id,
      'workflow_state_changed',
      'Workflow state changed from ' || COALESCE(OLD.workflow_state, 'null') ||
      ' to ' || NEW.workflow_state,
      NEW.updated_by,
      OLD.workflow_state,
      NEW.workflow_state,
      jsonb_build_object(
        'from_state', OLD.workflow_state,
        'to_state', NEW.workflow_state,
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for workflow state changes
DROP TRIGGER IF EXISTS trigger_log_workflow_state_change ON public.cases;
CREATE TRIGGER trigger_log_workflow_state_change
  AFTER UPDATE OF workflow_state ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION log_workflow_state_change();

-- ============================================
-- 10. UPDATE RLS POLICIES
-- ============================================

RAISE NOTICE 'Updating Row Level Security policies...';

-- Enable RLS on new tables
ALTER TABLE public.case_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filing_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_judgments ENABLE ROW LEVEL SECURITY;

-- Case delegations: users can view their assignments
DROP POLICY IF EXISTS "Users can view their case delegations" ON public.case_delegations;
CREATE POLICY "Users can view their case delegations"
  ON public.case_delegations FOR SELECT
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

-- Filings: users can view filings for cases they're involved in
DROP POLICY IF EXISTS "Users can view filings" ON public.filings;
CREATE POLICY "Users can view filings"
  ON public.filings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = filings.case_id
      AND (c.assigned_officer_id = auth.uid() OR c.created_by = auth.uid())
    )
  );

-- Filing reviews: reviewers and creators can view
DROP POLICY IF EXISTS "Users can view filing reviews" ON public.filing_reviews;
CREATE POLICY "Users can view filing reviews"
  ON public.filing_reviews FOR SELECT
  USING (auth.uid() = reviewed_by OR EXISTS (
    SELECT 1 FROM public.filings f
    WHERE f.id = filing_reviews.filing_id
    AND f.created_by = auth.uid()
  ));

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

RAISE NOTICE '
============================================
LITIGATION WORKFLOW MIGRATION COMPLETE!
============================================
New tables created:
- case_delegations (assignment history)
- filings (court documents with draft/sealed versions)
- filing_reviews (manager review actions)
- case_progress_updates (stage updates)
- case_judgments (judgment + compliance memos)

Cases table extended with:
- workflow_state (state machine)
- litigation-specific fields
- closure tracking

Next steps:
1. Update API routes to use new tables
2. Update UI pages for workflow
3. Test workflow transitions
============================================
';

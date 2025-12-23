-- =====================================================
-- EXECUTIVE LEGAL OVERSIGHT & ASSIGNMENT WORKFLOW
-- Database Migration Script
-- =====================================================

-- This script implements the automated legal oversight
-- and assignment workflow as specified in Same.New Advisory

BEGIN;

-- =====================================================
-- PART 1: UPDATE USER ROLES
-- =====================================================

-- Drop existing role constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new executive roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN (
  'admin',
  'secretary_lands',          -- Secretary for Lands
  'director_legal',           -- Director, Legal Services
  'manager_legal',            -- Manager, Legal Services
  'litigation_officer',       -- Litigation Officer
  'legal_officer',            -- General Legal Officer
  'registrar',
  'survey_officer',
  'auditor'
));

COMMENT ON COLUMN public.profiles.role IS 'User role: admin, secretary_lands, director_legal, manager_legal, litigation_officer, legal_officer, registrar, survey_officer, auditor';

-- =====================================================
-- PART 2: EXECUTIVE WORKFLOW TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.executive_workflow (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Workflow stage tracking
  stage TEXT CHECK (stage IN (
    'case_registered',        -- Case just registered
    'secretary_review',       -- Secretary reviewing
    'director_guidance',      -- Director providing guidance
    'manager_instruction',    -- Manager providing instructions
    'officer_assigned',       -- Assigned to litigation officer
    'completed'               -- Workflow completed
  )) NOT NULL,

  -- Officer information
  officer_role TEXT NOT NULL, -- secretary_lands, director_legal, etc.
  officer_id UUID REFERENCES public.profiles(id),
  officer_name TEXT,

  -- Actions and content
  action_taken TEXT,
  commentary TEXT,
  advice TEXT,
  instructions TEXT,
  recommendations TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_new_case BOOLEAN DEFAULT TRUE,
  case_summary TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending'
);

-- Indexes for executive_workflow
CREATE INDEX IF NOT EXISTS idx_executive_workflow_case_id ON public.executive_workflow(case_id);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_stage ON public.executive_workflow(stage);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_officer ON public.executive_workflow(officer_id);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_status ON public.executive_workflow(status);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_created ON public.executive_workflow(created_at DESC);

COMMENT ON TABLE public.executive_workflow IS 'Tracks the executive legal oversight workflow from case registration through assignment';

-- RLS for executive_workflow
ALTER TABLE public.executive_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view workflow"
  ON public.executive_workflow FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert workflow"
  ON public.executive_workflow FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update workflow"
  ON public.executive_workflow FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- PART 3: ENHANCE CASE COMMENTS TABLE
-- =====================================================

-- Add new columns for attachments and workflow tracking
ALTER TABLE public.case_comments
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS workflow_stage TEXT,
ADD COLUMN IF NOT EXISTS requires_response BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS responded_to BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS officer_role TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'executive_only', 'internal')) DEFAULT 'public';

-- Add index for workflow queries
CREATE INDEX IF NOT EXISTS idx_case_comments_workflow ON public.case_comments(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_case_comments_officer_role ON public.case_comments(officer_role);
CREATE INDEX IF NOT EXISTS idx_case_comments_requires_response ON public.case_comments(requires_response);

COMMENT ON COLUMN public.case_comments.attachments IS 'JSON array of attached documents (file URLs, names, types)';
COMMENT ON COLUMN public.case_comments.workflow_stage IS 'Links comment to specific workflow stage';
COMMENT ON COLUMN public.case_comments.officer_role IS 'Role of the officer making the comment';
COMMENT ON COLUMN public.case_comments.visibility IS 'Who can see this comment: public, executive_only, or internal';

-- =====================================================
-- PART 4: CASE ASSIGNMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.case_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Assignment details
  assigned_to UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_to_name TEXT,
  assigned_by_name TEXT,

  -- Assignment type
  assignment_type TEXT CHECK (assignment_type IN (
    'primary_officer',        -- Main officer handling the case
    'supporting_officer',     -- Supporting/assisting officer
    'review'                  -- Review assignment
  )) DEFAULT 'primary_officer',

  -- Instructions and context
  instructions TEXT,
  executive_commentary TEXT,    -- Compiled commentary from executives
  secretary_advice TEXT,
  director_guidance TEXT,
  manager_instructions TEXT,

  -- Attachments and documents
  attached_documents JSONB DEFAULT '[]',

  -- Status tracking
  status TEXT CHECK (status IN (
    'pending',
    'acknowledged',
    'in_progress',
    'completed',
    'reassigned'
  )) DEFAULT 'pending',

  -- Timestamps
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for case_assignments
CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id ON public.case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_assigned_to ON public.case_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_assignments_assigned_by ON public.case_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_case_assignments_status ON public.case_assignments(status);
CREATE INDEX IF NOT EXISTS idx_case_assignments_type ON public.case_assignments(assignment_type);

COMMENT ON TABLE public.case_assignments IS 'Formal assignments of cases to litigation officers with executive context';

-- RLS for case_assignments
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view assignments"
  ON public.case_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert assignments"
  ON public.case_assignments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update own assignments"
  ON public.case_assignments FOR UPDATE
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

-- =====================================================
-- PART 5: EXECUTIVE NOTIFICATIONS TABLE (Enhanced)
-- =====================================================

-- Add columns to notifications table for executive workflow
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS case_type TEXT,
ADD COLUMN IF NOT EXISTS is_new_case BOOLEAN,
ADD COLUMN IF NOT EXISTS court_reference TEXT,
ADD COLUMN IF NOT EXISTS case_summary TEXT,
ADD COLUMN IF NOT EXISTS workflow_stage TEXT,
ADD COLUMN IF NOT EXISTS officer_role TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_case_type ON public.notifications(case_type);
CREATE INDEX IF NOT EXISTS idx_notifications_workflow ON public.notifications(workflow_stage);

-- =====================================================
-- PART 6: HELPER FUNCTIONS
-- =====================================================

-- Function to get executive officers (Secretary, Director, Manager)
CREATE OR REPLACE FUNCTION get_executive_officers()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role
  FROM public.profiles p
  WHERE p.role IN ('secretary_lands', 'director_legal', 'manager_legal')
  ORDER BY
    CASE p.role
      WHEN 'secretary_lands' THEN 1
      WHEN 'director_legal' THEN 2
      WHEN 'manager_legal' THEN 3
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create executive notifications for a case
CREATE OR REPLACE FUNCTION notify_executive_officers(
  p_case_id UUID,
  p_case_number TEXT,
  p_case_title TEXT,
  p_court_reference TEXT,
  p_is_new_case BOOLEAN,
  p_case_summary TEXT,
  p_created_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_officer RECORD;
  v_notification_count INTEGER := 0;
  v_creator_name TEXT;
BEGIN
  -- Get creator name
  SELECT full_name INTO v_creator_name
  FROM public.profiles
  WHERE id = p_created_by;

  -- Loop through executive officers
  FOR v_officer IN
    SELECT id, email, full_name, role
    FROM get_executive_officers()
  LOOP
    -- Insert notification
    INSERT INTO public.notifications (
      user_id,
      case_id,
      title,
      message,
      type,
      priority,
      action_required,
      action_url,
      case_type,
      is_new_case,
      court_reference,
      case_summary,
      workflow_stage,
      officer_role,
      metadata
    ) VALUES (
      v_officer.id,
      p_case_id,
      'New Case Registered - Executive Review Required',
      format(
        E'A %s has been registered and requires your review.\n\n' ||
        'Case Number: %s\n' ||
        'Title: %s\n' ||
        'Court Reference: %s\n' ||
        'Registered by: %s\n\n' ||
        'Please review the case details and provide your commentary, advice, or instructions.',
        CASE WHEN p_is_new_case THEN 'NEW CASE' ELSE 'EXISTING CASE' END,
        p_case_number,
        p_case_title,
        COALESCE(p_court_reference, 'Not provided'),
        COALESCE(v_creator_name, 'Unknown')
      ),
      'case_created',
      'high',
      TRUE,
      format('/cases/%s', p_case_id),
      CASE WHEN p_is_new_case THEN 'new_case' ELSE 'existing_case' END,
      p_is_new_case,
      p_court_reference,
      p_case_summary,
      'case_registered',
      v_officer.role,
      jsonb_build_object(
        'case_id', p_case_id,
        'case_number', p_case_number,
        'created_by', p_created_by,
        'officer_role', v_officer.role,
        'notification_type', 'executive_review'
      )
    );

    v_notification_count := v_notification_count + 1;
  END LOOP;

  RETURN v_notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize workflow tracking for a case
CREATE OR REPLACE FUNCTION initialize_executive_workflow(
  p_case_id UUID,
  p_is_new_case BOOLEAN,
  p_case_summary TEXT
)
RETURNS VOID AS $$
DECLARE
  v_officer RECORD;
BEGIN
  -- Create workflow entries for each executive officer
  FOR v_officer IN
    SELECT id, full_name, role
    FROM get_executive_officers()
  LOOP
    INSERT INTO public.executive_workflow (
      case_id,
      stage,
      officer_role,
      officer_id,
      officer_name,
      is_new_case,
      case_summary,
      status
    ) VALUES (
      p_case_id,
      'case_registered',
      v_officer.role,
      v_officer.id,
      v_officer.full_name,
      p_is_new_case,
      p_case_summary,
      'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 7: VIEWS FOR REPORTING
-- =====================================================

-- View: Executive Workflow Summary
CREATE OR REPLACE VIEW executive_workflow_summary AS
SELECT
  ew.case_id,
  c.case_number,
  c.title,
  c.court_file_number,
  ew.is_new_case,
  COUNT(DISTINCT ew.id) as workflow_entries,
  COUNT(DISTINCT ew.id) FILTER (WHERE ew.status = 'pending') as pending_reviews,
  COUNT(DISTINCT ew.id) FILTER (WHERE ew.status = 'completed') as completed_reviews,
  MAX(ew.created_at) as latest_activity,
  BOOL_OR(ca.id IS NOT NULL) as is_assigned
FROM public.executive_workflow ew
JOIN public.cases c ON c.id = ew.case_id
LEFT JOIN public.case_assignments ca ON ca.case_id = ew.case_id
GROUP BY ew.case_id, c.case_number, c.title, c.court_file_number, ew.is_new_case;

-- View: Pending Executive Reviews by Officer
CREATE OR REPLACE VIEW pending_executive_reviews AS
SELECT
  ew.id as workflow_id,
  ew.case_id,
  c.case_number,
  c.title,
  c.court_file_number,
  ew.stage,
  ew.officer_role,
  ew.officer_id,
  ew.officer_name,
  ew.is_new_case,
  ew.created_at,
  EXTRACT(DAY FROM (NOW() - ew.created_at)) as days_pending
FROM public.executive_workflow ew
JOIN public.cases c ON c.id = ew.case_id
WHERE ew.status = 'pending'
ORDER BY ew.created_at ASC;

-- View: Case Assignment Status
CREATE OR REPLACE VIEW case_assignment_status AS
SELECT
  ca.id as assignment_id,
  ca.case_id,
  c.case_number,
  c.title,
  ca.assigned_to,
  p_to.full_name as assigned_to_name,
  p_to.role as assigned_to_role,
  ca.assigned_by,
  p_by.full_name as assigned_by_name,
  ca.assignment_type,
  ca.status,
  ca.assigned_at,
  ca.acknowledged_at,
  EXTRACT(DAY FROM (NOW() - ca.assigned_at)) as days_since_assignment
FROM public.case_assignments ca
JOIN public.cases c ON c.id = ca.case_id
JOIN public.profiles p_to ON p_to.id = ca.assigned_to
JOIN public.profiles p_by ON p_by.id = ca.assigned_by
ORDER BY ca.assigned_at DESC;

-- =====================================================
-- PART 8: GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.executive_workflow TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.case_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION get_executive_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_executive_officers(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_executive_workflow(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT SELECT ON executive_workflow_summary TO authenticated;
GRANT SELECT ON pending_executive_reviews TO authenticated;
GRANT SELECT ON case_assignment_status TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Executive Oversight Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  ✅ Updated profiles table with new roles';
  RAISE NOTICE '  ✅ executive_workflow table';
  RAISE NOTICE '  ✅ case_assignments table';
  RAISE NOTICE '  ✅ Enhanced case_comments table';
  RAISE NOTICE '  ✅ Enhanced notifications table';
  RAISE NOTICE '  ✅ Helper functions for workflow';
  RAISE NOTICE '  ✅ Reporting views';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create executive officer user accounts';
  RAISE NOTICE '  2. Update case registration API';
  RAISE NOTICE '  3. Build executive review UI';
  RAISE NOTICE '  4. Test complete workflow';
  RAISE NOTICE '';
END $$;

COMMIT;

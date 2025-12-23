-- =====================================================
-- DLPP LEGAL CASE MANAGEMENT SYSTEM
-- COMPLETE DATABASE SETUP SCRIPT
-- =====================================================
-- This script creates ALL necessary database objects
-- Run this ONCE in your Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: BASE SCHEMA (Tables, Extensions)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN (
    'admin',
    'secretary_lands',
    'director_legal',
    'manager_legal',
    'litigation_officer',
    'legal_officer',
    'registrar',
    'survey_officer',
    'director',
    'auditor'
  )) DEFAULT 'legal_officer',
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('under_review', 'in_court', 'mediation', 'tribunal', 'judgment', 'closed', 'settled')) DEFAULT 'under_review',
  case_type TEXT CHECK (case_type IN ('dispute', 'court_matter', 'title_claim', 'administrative_review', 'other')) DEFAULT 'other',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  region TEXT,
  assigned_officer_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),

  -- Workflow fields
  dlpp_role TEXT CHECK (dlpp_role IN ('plaintiff', 'defendant')),
  court_file_number TEXT,
  parties_description TEXT,
  track_number TEXT,
  proceeding_filed_date DATE,
  documents_served_date DATE,
  court_documents_type TEXT,
  matter_type TEXT,
  returnable_date TIMESTAMP WITH TIME ZONE,
  returnable_type TEXT,
  division_responsible TEXT,
  allegations TEXT,
  reliefs_sought TEXT,
  opposing_lawyer_name TEXT,
  sol_gen_officer TEXT,
  dlpp_action_officer TEXT,
  officer_assigned_date DATE,
  assignment_footnote TEXT,
  section5_notice BOOLEAN DEFAULT FALSE,
  land_description TEXT,
  zoning TEXT,
  survey_plan_no TEXT,
  lease_type TEXT,
  lease_commencement_date DATE,
  lease_expiration_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Parties involved in cases
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  party_type TEXT CHECK (party_type IN ('individual', 'company', 'government_entity', 'other')) DEFAULT 'individual',
  role TEXT CHECK (role IN ('plaintiff', 'defendant', 'witness', 'other')) DEFAULT 'other',
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT CHECK (document_type IN ('filing', 'affidavit', 'correspondence', 'survey_report', 'contract', 'evidence', 'other')) DEFAULT 'other',
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  version INTEGER DEFAULT 1
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Events (hearings, filings, deadlines)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT CHECK (event_type IN ('hearing', 'filing_deadline', 'response_deadline', 'meeting', 'other')) DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  auto_created BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Land Parcels
CREATE TABLE IF NOT EXISTS public.land_parcels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  parcel_number TEXT NOT NULL,
  location TEXT,
  coordinates JSONB,
  area_sqm DECIMAL,
  survey_plan_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Case History/Audit Trail
CREATE TABLE IF NOT EXISTS public.case_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- PART 2: NOTIFICATIONS AND COMMENTS SYSTEM
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'case_created',
    'case_updated',
    'comment_added',
    'task_assigned',
    'deadline_approaching',
    'status_changed',
    'document_uploaded',
    'general'
  )) DEFAULT 'general',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_required BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',

  -- Executive workflow fields
  case_type TEXT,
  is_new_case BOOLEAN,
  court_reference TEXT,
  case_summary TEXT,
  workflow_stage TEXT,
  officer_role TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Case Comments table
CREATE TABLE IF NOT EXISTS public.case_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  comment_type TEXT CHECK (comment_type IN (
    'commentary',
    'advice',
    'input',
    'general'
  )) DEFAULT 'general',
  is_private BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES public.case_comments(id) ON DELETE CASCADE,

  -- Executive workflow fields
  attachments JSONB DEFAULT '[]',
  workflow_stage TEXT,
  requires_response BOOLEAN DEFAULT FALSE,
  responded_to BOOLEAN DEFAULT FALSE,
  officer_role TEXT,
  visibility TEXT CHECK (visibility IN ('public', 'executive_only', 'internal')) DEFAULT 'public',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  edited BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- PART 3: EXECUTIVE WORKFLOW SYSTEM
-- =====================================================

-- Executive workflow tracking table
CREATE TABLE IF NOT EXISTS public.executive_workflow (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Workflow stage tracking
  stage TEXT CHECK (stage IN (
    'case_registered',
    'secretary_review',
    'director_guidance',
    'manager_instruction',
    'officer_assigned',
    'completed'
  )) NOT NULL,

  -- Officer information
  officer_role TEXT NOT NULL,
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

-- Case assignments table
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
    'primary_officer',
    'supporting_officer',
    'review'
  )) DEFAULT 'primary_officer',

  -- Instructions and context
  instructions TEXT,
  executive_commentary TEXT,
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

-- =====================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Cases indexes
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON public.cases(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON public.cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON public.notifications(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_case_type ON public.notifications(case_type);
CREATE INDEX IF NOT EXISTS idx_notifications_workflow ON public.notifications(workflow_stage);

-- Case comments indexes
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_user_id ON public.case_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_created_at ON public.case_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_comments_type ON public.case_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_case_comments_parent ON public.case_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_workflow ON public.case_comments(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_case_comments_officer_role ON public.case_comments(officer_role);
CREATE INDEX IF NOT EXISTS idx_case_comments_requires_response ON public.case_comments(requires_response);

-- Executive workflow indexes
CREATE INDEX IF NOT EXISTS idx_executive_workflow_case_id ON public.executive_workflow(case_id);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_stage ON public.executive_workflow(stage);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_officer ON public.executive_workflow(officer_id);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_status ON public.executive_workflow(status);
CREATE INDEX IF NOT EXISTS idx_executive_workflow_created ON public.executive_workflow(created_at DESC);

-- Case assignments indexes
CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id ON public.case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_assigned_to ON public.case_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_assignments_assigned_by ON public.case_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_case_assignments_status ON public.case_assignments(status);
CREATE INDEX IF NOT EXISTS idx_case_assignments_type ON public.case_assignments(assignment_type);

-- =====================================================
-- PART 5: DATABASE FUNCTIONS
-- =====================================================

-- Function to get executive officers
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
-- PART 6: VIEWS FOR REPORTING
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
  ew.case_summary,
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
-- PART 7: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Cases policies (simple - allow all for authenticated)
CREATE POLICY "Allow authenticated users full access to cases"
  ON public.cases FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Parties policies
CREATE POLICY "Allow authenticated users full access to parties"
  ON public.parties FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Documents policies
CREATE POLICY "Allow authenticated users full access to documents"
  ON public.documents FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Tasks policies
CREATE POLICY "Allow authenticated users full access to tasks"
  ON public.tasks FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Events policies
CREATE POLICY "Allow authenticated users full access to events"
  ON public.events FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Land parcels policies
CREATE POLICY "Allow authenticated users full access to land_parcels"
  ON public.land_parcels FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Case history policies
CREATE POLICY "Allow authenticated users full access to case_history"
  ON public.case_history FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Case comments policies
CREATE POLICY "Users can view case comments"
  ON public.case_comments FOR SELECT
  USING (
    NOT is_private
    OR auth.uid() = user_id
    OR auth.uid() IN (
      SELECT created_by FROM public.cases WHERE id = case_id
    )
  );

CREATE POLICY "Users can insert comments"
  ON public.case_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.case_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.case_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Executive workflow policies
CREATE POLICY "Allow authenticated users to view workflow"
  ON public.executive_workflow FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert workflow"
  ON public.executive_workflow FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update workflow"
  ON public.executive_workflow FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Case assignments policies
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
-- PART 8: GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.land_parcels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_workflow TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_assignments TO authenticated;

GRANT EXECUTE ON FUNCTION get_executive_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_executive_officers(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_executive_workflow(UUID, BOOLEAN, TEXT) TO authenticated;

GRANT SELECT ON executive_workflow_summary TO authenticated;
GRANT SELECT ON pending_executive_reviews TO authenticated;
GRANT SELECT ON case_assignment_status TO authenticated;

-- =====================================================
-- VERIFICATION & SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  ✅ 12 Tables (profiles, cases, parties, documents, tasks, events, land_parcels, case_history, notifications, case_comments, executive_workflow, case_assignments)';
  RAISE NOTICE '  ✅ 3 Database Functions (get_executive_officers, notify_executive_officers, initialize_executive_workflow)';
  RAISE NOTICE '  ✅ 3 Reporting Views (executive_workflow_summary, pending_executive_reviews, case_assignment_status)';
  RAISE NOTICE '  ✅ All Indexes for Performance';
  RAISE NOTICE '  ✅ All RLS Policies for Security';
  RAISE NOTICE '  ✅ All Permissions Granted';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create executive officer user accounts in Supabase Authentication';
  RAISE NOTICE '  2. Insert profiles for each user with appropriate roles';
  RAISE NOTICE '  3. Test case registration workflow';
  RAISE NOTICE '  4. Verify executive notifications working';
  RAISE NOTICE '';
  RAISE NOTICE 'Roles Available:';
  RAISE NOTICE '  - secretary_lands (Secretary for Lands)';
  RAISE NOTICE '  - director_legal (Director, Legal Services)';
  RAISE NOTICE '  - manager_legal (Manager, Legal Services)';
  RAISE NOTICE '  - litigation_officer (Litigation Officer)';
  RAISE NOTICE '  - legal_officer, registrar, survey_officer, director, auditor, admin';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 System Ready for Use!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

COMMIT;

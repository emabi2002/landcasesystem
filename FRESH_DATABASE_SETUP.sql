-- =====================================================
-- DLPP LEGAL CASE MANAGEMENT SYSTEM
-- FRESH DATABASE SETUP SCRIPT
-- =====================================================
-- This script DROPS existing objects and recreates everything
-- Use this if you're getting errors about missing columns
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: DROP EXISTING OBJECTS (Clean Slate)
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS executive_workflow_summary CASCADE;
DROP VIEW IF EXISTS pending_executive_reviews CASCADE;
DROP VIEW IF EXISTS case_assignment_status CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_executive_officers() CASCADE;
DROP FUNCTION IF EXISTS notify_executive_officers(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS initialize_executive_workflow(UUID, BOOLEAN, TEXT) CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS case_assignments CASCADE;
DROP TABLE IF EXISTS executive_workflow CASCADE;
DROP TABLE IF EXISTS case_comments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS case_history CASCADE;
DROP TABLE IF EXISTS land_parcels CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- STEP 2: CREATE EXTENSION
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 3: CREATE TABLES
-- =====================================================

-- Profiles table
CREATE TABLE public.profiles (
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
CREATE TABLE public.cases (
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

-- Parties table
CREATE TABLE public.parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  party_type TEXT CHECK (party_type IN ('individual', 'company', 'government_entity', 'other')) DEFAULT 'individual',
  role TEXT CHECK (role IN ('plaintiff', 'defendant', 'witness', 'other')) DEFAULT 'other',
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Documents table
CREATE TABLE public.documents (
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

-- Tasks table
CREATE TABLE public.tasks (
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

-- Events table
CREATE TABLE public.events (
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

-- Land parcels table
CREATE TABLE public.land_parcels (
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

-- Case history table
CREATE TABLE public.case_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications table
CREATE TABLE public.notifications (
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
  case_type TEXT,
  is_new_case BOOLEAN,
  court_reference TEXT,
  case_summary TEXT,
  workflow_stage TEXT,
  officer_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Case comments table
CREATE TABLE public.case_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  comment_type TEXT CHECK (comment_type IN ('commentary', 'advice', 'input', 'general')) DEFAULT 'general',
  is_private BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES public.case_comments(id) ON DELETE CASCADE,
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

-- Executive workflow table
CREATE TABLE public.executive_workflow (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  stage TEXT CHECK (stage IN (
    'case_registered',
    'secretary_review',
    'director_guidance',
    'manager_instruction',
    'officer_assigned',
    'completed'
  )) NOT NULL,
  officer_role TEXT NOT NULL,
  officer_id UUID REFERENCES public.profiles(id),
  officer_name TEXT,
  action_taken TEXT,
  commentary TEXT,
  advice TEXT,
  instructions TEXT,
  recommendations TEXT,
  metadata JSONB DEFAULT '{}',
  is_new_case BOOLEAN DEFAULT TRUE,
  case_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending'
);

-- Case assignments table
CREATE TABLE public.case_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_to_name TEXT,
  assigned_by_name TEXT,
  assignment_type TEXT CHECK (assignment_type IN ('primary_officer', 'supporting_officer', 'review')) DEFAULT 'primary_officer',
  instructions TEXT,
  executive_commentary TEXT,
  secretary_advice TEXT,
  director_guidance TEXT,
  manager_instructions TEXT,
  attached_documents JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'completed', 'reassigned')) DEFAULT 'pending',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- STEP 4: CREATE INDEXES
-- =====================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_assigned_officer ON public.cases(assigned_officer_id);
CREATE INDEX idx_cases_created_by ON public.cases(created_by);
CREATE INDEX idx_cases_created_at ON public.cases(created_at DESC);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_case_id ON public.notifications(case_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX idx_case_comments_user_id ON public.case_comments(user_id);
CREATE INDEX idx_case_comments_created_at ON public.case_comments(created_at DESC);
CREATE INDEX idx_executive_workflow_case_id ON public.executive_workflow(case_id);
CREATE INDEX idx_executive_workflow_officer_id ON public.executive_workflow(officer_id);
CREATE INDEX idx_executive_workflow_status ON public.executive_workflow(status);
CREATE INDEX idx_case_assignments_case_id ON public.case_assignments(case_id);
CREATE INDEX idx_case_assignments_assigned_to ON public.case_assignments(assigned_to);
CREATE INDEX idx_case_assignments_assigned_by ON public.case_assignments(assigned_by);

-- =====================================================
-- STEP 5: CREATE FUNCTIONS
-- =====================================================

CREATE FUNCTION get_executive_officers()
RETURNS TABLE (id UUID, email TEXT, full_name TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.role
  FROM public.profiles p
  WHERE p.role IN ('secretary_lands', 'director_legal', 'manager_legal')
  ORDER BY CASE p.role
    WHEN 'secretary_lands' THEN 1
    WHEN 'director_legal' THEN 2
    WHEN 'manager_legal' THEN 3
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION notify_executive_officers(
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
  SELECT full_name INTO v_creator_name FROM public.profiles WHERE id = p_created_by;

  FOR v_officer IN SELECT id, email, full_name, role FROM get_executive_officers()
  LOOP
    INSERT INTO public.notifications (
      user_id, case_id, title, message, type, priority, action_required, action_url,
      case_type, is_new_case, court_reference, case_summary, workflow_stage, officer_role, metadata
    ) VALUES (
      v_officer.id, p_case_id, 'New Case Registered - Executive Review Required',
      format(
        E'A %s has been registered and requires your review.\n\nCase Number: %s\nTitle: %s\nCourt Reference: %s\nRegistered by: %s\n\nPlease review the case details and provide your commentary, advice, or instructions.',
        CASE WHEN p_is_new_case THEN 'NEW CASE' ELSE 'EXISTING CASE' END,
        p_case_number, p_case_title, COALESCE(p_court_reference, 'Not provided'), COALESCE(v_creator_name, 'Unknown')
      ),
      'case_created', 'high', TRUE, format('/cases/%s', p_case_id),
      CASE WHEN p_is_new_case THEN 'new_case' ELSE 'existing_case' END,
      p_is_new_case, p_court_reference, p_case_summary, 'case_registered', v_officer.role,
      jsonb_build_object('case_id', p_case_id, 'case_number', p_case_number, 'created_by', p_created_by)
    );
    v_notification_count := v_notification_count + 1;
  END LOOP;

  RETURN v_notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION initialize_executive_workflow(
  p_case_id UUID,
  p_is_new_case BOOLEAN,
  p_case_summary TEXT
)
RETURNS VOID AS $$
DECLARE
  v_officer RECORD;
BEGIN
  FOR v_officer IN SELECT id, full_name, role FROM get_executive_officers()
  LOOP
    INSERT INTO public.executive_workflow (
      case_id, stage, officer_role, officer_id, officer_name, is_new_case, case_summary, status
    ) VALUES (
      p_case_id, 'case_registered', v_officer.role, v_officer.id, v_officer.full_name, p_is_new_case, p_case_summary, 'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: CREATE VIEWS
-- =====================================================

CREATE VIEW executive_workflow_summary AS
SELECT
  ew.case_id, c.case_number, c.title, c.court_file_number, ew.is_new_case,
  COUNT(DISTINCT ew.id) as workflow_entries,
  COUNT(DISTINCT ew.id) FILTER (WHERE ew.status = 'pending') as pending_reviews,
  COUNT(DISTINCT ew.id) FILTER (WHERE ew.status = 'completed') as completed_reviews,
  MAX(ew.created_at) as latest_activity,
  BOOL_OR(ca.id IS NOT NULL) as is_assigned
FROM public.executive_workflow ew
JOIN public.cases c ON c.id = ew.case_id
LEFT JOIN public.case_assignments ca ON ca.case_id = ew.case_id
GROUP BY ew.case_id, c.case_number, c.title, c.court_file_number, ew.is_new_case;

CREATE VIEW pending_executive_reviews AS
SELECT
  ew.id as workflow_id, ew.case_id, c.case_number, c.title, c.court_file_number,
  ew.stage, ew.officer_role, ew.officer_id, ew.officer_name, ew.is_new_case,
  ew.case_summary, ew.created_at,
  EXTRACT(DAY FROM (NOW() - ew.created_at)) as days_pending
FROM public.executive_workflow ew
JOIN public.cases c ON c.id = ew.case_id
WHERE ew.status = 'pending'
ORDER BY ew.created_at ASC;

CREATE VIEW case_assignment_status AS
SELECT
  ca.id as assignment_id, ca.case_id, c.case_number, c.title,
  ca.assigned_to, p_to.full_name as assigned_to_name, p_to.role as assigned_to_role,
  ca.assigned_by, p_by.full_name as assigned_by_name,
  ca.assignment_type, ca.status, ca.assigned_at, ca.acknowledged_at,
  EXTRACT(DAY FROM (NOW() - ca.assigned_at)) as days_since_assignment
FROM public.case_assignments ca
JOIN public.cases c ON c.id = ca.case_id
JOIN public.profiles p_to ON p_to.id = ca.assigned_to
JOIN public.profiles p_by ON p_by.id = ca.assigned_by
ORDER BY ca.assigned_at DESC;

-- =====================================================
-- STEP 7: ENABLE RLS AND CREATE POLICIES
-- =====================================================

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

-- Simple policies - allow all for authenticated users
CREATE POLICY "auth_select_profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "auth_all_cases" ON public.cases FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_parties" ON public.parties FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_documents" ON public.documents FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_tasks" ON public.tasks FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_events" ON public.events FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_land_parcels" ON public.land_parcels FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_case_history" ON public.case_history FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_select_notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "auth_update_notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "auth_insert_notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_delete_notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "auth_select_comments" ON public.case_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_comments" ON public.case_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_update_comments" ON public.case_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "auth_delete_comments" ON public.case_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "auth_all_workflow" ON public.executive_workflow FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_assignments" ON public.case_assignments FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.cases TO authenticated;
GRANT ALL ON public.parties TO authenticated;
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.land_parcels TO authenticated;
GRANT ALL ON public.case_history TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.case_comments TO authenticated;
GRANT ALL ON public.executive_workflow TO authenticated;
GRANT ALL ON public.case_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION get_executive_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_executive_officers(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_executive_workflow(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT SELECT ON executive_workflow_summary TO authenticated;
GRANT SELECT ON pending_executive_reviews TO authenticated;
GRANT SELECT ON case_assignment_status TO authenticated;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables, functions, views created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Create user accounts in Supabase Authentication';
  RAISE NOTICE 'Then run profile INSERT statements for each user';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready to use!';
  RAISE NOTICE '========================================';
END $$;

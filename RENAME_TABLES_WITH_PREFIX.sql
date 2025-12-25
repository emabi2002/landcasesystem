-- =====================================================
-- RENAME ALL TABLES WITH PREFIX: legal_
-- For multi-system database (case system + audit system)
-- =====================================================
-- This script renames all tables to have 'legal_' prefix
-- Run this ONCE in your Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop existing views (they depend on tables)
-- =====================================================

DROP VIEW IF EXISTS executive_workflow_summary CASCADE;
DROP VIEW IF EXISTS pending_executive_reviews CASCADE;
DROP VIEW IF EXISTS case_assignment_status CASCADE;

-- =====================================================
-- STEP 2: Rename all tables
-- =====================================================

-- Core System Tables
ALTER TABLE IF EXISTS profiles RENAME TO legal_profiles;
ALTER TABLE IF EXISTS cases RENAME TO legal_cases;
ALTER TABLE IF EXISTS parties RENAME TO legal_parties;
ALTER TABLE IF EXISTS documents RENAME TO legal_documents;
ALTER TABLE IF EXISTS tasks RENAME TO legal_tasks;
ALTER TABLE IF EXISTS events RENAME TO legal_events;
ALTER TABLE IF EXISTS land_parcels RENAME TO legal_land_parcels;
ALTER TABLE IF EXISTS case_history RENAME TO legal_case_history;
ALTER TABLE IF EXISTS notifications RENAME TO legal_notifications;
ALTER TABLE IF EXISTS case_comments RENAME TO legal_case_comments;

-- Executive Workflow Tables
ALTER TABLE IF EXISTS executive_workflow RENAME TO legal_executive_workflow;
ALTER TABLE IF EXISTS case_assignments RENAME TO legal_case_assignments;

-- RBAC System Tables
ALTER TABLE IF EXISTS user_groups RENAME TO legal_user_groups;
ALTER TABLE IF EXISTS system_modules RENAME TO legal_system_modules;
ALTER TABLE IF EXISTS permissions RENAME TO legal_permissions;
ALTER TABLE IF EXISTS group_module_access RENAME TO legal_group_module_access;
ALTER TABLE IF EXISTS user_group_membership RENAME TO legal_user_group_membership;
ALTER TABLE IF EXISTS rbac_audit_log RENAME TO legal_rbac_audit_log;

-- =====================================================
-- STEP 3: Recreate functions with new table names
-- =====================================================

-- Drop old functions
DROP FUNCTION IF EXISTS get_executive_officers() CASCADE;
DROP FUNCTION IF EXISTS notify_executive_officers(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS initialize_executive_workflow(UUID, BOOLEAN, TEXT) CASCADE;

-- Recreate get_executive_officers
CREATE OR REPLACE FUNCTION get_executive_officers()
RETURNS TABLE (id UUID, email TEXT, full_name TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.role
  FROM public.legal_profiles p
  WHERE p.role IN ('secretary_lands', 'director_legal', 'manager_legal')
  ORDER BY CASE p.role
    WHEN 'secretary_lands' THEN 1
    WHEN 'director_legal' THEN 2
    WHEN 'manager_legal' THEN 3
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate notify_executive_officers
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
  SELECT full_name INTO v_creator_name FROM public.legal_profiles WHERE id = p_created_by;

  FOR v_officer IN SELECT id, email, full_name, role FROM get_executive_officers()
  LOOP
    INSERT INTO public.legal_notifications (
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

-- Recreate initialize_executive_workflow
CREATE OR REPLACE FUNCTION initialize_executive_workflow(
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
    INSERT INTO public.legal_executive_workflow (
      case_id, stage, officer_role, officer_id, officer_name, is_new_case, case_summary, status
    ) VALUES (
      p_case_id, 'case_registered', v_officer.role, v_officer.id, v_officer.full_name, p_is_new_case, p_case_summary, 'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: Recreate views with new table names
-- =====================================================

CREATE OR REPLACE VIEW executive_workflow_summary AS
SELECT
  ew.case_id, c.case_number, c.title, c.court_file_number, ew.is_new_case,
  COUNT(DISTINCT ew.id) as workflow_entries,
  COUNT(DISTINCT ew.id) FILTER (WHERE ew.status = 'pending') as pending_reviews,
  COUNT(DISTINCT ew.id) FILTER (WHERE ew.status = 'completed') as completed_reviews,
  MAX(ew.created_at) as latest_activity,
  BOOL_OR(ca.id IS NOT NULL) as is_assigned
FROM public.legal_executive_workflow ew
JOIN public.legal_cases c ON c.id = ew.case_id
LEFT JOIN public.legal_case_assignments ca ON ca.case_id = ew.case_id
GROUP BY ew.case_id, c.case_number, c.title, c.court_file_number, ew.is_new_case;

CREATE OR REPLACE VIEW pending_executive_reviews AS
SELECT
  ew.id as workflow_id, ew.case_id, c.case_number, c.title, c.court_file_number,
  ew.stage, ew.officer_role, ew.officer_id, ew.officer_name, ew.is_new_case,
  ew.case_summary, ew.created_at,
  EXTRACT(DAY FROM (NOW() - ew.created_at)) as days_pending
FROM public.legal_executive_workflow ew
JOIN public.legal_cases c ON c.id = ew.case_id
WHERE ew.status = 'pending'
ORDER BY ew.created_at ASC;

CREATE OR REPLACE VIEW case_assignment_status AS
SELECT
  ca.id as assignment_id, ca.case_id, c.case_number, c.title,
  ca.assigned_to, p_to.full_name as assigned_to_name, p_to.role as assigned_to_role,
  ca.assigned_by, p_by.full_name as assigned_by_name,
  ca.assignment_type, ca.status, ca.assigned_at, ca.acknowledged_at,
  EXTRACT(DAY FROM (NOW() - ca.assigned_at)) as days_since_assignment
FROM public.legal_case_assignments ca
JOIN public.legal_cases c ON c.id = ca.case_id
JOIN public.legal_profiles p_to ON p_to.id = ca.assigned_to
JOIN public.legal_profiles p_by ON p_by.id = ca.assigned_by
ORDER BY ca.assigned_at DESC;

-- =====================================================
-- STEP 5: Grant permissions to new table names
-- =====================================================

GRANT ALL ON public.legal_profiles TO authenticated;
GRANT ALL ON public.legal_cases TO authenticated;
GRANT ALL ON public.legal_parties TO authenticated;
GRANT ALL ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_tasks TO authenticated;
GRANT ALL ON public.legal_events TO authenticated;
GRANT ALL ON public.legal_land_parcels TO authenticated;
GRANT ALL ON public.legal_case_history TO authenticated;
GRANT ALL ON public.legal_notifications TO authenticated;
GRANT ALL ON public.legal_case_comments TO authenticated;
GRANT ALL ON public.legal_executive_workflow TO authenticated;
GRANT ALL ON public.legal_case_assignments TO authenticated;
GRANT ALL ON public.legal_user_groups TO authenticated;
GRANT ALL ON public.legal_system_modules TO authenticated;
GRANT ALL ON public.legal_permissions TO authenticated;
GRANT ALL ON public.legal_group_module_access TO authenticated;
GRANT ALL ON public.legal_user_group_membership TO authenticated;
GRANT ALL ON public.legal_rbac_audit_log TO authenticated;

GRANT EXECUTE ON FUNCTION get_executive_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_executive_officers(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_executive_workflow(UUID, BOOLEAN, TEXT) TO authenticated;

GRANT SELECT ON executive_workflow_summary TO authenticated;
GRANT SELECT ON pending_executive_reviews TO authenticated;
GRANT SELECT ON case_assignment_status TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

SELECT
  'Tables with legal_ prefix' as check_type,
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'legal_%'
ORDER BY table_name;

-- =====================================================
-- SUCCESS!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TABLE RENAMING COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables now have "legal_" prefix';
  RAISE NOTICE 'Functions and views updated';
  RAISE NOTICE 'Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP:';
  RAISE NOTICE 'Update application code to use new table names';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

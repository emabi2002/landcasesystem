-- VERIFICATION SCRIPT - Check Migration Status
-- Run this in Supabase SQL Editor to see what's already done

-- Check which workflow columns exist in cases table
SELECT
  'dlpp_role' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'dlpp_role'
  ) as exists
UNION ALL
SELECT 'track_number', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'track_number')
UNION ALL
SELECT 'proceeding_filed_date', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'proceeding_filed_date')
UNION ALL
SELECT 'documents_served_date', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'documents_served_date')
UNION ALL
SELECT 'court_documents_type', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'court_documents_type')
UNION ALL
SELECT 'matter_type', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'matter_type')
UNION ALL
SELECT 'returnable_date', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'returnable_date')
UNION ALL
SELECT 'returnable_type', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'returnable_type')
UNION ALL
SELECT 'division_responsible', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'division_responsible')
UNION ALL
SELECT 'allegations', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'allegations')
UNION ALL
SELECT 'reliefs_sought', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'reliefs_sought')
UNION ALL
SELECT 'opposing_lawyer_name', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'opposing_lawyer_name')
UNION ALL
SELECT 'sol_gen_officer', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'sol_gen_officer')
UNION ALL
SELECT 'dlpp_action_officer', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'dlpp_action_officer')
UNION ALL
SELECT 'officer_assigned_date', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'officer_assigned_date')
UNION ALL
SELECT 'assignment_footnote', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'assignment_footnote')
UNION ALL
SELECT 'section5_notice', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'section5_notice')
UNION ALL
SELECT 'land_description', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'land_description')
UNION ALL
SELECT 'zoning', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'zoning')
UNION ALL
SELECT 'survey_plan_no', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'survey_plan_no')
UNION ALL
SELECT 'lease_type', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'lease_type')
UNION ALL
SELECT 'lease_commencement_date', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'lease_commencement_date')
UNION ALL
SELECT 'lease_expiration_date', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'lease_expiration_date')
UNION ALL
SELECT 'parties_description', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'parties_description')
UNION ALL
SELECT 'court_file_number', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'court_file_number');

-- Check if court_orders table exists
SELECT
  'court_orders_table' as object_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'court_orders'
  ) as exists;

-- Check if trigger exists
SELECT
  'auto_calendar_trigger' as object_name,
  EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_auto_create_returnable_event'
  ) as exists;

-- Check if function exists
SELECT
  'check_alerts_function' as object_name,
  EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'check_returnable_date_alerts'
  ) as exists;

-- Count total cases
SELECT 'Total Cases' as metric, COUNT(*)::text as value FROM public.cases;

-- Count cases with returnable dates
SELECT 'Cases with Returnable Dates' as metric, COUNT(*)::text as value
FROM public.cases
WHERE returnable_date IS NOT NULL;

-- Summary message
DO $$
DECLARE
  workflow_columns_count INT;
BEGIN
  SELECT COUNT(*) INTO workflow_columns_count
  FROM information_schema.columns
  WHERE table_name = 'cases'
  AND column_name IN (
    'dlpp_role', 'track_number', 'matter_type', 'returnable_date',
    'land_description', 'allegations', 'reliefs_sought'
  );

  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION STATUS SUMMARY ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Workflow columns found: %/7 key columns', workflow_columns_count;

  IF workflow_columns_count = 7 THEN
    RAISE NOTICE '✅ All key workflow columns exist!';
    RAISE NOTICE '✅ Migration appears to be complete';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Test the registration form in your app';
  ELSIF workflow_columns_count > 0 THEN
    RAISE NOTICE '⚠️ Partial migration detected';
    RAISE NOTICE '⚠️ Some columns exist, some are missing';
    RAISE NOTICE '';
    RAISE NOTICE 'Action: Run database-workflow-enhancement-SAFE.sql';
  ELSE
    RAISE NOTICE '❌ No workflow columns found';
    RAISE NOTICE '❌ Migration has not been run';
    RAISE NOTICE '';
    RAISE NOTICE 'Action: Run database-workflow-enhancement-SAFE.sql';
  END IF;
END $$;

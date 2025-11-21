-- DLPP Legal Case Management System - Data Verification Script
-- Run this to verify that sample data loaded correctly
-- This will show you counts and samples from each table

-- ============================================
-- TABLE COUNTS
-- ============================================
SELECT 'TABLE COUNTS' as check_type, '==================' as details;

SELECT 'profiles' as table_name, COUNT(*) as row_count, '(Expected: 5 sample + your admin = 6)' as expected
FROM public.profiles
UNION ALL
SELECT 'cases', COUNT(*), '(Expected: 7)'
FROM public.cases
UNION ALL
SELECT 'parties', COUNT(*), '(Expected: 24)'
FROM public.parties
UNION ALL
SELECT 'documents', COUNT(*), '(Expected: 19)'
FROM public.documents
UNION ALL
SELECT 'tasks', COUNT(*), '(Expected: 17)'
FROM public.tasks
UNION ALL
SELECT 'events', COUNT(*), '(Expected: 19)'
FROM public.events
UNION ALL
SELECT 'land_parcels', COUNT(*), '(Expected: 8)'
FROM public.land_parcels
UNION ALL
SELECT 'case_history', COUNT(*), '(Expected: 6+ plus auto-generated)'
FROM public.case_history
UNION ALL
SELECT 'evidence', COUNT(*), '(Expected: 8)'
FROM public.evidence
UNION ALL
SELECT 'notifications', COUNT(*), '(Expected: 9)'
FROM public.notifications;

-- ============================================
-- SAMPLE CASES
-- ============================================
SELECT '' as spacer;
SELECT 'SAMPLE CASES' as check_type, '==================' as details;

SELECT
  case_number,
  LEFT(title, 40) as title_preview,
  status,
  case_type,
  priority,
  region
FROM public.cases
ORDER BY case_number;

-- ============================================
-- CASE STATISTICS
-- ============================================
SELECT '' as spacer;
SELECT 'CASE STATISTICS' as check_type, '==================' as details;

SELECT
  status,
  COUNT(*) as count
FROM public.cases
GROUP BY status
ORDER BY count DESC;

SELECT '' as spacer;
SELECT
  case_type,
  COUNT(*) as count
FROM public.cases
GROUP BY case_type
ORDER BY count DESC;

-- ============================================
-- TASK STATISTICS
-- ============================================
SELECT '' as spacer;
SELECT 'TASK STATISTICS' as check_type, '==================' as details;

SELECT
  status,
  COUNT(*) as count
FROM public.tasks
GROUP BY status
ORDER BY
  CASE status
    WHEN 'overdue' THEN 1
    WHEN 'pending' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'completed' THEN 4
  END;

-- ============================================
-- EVENT STATISTICS
-- ============================================
SELECT '' as spacer;
SELECT 'EVENT STATISTICS' as check_type, '==================' as details;

SELECT
  event_type,
  COUNT(*) as count
FROM public.events
GROUP BY event_type
ORDER BY count DESC;

-- ============================================
-- UPCOMING EVENTS
-- ============================================
SELECT '' as spacer;
SELECT 'UPCOMING EVENTS' as check_type, '==================' as details;

SELECT
  c.case_number,
  e.event_type,
  LEFT(e.title, 40) as title,
  e.event_date::date as date,
  e.location
FROM public.events e
JOIN public.cases c ON c.id = e.case_id
WHERE e.event_date >= NOW()
ORDER BY e.event_date
LIMIT 10;

-- ============================================
-- SAMPLE PARTIES
-- ============================================
SELECT '' as spacer;
SELECT 'SAMPLE PARTIES (First 10)' as check_type, '==================' as details;

SELECT
  c.case_number,
  p.name,
  p.party_type,
  p.role
FROM public.parties p
JOIN public.cases c ON c.id = p.case_id
ORDER BY c.case_number, p.name
LIMIT 10;

-- ============================================
-- SAMPLE DOCUMENTS
-- ============================================
SELECT '' as spacer;
SELECT 'SAMPLE DOCUMENTS (First 10)' as check_type, '==================' as details;

SELECT
  c.case_number,
  LEFT(d.title, 40) as title,
  d.document_type,
  d.uploaded_at::date as uploaded
FROM public.documents d
JOIN public.cases c ON c.id = d.case_id
ORDER BY d.uploaded_at DESC
LIMIT 10;

-- ============================================
-- LAND PARCELS
-- ============================================
SELECT '' as spacer;
SELECT 'LAND PARCELS' as check_type, '==================' as details;

SELECT
  c.case_number,
  lp.parcel_number,
  LEFT(lp.location, 30) as location,
  lp.area_sqm
FROM public.land_parcels lp
JOIN public.cases c ON c.id = lp.case_id
ORDER BY c.case_number;

-- ============================================
-- NOTIFICATIONS
-- ============================================
SELECT '' as spacer;
SELECT 'SAMPLE NOTIFICATIONS' as check_type, '==================' as details;

SELECT
  p.full_name as user,
  c.case_number,
  LEFT(n.title, 50) as notification,
  n.type,
  n.read
FROM public.notifications n
JOIN public.profiles p ON p.id = n.user_id
LEFT JOIN public.cases c ON c.id = n.case_id
ORDER BY n.created_at DESC
LIMIT 10;

-- ============================================
-- DATA QUALITY CHECKS
-- ============================================
SELECT '' as spacer;
SELECT 'DATA QUALITY CHECKS' as check_type, '==================' as details;

-- Check for cases without parties
SELECT
  'Cases without parties' as check,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS ✓' ELSE 'WARNING' END as status
FROM public.cases c
LEFT JOIN public.parties p ON p.case_id = c.id
WHERE p.id IS NULL;

-- Check for cases without documents
SELECT
  'Cases without documents' as check,
  COUNT(*) as count,
  CASE WHEN COUNT(*) <= 1 THEN 'PASS ✓' ELSE 'INFO' END as status
FROM public.cases c
LEFT JOIN public.documents d ON d.case_id = c.id
WHERE d.id IS NULL;

-- Check for future events
SELECT
  'Future events scheduled' as check,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN 'PASS ✓' ELSE 'WARNING' END as status
FROM public.events
WHERE event_date >= NOW();

-- Check for overdue tasks
SELECT
  'Overdue tasks (expected)' as check,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 1 THEN 'PASS ✓' ELSE 'INFO' END as status
FROM public.tasks
WHERE due_date < NOW() AND status != 'completed';

-- ============================================
-- SUMMARY
-- ============================================
SELECT '' as spacer;
SELECT 'VERIFICATION SUMMARY' as check_type, '==================' as details;

WITH totals AS (
  SELECT
    (SELECT COUNT(*) FROM public.profiles) as profiles,
    (SELECT COUNT(*) FROM public.cases) as cases,
    (SELECT COUNT(*) FROM public.parties) as parties,
    (SELECT COUNT(*) FROM public.documents) as documents,
    (SELECT COUNT(*) FROM public.tasks) as tasks,
    (SELECT COUNT(*) FROM public.events) as events,
    (SELECT COUNT(*) FROM public.land_parcels) as land_parcels,
    (SELECT COUNT(*) FROM public.case_history) as case_history,
    (SELECT COUNT(*) FROM public.evidence) as evidence,
    (SELECT COUNT(*) FROM public.notifications) as notifications
)
SELECT
  'Total records across all tables' as metric,
  (profiles + cases + parties + documents + tasks + events + land_parcels + case_history + evidence + notifications) as value
FROM totals
UNION ALL
SELECT
  'Expected minimum records' as metric,
  100 as value
UNION ALL
SELECT
  'Status' as metric,
  CASE
    WHEN (SELECT SUM(value::int) FROM (
      SELECT (profiles + cases + parties + documents + tasks + events + land_parcels + case_history + evidence + notifications) as value FROM totals
    ) sub) >= 100
    THEN 1  -- Represents 'SUCCESS ✓'
    ELSE 0  -- Represents 'FAILED'
  END as value
FROM totals;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
DECLARE
  total_records int;
BEGIN
  SELECT COUNT(*) INTO total_records FROM public.cases;

  IF total_records >= 7 THEN
    RAISE NOTICE '';
    RAISE NOTICE '===================================================';
    RAISE NOTICE '✓ VERIFICATION SUCCESSFUL!';
    RAISE NOTICE '===================================================';
    RAISE NOTICE 'Sample data is loaded correctly.';
    RAISE NOTICE 'You have % legal cases ready to explore.', total_records;
    RAISE NOTICE 'You can now login and test the system!';
    RAISE NOTICE '===================================================';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '===================================================';
    RAISE NOTICE '⚠ VERIFICATION INCOMPLETE';
    RAISE NOTICE '===================================================';
    RAISE NOTICE 'Expected 7 cases, found %.', total_records;
    RAISE NOTICE 'Please run sample-data.sql to load sample data.';
    RAISE NOTICE '===================================================';
  END IF;
END $$;

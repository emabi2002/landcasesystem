-- =====================================================
-- QUICK DATABASE VERIFICATION - NO ERRORS VERSION
-- Run this to verify all tables after database restore
-- =====================================================

-- PART 1: Check if tables exist
SELECT
  'Table Check' as verification_type,
  t.table_name,
  'EXISTS' as status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN (
  'profiles', 'cases', 'parties', 'documents',
  'tasks', 'events', 'land_parcels', 'case_history',
  'notifications', 'case_comments', 'executive_workflow', 'case_assignments',
  'user_groups', 'system_modules', 'permissions',
  'group_module_access', 'user_group_membership', 'rbac_audit_log'
)
ORDER BY t.table_name;

-- PART 2: Summary count
SELECT
  'SUMMARY' as check_type,
  COUNT(*) as tables_found,
  18 as tables_expected,
  CASE
    WHEN COUNT(*) = 18 THEN '✅ ALL TABLES PRESENT'
    WHEN COUNT(*) >= 12 THEN '⚠️ CORE TABLES OK, RBAC MISSING'
    WHEN COUNT(*) >= 6 THEN '⚠️ SOME CORE TABLES MISSING'
    ELSE '❌ MANY TABLES MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'cases', 'parties', 'documents',
  'tasks', 'events', 'land_parcels', 'case_history',
  'notifications', 'case_comments', 'executive_workflow', 'case_assignments',
  'user_groups', 'system_modules', 'permissions',
  'group_module_access', 'user_group_membership', 'rbac_audit_log'
);

-- PART 3: Check which tables are MISSING
SELECT
  'MISSING TABLES' as check_type,
  missing_table,
  CASE
    WHEN missing_table IN ('profiles', 'cases') THEN '❌ CRITICAL - System won''t work'
    WHEN missing_table IN ('parties', 'documents', 'tasks', 'events') THEN '⚠️ HIGH - Major features broken'
    WHEN missing_table IN ('user_groups', 'system_modules') THEN '⚠️ MEDIUM - RBAC broken'
    ELSE '⚠️ LOW - Minor features affected'
  END as impact
FROM (
  SELECT unnest(ARRAY[
    'profiles', 'cases', 'parties', 'documents',
    'tasks', 'events', 'land_parcels', 'case_history',
    'notifications', 'case_comments', 'executive_workflow', 'case_assignments',
    'user_groups', 'system_modules', 'permissions',
    'group_module_access', 'user_group_membership', 'rbac_audit_log'
  ]) as missing_table
) required
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_name = required.missing_table
)
ORDER BY impact DESC, missing_table;

-- PART 4: Core vs RBAC breakdown
SELECT
  'Core System Tables' as category,
  COUNT(*) as found,
  12 as expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'cases', 'parties', 'documents',
  'tasks', 'events', 'land_parcels', 'case_history',
  'notifications', 'case_comments', 'executive_workflow', 'case_assignments'
)
UNION ALL
SELECT
  'RBAC System Tables',
  COUNT(*),
  6
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_groups', 'system_modules', 'permissions',
  'group_module_access', 'user_group_membership', 'rbac_audit_log'
);

-- PART 5: Check functions
SELECT
  'Functions' as check_type,
  proname as function_name,
  'EXISTS' as status
FROM pg_proc
WHERE proname IN (
  'get_executive_officers',
  'notify_executive_officers',
  'initialize_executive_workflow'
)
ORDER BY proname;

-- PART 6: Check views
SELECT
  'Views' as check_type,
  table_name as view_name,
  'EXISTS' as status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
  'executive_workflow_summary',
  'pending_executive_reviews',
  'case_assignment_status'
)
ORDER BY table_name;

-- PART 7: RLS Status
SELECT
  'Row Level Security' as check_type,
  c.relname as table_name,
  CASE WHEN c.relrowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ⚠️' END as rls_status,
  COUNT(p.policyname) as policy_count
FROM pg_class c
LEFT JOIN pg_policies p ON p.tablename = c.relname
WHERE c.relnamespace = 'public'::regnamespace
AND c.relname IN (
  'profiles', 'cases', 'parties', 'documents',
  'tasks', 'events', 'notifications', 'case_comments',
  'user_groups', 'system_modules'
)
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- PART 8: Data integrity - record counts
SELECT
  'Data Counts' as check_type,
  'Users (profiles)' as table_name,
  COUNT(*)::text as record_count
FROM profiles
UNION ALL
SELECT 'Data Counts', 'Cases', COUNT(*)::text FROM cases
UNION ALL
SELECT 'Data Counts', 'Documents', COUNT(*)::text FROM documents
UNION ALL
SELECT 'Data Counts', 'Tasks', COUNT(*)::text FROM tasks
UNION ALL
SELECT 'Data Counts', 'User Groups', COUNT(*)::text FROM user_groups
UNION ALL
SELECT 'Data Counts', 'System Modules', COUNT(*)::text FROM system_modules;

-- =====================================================
-- INTERPRETATION GUIDE
-- =====================================================
--
-- PART 2 (Summary):
-- - 18/18 tables = ✅ Perfect! Everything exists
-- - 12-17 tables = ⚠️ Some missing, check PART 3
-- - <12 tables = ❌ Many missing, run migrations
--
-- PART 3 (Missing Tables):
-- - If empty = ✅ No tables missing!
-- - If has rows = ❌ Shows which tables to restore
--
-- PART 4 (Core vs RBAC):
-- - Core: 12/12 = ✅ System will work
-- - RBAC: 6/6 = ✅ Permissions will work
--
-- NEXT STEPS IF TABLES MISSING:
-- 1. Core tables missing → Run FRESH_DATABASE_SETUP.sql
-- 2. RBAC tables missing → Run database-rbac-system.sql
-- 3. Both missing → Run BOTH scripts in order
--
-- =====================================================

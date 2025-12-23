-- =====================================================
-- UNRE TABLE VERIFICATION (Supabase-Compatible)
-- Shows results in table format, not RAISE NOTICE
-- Run each query separately to see results
-- =====================================================

-- =====================================================
-- QUERY 1: Check which UNRE tables exist
-- Copy and run this first
-- =====================================================

SELECT
  table_name,
  '❌ FOUND - Will be removed' as status,
  'UNRE Finance Module' as module
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'aap_header', 'aap_line', 'aap_line_schedule', 'aap_approvals',
  'ge_requests', 'ge_line_items', 'ge_approvals',
  'budget_lines', 'budget_line', 'budget_commitments', 'payment_vouchers',
  'cost_centres', 'chart_of_accounts', 'expense_types', 'suppliers', 'fiscal_year',
  'roles', 'user_roles', 'user_profiles'
)
ORDER BY table_name;

-- =====================================================
-- QUERY 2: Check dependencies (Foreign Keys)
-- Copy and run this second
-- =====================================================

/*
SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_name,
  '⚠️ DEPENDENCY FOUND' as warning
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND ccu.table_name IN (
  'aap_header', 'aap_line', 'aap_line_schedule', 'aap_approvals',
  'ge_requests', 'ge_line_items', 'ge_approvals',
  'budget_lines', 'budget_line', 'budget_commitments', 'payment_vouchers',
  'cost_centres', 'chart_of_accounts', 'expense_types', 'suppliers', 'fiscal_year',
  'roles', 'user_roles', 'user_profiles'
)
ORDER BY from_table;

-- If this returns no rows: ✅ Safe to proceed
-- If this returns rows: ⛔ STOP - Dependencies exist
*/

-- =====================================================
-- QUERY 3: Verify Lands tables are safe
-- Copy and run this third
-- =====================================================

/*
SELECT
  table_name,
  '✅ SAFE - Will NOT be removed' as status,
  'Lands Department' as module
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'cases', 'parties', 'documents', 'tasks', 'events',
  'land_parcels', 'case_history', 'notifications', 'case_comments',
  'executive_workflow', 'case_assignments'
)
ORDER BY table_name;
*/

-- =====================================================
-- QUERY 4: Check shared tables (documents, notifications)
-- Copy and run this fourth
-- =====================================================

/*
SELECT
  table_name,
  '⚠️ SHARED - Check if used by Lands' as status,
  CASE
    WHEN table_name = 'documents' THEN 'Used by Legal Case Management'
    WHEN table_name = 'notifications' THEN 'Used by Executive Workflow'
    WHEN table_name = 'case_comments' THEN 'Used by Executive Workflow'
    ELSE 'Check usage'
  END as notes
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('documents', 'notifications', 'case_comments', 'audit_logs')
ORDER BY table_name;
*/

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

-- 1. Run QUERY 1 first (already uncommented above)
--    This shows which UNRE tables exist
--
-- 2. Uncomment and run QUERY 2
--    This checks for dependencies (should be empty)
--
-- 3. Uncomment and run QUERY 3
--    This verifies your Lands tables are safe
--
-- 4. Uncomment and run QUERY 4
--    This shows shared tables that must be kept
--
-- 5. Share all results with me before proceeding!

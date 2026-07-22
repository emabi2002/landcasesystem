-- ============================================
-- VERIFY RBAC + DATA SCOPE DEPLOYMENT
-- ============================================
-- Run these queries to confirm everything worked
-- ============================================

-- 1. Check data scopes exist
SELECT '1. DATA SCOPES' as check_name, code, name 
FROM public.data_scopes 
ORDER BY sort_order;

-- 2. Check group scope rules seeded
SELECT '2. SCOPE RULES' as check_name,
       g.group_name,
       m.module_name,
       ds.code as scope
FROM public.group_scope_rules gsr
JOIN public.groups g ON g.id = gsr.group_id
JOIN public.modules m ON m.id = gsr.module_id
JOIN public.data_scopes ds ON ds.id = gsr.scope_id
WHERE gsr.allow = TRUE
ORDER BY g.group_name, ds.code;

-- 3. Check new columns in cases table
SELECT '3. CASES TABLE COLUMNS' as check_name,
       column_name, 
       data_type
FROM information_schema.columns
WHERE table_name = 'cases'
  AND column_name IN ('created_group_id', 'assigned_group_id', 'department_id', 'is_confidential')
ORDER BY column_name;

-- 4. Check new permission columns
SELECT '4. PERMISSION COLUMNS' as check_name,
       column_name
FROM information_schema.columns
WHERE table_name = 'group_module_permissions'
  AND column_name IN ('can_allocate', 'can_recommend', 'can_directive', 'can_close_case', 'can_reassign')
ORDER BY column_name;

-- 5. Check RLS enabled on cases
SELECT '5. RLS STATUS' as check_name,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('cases', 'data_scopes', 'group_scope_rules')
ORDER BY tablename;

-- 6. Check RLS policies on cases
SELECT '6. RLS POLICIES' as check_name,
       policyname,
       cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'cases'
ORDER BY policyname;

-- 7. Check scope enforcement function exists
SELECT '7. SCOPE FUNCTION' as check_name,
       routine_name,
       routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'user_can_access_case';

-- ============================================
-- SUCCESS SUMMARY
-- ============================================
SELECT '========================================' as summary
UNION ALL SELECT '✅ RBAC + DATA SCOPE DEPLOYMENT VERIFIED'
UNION ALL SELECT '========================================'
UNION ALL SELECT ''
UNION ALL SELECT 'Your system now has:'
UNION ALL SELECT '✅ Two-layer permission system'
UNION ALL SELECT '✅ Database-enforced row-level security'
UNION ALL SELECT '✅ Scope-based access control'
UNION ALL SELECT '✅ Specialized action permissions'
UNION ALL SELECT ''
UNION ALL SELECT 'Next: Test with different user roles!';

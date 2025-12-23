-- =====================================================
-- RBAC MIGRATION VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify migration
-- =====================================================

-- 1. Verify all tables were created
SELECT 'Tables Created' as check_type, COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_groups',
  'system_modules',
  'permissions',
  'group_module_access',
  'user_group_membership',
  'rbac_audit_log'
);
-- Expected: count = 6

-- 2. List all user groups created
SELECT
  'User Groups' as check_type,
  group_name,
  group_code,
  is_active,
  description
FROM user_groups
ORDER BY group_name;
-- Expected: 7 groups

-- 3. List all system modules created
SELECT
  'System Modules' as check_type,
  module_name,
  module_code,
  module_url,
  is_active
FROM system_modules
ORDER BY display_order, module_name;
-- Expected: 18 modules

-- 4. Check indexes were created
SELECT
  'Indexes' as check_type,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_groups', 'system_modules', 'group_module_access', 'user_group_membership')
ORDER BY tablename, indexname;
-- Expected: Multiple indexes

-- 5. Verify RLS is enabled
SELECT
  'RLS Enabled' as check_type,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_groups',
  'system_modules',
  'group_module_access',
  'user_group_membership',
  'rbac_audit_log'
)
ORDER BY tablename;
-- Expected: All should have rowsecurity = true

-- 6. Count permissions (if any exist)
SELECT
  'Permissions' as check_type,
  COUNT(*) as total_permissions
FROM permissions;
-- Expected: 8 permissions

-- 7. Summary report
SELECT
  'MIGRATION SUMMARY' as report,
  (SELECT COUNT(*) FROM user_groups) as total_groups,
  (SELECT COUNT(*) FROM system_modules) as total_modules,
  (SELECT COUNT(*) FROM permissions) as total_permissions,
  (SELECT COUNT(*) FROM group_module_access) as total_access_grants,
  (SELECT COUNT(*) FROM user_group_membership) as total_memberships;

-- =====================================================
-- SUCCESS CRITERIA
-- =====================================================
-- ✅ 6 tables created
-- ✅ 7 user groups
-- ✅ 18 system modules
-- ✅ 8 permissions
-- ✅ RLS enabled on all tables
-- ✅ Indexes created
-- =====================================================

-- 8. Show default groups with details
SELECT
  group_name,
  group_code,
  description,
  is_active,
  created_at
FROM user_groups
ORDER BY
  CASE group_code
    WHEN 'ADMIN' THEN 1
    WHEN 'LEGAL_OFF' THEN 2
    WHEN 'SURVEY_OFF' THEN 3
    WHEN 'REGISTRY' THEN 4
    WHEN 'EXEC_OFF' THEN 5
    WHEN 'COMPLIANCE' THEN 6
    WHEN 'READ_ONLY' THEN 7
  END;

-- 9. Show all modules by category
SELECT
  module_name,
  module_code,
  module_url,
  display_order,
  is_active
FROM system_modules
ORDER BY display_order, module_name;

-- =====================================================
-- If all queries return expected results, migration is SUCCESS!
-- =====================================================

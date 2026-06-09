-- ============================================
-- PHASE A: ACCESS CONTROL DISCOVERY
-- ============================================
-- Run this in Supabase SQL Editor
-- Copy results to analyze current state
-- ============================================

-- 1. EXISTING RBAC TABLES
SELECT
    'RBAC TABLES' as category,
    table_name,
    CASE
        WHEN table_name ILIKE '%user%' THEN 'User mgmt'
        WHEN table_name ILIKE '%group%' THEN 'Group mgmt'
        WHEN table_name ILIKE '%role%' THEN 'Role mgmt'
        WHEN table_name ILIKE '%permission%' THEN 'Permission mgmt'
        WHEN table_name ILIKE '%access%' THEN 'Access control'
        WHEN table_name ILIKE '%scope%' THEN 'Data scope'
        ELSE 'Other'
    END as purpose
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND (
        table_name ILIKE '%user%' OR
        table_name ILIKE '%group%' OR
        table_name ILIKE '%role%' OR
        table_name ILIKE '%permission%' OR
        table_name ILIKE '%access%' OR
        table_name ILIKE '%scope%'
    )
ORDER BY purpose, table_name;

-- ============================================

-- 2. CASES TABLE OWNERSHIP COLUMNS
SELECT
    'CASES OWNERSHIP' as category,
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_name ILIKE '%created_by%' THEN 'Creator'
        WHEN column_name ILIKE '%assigned%' THEN 'Assignment'
        WHEN column_name ILIKE '%group%' THEN 'Group'
        ELSE 'Other'
    END as purpose
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'cases'
    AND (
        column_name ILIKE '%created_by%' OR
        column_name ILIKE '%owner%' OR
        column_name ILIKE '%assigned%' OR
        column_name ILIKE '%user%' OR
        column_name ILIKE '%group%' OR
        column_name ILIKE '%department%'
    )
ORDER BY column_name;

-- ============================================

-- 3. RLS STATUS
SELECT
    'RLS STATUS' as category,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('cases', 'users', 'profiles', 'groups',
                      'roles', 'permissions', 'documents', 'tasks')
ORDER BY rowsecurity DESC, tablename;

-- ============================================

-- 4. EXISTING RLS POLICIES
SELECT
    'RLS POLICIES' as category,
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================

-- 5. ALL OWNERSHIP COLUMNS ACROSS TABLES
SELECT
    'OWNERSHIP COLUMNS' as category,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name IN ('created_by', 'owner_id', 'user_id', 'assigned_to',
                       'assigned_user_id', 'assigned_group_id', 'created_group_id')
ORDER BY table_name, column_name;

-- ============================================

-- 6. RECORD COUNTS
SELECT 'RECORD COUNTS' as category, 'users/profiles' as table_name,
       COALESCE((SELECT COUNT(*) FROM auth.users), 0) as count
UNION ALL
SELECT 'RECORD COUNTS', 'profiles',
       COALESCE((SELECT COUNT(*) FROM profiles WHERE true), 0)
UNION ALL
SELECT 'RECORD COUNTS', 'groups',
       COALESCE((SELECT COUNT(*) FROM groups WHERE true), 0)
UNION ALL
SELECT 'RECORD COUNTS', 'user_groups',
       COALESCE((SELECT COUNT(*) FROM user_groups WHERE true), 0)
UNION ALL
SELECT 'RECORD COUNTS', 'roles',
       COALESCE((SELECT COUNT(*) FROM user_roles WHERE true), 0)
UNION ALL
SELECT 'RECORD COUNTS', 'permissions',
       COALESCE((SELECT COUNT(*) FROM permissions WHERE true), 0)
UNION ALL
SELECT 'RECORD COUNTS', 'cases',
       COALESCE((SELECT COUNT(*) FROM cases WHERE true), 0);

-- ============================================

-- 7. PROFILES TABLE STRUCTURE (if exists)
SELECT
    'PROFILES SCHEMA' as category,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================

-- 8. GROUPS TABLE STRUCTURE (if exists)
SELECT
    'GROUPS SCHEMA' as category,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'groups'
ORDER BY ordinal_position;

-- ============================================

-- SUMMARY
SELECT '========================================' as summary
UNION ALL SELECT 'ACCESS CONTROL DISCOVERY COMPLETE'
UNION ALL SELECT '========================================'
UNION ALL SELECT 'Review results above to determine:'
UNION ALL SELECT '1. Which RBAC tables already exist'
UNION ALL SELECT '2. Whether RLS is enabled'
UNION ALL SELECT '3. What ownership columns are present'
UNION ALL SELECT '4. Gaps in the permission system'
UNION ALL SELECT ''
UNION ALL SELECT 'Proceed to Phase B after analysis';

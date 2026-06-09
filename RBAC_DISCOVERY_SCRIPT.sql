-- ============================================
-- PHASE A: ACCESS CONTROL DISCOVERY SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor to produce
-- an Access Control Inventory Report
-- ============================================

\echo '========================================';
\echo 'ACCESS CONTROL INVENTORY REPORT';
\echo '========================================';
\echo '';

-- ============================================
-- 1. EXISTING RBAC TABLES
-- ============================================
\echo '1. EXISTING RBAC TABLES';
\echo '----------------------------------------';

SELECT
    table_name,
    CASE
        WHEN table_name ILIKE '%user%' THEN 'User management'
        WHEN table_name ILIKE '%group%' THEN 'Group management'
        WHEN table_name ILIKE '%role%' THEN 'Role management'
        WHEN table_name ILIKE '%permission%' THEN 'Permission management'
        WHEN table_name ILIKE '%access%' THEN 'Access control'
        WHEN table_name ILIKE '%scope%' THEN 'Data scope'
        ELSE 'Other'
    END as purpose_category
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND (
        table_name ILIKE '%user%' OR
        table_name ILIKE '%group%' OR
        table_name ILIKE '%role%' OR
        table_name ILIKE '%permission%' OR
        table_name ILIKE '%access%' OR
        table_name ILIKE '%scope%' OR
        table_name ILIKE '%auth%'
    )
ORDER BY purpose_category, table_name;

\echo '';

-- ============================================
-- 2. CASE TABLE OWNERSHIP COLUMNS
-- ============================================
\echo '2. CASE TABLE - OWNERSHIP & ASSIGNMENT COLUMNS';
\echo '----------------------------------------';

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name ILIKE '%created_by%' THEN 'Creator/Owner'
        WHEN column_name ILIKE '%owner%' THEN 'Owner'
        WHEN column_name ILIKE '%assigned%' THEN 'Assignment'
        WHEN column_name ILIKE '%user%' THEN 'User reference'
        WHEN column_name ILIKE '%group%' THEN 'Group reference'
        WHEN column_name ILIKE '%department%' THEN 'Department'
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
ORDER BY ordinal_position;

\echo '';

-- ============================================
-- 3. ALL TABLES WITH OWNERSHIP COLUMNS
-- ============================================
\echo '3. ALL TABLES WITH OWNERSHIP/ASSIGNMENT COLUMNS';
\echo '----------------------------------------';

SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND (
        column_name IN ('created_by', 'owner_id', 'user_id', 'assigned_to',
                       'assigned_user_id', 'assigned_group_id', 'created_group_id',
                       'department_id', 'division_id')
    )
ORDER BY table_name, column_name;

\echo '';

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
\echo '4. EXISTING RLS POLICIES';
\echo '----------------------------------------';

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo '';

-- ============================================
-- 5. TABLES WITH RLS ENABLED
-- ============================================
\echo '5. TABLES WITH RLS ENABLED/DISABLED';
\echo '----------------------------------------';

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

\echo '';

-- ============================================
-- 6. EXISTING FUNCTIONS/PROCEDURES (ACCESS CONTROL)
-- ============================================
\echo '6. STORED FUNCTIONS (POTENTIAL ACCESS CONTROL)';
\echo '----------------------------------------';

SELECT
    routine_name,
    routine_type,
    data_type as return_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (
        routine_name ILIKE '%permission%' OR
        routine_name ILIKE '%access%' OR
        routine_name ILIKE '%scope%' OR
        routine_name ILIKE '%check%' OR
        routine_name ILIKE '%auth%'
    )
ORDER BY routine_name;

\echo '';

-- ============================================
-- 7. TRIGGERS (ACCESS CONTROL RELATED)
-- ============================================
\echo '7. TRIGGERS (AUDIT/ACCESS RELATED)';
\echo '----------------------------------------';

SELECT
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo '';

-- ============================================
-- 8. DETAILED SCHEMA: RBAC TABLES
-- ============================================
\echo '8. DETAILED SCHEMA OF KEY RBAC TABLES';
\echo '----------------------------------------';

-- Check if specific RBAC tables exist
DO $$
DECLARE
    rbac_tables TEXT[] := ARRAY['users', 'profiles', 'groups', 'user_groups',
                                 'roles', 'user_roles', 'group_roles',
                                 'permissions', 'role_permissions',
                                 'modules', 'functions', 'data_scopes'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY rbac_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = tbl) THEN
            RAISE NOTICE '';
            RAISE NOTICE 'Table: %', tbl;
            RAISE NOTICE '----------------------------------------';

            -- Show columns
            PERFORM column_name || ' (' || data_type ||
                   CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END || ')'
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = tbl
            ORDER BY ordinal_position;
        END IF;
    END LOOP;
END $$;

\echo '';

-- ============================================
-- 9. FOREIGN KEY RELATIONSHIPS (RBAC)
-- ============================================
\echo '9. FOREIGN KEY RELATIONSHIPS';
\echo '----------------------------------------';

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (
        tc.table_name ILIKE '%user%' OR
        tc.table_name ILIKE '%group%' OR
        tc.table_name ILIKE '%role%' OR
        tc.table_name ILIKE '%permission%'
    )
ORDER BY tc.table_name, kcu.column_name;

\echo '';

-- ============================================
-- 10. SAMPLE DATA COUNTS
-- ============================================
\echo '10. RECORD COUNTS IN RBAC TABLES';
\echo '----------------------------------------';

DO $$
DECLARE
    rbac_tables TEXT[] := ARRAY['users', 'profiles', 'groups', 'user_groups',
                                 'roles', 'user_roles', 'permissions',
                                 'role_permissions', 'modules'];
    tbl TEXT;
    cnt INTEGER;
BEGIN
    FOREACH tbl IN ARRAY rbac_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('SELECT COUNT(*) FROM %I', tbl) INTO cnt;
            RAISE NOTICE '% : % records', tbl, cnt;
        END IF;
    END LOOP;
END $$;

\echo '';

-- ============================================
-- 11. SUMMARY ASSESSMENT
-- ============================================
\echo '11. ASSESSMENT SUMMARY';
\echo '========================================';

SELECT
    'Total Tables' as metric,
    COUNT(*)::TEXT as value
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'

UNION ALL

SELECT
    'RBAC Tables',
    COUNT(*)::TEXT
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND (
        table_name ILIKE '%user%' OR
        table_name ILIKE '%group%' OR
        table_name ILIKE '%role%' OR
        table_name ILIKE '%permission%'
    )

UNION ALL

SELECT
    'Tables with RLS Enabled',
    COUNT(*)::TEXT
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = true

UNION ALL

SELECT
    'Total RLS Policies',
    COUNT(*)::TEXT
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Tables with created_by',
    COUNT(DISTINCT table_name)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'created_by'

UNION ALL

SELECT
    'Tables with assigned_to',
    COUNT(DISTINCT table_name)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'assigned_to';

\echo '';
\echo '========================================';
\echo 'DISCOVERY COMPLETE';
\echo '========================================';

-- ============================================
-- RECOMMENDATIONS OUTPUT
-- ============================================

\echo '';
\echo 'NEXT STEPS:';
\echo '1. Review the tables and columns above';
\echo '2. Identify gaps in RBAC infrastructure';
\echo '3. Check if data scope columns exist in cases table';
\echo '4. Verify RLS policies are comprehensive';
\echo '5. Proceed to Phase B: Design unified access model';

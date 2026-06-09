-- =====================================================================
-- EMPTY ALL DATA - WORKS WITH ANY TABLE CONFIGURATION
-- =====================================================================
-- This version uses DO blocks to handle missing tables gracefully
-- Preserves: groups, modules, group_module_permissions, user_groups
-- =====================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Delete from all tables except RBAC tables
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            'groups',
            'modules',
            'group_module_permissions',
            'user_groups'
        )
        ORDER BY tablename
    LOOP
        EXECUTE format('DELETE FROM %I', r.tablename);
        RAISE NOTICE 'Deleted all records from: %', r.tablename;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE EMPTIED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
END $$;

-- Show verification counts
SELECT
  'Cases' as table_name,
  COUNT(*) as records
FROM cases
UNION ALL
SELECT 'Documents', COUNT(*) FROM documents
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Land Parcels', COUNT(*) FROM land_parcels
UNION ALL
SELECT 'Litigation Costs', COUNT(*) FROM litigation_costs
UNION ALL
SELECT '--- RBAC System ---', NULL
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Modules', COUNT(*) FROM modules
UNION ALL
SELECT 'Permissions', COUNT(*) FROM group_module_permissions
ORDER BY table_name;

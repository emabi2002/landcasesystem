-- =====================================================================
-- EMPTY ALL DATA - HANDLES FOREIGN KEY CONSTRAINTS
-- =====================================================================
-- Uses TRUNCATE CASCADE to automatically handle foreign key constraints
-- Preserves: groups, modules, group_module_permissions, user_groups
-- =====================================================================

DO $$ 
DECLARE
    r RECORD;
    table_list TEXT := '';
BEGIN
    -- Build comma-separated list of tables to truncate (excluding RBAC tables)
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
        IF table_list != '' THEN
            table_list := table_list || ', ';
        END IF;
        table_list := table_list || quote_ident(r.tablename);
        RAISE NOTICE 'Will empty table: %', r.tablename;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Emptying all tables...';
    
    -- Truncate all tables at once with CASCADE
    IF table_list != '' THEN
        EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE';
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'DATABASE EMPTIED SUCCESSFULLY!';
        RAISE NOTICE 'All foreign key constraints handled.';
        RAISE NOTICE 'All ID sequences reset to 1.';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE 'No tables to empty.';
    END IF;
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

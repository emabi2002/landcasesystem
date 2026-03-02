-- =====================================================================
-- EMPTY ALL DATA - HANDLES EVERYTHING
-- =====================================================================
-- Uses TRUNCATE CASCADE + handles missing tables in verification
-- =====================================================================

-- STEP 1: Empty all tables (except RBAC)
DO $$ 
DECLARE
    r RECORD;
    table_list TEXT := '';
BEGIN
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
    END LOOP;
    
    IF table_list != '' THEN
        EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'DATABASE EMPTIED SUCCESSFULLY!';
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- STEP 2: Show counts (only for tables that exist)
DO $$
DECLARE
    r RECORD;
    cnt INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Verification Counts:';
    RAISE NOTICE '--------------------';
    
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', r.tablename) INTO cnt;
        
        IF r.tablename IN ('groups', 'modules', 'group_module_permissions', 'user_groups') THEN
            RAISE NOTICE '✓ % (RBAC): % records', r.tablename, cnt;
        ELSE
            RAISE NOTICE '  %: % records', r.tablename, cnt;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Done! System ready for fresh data.';
END $$;

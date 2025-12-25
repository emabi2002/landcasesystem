-- =====================================================
-- COMPLETE DATABASE VERIFICATION SCRIPT
-- DLPP Legal Case Management System
-- =====================================================
-- This script verifies ALL tables exist and have correct structure
-- Run this after database restore to ensure system integrity
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: VERIFY ALL TABLES EXIST
-- =====================================================

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  table_name TEXT;
  required_tables TEXT[] := ARRAY[
    -- Core System Tables
    'profiles',
    'cases',
    'parties',
    'documents',
    'tasks',
    'events',
    'land_parcels',
    'case_history',
    'notifications',
    'case_comments',

    -- Executive Workflow Tables
    'executive_workflow',
    'case_assignments',

    -- RBAC System Tables
    'user_groups',
    'system_modules',
    'permissions',
    'group_module_access',
    'user_group_membership',
    'rbac_audit_log'
  ];
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STARTING DATABASE VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check each required table
  FOREACH table_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
      RAISE NOTICE '❌ MISSING: %', table_name;
    ELSE
      RAISE NOTICE '✅ EXISTS: %', table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total tables required: %', array_length(required_tables, 1);
  RAISE NOTICE 'Tables found: %', array_length(required_tables, 1) - array_length(missing_tables, 1);
  RAISE NOTICE 'Tables missing: %', COALESCE(array_length(missing_tables, 1), 0);

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  MISSING TABLES:';
    FOREACH table_name IN ARRAY missing_tables
    LOOP
      RAISE NOTICE '   - %', table_name;
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ACTION REQUIRED:';
    RAISE NOTICE '   Run the appropriate migration script(s):';
    RAISE NOTICE '   - FRESH_DATABASE_SETUP.sql (for core tables)';
    RAISE NOTICE '   - database-rbac-system.sql (for RBAC tables)';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ ALL TABLES EXIST!';
  END IF;
END $$;

-- =====================================================
-- PART 2: VERIFY TABLE STRUCTURES
-- =====================================================

-- Check profiles table
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFYING TABLE STRUCTURES';
  RAISE NOTICE '========================================';

  -- Profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✅ profiles: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'profiles' AND table_schema = 'public'
    );
  END IF;

  -- Cases
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cases') THEN
    RAISE NOTICE '✅ cases: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'cases' AND table_schema = 'public'
    );
  END IF;

  -- Parties
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parties') THEN
    RAISE NOTICE '✅ parties: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'parties' AND table_schema = 'public'
    );
  END IF;

  -- Documents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    RAISE NOTICE '✅ documents: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'documents' AND table_schema = 'public'
    );
  END IF;

  -- Tasks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    RAISE NOTICE '✅ tasks: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'tasks' AND table_schema = 'public'
    );
  END IF;

  -- Events
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    RAISE NOTICE '✅ events: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'events' AND table_schema = 'public'
    );
  END IF;

  -- Land Parcels
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'land_parcels') THEN
    RAISE NOTICE '✅ land_parcels: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'land_parcels' AND table_schema = 'public'
    );
  END IF;

  -- Notifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    RAISE NOTICE '✅ notifications: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'notifications' AND table_schema = 'public'
    );
  END IF;

  -- Case Comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_comments') THEN
    RAISE NOTICE '✅ case_comments: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'case_comments' AND table_schema = 'public'
    );
  END IF;

  -- Executive Workflow
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'executive_workflow') THEN
    RAISE NOTICE '✅ executive_workflow: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'executive_workflow' AND table_schema = 'public'
    );
  END IF;

  -- Case Assignments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_assignments') THEN
    RAISE NOTICE '✅ case_assignments: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'case_assignments' AND table_schema = 'public'
    );
  END IF;

  -- RBAC Tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_groups') THEN
    RAISE NOTICE '✅ user_groups: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'user_groups' AND table_schema = 'public'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_modules') THEN
    RAISE NOTICE '✅ system_modules: % columns', (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'system_modules' AND table_schema = 'public'
    );
  END IF;
END $$;

-- =====================================================
-- PART 3: VERIFY FUNCTIONS EXIST
-- =====================================================

DO $$
DECLARE
  function_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFYING FUNCTIONS';
  RAISE NOTICE '========================================';

  -- Check get_executive_officers
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_executive_officers'
  ) THEN
    RAISE NOTICE '✅ get_executive_officers() exists';
  ELSE
    RAISE NOTICE '❌ MISSING: get_executive_officers()';
  END IF;

  -- Check notify_executive_officers
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'notify_executive_officers'
  ) THEN
    RAISE NOTICE '✅ notify_executive_officers() exists';
  ELSE
    RAISE NOTICE '❌ MISSING: notify_executive_officers()';
  END IF;

  -- Check initialize_executive_workflow
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'initialize_executive_workflow'
  ) THEN
    RAISE NOTICE '✅ initialize_executive_workflow() exists';
  ELSE
    RAISE NOTICE '❌ MISSING: initialize_executive_workflow()';
  END IF;

  -- Check user_has_module_access (RBAC)
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'user_has_module_access'
  ) THEN
    RAISE NOTICE '✅ user_has_module_access() exists';
  ELSE
    RAISE NOTICE '⚠️  OPTIONAL: user_has_module_access() (RBAC function)';
  END IF;

  -- Check get_user_accessible_modules (RBAC)
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_user_accessible_modules'
  ) THEN
    RAISE NOTICE '✅ get_user_accessible_modules() exists';
  ELSE
    RAISE NOTICE '⚠️  OPTIONAL: get_user_accessible_modules() (RBAC function)';
  END IF;
END $$;

-- =====================================================
-- PART 4: VERIFY VIEWS EXIST
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFYING VIEWS';
  RAISE NOTICE '========================================';

  -- Executive workflow views
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'executive_workflow_summary'
  ) THEN
    RAISE NOTICE '✅ executive_workflow_summary exists';
  ELSE
    RAISE NOTICE '❌ MISSING: executive_workflow_summary';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'pending_executive_reviews'
  ) THEN
    RAISE NOTICE '✅ pending_executive_reviews exists';
  ELSE
    RAISE NOTICE '❌ MISSING: pending_executive_reviews';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'case_assignment_status'
  ) THEN
    RAISE NOTICE '✅ case_assignment_status exists';
  ELSE
    RAISE NOTICE '❌ MISSING: case_assignment_status';
  END IF;
END $$;

-- =====================================================
-- PART 5: VERIFY RLS POLICIES
-- =====================================================

DO $$
DECLARE
  table_name TEXT;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFYING ROW LEVEL SECURITY';
  RAISE NOTICE '========================================';

  -- Check RLS on key tables
  FOR table_name IN
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('profiles', 'cases', 'parties', 'documents',
                        'tasks', 'events', 'notifications', 'case_comments',
                        'user_groups', 'system_modules')
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name;

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name;

    IF rls_enabled THEN
      RAISE NOTICE '✅ %: RLS enabled (% policies)', table_name, policy_count;
    ELSE
      RAISE NOTICE '⚠️  %: RLS disabled', table_name;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- PART 6: DATA INTEGRITY CHECKS
-- =====================================================

DO $$
DECLARE
  total_cases INTEGER;
  total_users INTEGER;
  total_groups INTEGER;
  total_modules INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA INTEGRITY CHECKS';
  RAISE NOTICE '========================================';

  -- Count data in key tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    SELECT COUNT(*) INTO total_users FROM profiles;
    RAISE NOTICE 'Users (profiles): %', total_users;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cases') THEN
    SELECT COUNT(*) INTO total_cases FROM cases;
    RAISE NOTICE 'Cases: %', total_cases;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_groups') THEN
    SELECT COUNT(*) INTO total_groups FROM user_groups;
    RAISE NOTICE 'User Groups: % (expected: 7)', total_groups;

    IF total_groups < 7 THEN
      RAISE NOTICE '⚠️  WARNING: Expected 7 user groups, found %', total_groups;
      RAISE NOTICE '   Run database-rbac-system.sql to create default groups';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_modules') THEN
    SELECT COUNT(*) INTO total_modules FROM system_modules;
    RAISE NOTICE 'System Modules: % (expected: 18)', total_modules;

    IF total_modules < 18 THEN
      RAISE NOTICE '⚠️  WARNING: Expected 18 modules, found %', total_modules;
      RAISE NOTICE '   Run database-rbac-system.sql to create default modules';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 7: FOREIGN KEY INTEGRITY
-- =====================================================

DO $$
DECLARE
  fk_violations INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FOREIGN KEY INTEGRITY';
  RAISE NOTICE '========================================';

  -- Check for orphaned records
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cases')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN

    SELECT COUNT(*) INTO fk_violations
    FROM cases
    WHERE assigned_officer_id IS NOT NULL
    AND assigned_officer_id NOT IN (SELECT id FROM profiles);

    IF fk_violations > 0 THEN
      RAISE NOTICE '⚠️  Cases with invalid assigned_officer_id: %', fk_violations;
    ELSE
      RAISE NOTICE '✅ Cases.assigned_officer_id: All valid';
    END IF;

    SELECT COUNT(*) INTO fk_violations
    FROM cases
    WHERE created_by IS NOT NULL
    AND created_by NOT IN (SELECT id FROM profiles);

    IF fk_violations > 0 THEN
      RAISE NOTICE '⚠️  Cases with invalid created_by: %', fk_violations;
    ELSE
      RAISE NOTICE '✅ Cases.created_by: All valid';
    END IF;
  END IF;

  -- Check parties foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parties')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cases') THEN

    SELECT COUNT(*) INTO fk_violations
    FROM parties
    WHERE case_id NOT IN (SELECT id FROM cases);

    IF fk_violations > 0 THEN
      RAISE NOTICE '⚠️  Parties with invalid case_id: %', fk_violations;
    ELSE
      RAISE NOTICE '✅ Parties.case_id: All valid';
    END IF;
  END IF;

  -- Check documents foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cases') THEN

    SELECT COUNT(*) INTO fk_violations
    FROM documents
    WHERE case_id NOT IN (SELECT id FROM cases);

    IF fk_violations > 0 THEN
      RAISE NOTICE '⚠️  Documents with invalid case_id: %', fk_violations;
    ELSE
      RAISE NOTICE '✅ Documents.case_id: All valid';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 8: CRITICAL COLUMNS CHECK
-- =====================================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CRITICAL COLUMNS VERIFICATION';
  RAISE NOTICE '========================================';

  -- Check profiles columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    FOR col_name IN SELECT unnest(ARRAY['id', 'email', 'full_name', 'role'])
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = col_name
      ) THEN
        RAISE NOTICE '❌ MISSING: profiles.%', col_name;
        missing_columns := array_append(missing_columns, 'profiles.' || col_name);
      END IF;
    END LOOP;
  END IF;

  -- Check cases columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cases') THEN
    FOR col_name IN SELECT unnest(ARRAY['id', 'case_number', 'title', 'status', 'assigned_officer_id'])
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cases' AND column_name = col_name
      ) THEN
        RAISE NOTICE '❌ MISSING: cases.%', col_name;
        missing_columns := array_append(missing_columns, 'cases.' || col_name);
      END IF;
    END LOOP;
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  CRITICAL: Missing columns detected!';
    RAISE NOTICE '   This may cause application errors.';
    RAISE NOTICE '   Run FRESH_DATABASE_SETUP.sql to fix.';
  ELSE
    RAISE NOTICE '✅ All critical columns present';
  END IF;
END $$;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
  core_tables_exist BOOLEAN;
  rbac_tables_exist BOOLEAN;
  functions_exist BOOLEAN;
  views_exist BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';

  -- Core tables check
  core_tables_exist := (
    SELECT COUNT(*) = 12
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'profiles', 'cases', 'parties', 'documents',
      'tasks', 'events', 'land_parcels', 'case_history',
      'notifications', 'case_comments', 'executive_workflow', 'case_assignments'
    )
  );

  -- RBAC tables check
  rbac_tables_exist := (
    SELECT COUNT(*) = 6
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'user_groups', 'system_modules', 'permissions',
      'group_module_access', 'user_group_membership', 'rbac_audit_log'
    )
  );

  -- Functions check
  functions_exist := (
    SELECT COUNT(*) >= 3
    FROM pg_proc
    WHERE proname IN (
      'get_executive_officers',
      'notify_executive_officers',
      'initialize_executive_workflow'
    )
  );

  -- Views check
  views_exist := (
    SELECT COUNT(*) = 3
    FROM information_schema.views
    WHERE table_name IN (
      'executive_workflow_summary',
      'pending_executive_reviews',
      'case_assignment_status'
    )
  );

  RAISE NOTICE '';
  IF core_tables_exist THEN
    RAISE NOTICE '✅ CORE SYSTEM: All 12 tables present';
  ELSE
    RAISE NOTICE '❌ CORE SYSTEM: Missing tables detected';
    RAISE NOTICE '   ACTION: Run FRESH_DATABASE_SETUP.sql';
  END IF;

  IF rbac_tables_exist THEN
    RAISE NOTICE '✅ RBAC SYSTEM: All 6 tables present';
  ELSE
    RAISE NOTICE '❌ RBAC SYSTEM: Missing tables detected';
    RAISE NOTICE '   ACTION: Run database-rbac-system.sql';
  END IF;

  IF functions_exist THEN
    RAISE NOTICE '✅ FUNCTIONS: All required functions present';
  ELSE
    RAISE NOTICE '❌ FUNCTIONS: Missing functions detected';
    RAISE NOTICE '   ACTION: Run FRESH_DATABASE_SETUP.sql';
  END IF;

  IF views_exist THEN
    RAISE NOTICE '✅ VIEWS: All required views present';
  ELSE
    RAISE NOTICE '❌ VIEWS: Missing views detected';
    RAISE NOTICE '   ACTION: Run FRESH_DATABASE_SETUP.sql';
  END IF;

  RAISE NOTICE '';
  IF core_tables_exist AND rbac_tables_exist AND functions_exist AND views_exist THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 DATABASE IS COMPLETE AND HEALTHY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All required tables, functions, and views are present.';
    RAISE NOTICE 'Your system is ready to use.';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  DATABASE REQUIRES ATTENTION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Some components are missing.';
    RAISE NOTICE 'Follow the ACTION items above to fix.';
  END IF;

  RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- END OF VERIFICATION SCRIPT
-- =====================================================

-- =====================================================
-- DLPP LANDS DATABASE CLEANUP
-- Remove UNRE Finance/Procurement Module Tables
-- =====================================================
-- This script safely removes foreign module tables
-- that belong to UNRE, not the Lands Department
-- =====================================================

-- =====================================================
-- STEP 1: VERIFICATION - Check what exists
-- =====================================================

DO $$
DECLARE
  v_table_name TEXT;
  v_exists BOOLEAN;
  v_unre_tables TEXT[] := ARRAY[
    'aap_header', 'aap_line', 'aap_line_schedule', 'aap_approvals',
    'ge_requests', 'ge_line_items', 'ge_approvals',
    'budget_lines', 'budget_line', 'budget_commitments', 'payment_vouchers',
    'cost_centres', 'chart_of_accounts', 'expense_types', 'suppliers', 'fiscal_year',
    'roles', 'user_roles', 'user_profiles'
  ];
  v_shared_tables TEXT[] := ARRAY['documents', 'notifications', 'audit_logs'];
  v_found_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION: Checking for UNRE tables';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check UNRE tables
  RAISE NOTICE 'UNRE Finance Module Tables:';
  RAISE NOTICE '----------------------------';
  FOREACH v_table_name IN ARRAY v_unre_tables
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = v_table_name
    ) INTO v_exists;

    IF v_exists THEN
      RAISE NOTICE '  ❌ FOUND: % (will be removed)', v_table_name;
      v_found_count := v_found_count + 1;
    ELSE
      RAISE NOTICE '  ✓ Not present: %', v_table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Shared Tables (check if used by Lands):';
  RAISE NOTICE '---------------------------------------';
  FOREACH v_table_name IN ARRAY v_shared_tables
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = v_table_name
    ) INTO v_exists;

    IF v_exists THEN
      RAISE NOTICE '  ⚠️  EXISTS: % (check before removing!)', v_table_name;
    ELSE
      RAISE NOTICE '  ✓ Not present: %', v_table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary: Found % UNRE tables to remove', v_found_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 2: CHECK DEPENDENCIES
-- =====================================================

DO $$
DECLARE
  v_constraint RECORD;
  v_dependency_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEPENDENCY CHECK: Foreign Key References';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check if any Lands tables reference UNRE tables
  FOR v_constraint IN
    SELECT
      tc.table_name as from_table,
      kcu.column_name as from_column,
      ccu.table_name AS to_table,
      ccu.column_name AS to_column,
      tc.constraint_name
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
  LOOP
    RAISE NOTICE '  ⚠️  WARNING: %.% references %.%',
      v_constraint.from_table, v_constraint.from_column,
      v_constraint.to_table, v_constraint.to_column;
    v_dependency_count := v_dependency_count + 1;
  END LOOP;

  IF v_dependency_count = 0 THEN
    RAISE NOTICE '  ✓ No dependencies found - Safe to proceed';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '  ⛔ STOP: Found % dependencies!', v_dependency_count;
    RAISE NOTICE '  ⛔ Must resolve dependencies before dropping tables';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 3: CHECK LANDS TABLES USAGE
-- =====================================================

DO $$
DECLARE
  v_lands_tables TEXT[] := ARRAY[
    'profiles', 'cases', 'parties', 'tasks', 'events',
    'land_parcels', 'case_history', 'executive_workflow', 'case_assignments'
  ];
  v_table_name TEXT;
  v_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LANDS TABLES: Verifying current schema';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_table_name IN ARRAY v_lands_tables
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = v_table_name
    ) INTO v_exists;

    IF v_exists THEN
      RAISE NOTICE '  ✓ Active: %', v_table_name;
    ELSE
      RAISE NOTICE '  ❌ Missing: % (should exist!)', v_table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Note: documents, notifications, case_comments are used by Lands';
  RAISE NOTICE '      and should NOT be removed!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 4: SAFE REMOVAL (uncomment to execute)
-- =====================================================

/*
-- ⚠️  UNCOMMENT THIS SECTION ONLY AFTER:
-- 1. Running verification above
-- 2. Confirming no dependencies exist
-- 3. Taking a backup of your database
-- 4. Verifying you're on the correct database

BEGIN;

-- Drop UNRE Finance/AAP tables
DROP TABLE IF EXISTS public.aap_approvals CASCADE;
DROP TABLE IF EXISTS public.aap_line_schedule CASCADE;
DROP TABLE IF EXISTS public.aap_line CASCADE;
DROP TABLE IF EXISTS public.aap_header CASCADE;

-- Drop GE (Goods & Expenses) tables
DROP TABLE IF EXISTS public.ge_approvals CASCADE;
DROP TABLE IF EXISTS public.ge_line_items CASCADE;
DROP TABLE IF EXISTS public.ge_requests CASCADE;

-- Drop Budget tables
DROP TABLE IF EXISTS public.payment_vouchers CASCADE;
DROP TABLE IF EXISTS public.budget_commitments CASCADE;
DROP TABLE IF EXISTS public.budget_lines CASCADE;
DROP TABLE IF EXISTS public.budget_line CASCADE;

-- Drop Finance master data
DROP TABLE IF EXISTS public.cost_centres CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.expense_types CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.fiscal_year CASCADE;

-- Drop UNRE access control (if not used by Lands)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Drop UNRE user profiles (ONLY if different from Lands profiles table)
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- ⚠️  DO NOT DROP these - they are used by Lands:
-- - public.documents (used by Legal Case Management)
-- - public.notifications (used by Executive Workflow)
-- - public.case_comments (used by Executive Workflow)
-- - public.profiles (Lands identity table)

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CLEANUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'UNRE Finance module tables removed.';
  RAISE NOTICE 'Lands Department tables preserved.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Regenerate ERD showing Lands tables only';
  RAISE NOTICE '  2. Verify application still works';
  RAISE NOTICE '  3. Test all Lands workflows';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
*/

-- =====================================================
-- INSTRUCTIONS FOR USE
-- =====================================================

-- 1. Run this script AS-IS first (with removal section commented out)
--    This will show you what exists and check for dependencies
--
-- 2. Review the output carefully
--
-- 3. If safe to proceed:
--    a. Take a database backup
--    b. Uncomment the STEP 4 section above
--    c. Run the script again
--
-- 4. Verify Lands application still works after removal

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if something goes wrong)
-- =====================================================

-- If you took a backup before removal, you can restore:
-- 1. In Supabase Dashboard → Database → Backups
-- 2. Restore to the backup taken before this cleanup
-- 3. Or use pg_restore with your backup file

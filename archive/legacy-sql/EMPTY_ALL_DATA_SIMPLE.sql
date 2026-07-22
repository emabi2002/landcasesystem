-- ============================================
-- EMPTY ALL DATA - SIMPLE VERSION
-- ============================================
-- This script deletes ALL data from ALL tables
-- in the correct order (respects foreign keys)
-- ============================================
-- ⚠️ WARNING: THIS WILL DELETE ALL DATA! ⚠️
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  EMPTYING ALL DATA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================
-- DELETE DATA IN CORRECT ORDER
-- (Children first, then parents)
-- ============================================

-- Deepest dependencies first
DO $$
BEGIN
  RAISE NOTICE 'Deleting workflow data...';
END $$;

-- Delete with existence checks to avoid errors
DO $$
BEGIN
  -- Deepest dependencies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_inheritance') THEN
    DELETE FROM public.document_inheritance;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'division_compliance_updates') THEN
    DELETE FROM public.division_compliance_updates;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_intake_documents') THEN
    DELETE FROM public.case_intake_documents;
  END IF;

  -- Mid-level dependencies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_amendments') THEN
    DELETE FROM public.case_amendments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DELETE FROM public.notifications;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_parties') THEN
    DELETE FROM public.case_parties;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitor_general_updates') THEN
    DELETE FROM public.solicitor_general_updates;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_filings') THEN
    DELETE FROM public.case_filings;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manager_memos') THEN
    DELETE FROM public.manager_memos;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'court_orders') THEN
    DELETE FROM public.court_orders;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_closure') THEN
    DELETE FROM public.case_closure;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_maintenance_log') THEN
    DELETE FROM public.file_maintenance_log;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'court_references') THEN
    DELETE FROM public.court_references;
  END IF;
END $$;

-- Officer reassignments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'officer_reassignments') THEN
    DELETE FROM public.officer_reassignments;
  END IF;
END $$;

-- Case-level workflow
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_documents') THEN
    DELETE FROM public.case_documents;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_files') THEN
    DELETE FROM public.case_files;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_assignments') THEN
    DELETE FROM public.case_assignments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'directions') THEN
    DELETE FROM public.directions;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_intake_records') THEN
    DELETE FROM public.case_intake_records;
  END IF;

  RAISE NOTICE 'Deleting old normalized tables...';
END $$;

-- Old normalized tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_history') THEN
    DELETE FROM public.case_history;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    DELETE FROM public.documents;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    DELETE FROM public.events;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DELETE FROM public.tasks;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'land_parcels') THEN
    DELETE FROM public.land_parcels;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    DELETE FROM public.calendar_events WHERE case_id IS NOT NULL;
  END IF;
END $$;

-- Parties
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parties') THEN
    DELETE FROM public.parties;
  END IF;
END $$;

-- User roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    DELETE FROM public.user_roles;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Deleting cases...';
END $$;

-- FINALLY: Cases (parent table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cases') THEN
    DELETE FROM public.cases;
  END IF;
END $$;

-- Keep users and roles (system configuration)
-- DELETE FROM public.users;
-- DELETE FROM public.roles;

-- ============================================
-- VERIFY EMPTY
-- ============================================

DO $$
DECLARE
  cases_count INT;
  parties_count INT;
  docs_count INT;
  refs_count INT;
  reassignments_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Verifying deletion...';

  SELECT COUNT(*) INTO cases_count FROM public.cases;
  SELECT COUNT(*) INTO parties_count FROM public.parties;

  -- Check case_documents if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_documents') THEN
    SELECT COUNT(*) INTO docs_count FROM public.case_documents;
  ELSE
    docs_count := 0;
  END IF;

  -- Check court_references if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'court_references') THEN
    SELECT COUNT(*) INTO refs_count FROM public.court_references;
  ELSE
    refs_count := 0;
  END IF;

  -- Check officer_reassignments if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'officer_reassignments') THEN
    SELECT COUNT(*) INTO reassignments_count FROM public.officer_reassignments;
  ELSE
    reassignments_count := 0;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Current counts (should all be 0):';
  RAISE NOTICE '  Cases: %', cases_count;
  RAISE NOTICE '  Parties: %', parties_count;
  RAISE NOTICE '  Documents: %', docs_count;
  RAISE NOTICE '  Court References: %', refs_count;
  RAISE NOTICE '  Officer Reassignments: %', reassignments_count;
  RAISE NOTICE '';

  IF cases_count = 0 AND parties_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All data deleted!';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Some data may remain';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  DATABASE EMPTIED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'DELETED:';
  RAISE NOTICE '  ✅ All cases';
  RAISE NOTICE '  ✅ All parties';
  RAISE NOTICE '  ✅ All workflow data';
  RAISE NOTICE '  ✅ All related records';
  RAISE NOTICE '';
  RAISE NOTICE 'KEPT:';
  RAISE NOTICE '  ✅ Table structures';
  RAISE NOTICE '  ✅ Functions & triggers';
  RAISE NOTICE '  ✅ Users & roles';
  RAISE NOTICE '';
  RAISE NOTICE 'READY FOR FRESH IMPORT!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run OFFICER_REASSIGNMENT_TRACKING.sql';
  RAISE NOTICE '  2. Fix your Excel spreadsheet';
  RAISE NOTICE '  3. Run import script';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- EMPTY ALL DATA - FRESH START
-- ============================================
-- This script deletes ALL data from ALL tables
-- while preserving the table structure
-- Run this to start completely fresh
-- ============================================
-- ⚠️ WARNING: THIS WILL DELETE ALL DATA! ⚠️
-- Make sure you have a backup before running!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  EMPTYING ALL DATA - FRESH START';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  WARNING: Deleting all data...';
  RAISE NOTICE '';
END $$;

-- ============================================
-- STEP 1: DISABLE TRIGGERS TEMPORARILY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Step 1: Disabling triggers...';
END $$;

ALTER TABLE public.cases DISABLE TRIGGER ALL;
ALTER TABLE public.parties DISABLE TRIGGER ALL;
ALTER TABLE public.users DISABLE TRIGGER ALL;
ALTER TABLE public.case_intake_records DISABLE TRIGGER ALL;
ALTER TABLE public.case_intake_documents DISABLE TRIGGER ALL;
ALTER TABLE public.directions DISABLE TRIGGER ALL;
ALTER TABLE public.case_assignments DISABLE TRIGGER ALL;
ALTER TABLE public.case_files DISABLE TRIGGER ALL;
ALTER TABLE public.case_documents DISABLE TRIGGER ALL;
ALTER TABLE public.case_filings DISABLE TRIGGER ALL;
ALTER TABLE public.solicitor_general_updates DISABLE TRIGGER ALL;
ALTER TABLE public.manager_memos DISABLE TRIGGER ALL;
ALTER TABLE public.division_compliance_updates DISABLE TRIGGER ALL;
ALTER TABLE public.court_orders DISABLE TRIGGER ALL;
ALTER TABLE public.case_closure DISABLE TRIGGER ALL;
ALTER TABLE public.case_parties DISABLE TRIGGER ALL;
ALTER TABLE public.notifications DISABLE TRIGGER ALL;
ALTER TABLE public.court_references DISABLE TRIGGER ALL;
ALTER TABLE public.file_maintenance_log DISABLE TRIGGER ALL;
ALTER TABLE public.case_amendments DISABLE TRIGGER ALL;
ALTER TABLE public.document_inheritance DISABLE TRIGGER ALL;

-- Disable triggers on any existing normalized tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    EXECUTE 'ALTER TABLE public.documents DISABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    EXECUTE 'ALTER TABLE public.events DISABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    EXECUTE 'ALTER TABLE public.tasks DISABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'land_parcels') THEN
    EXECUTE 'ALTER TABLE public.land_parcels DISABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_history') THEN
    EXECUTE 'ALTER TABLE public.case_history DISABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    EXECUTE 'ALTER TABLE public.calendar_events DISABLE TRIGGER ALL';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers disabled';
END $$;

-- ============================================
-- STEP 2: DELETE DATA IN CORRECT ORDER
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Step 2: Deleting data from all tables...';
  RAISE NOTICE '';
END $$;

-- Delete from child tables first (most dependent)

-- Workflow tracking - deepest dependencies
DELETE FROM public.document_inheritance;
DELETE FROM public.division_compliance_updates;
DELETE FROM public.case_intake_documents;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Deleted: document_inheritance, division_compliance_updates, case_intake_documents';
END $$;

-- Workflow tracking - mid-level dependencies
DELETE FROM public.case_amendments;
DELETE FROM public.notifications;
DELETE FROM public.case_parties;
DELETE FROM public.solicitor_general_updates;
DELETE FROM public.case_filings;
DELETE FROM public.manager_memos;
DELETE FROM public.court_orders;
DELETE FROM public.case_closure;
DELETE FROM public.file_maintenance_log;
DELETE FROM public.court_references;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Deleted: case_amendments, notifications, case_parties, solicitor_general_updates';
  RAISE NOTICE '  ✅ Deleted: case_filings, manager_memos, court_orders, case_closure';
  RAISE NOTICE '  ✅ Deleted: file_maintenance_log, court_references';
END $$;

-- Workflow tracking - case-level dependencies
DELETE FROM public.case_documents;
DELETE FROM public.case_files;
DELETE FROM public.case_assignments;
DELETE FROM public.directions;
DELETE FROM public.case_intake_records;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Deleted: case_documents, case_files, case_assignments, directions, case_intake_records';
END $$;

-- Old normalized tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_history') THEN
    DELETE FROM public.case_history;
    RAISE NOTICE '  ✅ Deleted: case_history';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    DELETE FROM public.documents;
    RAISE NOTICE '  ✅ Deleted: documents';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    DELETE FROM public.events;
    RAISE NOTICE '  ✅ Deleted: events';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DELETE FROM public.tasks;
    RAISE NOTICE '  ✅ Deleted: tasks';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'land_parcels') THEN
    DELETE FROM public.land_parcels;
    RAISE NOTICE '  ✅ Deleted: land_parcels';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    DELETE FROM public.calendar_events WHERE case_id IS NOT NULL;
    RAISE NOTICE '  ✅ Deleted: calendar_events (case-related)';
  END IF;
END $$;

-- Parties (independent or linked to cases)
DELETE FROM public.parties;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Deleted: parties';
END $$;

-- User roles
DELETE FROM public.user_roles;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Deleted: user_roles';
END $$;

-- FINALLY: Delete cases (parent table)
DELETE FROM public.cases;

DO $$
BEGIN
  RAISE NOTICE '  ✅ Deleted: cases (master table)';
END $$;

-- Don't delete users and roles - keep system users
-- DELETE FROM public.users;
-- DELETE FROM public.roles;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '  ℹ️  Kept: users, roles (system configuration)';
  RAISE NOTICE '';
END $$;

-- ============================================
-- STEP 3: RE-ENABLE TRIGGERS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Step 3: Re-enabling triggers...';
END $$;

ALTER TABLE public.cases ENABLE TRIGGER ALL;
ALTER TABLE public.parties ENABLE TRIGGER ALL;
ALTER TABLE public.users ENABLE TRIGGER ALL;
ALTER TABLE public.case_intake_records ENABLE TRIGGER ALL;
ALTER TABLE public.case_intake_documents ENABLE TRIGGER ALL;
ALTER TABLE public.directions ENABLE TRIGGER ALL;
ALTER TABLE public.case_assignments ENABLE TRIGGER ALL;
ALTER TABLE public.case_files ENABLE TRIGGER ALL;
ALTER TABLE public.case_documents ENABLE TRIGGER ALL;
ALTER TABLE public.case_filings ENABLE TRIGGER ALL;
ALTER TABLE public.solicitor_general_updates ENABLE TRIGGER ALL;
ALTER TABLE public.manager_memos ENABLE TRIGGER ALL;
ALTER TABLE public.division_compliance_updates ENABLE TRIGGER ALL;
ALTER TABLE public.court_orders ENABLE TRIGGER ALL;
ALTER TABLE public.case_closure ENABLE TRIGGER ALL;
ALTER TABLE public.case_parties ENABLE TRIGGER ALL;
ALTER TABLE public.notifications ENABLE TRIGGER ALL;
ALTER TABLE public.court_references ENABLE TRIGGER ALL;
ALTER TABLE public.file_maintenance_log ENABLE TRIGGER ALL;
ALTER TABLE public.case_amendments ENABLE TRIGGER ALL;
ALTER TABLE public.document_inheritance ENABLE TRIGGER ALL;

-- Re-enable triggers on old normalized tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    EXECUTE 'ALTER TABLE public.documents ENABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    EXECUTE 'ALTER TABLE public.events ENABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    EXECUTE 'ALTER TABLE public.tasks ENABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'land_parcels') THEN
    EXECUTE 'ALTER TABLE public.land_parcels ENABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_history') THEN
    EXECUTE 'ALTER TABLE public.case_history ENABLE TRIGGER ALL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    EXECUTE 'ALTER TABLE public.calendar_events ENABLE TRIGGER ALL';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers re-enabled';
END $$;

-- ============================================
-- STEP 4: VERIFY EMPTY
-- ============================================

DO $$
DECLARE
  cases_count INT;
  parties_count INT;
  docs_count INT;
  refs_count INT;
  amendments_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Step 4: Verifying all data deleted...';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO cases_count FROM public.cases;
  SELECT COUNT(*) INTO parties_count FROM public.parties;
  SELECT COUNT(*) INTO docs_count FROM public.case_documents;
  SELECT COUNT(*) INTO refs_count FROM public.court_references;
  SELECT COUNT(*) INTO amendments_count FROM public.case_amendments;

  RAISE NOTICE 'Current counts (should all be 0):';
  RAISE NOTICE '  Cases: %', cases_count;
  RAISE NOTICE '  Parties: %', parties_count;
  RAISE NOTICE '  Case Documents: %', docs_count;
  RAISE NOTICE '  Court References: %', refs_count;
  RAISE NOTICE '  Case Amendments: %', amendments_count;
  RAISE NOTICE '';

  IF cases_count = 0 AND parties_count = 0 AND docs_count = 0 THEN
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
  RAISE NOTICE 'WHAT WAS DELETED:';
  RAISE NOTICE '  ✅ All cases';
  RAISE NOTICE '  ✅ All parties';
  RAISE NOTICE '  ✅ All case documents';
  RAISE NOTICE '  ✅ All court references';
  RAISE NOTICE '  ✅ All workflow records';
  RAISE NOTICE '  ✅ All amendments';
  RAISE NOTICE '  ✅ All related data';
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT WAS KEPT:';
  RAISE NOTICE '  ✅ All table structures';
  RAISE NOTICE '  ✅ All functions and triggers';
  RAISE NOTICE '  ✅ Users and roles';
  RAISE NOTICE '  ✅ Database schema intact';
  RAISE NOTICE '';
  RAISE NOTICE 'READY FOR FRESH IMPORT!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Fix your Excel spreadsheet';
  RAISE NOTICE '  2. Run import script';
  RAISE NOTICE '  3. Start fresh with clean data!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- EMPTY CASES AND RELATED DATA
-- ============================================
-- This script safely deletes ALL case data
-- Run this BEFORE reimporting corrected spreadsheet
-- ============================================

-- STEP 1: Disable triggers temporarily (faster deletion)
-- ============================================
ALTER TABLE public.cases DISABLE TRIGGER ALL;
ALTER TABLE public.parties DISABLE TRIGGER ALL;
ALTER TABLE public.documents DISABLE TRIGGER ALL;
ALTER TABLE public.events DISABLE TRIGGER ALL;
ALTER TABLE public.tasks DISABLE TRIGGER ALL;
ALTER TABLE public.land_parcels DISABLE TRIGGER ALL;
ALTER TABLE public.case_history DISABLE TRIGGER ALL;

-- STEP 2: Delete data in correct order (children first, then parents)
-- ============================================

-- Delete case history
DELETE FROM public.case_history;
RAISE NOTICE '✅ Deleted case_history records';

-- Delete documents
DELETE FROM public.documents;
RAISE NOTICE '✅ Deleted documents records';

-- Delete events
DELETE FROM public.events;
RAISE NOTICE '✅ Deleted events records';

-- Delete tasks
DELETE FROM public.tasks;
RAISE NOTICE '✅ Deleted tasks records';

-- Delete land parcels
DELETE FROM public.land_parcels;
RAISE NOTICE '✅ Deleted land_parcels records';

-- Delete parties
DELETE FROM public.parties;
RAISE NOTICE '✅ Deleted parties records';

-- Delete calendar events (if exists)
DELETE FROM public.calendar_events WHERE case_id IS NOT NULL;
RAISE NOTICE '✅ Deleted calendar_events linked to cases';

-- FINALLY: Delete cases (parent table)
DELETE FROM public.cases;
RAISE NOTICE '✅ Deleted cases records';

-- STEP 3: Reset sequences (optional - for clean IDs)
-- ============================================
-- Note: Only reset if tables use sequences
-- Skip if using UUIDs

-- STEP 4: Re-enable triggers
-- ============================================
ALTER TABLE public.cases ENABLE TRIGGER ALL;
ALTER TABLE public.parties ENABLE TRIGGER ALL;
ALTER TABLE public.documents ENABLE TRIGGER ALL;
ALTER TABLE public.events ENABLE TRIGGER ALL;
ALTER TABLE public.tasks ENABLE TRIGGER ALL;
ALTER TABLE public.land_parcels ENABLE TRIGGER ALL;
ALTER TABLE public.case_history ENABLE TRIGGER ALL;

-- STEP 5: Verify empty
-- ============================================
DO $$
DECLARE
  cases_count INT;
  parties_count INT;
  docs_count INT;
  events_count INT;
  tasks_count INT;
  parcels_count INT;
  history_count INT;
BEGIN
  SELECT COUNT(*) INTO cases_count FROM public.cases;
  SELECT COUNT(*) INTO parties_count FROM public.parties;
  SELECT COUNT(*) INTO docs_count FROM public.documents;
  SELECT COUNT(*) INTO events_count FROM public.events;
  SELECT COUNT(*) INTO tasks_count FROM public.tasks;
  SELECT COUNT(*) INTO parcels_count FROM public.land_parcels;
  SELECT COUNT(*) INTO history_count FROM public.case_history;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  CASE DATA DELETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Current counts (should all be 0):';
  RAISE NOTICE '  Cases: %', cases_count;
  RAISE NOTICE '  Parties: %', parties_count;
  RAISE NOTICE '  Documents: %', docs_count;
  RAISE NOTICE '  Events: %', events_count;
  RAISE NOTICE '  Tasks: %', tasks_count;
  RAISE NOTICE '  Land Parcels: %', parcels_count;
  RAISE NOTICE '  Case History: %', history_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Database is now ready for fresh import!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Fix your Excel spreadsheet';
  RAISE NOTICE '  2. Run the import script again';
  RAISE NOTICE '  3. Then run workflow migration';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

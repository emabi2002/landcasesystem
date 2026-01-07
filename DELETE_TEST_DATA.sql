-- ============================================
-- DLPP Legal CMS - DELETE ALL TEST DATA
-- ============================================
-- This script removes ALL test data that was inserted
-- using SAMPLE_TEST_DATA.sql
--
-- All test data is identified by "TEST_" prefix
--
-- Generated: January 2, 2026
-- ============================================

-- ============================================
-- SAFETY CHECK - View what will be deleted
-- ============================================
-- Uncomment these to preview before deleting:

-- SELECT 'Cases to delete:' as info, COUNT(*) as count FROM cases WHERE case_number LIKE 'TEST_%';
-- SELECT 'Directions to delete:' as info, COUNT(*) as count FROM directions WHERE direction_number LIKE 'TEST_%';
-- SELECT 'Communications to delete:' as info, COUNT(*) as count FROM communications WHERE subject LIKE 'TEST_%';

-- ============================================
-- DELETE TEST DATA (Order matters for foreign keys)
-- ============================================

-- Start transaction
BEGIN;

-- 1. Delete case history (references cases)
DELETE FROM case_history
WHERE description LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 2. Delete land parcels (references cases)
DELETE FROM land_parcels
WHERE parcel_number LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 3. Delete tasks (references cases)
DELETE FROM tasks
WHERE title LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 4. Delete events (references cases)
DELETE FROM events
WHERE title LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 5. Delete parties (references cases)
DELETE FROM parties
WHERE name LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 6. Delete documents (references cases)
DELETE FROM documents
WHERE title LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 7. Delete communications/alerts (references cases)
DELETE FROM communications
WHERE subject LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 8. Delete compliance tracking (references cases)
DELETE FROM compliance_tracking
WHERE court_order_description LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 9. Delete filings (references cases)
DELETE FROM filings
WHERE title LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 10. Delete case delegations (references cases)
DELETE FROM case_delegations
WHERE delegated_to LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 11. Delete directions (references cases)
DELETE FROM directions
WHERE direction_number LIKE 'TEST_%'
   OR case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');

-- 12. Delete cases (main table)
DELETE FROM cases
WHERE case_number LIKE 'TEST_%';

-- 13. Delete test users (optional - comment out if you want to keep them)
DELETE FROM users
WHERE full_name LIKE 'TEST_%'
   OR email LIKE 'test.%@lands.gov.pg';

-- Commit transaction
COMMIT;

-- ============================================
-- VERIFICATION - Confirm deletion
-- ============================================

SELECT 'DELETION VERIFICATION' as report;
SELECT 'Cases remaining with TEST_' as check_item, COUNT(*) as count FROM cases WHERE case_number LIKE 'TEST_%';
SELECT 'Directions remaining with TEST_' as check_item, COUNT(*) as count FROM directions WHERE direction_number LIKE 'TEST_%';
SELECT 'Communications remaining with TEST_' as check_item, COUNT(*) as count FROM communications WHERE subject LIKE 'TEST_%';
SELECT 'Documents remaining with TEST_' as check_item, COUNT(*) as count FROM documents WHERE title LIKE 'TEST_%';
SELECT 'Tasks remaining with TEST_' as check_item, COUNT(*) as count FROM tasks WHERE title LIKE 'TEST_%';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '✅ ALL TEST DATA DELETED SUCCESSFULLY!';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '';
    RAISE NOTICE '🗑️  Deleted all records with TEST_ prefix:';
    RAISE NOTICE '   • Cases';
    RAISE NOTICE '   • Directions';
    RAISE NOTICE '   • Delegations';
    RAISE NOTICE '   • Filings';
    RAISE NOTICE '   • Compliance Records';
    RAISE NOTICE '   • Communications/Alerts';
    RAISE NOTICE '   • Documents';
    RAISE NOTICE '   • Parties';
    RAISE NOTICE '   • Events';
    RAISE NOTICE '   • Tasks';
    RAISE NOTICE '   • Land Parcels';
    RAISE NOTICE '   • Case History';
    RAISE NOTICE '   • Test Users';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database is now clean of test data!';
    RAISE NOTICE '';
END $$;

-- ============================================
-- ALTERNATIVE: Delete by specific IDs
-- ============================================
-- If you prefer to delete by the specific UUIDs used in test data:

/*
-- Delete specific test case IDs
DELETE FROM cases WHERE id IN (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107',
    '11111111-1111-1111-1111-111111111108',
    '11111111-1111-1111-1111-111111111109',
    '11111111-1111-1111-1111-111111111110'
);

-- Delete specific test user IDs
DELETE FROM users WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008'
);
*/

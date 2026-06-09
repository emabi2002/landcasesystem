-- =====================================================================
-- EMPTY ALL DATA FROM DATABASE - START FRESH
-- =====================================================================
-- This script deletes ALL data from tables while preserving:
-- - Table structures
-- - RBAC system (groups, modules, permissions)
-- - Database schema
-- =====================================================================

-- IMPORTANT: Run this in Supabase SQL Editor
-- This will DELETE ALL case data, documents, costs, etc.

BEGIN;

-- =====================================================================
-- STEP 1: DELETE ALL CASE-RELATED DATA
-- =====================================================================
-- Delete in order to avoid foreign key constraint violations

-- Delete audit logs first
DELETE FROM audit_logs WHERE logged_at IS NOT NULL;

-- Delete workflow-related data
DELETE FROM compliance_tracking;
DELETE FROM filings;
DELETE FROM case_delegations;
DELETE FROM directions;

-- Delete case communications
DELETE FROM communications;
DELETE FROM correspondence;
DELETE FROM file_requests;

-- Delete case events and tasks
DELETE FROM events;
DELETE FROM tasks;

-- Delete litigation costs
DELETE FROM litigation_costs;
DELETE FROM cost_alerts;
DELETE FROM cost_documents;

-- Delete compliance data
DELETE FROM compliance_recommendations;
DELETE FROM compliance_links;

-- Delete documents
DELETE FROM documents;

-- Delete land parcels
DELETE FROM land_parcels;

-- Delete case parties and lawyers
DELETE FROM case_parties;
DELETE FROM lawyers;

-- Delete notifications
DELETE FROM notifications;

-- Delete reception/intake records
DELETE FROM intake_records;

-- Finally, delete all cases
DELETE FROM cases;

-- =====================================================================
-- STEP 2: RESET USER GROUPS (OPTIONAL - Keep users but remove assignments)
-- =====================================================================
-- Uncomment the line below if you want to remove all user group assignments
-- DELETE FROM user_groups;

-- =====================================================================
-- STEP 3: VERIFICATION
-- =====================================================================

-- Show counts after deletion
DO $$
BEGIN
    RAISE NOTICE 'Data Deletion Complete!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Cases: %', (SELECT COUNT(*) FROM cases);
    RAISE NOTICE 'Documents: %', (SELECT COUNT(*) FROM documents);
    RAISE NOTICE 'Tasks: %', (SELECT COUNT(*) FROM tasks);
    RAISE NOTICE 'Events: %', (SELECT COUNT(*) FROM events);
    RAISE NOTICE 'Land Parcels: %', (SELECT COUNT(*) FROM land_parcels);
    RAISE NOTICE 'Litigation Costs: %', (SELECT COUNT(*) FROM litigation_costs);
    RAISE NOTICE 'Directions: %', (SELECT COUNT(*) FROM directions);
    RAISE NOTICE 'Case Delegations: %', (SELECT COUNT(*) FROM case_delegations);
    RAISE NOTICE 'Filings: %', (SELECT COUNT(*) FROM filings);
    RAISE NOTICE 'Compliance Tracking: %', (SELECT COUNT(*) FROM compliance_tracking);
    RAISE NOTICE '';
    RAISE NOTICE 'RBAC System (Preserved):';
    RAISE NOTICE 'Groups: %', (SELECT COUNT(*) FROM groups);
    RAISE NOTICE 'Modules: %', (SELECT COUNT(*) FROM modules);
    RAISE NOTICE 'Permissions: %', (SELECT COUNT(*) FROM group_module_permissions);
    RAISE NOTICE 'User Assignments: %', (SELECT COUNT(*) FROM user_groups);
END $$;

COMMIT;

-- =====================================================================
-- SUCCESS MESSAGE
-- =====================================================================
-- All case data has been deleted.
-- Database is ready for fresh data entry.
-- RBAC system is preserved and ready to use.
-- =====================================================================

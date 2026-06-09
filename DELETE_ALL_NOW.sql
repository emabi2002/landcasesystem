-- =====================================================================
-- DELETE ALL DATA - SIMPLE AND DIRECT
-- =====================================================================
-- This will delete all records while handling foreign keys properly
-- =====================================================================

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Delete from all tables (in any order since FKs are disabled)
DELETE FROM compliance_tracking;
DELETE FROM filings;
DELETE FROM case_delegations;
DELETE FROM directions;
DELETE FROM communications;
DELETE FROM correspondence;
DELETE FROM file_requests;
DELETE FROM events;
DELETE FROM tasks;
DELETE FROM litigation_costs;
DELETE FROM documents;
DELETE FROM land_parcels;
DELETE FROM case_parties;
DELETE FROM lawyers;
DELETE FROM notifications;
DELETE FROM intake_records;
DELETE FROM cases;
DELETE FROM officers;
DELETE FROM agencies;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Show counts to verify
SELECT 'VERIFICATION:' as status;
SELECT 'Cases' as table_name, COUNT(*) as count FROM cases
UNION ALL SELECT 'Documents', COUNT(*) FROM documents
UNION ALL SELECT 'Litigation Costs', COUNT(*) FROM litigation_costs
UNION ALL SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'Events', COUNT(*) FROM events;

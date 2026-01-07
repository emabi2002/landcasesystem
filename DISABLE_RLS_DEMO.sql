-- ============================================================================
-- DISABLE ROW LEVEL SECURITY - FOR DEMO/TESTING ONLY
-- ============================================================================
-- This script disables all security restrictions on your database tables
-- ⚠️ WARNING: This gives FULL ACCESS to everyone - use only for demos!
-- ============================================================================

-- OPTION 1: DISABLE RLS COMPLETELY (RECOMMENDED FOR DEMO)
-- This is the simplest approach - no security checks at all

ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE land_parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ✅ ✅ ALL SECURITY DISABLED! ✅ ✅ ✅';
  RAISE NOTICE '✅ Full permissions granted to everyone';
  RAISE NOTICE '✅ You can now upload documents, add parties, create tasks, etc.';
  RAISE NOTICE '✅ No more "row-level security policy" errors!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  WARNING: This is for DEMO only!';
  RAISE NOTICE '⚠️  Re-enable security before production use';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check RLS status on all tables
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '🔒 ENABLED'
    ELSE '✅ DISABLED'
  END as security_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

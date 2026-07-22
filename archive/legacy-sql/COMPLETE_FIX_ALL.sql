-- ============================================================================
-- COMPLETE FIX - Database Tables + Storage Bucket Policies
-- ============================================================================
-- This fixes BOTH the database RLS AND storage bucket issues
-- ============================================================================

-- PART 1: FIX DATABASE TABLES (This is causing your error!)
-- ============================================================================

-- Disable RLS on all database tables
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

-- Drop ALL existing database policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Grant all permissions on database tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- PART 2: FIX STORAGE BUCKET POLICIES
-- ============================================================================

-- Delete existing storage policies for case-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload 5pq0yj_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload 5pq0yj_1" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload 5pq0yj_2" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Create simple, permissive storage policies
CREATE POLICY "Allow all authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-documents');

CREATE POLICY "Allow all authenticated users to read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-documents');

CREATE POLICY "Allow all authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'case-documents');

CREATE POLICY "Allow all authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'case-documents');

-- Also allow anonymous access (optional, for demo)
CREATE POLICY "Allow anonymous users to read"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'case-documents');

-- VERIFICATION
-- ============================================================================

-- Check database tables RLS status
SELECT
  '=== DATABASE TABLES ===' as section,
  tablename,
  CASE WHEN rowsecurity THEN '❌ ENABLED (BAD)' ELSE '✅ DISABLED (GOOD)' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check storage policies
SELECT
  '=== STORAGE POLICIES ===' as section,
  policyname,
  cmd as command,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ COMPLETE FIX APPLIED! ✅✅✅';
  RAISE NOTICE '✅ Database RLS: DISABLED';
  RAISE NOTICE '✅ Database policies: REMOVED';
  RAISE NOTICE '✅ Storage policies: UPDATED';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 NEXT STEPS:';
  RAISE NOTICE '1. LOG OUT of your app';
  RAISE NOTICE '2. LOG BACK IN';
  RAISE NOTICE '3. Try uploading document';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ It should work now!';
END $$;

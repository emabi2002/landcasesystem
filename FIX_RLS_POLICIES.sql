-- FIX ROW LEVEL SECURITY POLICIES FOR DLPP LEGAL CMS
-- Run this in Supabase SQL Editor to fix the "new row violates row-level security policy" error

-- ==============================================================================
-- IMPORTANT: This script fixes RLS policies to allow authenticated users to
-- insert, update, select, and delete records in all tables.
-- ==============================================================================

-- 1. FIX DOCUMENTS TABLE POLICIES
-- This is the most common issue when uploading documents

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated users to read documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON documents;

-- Create new permissive policies for documents table
CREATE POLICY "Allow authenticated users to insert documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read documents"
ON documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update documents"
ON documents FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete documents"
ON documents FOR DELETE
TO authenticated
USING (true);

-- 2. FIX PARTIES TABLE POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to insert parties" ON parties;
DROP POLICY IF EXISTS "Allow authenticated users to read parties" ON parties;
DROP POLICY IF EXISTS "Allow authenticated users to update parties" ON parties;
DROP POLICY IF EXISTS "Allow authenticated users to delete parties" ON parties;

CREATE POLICY "Allow authenticated users to insert parties"
ON parties FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read parties"
ON parties FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update parties"
ON parties FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete parties"
ON parties FOR DELETE
TO authenticated
USING (true);

-- 3. FIX TASKS TABLE POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete tasks" ON tasks;

CREATE POLICY "Allow authenticated users to insert tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read tasks"
ON tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update tasks"
ON tasks FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete tasks"
ON tasks FOR DELETE
TO authenticated
USING (true);

-- 4. FIX EVENTS TABLE POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to insert events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to read events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to update events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to delete events" ON events;

CREATE POLICY "Allow authenticated users to insert events"
ON events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read events"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update events"
ON events FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete events"
ON events FOR DELETE
TO authenticated
USING (true);

-- 5. FIX LAND_PARCELS TABLE POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to insert land_parcels" ON land_parcels;
DROP POLICY IF EXISTS "Allow authenticated users to read land_parcels" ON land_parcels;
DROP POLICY IF EXISTS "Allow authenticated users to update land_parcels" ON land_parcels;
DROP POLICY IF EXISTS "Allow authenticated users to delete land_parcels" ON land_parcels;

CREATE POLICY "Allow authenticated users to insert land_parcels"
ON land_parcels FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read land_parcels"
ON land_parcels FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update land_parcels"
ON land_parcels FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete land_parcels"
ON land_parcels FOR DELETE
TO authenticated
USING (true);

-- 6. FIX CASES TABLE POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to insert cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated users to read cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated users to update cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated users to delete cases" ON cases;

CREATE POLICY "Allow authenticated users to insert cases"
ON cases FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read cases"
ON cases FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update cases"
ON cases FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete cases"
ON cases FOR DELETE
TO authenticated
USING (true);

-- 7. FIX CASE_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Allow authenticated users to insert case_history" ON case_history;
DROP POLICY IF EXISTS "Allow authenticated users to read case_history" ON case_history;
DROP POLICY IF EXISTS "Allow authenticated users to update case_history" ON case_history;
DROP POLICY IF EXISTS "Allow authenticated users to delete case_history" ON case_history;

CREATE POLICY "Allow authenticated users to insert case_history"
ON case_history FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read case_history"
ON case_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update case_history"
ON case_history FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete case_history"
ON case_history FOR DELETE
TO authenticated
USING (true);

-- 8. FIX EVIDENCE TABLE POLICIES (if it exists)
DROP POLICY IF EXISTS "Allow authenticated users to insert evidence" ON evidence;
DROP POLICY IF EXISTS "Allow authenticated users to read evidence" ON evidence;
DROP POLICY IF EXISTS "Allow authenticated users to update evidence" ON evidence;
DROP POLICY IF EXISTS "Allow authenticated users to delete evidence" ON evidence;

CREATE POLICY "Allow authenticated users to insert evidence"
ON evidence FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read evidence"
ON evidence FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update evidence"
ON evidence FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete evidence"
ON evidence FOR DELETE
TO authenticated
USING (true);

-- 9. FIX NOTIFICATIONS TABLE POLICIES (if it exists)
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to read notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to update notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to delete notifications" ON notifications;

CREATE POLICY "Allow authenticated users to insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read notifications"
ON notifications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update notifications"
ON notifications FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete notifications"
ON notifications FOR DELETE
TO authenticated
USING (true);

-- ==============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the policies are working
-- ==============================================================================

-- Check all policies on documents table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY policyname;

-- Check all policies on all tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies have been fixed!';
  RAISE NOTICE '✅ Authenticated users can now insert, read, update, and delete records';
  RAISE NOTICE '✅ Try uploading a document again';
END $$;

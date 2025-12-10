-- Fix Row Level Security Policies for Documents Table
-- Run this in Supabase SQL Editor

-- 1. Allow authenticated users to INSERT documents
CREATE POLICY "Authenticated users can insert documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- 2. Allow authenticated users to SELECT (view) documents
CREATE POLICY "Authenticated users can view documents"
ON public.documents
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- 3. Allow authenticated users to UPDATE documents
CREATE POLICY "Authenticated users can update documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Allow authenticated users to DELETE documents
CREATE POLICY "Authenticated users can delete documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'documents';

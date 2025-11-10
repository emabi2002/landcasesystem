# Fix "Row-Level Security Policy" Error

## The Problem

When uploading documents (or adding parties, tasks, events, etc.), you see the error:

> **"new row violates row-level security policy"**

This happens because Supabase has Row Level Security (RLS) enabled on your tables, but no policies exist to allow authenticated users to insert data.

---

## Quick Fix - Run This SQL

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Sign in and select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run This SQL Script

Copy and paste **ALL** of this SQL code and run it:

```sql
-- ============================================
-- FIX ALL RLS POLICIES FOR DLPP LEGAL CMS
-- ============================================

-- 1. DOCUMENTS TABLE
-- Allow authenticated users to manage documents

DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

CREATE POLICY "Authenticated users can insert documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents"
ON public.documents FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents"
ON public.documents FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
ON public.documents FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- 2. PARTIES TABLE
-- Allow authenticated users to manage parties

DROP POLICY IF EXISTS "Authenticated users can insert parties" ON public.parties;
DROP POLICY IF EXISTS "Authenticated users can view parties" ON public.parties;
DROP POLICY IF EXISTS "Authenticated users can update parties" ON public.parties;
DROP POLICY IF EXISTS "Authenticated users can delete parties" ON public.parties;

CREATE POLICY "Authenticated users can insert parties"
ON public.parties FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view parties"
ON public.parties FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update parties"
ON public.parties FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete parties"
ON public.parties FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- 3. TASKS TABLE
-- Allow authenticated users to manage tasks

DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.tasks;

CREATE POLICY "Authenticated users can insert tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view tasks"
ON public.tasks FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- 4. EVENTS TABLE
-- Allow authenticated users to manage events

DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;

CREATE POLICY "Authenticated users can insert events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view events"
ON public.events FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events"
ON public.events FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete events"
ON public.events FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- 5. LAND_PARCELS TABLE
-- Allow authenticated users to manage land parcels

DROP POLICY IF EXISTS "Authenticated users can insert land_parcels" ON public.land_parcels;
DROP POLICY IF EXISTS "Authenticated users can view land_parcels" ON public.land_parcels;
DROP POLICY IF EXISTS "Authenticated users can update land_parcels" ON public.land_parcels;
DROP POLICY IF EXISTS "Authenticated users can delete land_parcels" ON public.land_parcels;

CREATE POLICY "Authenticated users can insert land_parcels"
ON public.land_parcels FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view land_parcels"
ON public.land_parcels FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update land_parcels"
ON public.land_parcels FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete land_parcels"
ON public.land_parcels FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- 6. CASE_HISTORY TABLE
-- Allow authenticated users to manage case history

DROP POLICY IF EXISTS "Authenticated users can insert case_history" ON public.case_history;
DROP POLICY IF EXISTS "Authenticated users can view case_history" ON public.case_history;

CREATE POLICY "Authenticated users can insert case_history"
ON public.case_history FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view case_history"
ON public.case_history FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

-- 7. EVIDENCE TABLE
-- Allow authenticated users to manage evidence

DROP POLICY IF EXISTS "Authenticated users can insert evidence" ON public.evidence;
DROP POLICY IF EXISTS "Authenticated users can view evidence" ON public.evidence;
DROP POLICY IF EXISTS "Authenticated users can update evidence" ON public.evidence;
DROP POLICY IF EXISTS "Authenticated users can delete evidence" ON public.evidence;

CREATE POLICY "Authenticated users can insert evidence"
ON public.evidence FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view evidence"
ON public.evidence FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update evidence"
ON public.evidence FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete evidence"
ON public.evidence FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- 8. NOTIFICATIONS TABLE
-- Allow authenticated users to manage notifications

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can delete notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Step 3: Click "Run" or press Ctrl/Cmd + Enter

You should see: **"Success. No rows returned"** or a list of policies created.

---

## What This Does

This SQL script:

✅ **Creates policies** for all tables that allow authenticated users to:
- INSERT (add new records)
- SELECT (view records)
- UPDATE (edit records)
- DELETE (remove records)

✅ **Fixes the error** you were seeing

✅ **Enables full functionality** for:
- Adding parties
- Uploading documents
- Creating tasks
- Scheduling events
- Linking land parcels
- Recording case history
- Managing evidence
- Sending notifications

---

## Test After Running

1. Go back to your DLPP Legal CMS app
2. Try uploading a document again
3. You should see: ✅ **Success!** (or warning about storage if bucket not created)
4. Try adding a party, task, or event - all should work now

---

## Understanding RLS

**Row Level Security (RLS)** is a Supabase security feature that controls who can access data:

- **Enabled by default** when you create tables via SQL
- **Requires policies** to allow operations (INSERT, SELECT, UPDATE, DELETE)
- **Protects your data** from unauthorized access

Our policies allow any **authenticated user** (logged in) to manage data. This is appropriate for an internal department system.

---

## Advanced: Role-Based Policies (Optional)

If you want different permissions for different user roles (e.g., admin vs. staff), you can create more specific policies later.

Example:
```sql
-- Only admins can delete documents
CREATE POLICY "Only admins can delete documents"
ON public.documents FOR DELETE TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```

But for now, the simple policies above will get everything working.

---

## Troubleshooting

### Still getting RLS errors?

1. **Check if RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

2. **Check existing policies:**
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. **Verify you're logged in:**
   - Make sure you're logged in as admin@lands.gov.pg
   - Check browser console for auth errors

### Need to disable RLS temporarily?

**NOT RECOMMENDED for production**, but for testing:
```sql
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
-- Replace 'documents' with the table name
```

To re-enable:
```sql
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
```

---

## Summary

**Problem:** RLS policies missing
**Solution:** Run the SQL script above
**Result:** All features work!

After running this script, you should be able to:
- ✅ Upload documents
- ✅ Add parties
- ✅ Create tasks
- ✅ Schedule events
- ✅ Link land parcels
- ✅ Do everything else in the system

---

**Last Updated:** October 30, 2025
**Status:** Critical Fix
**Priority:** Run this immediately

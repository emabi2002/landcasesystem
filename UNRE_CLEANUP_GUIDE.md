# UNRE Finance Module Cleanup Guide

## Overview

Your Lands database contains tables from the **UNRE Finance/Procurement module** that don't belong there. These tables should be removed to clean up your database schema.

---

## ⚠️ Important: What NOT to Remove

Your **Lands Legal Case Management System** uses these tables - **DO NOT REMOVE**:

✅ **Keep These Tables** (Lands Department):
- `profiles` - User accounts with executive roles
- `cases` - Legal case records
- `parties` - Case parties
- `documents` - Case documents (used by Legal CMS)
- `tasks` - Task management
- `events` - Calendar events
- `land_parcels` - Land parcel data
- `case_history` - Audit trail
- `notifications` - User notifications (used by Executive Workflow)
- `case_comments` - Case commentary (used by Executive Workflow)
- `executive_workflow` - Executive oversight tracking
- `case_assignments` - Case assignments to officers

---

## ❌ Tables to Remove (UNRE Finance Module)

### AAP (Annual Activity Plan)
- `aap_header`
- `aap_line`
- `aap_line_schedule`
- `aap_approvals`

### GE Requests (Goods & Expenses)
- `ge_requests`
- `ge_line_items`
- `ge_approvals`

### Budgeting / Payments
- `budget_lines`
- `budget_line`
- `budget_commitments`
- `payment_vouchers`

### Finance Master Data
- `cost_centres`
- `chart_of_accounts`
- `expense_types`
- `suppliers`
- `fiscal_year`

### UNRE Access Control
- `roles` (if different from Lands roles)
- `user_roles` (if different from Lands)
- `user_profiles` (if different from Lands `profiles` table)

---

## 🔒 Safety First: Pre-Cleanup Checklist

Before removing anything:

- [ ] **1. Take a full database backup**
  - In Supabase: Database → Backups → Create backup
  - Download backup file locally

- [ ] **2. Verify you're on the correct database**
  - Confirm Supabase Project ID: `yvnkyjnwvylrweyzvibs`
  - Confirm you're in the Lands database, not UNRE

- [ ] **3. Run verification script first**
  - Use `CLEANUP_UNRE_TABLES.sql` (Step 1-3 only)
  - Check what tables exist
  - Verify no dependencies

- [ ] **4. Confirm no application code uses UNRE tables**
  - Check API endpoints
  - Check scheduled jobs
  - Review application logs

---

## 📋 Step-by-Step Cleanup Process

### Step 1: Run Verification (Safe - Read Only)

1. **Open Supabase SQL Editor**
2. **Open file**: `CLEANUP_UNRE_TABLES.sql`
3. **Copy entire contents** (including commented removal section)
4. **Paste into SQL Editor**
5. **Click "Run"**

**What This Does:**
- ✅ Lists which UNRE tables exist
- ✅ Checks for foreign key dependencies
- ✅ Verifies Lands tables are intact
- ✅ Does NOT remove anything yet

### Step 2: Review Verification Output

Look for these messages:

**Good Signs (Safe to Proceed):**
```
✓ No dependencies found - Safe to proceed
✓ Active: profiles
✓ Active: cases
✓ Active: notifications
```

**Warning Signs (STOP):**
```
⚠️  WARNING: some_lands_table.column references unre_table.column
⛔ STOP: Found X dependencies!
```

If you see warnings, **DO NOT PROCEED**. Contact support.

### Step 3: Take Backup (Critical)

**Option A: Supabase Dashboard**
1. Go to Database → Backups
2. Click "Create backup"
3. Wait for completion
4. Download backup file

**Option B: pg_dump (if available)**
```bash
pg_dump [connection_string] > lands_backup_before_cleanup.sql
```

### Step 4: Execute Removal (Only if Step 2 was clean)

1. **Open `CLEANUP_UNRE_TABLES.sql` again**
2. **Find the section marked "STEP 4: SAFE REMOVAL"**
3. **Uncomment** the entire section (remove `/*` at start and `*/` at end)
4. **Save the file**
5. **Copy entire contents**
6. **Paste into Supabase SQL Editor**
7. **Click "Run"**
8. **Wait for completion**

**Expected Output:**
```
========================================
✅ CLEANUP COMPLETE
========================================

UNRE Finance module tables removed.
Lands Department tables preserved.
```

### Step 5: Post-Cleanup Verification

1. **Check Lands tables still exist:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'cases', 'notifications',
  'executive_workflow', 'case_assignments'
)
ORDER BY table_name;
```
Should return 5 rows.

2. **Test your Lands application:**
   - Login with admin account
   - Register a test case
   - Verify executive notifications work
   - Check case list loads
   - Test Executive Review dashboard

3. **Check for errors in logs:**
   - Supabase Dashboard → Logs
   - Look for any table not found errors

---

## 🔄 Rollback Plan (If Something Goes Wrong)

If the application breaks after cleanup:

### Option 1: Restore from Backup (Supabase)
1. Go to Database → Backups
2. Find backup taken before cleanup
3. Click "Restore"
4. Wait for restoration
5. Test application

### Option 2: Restore from SQL File
```sql
-- In Supabase SQL Editor:
-- Paste contents of your backup file
-- Run the script
```

---

## 📊 After Cleanup: Regenerate ERD

Once cleanup is complete and verified:

1. **Generate new schema diagram**
   - Shows only Lands Department tables
   - No UNRE Finance module clutter

2. **Update documentation**
   - Remove references to UNRE tables
   - Update database schema docs

3. **Verify FK relationships**
   - All foreign keys point to valid tables
   - No orphaned references

---

## ❓ FAQ

### Q: What if I'm not sure if a table is UNRE or Lands?

**A:** Run this query:
```sql
SELECT
  t.table_name,
  COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_name = 'table_name_here'
GROUP BY t.table_name;
```

If it contains columns like `case_id`, `officer_id`, `court_file_number` → It's Lands.
If it contains columns like `aap_id`, `budget_line_id`, `fiscal_year` → It's UNRE.

### Q: What if verification shows dependencies?

**A:** Do NOT proceed with cleanup. Contact support with:
- Verification script output
- List of dependencies found
- Description of your setup

### Q: Can I remove tables one at a time?

**A:** Not recommended. The script removes them in correct order (respecting FK constraints). Removing individually may cause errors.

### Q: What if I accidentally removed a Lands table?

**A:** Immediately restore from backup. Then:
1. Re-run `FRESH_DATABASE_SETUP.sql` to recreate Lands tables
2. This will recreate the schema (but you'll lose data)
3. Better to restore backup

---

## ✅ Success Criteria

After cleanup, you should have:

- [x] Only Lands Department tables in database
- [x] No UNRE Finance module tables
- [x] All Lands workflows working
- [x] Executive oversight workflow functional
- [x] Case registration works
- [x] Notifications being sent
- [x] No application errors

---

## 📞 Support

If you encounter issues:

1. **Stop immediately**
2. **Do not remove more tables**
3. **Check verification output**
4. **Restore from backup if needed**
5. **Contact support with:**
   - Verification script output
   - Error messages
   - Description of what happened

---

## 🎯 Quick Command Reference

**Check what tables exist:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Check table row counts:**
```sql
SELECT
  schemaname,
  relname,
  n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
```

**List all foreign keys:**
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

**File**: `UNRE_CLEANUP_GUIDE.md`
**Created**: December 22, 2025
**Purpose**: Safe removal of UNRE Finance module from Lands database
**Status**: Ready to execute

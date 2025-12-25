# 🚨 URGENT: Database Verification After Restore

**Date**: December 23, 2025
**Situation**: Database was restored - need to verify integrity
**Action Required**: IMMEDIATE - Run verification script

---

## ⚡ QUICK ACTION - Do This Now (2 minutes)

### Step 1: Run Verification Script

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Navigate to your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run This Quick Check**

```sql
-- QUICK TABLE CHECK
SELECT
  'CORE TABLES' as check_type,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'profiles', 'cases', 'parties', 'documents',
     'tasks', 'events', 'land_parcels', 'case_history',
     'notifications', 'case_comments', 'executive_workflow', 'case_assignments'
   )) as tables_found,
  12 as tables_expected
UNION ALL
SELECT
  'RBAC TABLES',
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'user_groups', 'system_modules', 'permissions',
     'group_module_access', 'user_group_membership', 'rbac_audit_log'
   )),
  6
UNION ALL
SELECT
  'TOTAL',
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'profiles', 'cases', 'parties', 'documents',
     'tasks', 'events', 'land_parcels', 'case_history',
     'notifications', 'case_comments', 'executive_workflow', 'case_assignments',
     'user_groups', 'system_modules', 'permissions',
     'group_module_access', 'user_group_membership', 'rbac_audit_log'
   )),
  18;
```

### Step 2: Interpret Results

**✅ GOOD**: All three rows show `tables_found` = `tables_expected`
- CORE TABLES: 12/12
- RBAC TABLES: 6/6
- TOTAL: 18/18

**❌ PROBLEM**: Any row shows fewer tables found than expected
- Missing tables detected
- Proceed to Step 3

---

## 🔧 If Tables Are Missing

### Option A: Run Comprehensive Verification (Recommended)

**File**: `COMPLETE_DATABASE_VERIFICATION.sql`

This will:
- ✅ Check all 18 tables
- ✅ Verify table structures
- ✅ Check functions and views
- ✅ Validate foreign keys
- ✅ Test RLS policies
- ✅ Provide detailed report

**How to run**:
1. Open `COMPLETE_DATABASE_VERIFICATION.sql` from project
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Run the script
5. Review the detailed output

**Time**: 30 seconds to run, 2 minutes to review

---

### Option B: Restore Missing Components

Based on which tables are missing:

#### Missing Core Tables (profiles, cases, etc.)

**Action**: Run `FRESH_DATABASE_SETUP.sql`

```bash
# This creates:
- 12 core tables
- 3 functions
- 3 views
- All indexes
- RLS policies
```

**Time**: 2-3 minutes

#### Missing RBAC Tables (user_groups, system_modules, etc.)

**Action**: Run `database-rbac-system.sql`

```bash
# This creates:
- 6 RBAC tables
- Default 7 user groups
- Default 18 system modules
- 8 permissions
- RLS policies
```

**Time**: 1-2 minutes

#### Missing Both

**Action**: Run BOTH scripts in order:
1. `FRESH_DATABASE_SETUP.sql` first
2. `database-rbac-system.sql` second

**Time**: 5 minutes total

---

## 📊 What Each Table Does

### Critical Tables (System Won't Work Without These)

1. **`profiles`** ⚠️ CRITICAL
   - User accounts
   - All logins
   - User management

2. **`cases`** ⚠️ CRITICAL
   - All case records
   - Core business data
   - Central to entire system

### Important Tables (Major Features Broken)

3. **`parties`** - Parties in cases
4. **`documents`** - Document storage
5. **`tasks`** - Task management
6. **`events`** - Calendar/hearings
7. **`land_parcels`** - Land information

### Supporting Tables (Features Degraded)

8. **`notifications`** - User notifications
9. **`case_comments`** - Discussions
10. **`case_history`** - Audit trail
11. **`executive_workflow`** - Executive review
12. **`case_assignments`** - Assignments

### RBAC Tables (Permission System)

13-18. **RBAC tables** - Granular permissions

---

## 🎯 Expected Results After Verification

### ✅ All Good

```
✅ CORE SYSTEM: All 12 tables present
✅ RBAC SYSTEM: All 6 tables present
✅ FUNCTIONS: All required functions present
✅ VIEWS: All required views present
✅ RLS: Enabled on all tables
🎉 DATABASE IS COMPLETE AND HEALTHY!
```

**Action**: None needed, system ready to use

---

### ⚠️ Some Missing

```
❌ CORE SYSTEM: Missing tables detected
   - profiles ❌
   - cases ✅
   - parties ✅
   ...
```

**Action**: Run `FRESH_DATABASE_SETUP.sql`

---

### ❌ Many Missing

```
❌ CORE SYSTEM: Missing tables detected
❌ RBAC SYSTEM: Missing tables detected
❌ FUNCTIONS: Missing functions detected
❌ VIEWS: Missing views detected
```

**Action**: Run both migration scripts

---

## 🚀 Testing After Restoration

### Quick Smoke Test (5 minutes)

1. **Login Test**
   - Try to login
   - Should work if `profiles` table exists

2. **Dashboard Test**
   - Navigate to dashboard
   - Should show statistics
   - Check for errors in browser console (F12)

3. **Cases Test**
   - Go to Cases page
   - Should list cases (or show "no cases")
   - Try to view a case detail
   - No errors = good

4. **RBAC Test**
   - Go to Admin → RBAC Management
   - Should show 7 groups and 18 modules
   - If empty = RBAC tables missing

### Detailed Application Test (15 minutes)

Run through each module:
- [ ] Dashboard loads
- [ ] Cases list loads
- [ ] Case detail loads
- [ ] Documents page loads
- [ ] Tasks page loads
- [ ] Calendar loads
- [ ] Land Parcels loads
- [ ] Admin pages load
- [ ] RBAC Management loads

**Any errors?** Check browser console and match to missing tables

---

## 📋 Common Issues & Solutions

### Issue: "relation 'profiles' does not exist"

**Cause**: Core tables missing
**Solution**: Run `FRESH_DATABASE_SETUP.sql`

### Issue: "function get_executive_officers() does not exist"

**Cause**: Functions not created
**Solution**: Run `FRESH_DATABASE_SETUP.sql`

### Issue: RBAC page shows "No groups"

**Cause**: RBAC tables missing or empty
**Solution**: Run `database-rbac-system.sql`

### Issue: "new row violates row-level security policy"

**Cause**: RLS policies not configured
**Solution**: Run `FIX_RLS_POLICIES.sql`

### Issue: Foreign key constraint violations

**Cause**: Orphaned records after restore
**Solution**: Run foreign key integrity queries in verification script

---

## 🔍 Data Integrity After Restore

### Check for Data Loss

Run these queries to see what data remains:

```sql
-- Check user count
SELECT COUNT(*) as total_users FROM profiles;

-- Check case count
SELECT COUNT(*) as total_cases FROM cases;

-- Check document count
SELECT COUNT(*) as total_documents FROM documents;

-- Check RBAC data
SELECT COUNT(*) as total_groups FROM user_groups;
SELECT COUNT(*) as total_modules FROM system_modules;
```

**Expected**:
- Users: Your actual user count
- Cases: Your actual case count
- Documents: Your actual document count
- Groups: 7 (if RBAC was set up)
- Modules: 18 (if RBAC was set up)

### Check for Orphaned Records

The verification script includes foreign key checks:

```sql
-- Example: Check for orphaned documents
SELECT COUNT(*) as orphaned_documents
FROM documents
WHERE case_id NOT IN (SELECT id FROM cases);
```

**Expected**: 0 (no orphaned records)

If orphaned records exist:
- Option 1: Delete them (data cleanup)
- Option 2: Restore missing parent records
- Option 3: Leave them (if parent data will be restored later)

---

## ⏱️ Time Estimates

| Action | Time Required |
|--------|--------------|
| Quick table count check | 30 seconds |
| Comprehensive verification | 2 minutes |
| Restore core tables | 3 minutes |
| Restore RBAC tables | 2 minutes |
| Test application | 5-15 minutes |
| **Total (worst case)** | **25 minutes** |

---

## 🎯 Immediate Action Plan

### RIGHT NOW (2 minutes)
1. Run quick table count check (above)
2. Identify what's missing

### NEXT (5-10 minutes)
3. Run comprehensive verification
4. Run missing migration scripts
5. Verify scripts completed successfully

### THEN (10 minutes)
6. Test application
7. Check for errors
8. Verify data integrity

### FINALLY (5 minutes)
9. Document what was restored
10. Note any data loss
11. Plan for prevention

---

## 📞 Support Resources

**Documentation**:
- `CODE_TO_DATABASE_MAPPING.md` - What tables do what
- `COMPLETE_DATABASE_VERIFICATION.sql` - Full verification
- `FRESH_DATABASE_SETUP.sql` - Core tables
- `database-rbac-system.sql` - RBAC tables

**Scripts Location**:
- All in project root directory
- Also on GitHub: https://github.com/emabi2002/landcasesystem

**If Stuck**:
1. Check browser console for specific errors
2. Review Supabase logs
3. Run verification script for detailed report
4. Contact support: support@same.new

---

## ✅ Success Checklist

After restoration, verify:

- [ ] Quick table check shows 18/18 tables
- [ ] Comprehensive verification passes
- [ ] Login works
- [ ] Dashboard loads without errors
- [ ] Cases page works
- [ ] RBAC admin works
- [ ] No console errors
- [ ] No missing tables warnings
- [ ] Foreign keys intact
- [ ] Data counts match expectations

**All checked?** ✅ Database restoration successful!

---

## 🎉 When All Is Good

You should see:
- ✅ 18 tables present
- ✅ 5 functions working
- ✅ 3 views created
- ✅ RLS enabled
- ✅ Application working
- ✅ No errors

**Status**: READY FOR PRODUCTION USE

---

**DO THIS NOW**: Run the quick table count check above ☝️

**Then**: Follow the action plan based on results

**Time to Complete**: 10-25 minutes depending on what's missing

---

**Created**: December 23, 2025
**Purpose**: Database restoration verification
**Status**: Ready to execute

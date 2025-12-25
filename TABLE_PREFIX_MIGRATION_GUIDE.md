# Table Prefix Migration Guide
## Adding `legal_` prefix to all tables

**Date**: December 23, 2025
**Purpose**: Distinguish legal case system tables from other systems (e.g., audit) sharing the same database
**Prefix**: `legal_`

---

## 📋 Overview

This migration renames all 18 tables to have a `legal_` prefix for better organization in a shared database environment.

### Before:
```
profiles, cases, parties, documents, tasks, events, land_parcels, case_history,
notifications, case_comments, executive_workflow, case_assignments, user_groups,
system_modules, permissions, group_module_access, user_group_membership, rbac_audit_log
```

### After:
```
legal_profiles, legal_cases, legal_parties, legal_documents, legal_tasks, legal_events,
legal_land_parcels, legal_case_history, legal_notifications, legal_case_comments,
legal_executive_workflow, legal_case_assignments, legal_user_groups, legal_system_modules,
legal_permissions, legal_group_module_access, legal_user_group_membership, legal_rbac_audit_log
```

---

## 🚀 Migration Steps (Total Time: 15-20 minutes)

### Step 1: Backup Current Database (5 minutes)

**CRITICAL**: Backup before making changes!

1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Click "Create Backup"
4. Wait for completion
5. Download backup (optional but recommended)

---

### Step 2: Update Code First (5 minutes)

**Run the automated script to update all code references**:

```bash
# Navigate to project directory
cd landcasesystem

# Run the update script
node update-table-references.js
```

**What this does**:
- Scans all `.ts`, `.tsx`, `.js`, `.jsx`, `.sql` files
- Finds all table references
- Updates them to use `legal_` prefix
- Reports all changes made

**Expected output**:
```
✅ src/app/api/cases/register/route.ts (15 changes)
✅ src/app/cases/page.tsx (8 changes)
✅ src/components/forms/AddPartyDialog.tsx (3 changes)
...
Total changes: 250+
```

**Review changes**:
```bash
# See what changed
git diff

# If you need to undo
git checkout .
```

---

### Step 3: Rename Tables in Database (5 minutes)

**Run the SQL migration script**:

1. Open Supabase SQL Editor
2. Open the file `RENAME_TABLES_WITH_PREFIX.sql`
3. Copy entire contents
4. Paste into Supabase SQL Editor
5. Click "Run"

**What this does**:
- Renames all 18 tables with `legal_` prefix
- Updates all functions to use new table names
- Recreates all views with new table names
- Updates RLS policies
- Grants permissions

**Expected output**:
```
✅ TABLE RENAMING COMPLETE!
All tables now have "legal_" prefix
Functions and views updated
Permissions granted
```

---

### Step 4: Verify Migration (2 minutes)

**Run verification query**:

```sql
-- Check all tables renamed
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'legal_%'
ORDER BY table_name;
```

**Expected result**: 18 tables with `legal_` prefix

---

### Step 5: Test Application (5-10 minutes)

**Test these key features**:

1. **Login**
   - Try to login → Should work

2. **Dashboard**
   - Should load statistics
   - No errors in console

3. **Cases**
   - View cases list → Should load
   - Create new case → Should work
   - View case details → Should work

4. **Documents**
   - View documents → Should load
   - Upload document → Should work

5. **Tasks**
   - View tasks → Should load
   - Create task → Should work

6. **RBAC Admin**
   - Go to Admin → RBAC Management
   - Should show 7 groups and 19 modules
   - Should work without errors

**Check browser console** (F12) for any errors

---

### Step 6: Commit Changes (2 minutes)

**If everything works**:

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Add legal_ prefix to all tables for multi-system database

- Renamed all 18 tables with legal_ prefix
- Updated all code references (250+ changes)
- Updated functions and views
- All tests passing

Enables sharing database with audit system and future systems."

# Push to GitHub
git push origin main
```

---

## 📊 What Gets Updated

### Database Objects

**Tables (18)**:
- All renamed with `legal_` prefix
- All foreign keys maintained
- All indexes maintained
- All constraints maintained

**Functions (3)**:
- `get_executive_officers()` → Updated
- `notify_executive_officers()` → Updated
- `initialize_executive_workflow()` → Updated

**Views (3)**:
- `executive_workflow_summary` → Updated
- `pending_executive_reviews` → Updated
- `case_assignment_status` → Updated

### Code Files

**API Routes** (~15 files):
- `/api/cases/register/route.ts`
- `/api/cases/assign/route.ts`
- `/api/executive/advice/route.ts`
- `/api/rbac/groups/route.ts`
- `/api/rbac/modules/route.ts`
- `/api/rbac/access/route.ts`
- `/api/rbac/members/route.ts`
- `/api/dashboard/stats/route.ts`
- All other API routes

**Pages** (~20 files):
- All case pages
- All admin pages
- Dashboard
- Calendar
- Tasks
- Documents
- All other pages

**Components** (~30 files):
- All form dialogs
- All list components
- Navigation
- All other components

**Total**: ~250+ code references updated

---

## 🔍 Verification Checklist

After migration, verify:

- [ ] All 18 tables renamed to `legal_` prefix
- [ ] Functions updated and working
- [ ] Views updated and working
- [ ] Login works
- [ ] Dashboard loads
- [ ] Cases list loads
- [ ] Case detail page works
- [ ] Document upload works
- [ ] Task creation works
- [ ] Calendar loads
- [ ] RBAC admin works
- [ ] No console errors
- [ ] No database errors
- [ ] All foreign keys intact
- [ ] RLS policies active

---

## 🐛 Troubleshooting

### Issue: "relation 'cases' does not exist"

**Cause**: Table renamed but code not updated
**Fix**: Run `update-table-references.js` again

### Issue: "relation 'legal_cases' does not exist"

**Cause**: Database not renamed yet
**Fix**: Run `RENAME_TABLES_WITH_PREFIX.sql`

### Issue: "function get_executive_officers() does not exist"

**Cause**: Functions not updated
**Fix**: Re-run the SQL migration script

### Issue: Some features work, others don't

**Cause**: Partial code update
**Fix**: Search for old table names: `grep -r "\.from('cases')" src/`

---

## ⏪ Rollback Procedure

If you need to rollback:

### Option 1: From Backup
1. Go to Supabase Dashboard → Backups
2. Restore from backup created in Step 1
3. Revert code: `git checkout HEAD~1`

### Option 2: Manual Reverse
Run this SQL to reverse table names:

```sql
-- Reverse all table renames
ALTER TABLE legal_profiles RENAME TO profiles;
ALTER TABLE legal_cases RENAME TO cases;
ALTER TABLE legal_parties RENAME TO parties;
-- ... (repeat for all 18 tables)
```

Then:
```bash
# Revert code changes
git revert HEAD
git push origin main
```

---

## 📈 Benefits of This Change

### Before (Problems):
- ❌ Table name conflicts with other systems
- ❌ Unclear which tables belong to which system
- ❌ Difficult to manage permissions per system
- ❌ Risk of accidental data mixing

### After (Benefits):
- ✅ Clear table ownership (`legal_` = legal system)
- ✅ Can share database safely with audit system
- ✅ Easier permission management
- ✅ Better organized database
- ✅ Scalable for future systems

---

## 🎯 Future Systems

With this prefix pattern, you can add more systems:

- `legal_*` = Legal Case Management System
- `audit_*` = Audit System
- `finance_*` = Finance System
- `hr_*` = HR System
- etc.

**All sharing the same database safely!**

---

## 📊 Migration Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Backup database | 5 min |
| 2 | Update code | 5 min |
| 3 | Rename tables in DB | 5 min |
| 4 | Verify migration | 2 min |
| 5 | Test application | 10 min |
| 6 | Commit changes | 2 min |
| **Total** | **Complete migration** | **30 min** |

---

## ✅ Success Criteria

Migration is successful when:

1. All 18 tables have `legal_` prefix
2. All code references updated
3. Application works without errors
4. All features functional
5. No console errors
6. Changes committed to GitHub

---

## 📞 Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review the verification checklist
3. Check browser console for specific errors
4. Review Supabase logs
5. Contact support: support@same.new

---

## 📝 Files Created

1. **`RENAME_TABLES_WITH_PREFIX.sql`** - Database migration script
2. **`update-table-references.js`** - Code update script
3. **`TABLE_PREFIX_MIGRATION_GUIDE.md`** - This guide
4. **`update-table-names.sh`** - Bash alternative (if needed)

---

**Ready to start?** Follow Step 1: Backup your database!

**Total time**: 30 minutes for complete migration

**Risk level**: Low (with backup)

**Reversible**: Yes (with backup or reverse script)

---

**Created**: December 23, 2025
**For**: Legal Case Management System
**Purpose**: Multi-system database organization
**Status**: Ready to execute

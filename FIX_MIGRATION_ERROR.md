# Fix Migration Error - Quick Guide

## ❌ Error You're Seeing
```
Error: Failed to run sql query: ERROR: 42P07:
relation "idx_profiles_email" already exists
```

## ✅ Solution: Use Smart Migration Instead

The error happens because your database **already has some objects** from a previous partial run.

Instead of `RUN_THIS_SCHEMA.sql` (which drops everything), use the **smart migration**.

---

## 🚀 Step-by-Step Fix

### Step 1: Clear the SQL Editor

In Supabase SQL Editor:
1. Select all text (Ctrl+A / Cmd+A)
2. Delete it
3. You should have an empty editor

### Step 2: Run Smart Migration

1. **Open file**: `RUN_SMART_MIGRATION.sql` (in your project folder)
2. **Copy ALL contents** (Ctrl+A, then Ctrl+C)
3. **Paste into Supabase SQL Editor** (Ctrl+V)
4. **Click RUN** button

This will:
- ✅ Check what exists
- ✅ Only create missing tables
- ✅ Skip existing indexes (no error!)
- ✅ Update functions & triggers
- ✅ Seed initial data

### Step 3: Run Canonical Workflow Migration

After Step 2 succeeds:

1. **Clear the editor again**
2. **Open file**: `SCHEMA_MIGRATION_CANONICAL_WORKFLOW.sql`
3. **Copy ALL contents**
4. **Paste into Supabase SQL Editor**
5. **Click RUN** button

This adds:
- ✅ 7 normalized workflow tables
- ✅ Lifecycle state machine
- ✅ 3-day returnable date alerts

---

## 🎯 Expected Results

### After Step 2 (Smart Migration):
```
✅ Smart Migration Complete!
total_tables_created: 24
```

### After Step 3 (Canonical Workflow):
```
✅ CANONICAL WORKFLOW SCHEMA MIGRATION COMPLETE!

📊 SUMMARY:
  - New/Verified Tables: 7
  - Cases table enhanced with 8 new columns
  - Documents table enhanced with 7 new columns
  - Triggers created: 7
  - Master view created: v_litigation_register
```

---

## 📁 File Summary

**Use These (in order):**
1. ✅ `RUN_SMART_MIGRATION.sql` - Run FIRST (idempotent, safe)
2. ✅ `SCHEMA_MIGRATION_CANONICAL_WORKFLOW.sql` - Run SECOND (idempotent, safe)

**Don't Use:**
- ❌ `RUN_THIS_SCHEMA.sql` - For clean installs only (drops everything)
- ❌ `database-schema-consolidated.sql` - Old version

---

## 🔧 If You Still Get Errors

### Error: "table already exists"
**Solution**: This is fine! The smart migration will skip it.

### Error: "column already exists"
**Solution**: This is fine! The migration checks before adding.

### Error: "permission denied"
**Solution**: Make sure you're logged into Supabase with admin access.

### Other errors:
1. Take a screenshot of the error
2. Share it with me
3. I'll help you fix it

---

## ✨ Why This Works

**Smart Migration** (`RUN_SMART_MIGRATION.sql`):
- Uses `CREATE TABLE IF NOT EXISTS` (won't fail if exists)
- Uses `CREATE INDEX IF NOT EXISTS` (won't fail if exists)
- Uses `CREATE OR REPLACE FUNCTION` (updates existing)
- Uses `ON CONFLICT DO NOTHING` for data (idempotent inserts)

**Canonical Workflow Migration**:
- Checks each column before adding with `DO $$ ... END $$`
- Only creates what's missing
- Safe to run multiple times

---

## 🎉 After Success

Your database will have:
- ✅ 24 base tables (cases, documents, users, etc.)
- ✅ 7 canonical workflow tables (lawyers, assignments, land details, etc.)
- ✅ 30+ indexes for performance
- ✅ 10 functions (permissions, alerts, etc.)
- ✅ 10+ triggers (auto-logging, alerts, timestamps)
- ✅ Complete RBAC system
- ✅ Lifecycle state machine (10 states)
- ✅ 3-day returnable date alerts

**Your app will now work!** The "profiles table not found" error will be gone.

---

## 📞 Need Help?

If anything goes wrong:
1. Don't panic - we can fix it
2. Take a screenshot of the error
3. Tell me which step you're on
4. I'll guide you through it

---

**Ready?** Go to Step 1 above and start! 🚀

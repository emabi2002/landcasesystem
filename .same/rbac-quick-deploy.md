# 🚀 RBAC Quick Deployment Guide

## ✅ FIXED: Database Schema Errors

The database schema has been updated to fix all deployment conflicts.

**Changes Made:**
- ✅ Changed column from `timestamp` → `logged_at` (PostgreSQL reserved keyword)
- ✅ Added `DROP TABLE` statements to ensure clean install
- ✅ Added `DROP FUNCTION` statements to avoid signature conflicts
- ✅ Added `DROP TRIGGER` statements for clean reinstall
- ✅ All RBAC objects will be recreated fresh (no conflicts)

---

## 📋 Deployment Steps (5 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://yvnkyjnwvylrweyzvibs.supabase.co
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"** button

### Step 2: Run the Schema

1. Open the file: **`database-rbac-schema.sql`**
2. **Copy ALL contents** (Ctrl+A, Ctrl+C)
3. **Paste** into Supabase SQL Editor (Ctrl+V)
4. Click **"Run"** button (or press F5)
5. Wait for completion (should take 5-10 seconds)

### Step 3: Verify Installation

Run this verification query:

```sql
SELECT
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM modules) as modules_count,
    (SELECT COUNT(*) FROM group_module_permissions) as permissions_count,
    (SELECT COUNT(*) FROM user_groups) as user_groups_count;
```

**Expected Results:**
```
groups_count: 8
modules_count: 23
permissions_count: 161 (Super Admin has all permissions)
user_groups_count: 0 (no users assigned yet)
```

### Step 4: Assign Super Admin

1. Go to your app: http://localhost:3000
2. Login with: `admin@lands.gov.pg` / `demo123`
3. Navigate to: **Administration → User Management**
4. Find your user in the list
5. Click **"Assign Group"**
6. Select **"Super Admin"**
7. Click **"Assign to Group"**
8. **Log out and log back in** (required for permissions to load)

### Step 5: Test Permissions

1. Go to **Administration → Group Management**
2. You should see 8 groups in the left panel
3. Click on "Super Admin"
4. You should see all toggles enabled in the permission matrix
5. Go to **Cases** page
6. You should see "Create New Case" button (because you have create permission)

---

## 🐛 Troubleshooting

### Error: "relation 'groups' already exists"

**Problem:** Tables exist from previous run

**Solution:** The new schema has `DROP TABLE` statements, so this shouldn't happen. If it does:

```sql
-- Run this first to drop all RBAC tables
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.group_module_permissions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
```

Then run the full schema again.

### Error: "column 'timestamp' does not exist"

**Problem:** Old references to the renamed column

**Solution:** This has been fixed in the latest schema. Make sure you're using the updated `database-rbac-schema.sql` file.

### Error: "cannot change return type of existing function"

**Problem:** Functions exist from previous schema run with different signatures

**Solution:** This has been fixed! The new schema drops all functions before recreating them.

### Error: "relation 'public.groups' does not exist"

**Problem:** Trying to drop triggers on tables that don't exist yet

**Solution:** Fixed! The schema now drops objects in the correct order:
1. Drop tables (with CASCADE to auto-drop triggers)
2. Drop functions
No more dependency conflicts!

### Error: "permission denied for schema public"

**Problem:** Using wrong Supabase credentials

**Solution:**
1. Make sure you're logged into the correct Supabase project
2. Check you're using the project at: https://yvnkyjnwvylrweyzvibs.supabase.co
3. Try using the service role key instead of anon key (in SQL Editor settings)

### Tables Created But No Data

**Problem:** INSERTS failed silently

**Solution:** Check the Supabase SQL Editor output:
- Should show "INSERT 0 8" for groups
- Should show "INSERT 0 23" for modules
- Should show success messages for each section

If INSERTs failed, scroll through the output to find the error.

### Can't Access Admin Pages After Setup

**Problem:** User not assigned to group OR didn't log out/in

**Solution:**
1. Verify user is in "Super Admin" group via SQL:
   ```sql
   SELECT u.email, g.group_name
   FROM auth.users u
   JOIN user_groups ug ON u.id = ug.user_id
   JOIN groups g ON ug.group_id = g.id;
   ```
2. If user not listed, assign via `/admin/users` page
3. **Must log out and log back in** for permissions to take effect
4. Clear browser cache if still not working

### Permission Matrix Not Saving

**Problem:** RLS policies blocking updates

**Solution:** Check if you're logged in as Super Admin:
```sql
SELECT user_has_permission(
    auth.uid(),
    'group_management',
    'update'
);
```

Should return `true`. If not, re-assign to Super Admin group.

---

## 🎯 Success Checklist

After deployment, verify:

- [ ] 8 groups exist in database
- [ ] 23 modules exist in database
- [ ] Super Admin has 161 permissions (23 modules × 7 actions)
- [ ] Admin user assigned to Super Admin group
- [ ] Can access `/admin/groups` page
- [ ] Can access `/admin/users` page
- [ ] Permission matrix shows all toggles enabled for Super Admin
- [ ] Cases page shows "Create New Case" button
- [ ] No console errors

---

## 📊 Quick Test Script

Run this to verify everything works:

```sql
-- 1. Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('groups', 'modules', 'group_module_permissions', 'user_groups', 'audit_logs')
ORDER BY table_name;
-- Should return 5 rows

-- 2. Check groups
SELECT group_name FROM groups ORDER BY group_name;
-- Should return 8 groups

-- 3. Check modules
SELECT module_name FROM modules ORDER BY module_name;
-- Should return 23 modules

-- 4. Check Super Admin permissions
SELECT COUNT(*) as super_admin_permissions
FROM group_module_permissions gmp
JOIN groups g ON gmp.group_id = g.id
WHERE g.group_name = 'Super Admin';
-- Should return 161

-- 5. Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_permissions', 'user_has_permission')
ORDER BY routine_name;
-- Should return 2 rows
```

If all queries return expected results, your RBAC system is ready! ✅

---

## 🆘 Still Having Issues?

1. Check Supabase logs for detailed error messages
2. Verify you're running the latest version of `database-rbac-schema.sql`
3. Make sure all environment variables are correct
4. Try running the schema in smaller sections to isolate the error
5. Contact support: support@same.new

---

**Last Updated:** February 2026
**Schema Version:** 1.1 (fixed timestamp → logged_at)

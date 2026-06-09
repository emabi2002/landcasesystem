# 🚀 Setup Default Groups - Step-by-Step Instructions

## ⚡ Quick Start (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Login to your account
3. Select your project: **Legal Case Management System**

### Step 2: Open SQL Editor
1. Click on **SQL Editor** in the left sidebar
2. Click **"New query"** button

### Step 3: Copy the Setup Script
1. Open the file: `SETUP_DEFAULT_GROUPS_AND_PERMISSIONS.sql`
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C)

### Step 4: Paste and Run
1. Paste into the SQL Editor (Ctrl+V)
2. Click the **"Run"** button (or press F5)
3. Wait 3-5 seconds for execution

### Step 5: Verify Success
You should see output like this:

```
NOTICE: Groups created successfully
NOTICE: Super Admin ID: [uuid]
NOTICE: Manager ID: [uuid]
NOTICE: Case Officer ID: [uuid]
NOTICE: Legal Clerk ID: [uuid]
NOTICE: Document Clerk ID: [uuid]
NOTICE: Viewer ID: [uuid]
NOTICE: ============================================
NOTICE: SETUP COMPLETE!
NOTICE: ============================================
NOTICE: Default Groups Created: 6
NOTICE: System Modules: 20
NOTICE: Permissions Configured: [number]
```

✅ **Success!** Your groups and permissions are now set up.

---

## 🔍 Verify in the Application

### Check Groups Were Created
1. Open your application
2. Login as admin (admin@lands.gov.pg)
3. Navigate to **Administration → Groups**
4. You should see:
   - ✅ Super Admin
   - ✅ Manager
   - ✅ Case Officer
   - ✅ Legal Clerk
   - ✅ Document Clerk
   - ✅ Viewer

### Check Permissions Were Configured
1. Click on any group (e.g., "Case Officer")
2. The **Permission Matrix** should load on the right
3. You should see checkboxes toggled for various modules
4. Example: Case Officer should have Create, Read, Update for Case Management

---

## 🎯 Next Steps

### 1. Create Your First User
1. Go to **Administration → User Management**
2. Click **"Create User"** button
3. Fill in:
   - Full Name: `Test User`
   - Email: `test@dlpp.gov.pg`
   - Password: `Test123456`
   - Confirm Password: `Test123456`
   - **Group**: Select "Case Officer"
4. Click **"Create User"**

### 2. Test User Permissions
1. Logout from admin account
2. Login with: `test@dlpp.gov.pg` / `Test123456`
3. Verify you see the correct modules based on Case Officer permissions
4. Try creating a case (should work)
5. Try accessing Administration menu (should NOT appear)

### 3. Create Real Users
Now you can create actual users for your organization:
- Department heads → Assign to "Manager"
- Legal officers → Assign to "Case Officer"
- Support staff → Assign to "Legal Clerk"
- File clerks → Assign to "Document Clerk"

---

## 🔧 Troubleshooting

### "Syntax error" when running script
**Cause:** Incomplete copy/paste
**Solution:** Make sure you copied the ENTIRE script from beginning to end

### "Table 'groups' does not exist"
**Cause:** Base tables not created yet
**Solution:** Run the base schema migration first (check DATABASE_SETUP_GUIDE.md)

### Groups created but no permissions showing
**Cause:** Script only partially executed
**Solution:**
1. Delete the incomplete data:
   ```sql
   DELETE FROM group_module_permissions;
   DELETE FROM groups WHERE group_name IN ('Super Admin', 'Manager', 'Case Officer', 'Legal Clerk', 'Document Clerk', 'Viewer');
   DELETE FROM modules;
   ```
2. Re-run the setup script

### "User not allowed" error when viewing users
**Cause:** Missing service role key
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file

---

## 📊 What This Script Does

1. **Creates 20 System Modules**
   - Dashboard, Case Management, Documents, Tasks, etc.
   - Uses `ON CONFLICT` to prevent duplicates (safe to re-run)

2. **Creates 6 Default Groups**
   - Super Admin
   - Manager
   - Case Officer
   - Legal Clerk
   - Document Clerk
   - Viewer

3. **Configures Permissions**
   - ~365 permission records
   - Each group gets appropriate access to each module
   - 7 permission types: Create, Read, Update, Delete, Print, Approve, Export

4. **Provides Verification**
   - Outputs summary statistics
   - Shows permission breakdown per group

---

## 📝 Script Safety Features

✅ **Idempotent** - Safe to run multiple times
✅ **Non-destructive** - Won't delete existing custom groups
✅ **Transactional** - All or nothing (if one part fails, nothing is created)
✅ **Verified** - Includes verification queries to confirm success

---

## 📚 Related Documentation

After setup, read these guides:

1. **DEFAULT_GROUPS_SETUP_GUIDE.md** - Detailed explanation of each group
2. **GROUPS_PERMISSIONS_QUICK_REFERENCE.md** - Quick reference card
3. **USER_GROUP_MANAGEMENT_GUIDE.md** - How to create and assign users
4. **RBAC_COMPLETE_WORKFLOW.md** - Complete RBAC architecture

---

## ⏱️ Estimated Time

- **Run Script:** 30 seconds
- **Verify in App:** 2 minutes
- **Create Test User:** 1 minute
- **Test Permissions:** 2 minutes

**Total:** ~5 minutes

---

## ✅ Completion Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied setup script
- [ ] Ran script successfully
- [ ] Saw success messages
- [ ] Verified 6 groups appear in app
- [ ] Checked Permission Matrix loads
- [ ] Created test user
- [ ] Tested user login and permissions
- [ ] Deleted test user
- [ ] Ready to create real users

---

## 🆘 Need Help?

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review the error message in Supabase SQL Editor
3. Check that base tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('groups', 'modules', 'group_module_permissions', 'user_groups');
   ```
4. Verify environment variables are set in `.env.local`

---

**Ready? Let's do this! 🚀**

Run the script and you'll have a complete RBAC system in 5 minutes.

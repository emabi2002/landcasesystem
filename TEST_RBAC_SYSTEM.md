# RBAC System Testing Guide

**Date**: December 23, 2025
**Status**: Database Migrated ✅
**Ready to Test**: YES!

---

## 🎯 Quick Verification (5 minutes)

### Step 1: Verify Database Migration

Run these queries in Supabase SQL Editor:

```sql
-- Quick check: Count tables
SELECT COUNT(*) as rbac_tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_groups', 'system_modules', 'permissions',
  'group_module_access', 'user_group_membership', 'rbac_audit_log'
);
-- Expected: 6

-- Quick check: Count default data
SELECT
  (SELECT COUNT(*) FROM user_groups) as groups,
  (SELECT COUNT(*) FROM system_modules) as modules,
  (SELECT COUNT(*) FROM permissions) as permissions;
-- Expected: groups=7, modules=18, permissions=8
```

**✅ If you see 6 tables, 7 groups, and 18 modules, migration was successful!**

---

## 🧪 Test the RBAC Interface (10 minutes)

### Test 1: Access RBAC Admin Page

1. **Login to the system**
   - Email: `admin@lands.gov.pg`
   - Password: `demo123`

2. **Navigate to RBAC**
   - Click "Admin" in the navigation
   - Click "RBAC Management" card
   - OR go directly to: `http://localhost:3000/admin/rbac`

3. **Verify the page loads**
   - [ ] Page loads without errors
   - [ ] No console errors (F12 → Console tab)
   - [ ] See statistics cards at top
   - [ ] See two tabs: "User Groups" and "System Modules"

**Expected Statistics**:
- User Groups: 7
- System Modules: 18
- Total Users: (your user count)
- Active Groups: 7

---

### Test 2: View Default Groups

1. **On the "User Groups" tab**
   - [ ] You should see 7 groups listed

2. **Verify these groups exist**:
   - [ ] Administrators
   - [ ] Legal Officers
   - [ ] Survey Officers
   - [ ] Registry Staff
   - [ ] Executive Officers
   - [ ] Compliance Officers
   - [ ] Read Only

3. **Check group details**
   - Each group should show:
     - Group name
     - Group code (e.g., ADMIN, LEGAL_OFF)
     - Active/Inactive badge
     - Number of members (0 initially)
     - Action buttons: Members, Permissions, Edit, Delete

---

### Test 3: View System Modules

1. **Click "System Modules" tab**
   - [ ] You should see 18 modules listed

2. **Verify some key modules**:
   - [ ] Cases (CASES)
   - [ ] Documents (DOCUMENTS)
   - [ ] Parties (PARTIES)
   - [ ] Tasks (TASKS)
   - [ ] Calendar (CALENDAR)
   - [ ] Land Parcels (LAND_PARCELS)
   - [ ] Reports (REPORTS)

3. **Check module details**
   - Each module should show:
     - Module name
     - Module code
     - Description
     - URL path (if applicable)

---

### Test 4: Create a Test Group

Let's create a test group to verify functionality:

1. **Click "Create Group" button** (blue button, top right)

2. **Fill in the form**:
   - Group Name: `Test Group`
   - Group Code: `TEST_GRP`
   - Description: `Testing RBAC functionality`
   - Active: ✅ Checked

3. **Click "Create Group"**
   - [ ] Success message appears
   - [ ] New group appears in the list
   - [ ] Group shows "TEST_GRP" code
   - [ ] Group shows "Active" badge
   - [ ] No errors in console

**✅ SUCCESS!** If the group was created, the API is working!

---

### Test 5: Assign Permissions

Now let's assign permissions to the test group:

1. **Find "Test Group" in the list**

2. **Click "Permissions" button**
   - [ ] Permission dialog opens
   - [ ] Shows all 18 modules
   - [ ] Each module has 4 checkboxes: View, Create, Edit, Delete

3. **Assign some permissions**:
   - Cases: ✅ View, ✅ Create
   - Documents: ✅ View
   - Parties: ✅ View

4. **Verify automatic saving**:
   - [ ] Checkboxes toggle immediately
   - [ ] No error messages
   - [ ] Changes persist (refresh page and check)

5. **Close the dialog**
   - Click "Close" button

**✅ SUCCESS!** If permissions were assigned, the access control API is working!

---

### Test 6: Add Members to Group

Let's add your admin user to the test group:

1. **Find "Test Group" in the list**

2. **Click "Members" button**
   - [ ] Members dialog opens
   - [ ] Shows list of all users in the system
   - [ ] Each user has a checkbox

3. **Add yourself to the group**:
   - Find your admin user in the list
   - ✅ Check the checkbox next to your name
   - [ ] User is now checked
   - [ ] No errors

4. **Close the dialog**
   - Click "Close" button

5. **Verify member count updated**:
   - [ ] "Test Group" now shows "1 member" badge

**✅ SUCCESS!** If member was added, the membership API is working!

---

### Test 7: Edit a Group

Let's test editing:

1. **Find "Test Group" in the list**

2. **Click "Edit" button**
   - [ ] Edit dialog opens
   - [ ] Form is pre-filled with current values
   - [ ] Group Name: `Test Group`
   - [ ] Group Code: `TEST_GRP` (disabled, can't edit)

3. **Make a change**:
   - Change Description to: `Testing RBAC - EDITED`

4. **Click "Update Group"**
   - [ ] Success message appears
   - [ ] Dialog closes
   - [ ] Description is updated in the list

**✅ SUCCESS!** If the edit saved, update API is working!

---

### Test 8: Delete the Test Group

Finally, let's clean up:

1. **Find "Test Group" in the list**

2. **Click "Delete" button**
   - [ ] Confirmation dialog appears
   - [ ] Warning about removing permissions and memberships

3. **Confirm deletion**
   - Click "OK" or "Yes"
   - [ ] Success message appears
   - [ ] "Test Group" is removed from the list
   - [ ] No errors

**✅ SUCCESS!** If the group was deleted, delete API is working!

---

## 📊 Verification Checklist

Check off each item as you test:

### Database
- [ ] Migration ran without errors
- [ ] 6 tables created
- [ ] 7 default groups exist
- [ ] 18 system modules exist
- [ ] RLS policies enabled

### UI Access
- [ ] Can login as admin
- [ ] Can access /admin/rbac page
- [ ] Page loads without errors
- [ ] No console errors
- [ ] Statistics display correctly

### User Groups Tab
- [ ] Can view all groups
- [ ] Can create new group
- [ ] Can edit existing group
- [ ] Can delete group
- [ ] Group details display correctly

### System Modules Tab
- [ ] Can view all modules
- [ ] Modules display correctly
- [ ] Module details are accurate

### Permissions
- [ ] Can open permissions dialog
- [ ] Can assign permissions
- [ ] Can revoke permissions
- [ ] Permissions save correctly
- [ ] Permissions persist after refresh

### Members
- [ ] Can open members dialog
- [ ] Can add users to group
- [ ] Can remove users from group
- [ ] Member count updates

### Overall Functionality
- [ ] All CRUD operations work
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Data persists correctly
- [ ] UI is responsive

---

## 🎉 Success Criteria

**RBAC System is FULLY OPERATIONAL if**:

✅ All 8 tests passed
✅ No errors in any operation
✅ Data persists correctly
✅ All default groups visible
✅ All modules configured
✅ Can create, edit, delete groups
✅ Can assign permissions
✅ Can manage members

**If all tests passed: CONGRATULATIONS! Your RBAC system is working perfectly!** 🎊

---

## 🐛 Troubleshooting

### Issue: No groups appear

**Check**:
```sql
SELECT COUNT(*) FROM user_groups;
```

**If 0**: Re-run the seed data section from `database-rbac-system.sql`

**If >0**: Check browser console for API errors

---

### Issue: Can't create group

**Check**:
1. Browser console for errors
2. Network tab → API response
3. Supabase logs for database errors
4. Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

### Issue: Permissions don't save

**Check**:
```sql
SELECT * FROM group_module_access LIMIT 5;
```

**If empty**: API might not be reaching database
**If has data**: Check RLS policies

---

### Issue: API returns 500 errors

**Check**:
1. Environment variable: `SUPABASE_SERVICE_ROLE_KEY`
2. Supabase project URL is correct
3. Database connection is active
4. RLS policies allow admin access

---

## 📋 Next Steps After Testing

Once all tests pass:

### 1. Configure Default Groups (30 min)

Review and customize the 7 default groups:

1. **Administrators** - Keep full access
2. **Legal Officers** - Adjust as needed
3. **Survey Officers** - Customize for survey team
4. **Registry Staff** - Set appropriate permissions
5. **Executive Officers** - Configure for executives
6. **Compliance Officers** - Set compliance access
7. **Read Only** - Verify view-only access

### 2. Assign Users to Groups (1-2 hours)

1. List all current users
2. Determine appropriate group for each
3. Add users to groups via Members dialog
4. Test user access

### 3. Verify User Access (30 min)

1. Login as different users
2. Verify they can access permitted modules
3. Verify they CANNOT access restricted modules
4. Test create/edit/delete permissions

### 4. Document Your Setup (30 min)

Create a document with:
- Your group structure
- Which groups have which permissions
- User assignment policy
- Change request process

---

## 🎯 Ready for Production?

**Before going live, ensure**:

- [ ] All tests passed
- [ ] Default groups configured
- [ ] All users assigned to groups
- [ ] User access verified
- [ ] Team trained on RBAC
- [ ] Documentation created
- [ ] Change process defined
- [ ] Backup strategy in place

---

**If everything works: Your RBAC system is production-ready!** 🚀

**Questions?** Check:
- RBAC_SYSTEM_GUIDE.md - Complete user manual
- RBAC_NEXT_STEPS.md - Setup instructions
- SESSION_SUMMARY_RBAC.md - Technical details

---

**Happy Testing!** 🎉

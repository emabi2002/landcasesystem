# ✅ Verification Checklist - RBAC Cleanup

**After running the cleanup SQL, verify everything works correctly.**

---

## 📋 Step 1: Verify Groups are Clean

### **Check in Supabase:**

Run this SQL:
```sql
SELECT group_name FROM public.groups ORDER BY group_name;
```

**Expected Result (ONLY 6 groups):**
```
✅ Case Officer
✅ Document Clerk
✅ Legal Clerk
✅ Manager
✅ Super Admin
✅ Viewer
```

**Should NOT see:**
```
❌ Auditor
❌ Data Entry Clerk
❌ Department Admin
❌ Director
❌ Legal Officer
❌ Reception
❌ Registrar
```

---

## 📋 Step 2: Configure Case Officer Permissions

### **Option A: Use UI (Recommended)**

1. **Login as admin** (admin@dlpp.gov.pg)
2. **Go to:** Administration → Groups
3. **Find:** "Case Officer" group
4. **Click:** "Manage Permissions" button
5. **Check these modules** (✅ can_read):
   - ✅ Cases
   - ✅ Allocation
   - ✅ Directions
   - ✅ Compliance
   - ✅ Notifications
   - ✅ Calendar
   - ✅ Tasks
   - ✅ Documents
   - ✅ Land Parcels
6. **Uncheck these** (❌ all permissions):
   - ❌ Dashboard
   - ❌ Admin
   - ❌ Users
   - ❌ Groups
7. **Click:** "Save Permissions"

### **Option B: Use SQL (Quick)**

```sql
DO $$
DECLARE
  case_officer_group_id UUID;
  module_record RECORD;
BEGIN
  SELECT id INTO case_officer_group_id
  FROM public.groups WHERE group_name = 'Case Officer';

  FOR module_record IN SELECT id, module_key FROM public.modules
  LOOP
    INSERT INTO public.group_module_permissions (
      group_id, module_id,
      can_create, can_read, can_update, can_delete,
      can_print, can_export, can_approve
    ) VALUES (
      case_officer_group_id,
      module_record.id,
      CASE WHEN module_record.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true ELSE false END,
      CASE WHEN module_record.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'notifications', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true ELSE false END,
      CASE WHEN module_record.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'notifications', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true ELSE false END,
      CASE WHEN module_record.module_key IN ('cases', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true ELSE false END,
      CASE WHEN module_record.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true ELSE false END,
      CASE WHEN module_record.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true ELSE false END,
      false
    )
    ON CONFLICT (group_id, module_id) DO UPDATE SET
      can_read = EXCLUDED.can_read,
      can_create = EXCLUDED.can_create,
      can_update = EXCLUDED.can_update,
      can_delete = EXCLUDED.can_delete,
      can_print = EXCLUDED.can_print,
      can_export = EXCLUDED.can_export;
  END LOOP;
END $$;
```

---

## 📋 Step 3: Assign Case Officer User to Correct Group

1. **Login as admin**
2. **Go to:** Administration → User Management
3. **Find:** your case officer user (caseofficer@dlpp.gov.pg)
4. **Click:** "Assign Group" button
5. **Select:** "Case Officer" from dropdown
6. **Click:** "Assign to Group"
7. **Verify:** User shows "Case Officer" badge

---

## 📋 Step 4: Test Case Officer Login

1. **Logout** from admin account
2. **Login as case officer:**
   - Email: `caseofficer@dlpp.gov.pg`
   - Password: (whatever you set)
3. **Hard refresh browser:** `Ctrl + Shift + R`
4. **Check header:** Should show "Case Officer" or user's full name
5. **Check sidebar:**

**Should SEE:**
```
✅ Case Workflow
   ├── Register Case
   ├── Assignment Inbox
   ├── My Cases
   ├── All Cases
   ├── Directions & Hearings
   ├── Compliance
   └── Notifications

✅ Case Management
   ├── Calendar
   ├── Tasks
   ├── Documents
   └── Land Parcels
```

**Should NOT see:**
```
❌ Dashboard → Overview
❌ Administration
```

---

## 📋 Step 5: Test Group Dropdown is Clean

1. **Login as admin**
2. **Go to:** Administration → User Management
3. **Click:** "Create New User" OR click "Assign Group" on any user
4. **Check dropdown:** Should ONLY show 6 groups

**Expected dropdown:**
```
Choose a group...
├── Case Officer
├── Document Clerk
├── Legal Clerk
├── Manager
├── Super Admin
└── Viewer
```

**Should NOT show:**
```
❌ Auditor
❌ Data Entry Clerk
❌ Department Admin
❌ Director
❌ Legal Officer
❌ Reception
❌ Registrar
```

---

## ✅ Success Criteria

Check all that apply:

- [ ] Only 6 groups exist in database
- [ ] No old groups (Auditor, Data Entry Clerk, etc.)
- [ ] Case Officer group has module permissions configured
- [ ] Case officer user is assigned to "Case Officer" group
- [ ] Case officer user can login
- [ ] Case officer sees Case Workflow menu (7 items)
- [ ] Case officer sees Case Management menu (4 items)
- [ ] Case officer does NOT see Dashboard
- [ ] Case officer does NOT see Administration
- [ ] Group dropdown shows only 6 new groups
- [ ] No old groups in dropdown

---

## 🐛 Troubleshooting

### **Issue: Case officer still sees no menus**

**Check 1:** Is user assigned to group?
```sql
SELECT u.email, g.group_name
FROM user_groups ug
JOIN auth.users u ON ug.user_id = u.id
JOIN groups g ON ug.group_id = g.id
WHERE u.email = 'caseofficer@dlpp.gov.pg';
```

**Check 2:** Does Case Officer group have permissions?
```sql
SELECT m.module_key, gmp.can_read
FROM group_module_permissions gmp
JOIN modules m ON gmp.module_id = m.id
JOIN groups g ON gmp.group_id = g.id
WHERE g.group_name = 'Case Officer' AND gmp.can_read = true;
```

**If no results:** Run Step 2 SQL to configure permissions

---

### **Issue: Still seeing old groups in dropdown**

**Solution:**
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache
3. Logout and login
4. Check database - run Step 1 SQL again

---

### **Issue: Permission Matrix shows no modules**

**Cause:** Modules don't exist in database

**Solution:**
```sql
-- Check if modules exist
SELECT module_key FROM modules ORDER BY module_key;

-- If empty, create modules (see SETUP_CASE_OFFICER_FULL_PERMISSIONS.sql)
```

---

## 🎯 Quick Verification SQL

Run all these checks at once:

```sql
-- Check 1: Groups
SELECT '=== GROUPS ===' AS check;
SELECT group_name FROM groups ORDER BY group_name;

-- Check 2: Case Officer Permissions
SELECT '=== CASE OFFICER PERMISSIONS ===' AS check;
SELECT m.module_key, gmp.can_read, gmp.can_create
FROM group_module_permissions gmp
JOIN modules m ON gmp.module_id = m.id
JOIN groups g ON gmp.group_id = g.id
WHERE g.group_name = 'Case Officer' AND gmp.can_read = true
ORDER BY m.module_key;

-- Check 3: User Assignments
SELECT '=== USER GROUP ASSIGNMENTS ===' AS check;
SELECT u.email, g.group_name
FROM user_groups ug
JOIN auth.users u ON ug.user_id = u.id
JOIN groups g ON ug.group_id = g.id
ORDER BY u.email, g.group_name;
```

---

## ✅ Final Checklist

After completing all steps:

- [ ] **Cleanup Complete:** Old groups deleted
- [ ] **Permissions Configured:** Case Officer has module access
- [ ] **Users Assigned:** All users in correct new groups
- [ ] **UI Clean:** Dropdown shows only 6 groups
- [ ] **Testing Complete:** Case officer can login and see menus
- [ ] **System Working:** Only one RBAC system active

---

## 🎊 Success!

If all checks pass, your system is now clean:

✅ **Single RBAC system** (NEW one only)
✅ **Clean group structure** (6 groups)
✅ **Working permissions** (Case officers see menus)
✅ **No confusion** (No duplicate systems)

---

**Next:** Start using the UI to manage groups and permissions!

**Administration → Groups → Manage Permissions**

🎯 All configuration through the UI from now on!

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

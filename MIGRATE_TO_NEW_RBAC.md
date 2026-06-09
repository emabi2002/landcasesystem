# 🔄 Migration Guide: Remove Old RBAC System

**Problem:** You have TWO RBAC systems running simultaneously
**Solution:** Remove the old system, keep only the NEW one

---

## 🎯 Understanding the Two Systems

### **OLD System (Remove This):**
```
❌ Auditor
❌ Data Entry Clerk
❌ Department Admin
❌ Director
❌ Legal Officer
❌ Manager
❌ Reception
❌ Registrar
❌ Super Admin
```
These are from the OLD role-based system.

### **NEW System (Keep This):**
```
✅ Super Admin
✅ Manager
✅ Case Officer
✅ Legal Clerk
✅ Document Clerk
✅ Viewer
```
These are from the NEW group-based RBAC system.

---

## 🗑️ Step 1: Delete Old Groups from Database

Run this SQL in **Supabase SQL Editor**:

```sql
-- ===============================================
-- DELETE OLD RBAC GROUPS
-- ===============================================
-- This removes the old group system
-- WARNING: This will remove users from old groups!
-- Make sure to reassign users to new groups first!
-- ===============================================

-- Step 1: List old groups (to verify before deleting)
SELECT id, group_name, description
FROM public.groups
WHERE group_name IN (
  'Auditor',
  'Data Entry Clerk',
  'Department Admin',
  'Director',
  'Legal Officer',
  'Reception',
  'Registrar'
);

-- Step 2: Delete user assignments from old groups
DELETE FROM public.user_groups
WHERE group_id IN (
  SELECT id FROM public.groups
  WHERE group_name IN (
    'Auditor',
    'Data Entry Clerk',
    'Department Admin',
    'Director',
    'Legal Officer',
    'Reception',
    'Registrar'
  )
);

-- Step 3: Delete old group permissions
DELETE FROM public.group_module_permissions
WHERE group_id IN (
  SELECT id FROM public.groups
  WHERE group_name IN (
    'Auditor',
    'Data Entry Clerk',
    'Department Admin',
    'Director',
    'Legal Officer',
    'Reception',
    'Registrar'
  )
);

-- Step 4: Delete old groups
DELETE FROM public.groups
WHERE group_name IN (
  'Auditor',
  'Data Entry Clerk',
  'Department Admin',
  'Director',
  'Legal Officer',
  'Reception',
  'Registrar'
);

-- Step 5: Verify only new groups remain
SELECT group_name, description
FROM public.groups
ORDER BY group_name;

-- Expected Result: Only these should remain:
-- - Case Officer
-- - Document Clerk
-- - Legal Clerk
-- - Manager
-- - Super Admin
-- - Viewer
```

---

## ✅ Step 2: Create New Groups (If They Don't Exist)

Run this SQL to ensure NEW groups exist:

```sql
-- ===============================================
-- CREATE NEW RBAC GROUPS
-- ===============================================

INSERT INTO public.groups (group_name, description) VALUES
  ('Super Admin', 'Full system access including user management and configuration'),
  ('Manager', 'Department heads and supervisors with approval rights'),
  ('Case Officer', 'Legal officers handling case assignments and management'),
  ('Legal Clerk', 'Support staff assisting with case processing'),
  ('Document Clerk', 'Document management specialists'),
  ('Viewer', 'Read-only access for observers and auditors')
ON CONFLICT (group_name) DO UPDATE SET
  description = EXCLUDED.description;

-- Verify
SELECT group_name, description FROM public.groups ORDER BY group_name;
```

---

## 👥 Step 3: Reassign Users to New Groups

### **Check Current User Assignments:**

```sql
-- See which users are in which groups
SELECT
  u.email,
  g.group_name
FROM public.user_groups ug
JOIN auth.users u ON ug.user_id = u.id
JOIN public.groups g ON ug.group_id = g.id
ORDER BY u.email, g.group_name;
```

### **Reassign Users (Example):**

```sql
-- Example: Move users from "Legal Officer" to "Case Officer"
-- Replace with actual user IDs and group IDs

-- Get Case Officer group ID
DO $$
DECLARE
  case_officer_group_id UUID;
  user_record RECORD;
BEGIN
  -- Get Case Officer group
  SELECT id INTO case_officer_group_id
  FROM public.groups
  WHERE group_name = 'Case Officer';

  -- For each user that was in "Legal Officer", add to "Case Officer"
  -- You'll need to identify these users first

  -- Example:
  INSERT INTO public.user_groups (user_id, group_id)
  SELECT
    u.id,
    case_officer_group_id
  FROM auth.users u
  WHERE u.email = 'caseofficer@dlpp.gov.pg'
  ON CONFLICT (user_id, group_id) DO NOTHING;

  RAISE NOTICE 'Users reassigned to Case Officer group';
END $$;
```

---

## 🔧 Step 4: Configure Permissions for New Groups

Use the **Admin UI** (recommended):

1. Login as admin
2. Go to: **Administration → Groups**
3. For each group, click **"Manage Permissions"**
4. Check/uncheck boxes for each module
5. Click **"Save"**

**Or use SQL** (see `SETUP_CASE_OFFICER_FULL_PERMISSIONS.sql`)

---

## 🧪 Step 5: Test

### **Test 1: Check Groups List**

1. Go to: **Administration → User Management**
2. Click **"Create New User"** or **"Assign Group"**
3. Check dropdown - should ONLY show:
   - ✅ Super Admin
   - ✅ Manager
   - ✅ Case Officer
   - ✅ Legal Clerk
   - ✅ Document Clerk
   - ✅ Viewer

**Should NOT show:**
   - ❌ Auditor
   - ❌ Data Entry Clerk
   - ❌ Department Admin
   - ❌ etc.

### **Test 2: Create Case Officer User**

1. **Administration → User Management**
2. **Create New User**
3. Fill in:
   - Full Name: `Test Officer`
   - Email: `test.officer@dlpp.gov.pg`
   - Password: `Test@2025`
   - **Group:** Select **Case Officer**
4. Click **"Create User"**
5. Logout
6. Login as `test.officer@dlpp.gov.pg`
7. Should see:
   - ✅ Case Workflow menu (7 items)
   - ✅ Case Management menu (4 items)
   - ❌ NO Dashboard Overview
   - ❌ NO Administration

---

## 📊 Quick Reference: Group Mapping

If you had users in old groups, map them to new groups:

| Old Group | New Group |
|-----------|-----------|
| Director | Manager |
| Legal Officer | Case Officer |
| Data Entry Clerk | Document Clerk |
| Department Admin | Manager |
| Auditor | Viewer |
| Reception | Document Clerk |
| Registrar | Case Officer |

---

## ⚠️ Important Notes

### **Before Deleting Old Groups:**

1. ✅ **Check which users are in old groups**
   ```sql
   SELECT u.email, g.group_name
   FROM user_groups ug
   JOIN auth.users u ON ug.user_id = u.id
   JOIN groups g ON ug.group_id = g.id
   WHERE g.group_name IN ('Auditor', 'Data Entry Clerk', 'Department Admin')
   ORDER BY u.email;
   ```

2. ✅ **Reassign those users to new groups FIRST**
   - Use Admin UI: User Management → Assign Group
   - Or use SQL as shown above

3. ✅ **Then delete old groups**
   - Run the deletion SQL script

### **After Migration:**

1. ✅ **Test all user accounts**
   - Login as each user type
   - Verify correct menus show

2. ✅ **Configure new group permissions**
   - Use Administration → Groups → Manage Permissions
   - Or run SQL permission scripts

3. ✅ **Document your groups**
   - Keep notes on what each group is for
   - Who should be in each group

---

## 🐛 Troubleshooting

### **Issue: Still seeing old groups in dropdown**

**Cause:** Old groups not deleted from database

**Solution:**
1. Run the deletion SQL script (Step 1)
2. Hard refresh browser: `Ctrl + Shift + R`
3. Clear browser cache
4. Logout and login

---

### **Issue: User has no menus after migration**

**Cause:** User not assigned to any new group

**Solution:**
1. Go to: Administration → User Management
2. Find the user
3. Click "Assign Group"
4. Select appropriate new group (e.g., "Case Officer")
5. User logout and login

---

### **Issue: Case Officer user sees no menus**

**Cause:** Case Officer group has no module permissions

**Solution:**
1. Go to: Administration → Groups
2. Find "Case Officer" group
3. Click "Manage Permissions"
4. Check ✅ these modules:
   - Cases (all permissions except approve)
   - Allocation
   - Directions
   - Compliance
   - Calendar
   - Tasks
   - Documents
   - Land Parcels
5. Leave Dashboard and Admin unchecked ❌
6. Click "Save"

---

## ✅ Migration Checklist

- [ ] **Step 1:** Identify users in old groups
- [ ] **Step 2:** Create new groups (if not exist)
- [ ] **Step 3:** Configure permissions for new groups
- [ ] **Step 4:** Reassign users to new groups
- [ ] **Step 5:** Delete old groups from database
- [ ] **Step 6:** Test user login and menu visibility
- [ ] **Step 7:** Verify no old groups in dropdown
- [ ] **Step 8:** Document your group structure

---

## 🎯 Final Result

After migration, you should have:

✅ **Only 6 groups:**
- Super Admin
- Manager
- Case Officer
- Legal Clerk
- Document Clerk
- Viewer

✅ **Clean UI:**
- User assignment dropdown shows only new groups
- No confusion with duplicate systems

✅ **Working permissions:**
- Case Officers see case menus
- Managers see dashboard
- Admins see everything
- Viewers see read-only

---

## 🎊 Summary

**Problem:** Two RBAC systems running
**Old System:** Auditor, Data Entry Clerk, etc.
**New System:** Super Admin, Case Officer, etc.
**Solution:** Delete old groups, use only new ones

**Steps:**
1. Run deletion SQL
2. Reassign users
3. Configure permissions
4. Test

**Result:** ✅ Clean, single RBAC system

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

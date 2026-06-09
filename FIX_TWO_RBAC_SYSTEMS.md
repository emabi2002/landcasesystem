# 🚨 URGENT FIX: Two RBAC Systems Running

**Problem:** You have TWO different RBAC systems active simultaneously
**Impact:** Confusing group selection, users with no menus
**Solution:** Remove old system, keep NEW one only

---

## ⚡ Quick Fix (5 Minutes)

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**

---

### **Step 2: Run Cleanup Script**

Copy and paste this entire script:

```sql
-- Delete old groups and their assignments
DELETE FROM public.user_groups
WHERE group_id IN (
  SELECT id FROM public.groups
  WHERE group_name IN (
    'Auditor', 'Data Entry Clerk', 'Department Admin',
    'Director', 'Legal Officer', 'Reception', 'Registrar'
  )
);

DELETE FROM public.group_module_permissions
WHERE group_id IN (
  SELECT id FROM public.groups
  WHERE group_name IN (
    'Auditor', 'Data Entry Clerk', 'Department Admin',
    'Director', 'Legal Officer', 'Reception', 'Registrar'
  )
);

DELETE FROM public.groups
WHERE group_name IN (
  'Auditor', 'Data Entry Clerk', 'Department Admin',
  'Director', 'Legal Officer', 'Reception', 'Registrar'
);

-- Ensure NEW groups exist
INSERT INTO public.groups (group_name, description) VALUES
  ('Super Admin', 'Full system access'),
  ('Manager', 'Department heads with approval rights'),
  ('Case Officer', 'Legal officers handling cases'),
  ('Legal Clerk', 'Support staff'),
  ('Document Clerk', 'Document specialists'),
  ('Viewer', 'Read-only access')
ON CONFLICT (group_name) DO NOTHING;

-- Verify
SELECT group_name FROM public.groups ORDER BY group_name;
```

Click **"RUN"**

---

### **Step 3: Configure Case Officer Permissions**

Still in SQL Editor, run this:

```sql
-- Configure Case Officer group permissions
DO $$
DECLARE
  case_officer_group_id UUID;
BEGIN
  SELECT id INTO case_officer_group_id
  FROM public.groups WHERE group_name = 'Case Officer';

  -- Grant permissions for case management modules
  INSERT INTO public.group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_export, can_approve)
  SELECT
    case_officer_group_id,
    m.id,
    CASE
      WHEN m.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true
      ELSE false
    END,
    CASE
      WHEN m.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'notifications', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true
      ELSE false
    END,
    CASE
      WHEN m.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'notifications', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true
      ELSE false
    END,
    CASE
      WHEN m.module_key IN ('cases', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true
      ELSE false
    END,
    CASE
      WHEN m.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true
      ELSE false
    END,
    CASE
      WHEN m.module_key IN ('cases', 'allocation', 'directions', 'compliance', 'calendar', 'tasks', 'documents', 'land_parcels') THEN true
      ELSE false
    END,
    false
  FROM public.modules m
  ON CONFLICT (group_id, module_id) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update;

  RAISE NOTICE 'Case Officer permissions configured!';
END $$;
```

---

### **Step 4: Reassign Your Case Officer User**

1. **Login to your app** as admin
2. Go to: **Administration → User Management**
3. Find your case officer user (caseofficer@dlpp.gov.pg)
4. Click **"Assign Group"**
5. Select **"Case Officer"** from dropdown
6. Click **"Assign to Group"**

---

### **Step 5: Test**

1. **Logout** from admin
2. **Login** as case officer: `caseofficer@dlpp.gov.pg`
3. **Hard refresh**: `Ctrl + Shift + R`

**You should now see:**
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

❌ NO Dashboard
❌ NO Administration
```

---

## ✅ What This Fix Does

### **Removes (Old System):**
- ❌ Auditor
- ❌ Data Entry Clerk
- ❌ Department Admin
- ❌ Director
- ❌ Legal Officer
- ❌ Reception
- ❌ Registrar

### **Keeps (New System):**
- ✅ Super Admin
- ✅ Manager
- ✅ Case Officer
- ✅ Legal Clerk
- ✅ Document Clerk
- ✅ Viewer

---

## 🎯 After Running This Fix

**Group Dropdown Will Show:**
```
Choose a group...
├── Case Officer
├── Document Clerk
├── Legal Clerk
├── Manager
├── Super Admin
└── Viewer
```

**NO MORE:**
- ❌ Auditor
- ❌ Data Entry Clerk
- ❌ etc.

---

## 🐛 If Case Officer Still Has No Menu

1. **Check group assignment:**
   - Administration → User Management
   - Verify user is in "Case Officer" group

2. **Check module exists:**
   ```sql
   SELECT module_key FROM modules
   WHERE module_key IN ('cases', 'calendar', 'tasks');
   ```

3. **Check permissions:**
   ```sql
   SELECT m.module_key, gmp.can_read
   FROM group_module_permissions gmp
   JOIN modules m ON gmp.module_id = m.id
   JOIN groups g ON gmp.group_id = g.id
   WHERE g.group_name = 'Case Officer';
   ```

4. **Re-run Step 3 SQL** (configure permissions)

---

## ⚠️ Important

**After running the cleanup script:**
- All users in OLD groups will be unassigned
- You need to manually reassign them to NEW groups
- Use the UI: Administration → User Management → Assign Group

---

## 📋 Quick Checklist

- [ ] Run SQL cleanup script in Supabase
- [ ] Run permission configuration script
- [ ] Reassign case officer user to "Case Officer" group
- [ ] Logout and login as case officer
- [ ] Hard refresh browser
- [ ] Verify menus appear correctly

---

## 🎊 Result

After this fix:
- ✅ Only ONE RBAC system (the new one)
- ✅ Clean group dropdown
- ✅ Case officers see correct menus
- ✅ No confusion

---

**See also:**
- `CLEANUP_OLD_RBAC.sql` - Full cleanup script
- `MIGRATE_TO_NEW_RBAC.md` - Detailed migration guide

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

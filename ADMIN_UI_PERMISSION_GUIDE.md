# 🎯 Administrator's Guide: UI-Based Permission Configuration

**NO SQL REQUIRED!** Configure all permissions through the Admin menu.

**Date:** March 7, 2026
**Status:** ✅ Production Ready

---

## 🎯 Overview

As an administrator, you can configure all user permissions through the web interface. No SQL knowledge or coding required!

**What You Can Do:**
- ✅ Create and manage user groups
- ✅ Configure module permissions for each group
- ✅ Assign users to groups
- ✅ View permission matrix
- ✅ All changes take effect immediately

---

## 📋 Step-by-Step: Configure Case Officer Permissions

### **Step 1: Login as Administrator**

1. Go to: http://localhost:3000/login
2. Login with admin credentials:
   - Email: `admin@dlpp.gov.pg`
   - Password: `Admin@2025`

---

### **Step 2: Navigate to Groups Management**

1. Look at the **sidebar**
2. Find **"Administration"** section
3. Click **"Groups"**
4. You'll see the Groups management page

---

### **Step 3: Find or Create Case Officer Group**

**If "Case Officer" group exists:**
- Look for it in the groups list
- Click on it to view details

**If "Case Officer" group doesn't exist:**
1. Click **"Create New Group"** button
2. Fill in:
   - **Group Name:** `Case Officer`
   - **Description:** `Case officers who manage cases from registration through closure`
3. Click **"Create Group"**

---

### **Step 4: Configure Permissions Using Permission Matrix**

1. Find "Case Officer" group in the list
2. Click **"Manage Permissions"** or **"Permission Matrix"** button
3. You'll see a table with:
   - **Rows:** All modules in the system
   - **Columns:** Permission types (Create, Read, Update, Delete, Print, Approve, Export)

**Now configure each module:**

#### **✅ Modules to ENABLE (Check ✅):**

**Cases Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ✅ can_delete
- ✅ can_print
- ✅ can_export
- ❌ can_approve (leave unchecked)

**Allocation Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ❌ can_delete (leave unchecked)
- ✅ can_print
- ✅ can_export
- ❌ can_approve

**Directions Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ✅ can_delete
- ✅ can_print
- ✅ can_export
- ❌ can_approve

**Compliance Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ✅ can_delete
- ✅ can_print
- ✅ can_export
- ❌ can_approve

**Notifications Module:**
- ❌ can_create
- ✅ can_read
- ✅ can_update
- ❌ can_delete
- ❌ can_print
- ❌ can_export
- ❌ can_approve

**Calendar Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ✅ can_delete
- ✅ can_print
- ✅ can_export
- ❌ can_approve

**Tasks Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ✅ can_delete
- ✅ can_print
- ✅ can_export
- ❌ can_approve

**Documents Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ✅ can_delete
- ✅ can_print
- ✅ can_export
- ❌ can_approve

**Land Parcels Module:**
- ✅ can_create
- ✅ can_read
- ✅ can_update
- ✅ can_delete
- ✅ can_print
- ✅ can_export
- ❌ can_approve

#### **❌ Modules to DISABLE (Leave Unchecked):**

**Dashboard Module:**
- ❌ ALL checkboxes unchecked
- Case Officers should NOT see dashboard

**Admin Module:**
- ❌ ALL checkboxes unchecked

**Users Module:**
- ❌ ALL checkboxes unchecked

**Groups Module:**
- ❌ ALL checkboxes unchecked

**Modules Module:**
- ❌ ALL checkboxes unchecked

**Master Files Module:**
- ❌ ALL checkboxes unchecked

**Internal Officers Module:**
- ❌ ALL checkboxes unchecked

---

### **Step 5: Save Permissions**

1. After configuring all modules
2. Click **"Save"** or **"Update Permissions"** button
3. You should see: "Permissions updated successfully!"

---

### **Step 6: Assign Users to Case Officer Group**

**Method 1: During User Creation**
1. Go to: **Administration → User Management**
2. Click **"Create New User"**
3. Fill in user details:
   - Full Name: `John Doe`
   - Email: `john.doe@dlpp.gov.pg`
   - Password: `SecurePass123`
   - **Group Assignment:** Select **Case Officer** ← Important!
4. Click **"Create User"**
5. Done! User immediately has Case Officer permissions

**Method 2: Assign Existing User**
1. Go to: **Administration → User Management**
2. Find the user in the list
3. Click **"Assign Group"** button
4. Select **Case Officer** from dropdown
5. Click **"Assign to Group"**
6. Done! User now has Case Officer permissions

---

### **Step 7: Test**

1. Logout from admin account
2. Login as the Case Officer user
3. Hard refresh: `Ctrl + Shift + R`
4. Verify the sidebar shows:
   - ✅ Case Workflow (7 items)
   - ✅ Case Management (4 items)
   - ❌ No Dashboard Overview
   - ❌ No Administration menu

---

## 🎯 Quick Reference: UI Navigation

### **To Manage Groups:**
```
Login → Administration → Groups
```

### **To Configure Permissions:**
```
Login → Administration → Groups → [Select Group] → Manage Permissions
```

### **To Manage Users:**
```
Login → Administration → User Management
```

### **To Create Users:**
```
Login → Administration → User Management → Create New User
```

### **To Assign Users to Groups:**
```
Login → Administration → User Management → [Find User] → Assign Group
```

### **To Manage Modules:**
```
Login → Administration → Modules
```

---

## 📊 Visual Guide: Permission Matrix

When you open the Permission Matrix, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│ Permission Matrix for: Case Officer                         │
├─────────────────────────────────────────────────────────────┤
│ Module Name     │ Create │ Read │ Update │ Delete │ Print │ Export │ Approve │
├─────────────────┼────────┼──────┼────────┼────────┼───────┼────────┼─────────┤
│ Cases           │   ✅   │  ✅  │   ✅   │   ✅   │  ✅   │   ✅   │   ❌    │
│ Allocation      │   ✅   │  ✅  │   ✅   │   ❌   │  ✅   │   ✅   │   ❌    │
│ Directions      │   ✅   │  ✅  │   ✅   │   ✅   │  ✅   │   ✅   │   ❌    │
│ Compliance      │   ✅   │  ✅  │   ✅   │   ✅   │  ✅   │   ✅   │   ❌    │
│ Calendar        │   ✅   │  ✅  │   ✅   │   ✅   │  ✅   │   ✅   │   ❌    │
│ Tasks           │   ✅   │  ✅  │   ✅   │   ✅   │  ✅   │   ✅   │   ❌    │
│ Documents       │   ✅   │  ✅  │   ✅   │   ✅   │  ✅   │   ✅   │   ❌    │
│ Land Parcels    │   ✅   │  ✅  │   ✅   │   ✅   │  ✅   │   ✅   │   ❌    │
│ Dashboard       │   ❌   │  ❌  │   ❌   │   ❌   │  ❌   │   ❌   │   ❌    │
│ Admin           │   ❌   │  ❌  │   ❌   │   ❌   │  ❌   │   ❌   │   ❌    │
└─────────────────┴────────┴──────┴────────┴────────┴───────┴────────┴─────────┘

[Save Permissions Button]
```

**How to Use:**
1. Click checkboxes to enable/disable permissions
2. Changes are highlighted
3. Click "Save" to apply
4. Changes take effect immediately

---

## 🔄 Creating Other User Roles

You can create additional roles the same way:

### **Manager Role:**
```
1. Administration → Groups
2. Create New Group: "Manager"
3. Configure Permissions:
   - All modules: can_read = true
   - Most modules: can_approve = true
   - Dashboard: can_read = true ✅
   - Admin: can_read = false (or true for senior managers)
```

### **Document Clerk Role:**
```
1. Administration → Groups
2. Create New Group: "Document Clerk"
3. Configure Permissions:
   - Documents: Full access
   - Cases: Read only
   - Dashboard: No access
   - Admin: No access
```

### **Viewer Role:**
```
1. Administration → Groups
2. Create New Group: "Viewer"
3. Configure Permissions:
   - All modules: can_read = true only
   - All other permissions: false
```

---

## 🎯 Best Practices

### **1. Plan Your Groups**
Before creating groups, plan:
- What roles exist in your organization?
- What can each role do?
- What should each role NOT be able to do?

### **2. Start with Least Privilege**
- Start with minimal permissions
- Add more as needed
- It's easier to grant than revoke

### **3. Test Each Group**
After configuring a group:
1. Create a test user
2. Assign to the group
3. Login as test user
4. Verify permissions work correctly

### **4. Document Your Groups**
Keep notes about:
- What each group is for
- What permissions they have
- Why certain permissions were granted/denied

### **5. Regular Reviews**
- Review group permissions quarterly
- Remove unused groups
- Update permissions as workflows change

---

## 📋 Common Scenarios

### **Scenario 1: New Employee Joins**
```
1. Administration → User Management
2. Create New User
3. Fill in their details
4. Select their group (e.g., Case Officer)
5. Create User
6. They can login immediately with correct permissions
```

### **Scenario 2: Employee Changes Role**
```
1. Administration → User Management
2. Find the user
3. Remove from old group (if needed)
4. Assign to new group
5. Permissions update immediately
```

### **Scenario 3: Temporary Access Needed**
```
1. Administration → User Management
2. Find the user
3. Assign to additional group (users can be in multiple groups)
4. Permissions merge from all groups
5. When done, remove from temporary group
```

### **Scenario 4: New Feature Added**
```
1. Administration → Modules
2. Create new module for the feature
3. Administration → Groups
4. For each group, configure access to new module
5. Users see/don't see feature based on their group
```

---

## 🛡️ Security Tips

### **1. Protect Admin Access**
- Only give admin/groups/users module access to trusted staff
- Use strong passwords
- Change default admin password

### **2. Principle of Least Privilege**
- Users should only have permissions they need
- Don't give everyone admin access
- Review permissions regularly

### **3. Audit Trail**
- System tracks who made changes
- Review audit logs regularly
- Investigate suspicious activity

### **4. Multiple Groups**
- Users can be in multiple groups
- Permissions MERGE (most permissive wins)
- Be careful with overlapping permissions

---

## ❓ FAQ

### **Q: Can a user be in multiple groups?**
**A:** Yes! Users can be in multiple groups. They get the combined permissions from all their groups.

### **Q: What happens if I change a group's permissions?**
**A:** All users in that group immediately get the new permissions. They may need to logout/login or refresh.

### **Q: Can I delete a group?**
**A:** Yes, but users in that group will lose those permissions. Consider reassigning users first.

### **Q: How do I know what permissions a user has?**
**A:** Go to User Management, click the user, and you'll see all their groups. Check each group's permissions.

### **Q: Do I need to run SQL scripts?**
**A:** No! The SQL scripts are provided as an optional quick-setup. Everything can be done through the UI.

### **Q: Can I export/import group configurations?**
**A:** Not currently, but you can duplicate by manually copying permissions to a new group.

---

## 🎊 Summary

**Everything is UI-driven!**

**To Configure Permissions:**
1. ✅ Login as admin
2. ✅ Go to: Administration → Groups
3. ✅ Select/Create group
4. ✅ Click "Manage Permissions"
5. ✅ Check/uncheck boxes
6. ✅ Click "Save"
7. ✅ Done!

**To Assign Users:**
1. ✅ Go to: Administration → User Management
2. ✅ Create user or find existing user
3. ✅ Assign to group
4. ✅ Done!

**No SQL. No Coding. Just Click!** 🎯

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

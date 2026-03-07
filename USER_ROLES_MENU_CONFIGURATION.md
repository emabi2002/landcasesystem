# 🎯 User Roles & Menu Configuration Guide

## Overview

Each user role in the system has been configured with specific permissions and menu access appropriate to their responsibilities.

---

## 📊 Role Summary

| Role | Menu Items | Access Level | Use Case |
|------|------------|--------------|----------|
| **Case Officer** | 10 modules | Create, Update | Daily case management |
| **Document Clerk** | 6 modules | Manage documents | Document management |
| **Legal Clerk** | 7 modules | Support cases | Legal support work |
| **Manager** | 15+ modules | Full operations | Department oversight |
| **Super Admin** | ALL modules | Full admin | System administration |
| **Viewer** | 4 modules | Read only | Auditors, observers |

---

## 1️⃣ CASE OFFICER ✅ (Configured)

### **Menu Access:**
- **Case Workflow**
  - Register Case
  - My Cases
  - All Cases
  - Directions & Hearings
  - Compliance
  - Notifications

- **Case Management**
  - Calendar
  - Tasks
  - Documents
  - Land Parcels

- **Communications**
  - Correspondence
  - Communications
  - File Requests

### **Permissions:**
- ✅ **Can**: Register cases, manage assigned cases, create tasks, upload documents
- ❌ **Cannot**: Delete cases, approve, access admin panel

### **Landing Page:** `/cases`

---

## 2️⃣ DOCUMENT CLERK

### **Menu Access:**
- **Case Management**
  - Documents (full access)
  - Tasks
  - Calendar (view only)

- **Communications**
  - File Requests (full access)

- **Case Workflow** (limited)
  - Cases (view only)
  - Notifications

### **Permissions:**
- ✅ **Can**: Upload/manage documents, handle file requests, create tasks
- ❌ **Cannot**: Modify cases, access calendar editing, admin functions

### **Landing Page:** `/documents` or `/file-requests`

### **Use Case:**
Document Clerks focus on document management and file handling. They can view cases for context but cannot modify them.

---

## 3️⃣ LEGAL CLERK

### **Menu Access:**
- **Case Workflow**
  - Cases (create, update)
  - Directions (update only)
  - Notifications

- **Case Management**
  - Calendar (create, update)
  - Tasks (full access)
  - Documents (full access)

- **Communications**
  - Correspondence (full access)

### **Permissions:**
- ✅ **Can**: Support case processing, update directions, manage correspondence
- ❌ **Cannot**: Delete cases, approve, admin functions

### **Landing Page:** `/cases`

### **Use Case:**
Legal Clerks assist with case processing, prepare correspondence, and support legal work.

---

## 4️⃣ MANAGER

### **Menu Access:**
- **Case Workflow** (full access)
  - Register Case
  - My Cases
  - All Cases
  - Directions & Hearings
  - Compliance
  - Notifications
  - Allocations

- **Case Management** (full access)
  - Calendar
  - Tasks
  - Documents
  - Land Parcels

- **Communications** (full access)
  - Correspondence
  - Communications
  - File Requests

- **Legal**
  - Lawyers
  - Filings

- **Finance**
  - Litigation Costs

- **Reports**
  - All reports with export

### **Permissions:**
- ✅ **Can**: Everything EXCEPT admin functions (user management, groups, system config)
- ✅ **Can**: Approve, delete, export
- ❌ **Cannot**: Manage users, configure groups, system settings

### **Landing Page:** `/cases` or `/dashboard` (if dashboard permission added)

### **Use Case:**
Managers oversee department operations, approve actions, view reports, but don't manage system users/permissions.

---

## 5️⃣ SUPER ADMIN

### **Menu Access:**
- **Everything** ✅

- **Case Workflow** (full)
- **Case Management** (full)
- **Communications** (full)
- **Legal** (full)
- **Finance** (full)
- **Reports** (full)
- **Administration** ⭐
  - Admin Panel
  - Master Files
  - Internal Officers
  - User Management
  - Groups
  - Modules

### **Permissions:**
- ✅ **Can**: EVERYTHING including system administration
- ✅ **Can**: Create users, manage groups, configure permissions
- ✅ **Can**: All CRUD operations on all modules

### **Landing Page:** `/cases` or `/admin`

### **Use Case:**
Full system control for IT administrators and system managers.

---

## 6️⃣ VIEWER

### **Menu Access:**
- **Case Workflow** (read only)
  - Cases (view only)
  - Notifications

- **Case Management** (read only)
  - Calendar (view only)
  - Documents (view only)

### **Permissions:**
- ✅ **Can**: View cases, documents, calendar
- ❌ **Cannot**: Create, update, delete, print, export ANYTHING

### **Landing Page:** `/cases` (view only)

### **Use Case:**
Auditors, observers, or stakeholders who need to monitor but not interact.

---

## 🔧 How to Configure

### **Step 1: Run the SQL Script**

In Supabase SQL Editor:

```sql
-- Run this entire file:
\i CONFIGURE_ALL_USER_ROLES.sql
```

Or copy and paste the contents of `CONFIGURE_ALL_USER_ROLES.sql`

### **Step 2: Verify Configuration**

```sql
-- See permissions summary
SELECT
    g.group_name,
    COUNT(gmp.id) as total_modules,
    COUNT(CASE WHEN gmp.can_read THEN 1 END) as can_read,
    COUNT(CASE WHEN gmp.can_create THEN 1 END) as can_create
FROM public.groups g
LEFT JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
GROUP BY g.group_name
ORDER BY g.group_name;
```

### **Step 3: Assign Users to Groups**

Use the UI:
1. **Administration → User Management**
2. Find the user
3. Click **"Manage Groups"**
4. Click **"Set as [Role] ONLY"**

Or use SQL:
```sql
SELECT * FROM fix_user_group_assignment('user@example.com', 'Document Clerk');
```

---

## 📋 Configuration Checklist

After running the SQL script:

- [ ] Run `CONFIGURE_ALL_USER_ROLES.sql` in Supabase
- [ ] Verify permissions with summary query
- [ ] Assign users to appropriate groups
- [ ] Test each role by logging in
- [ ] Verify correct menus show for each role
- [ ] Confirm no unauthorized access

---

## 🧪 Testing Each Role

### **Test Document Clerk:**
1. Log in as Document Clerk user
2. Should see: Documents, File Requests, Tasks, Calendar (limited)
3. Should NOT see: Case registration, Admin panel

### **Test Legal Clerk:**
1. Log in as Legal Clerk user
2. Should see: Cases, Documents, Tasks, Calendar, Correspondence
3. Should NOT see: Allocations, Admin panel, Reports

### **Test Manager:**
1. Log in as Manager user
2. Should see: Most menus (Cases, Reports, Finance, Legal)
3. Should NOT see: Administration panel, User Management

### **Test Super Admin:**
1. Log in as Super Admin user
2. Should see: EVERYTHING including Administration
3. Can access all pages

### **Test Viewer:**
1. Log in as Viewer user
2. Should see: Cases, Documents, Calendar (all read-only)
3. Cannot create/edit/delete anything

---

## 🎯 Expected Menu Structure by Role

### **Case Officer Menu:**
```
Case Workflow
├── Register Case
├── My Cases
├── All Cases
├── Directions & Hearings
├── Compliance
└── Notifications

Case Management
├── Calendar
├── Tasks
├── Documents
└── Land Parcels

Communications
├── Correspondence
├── Communications
└── File Requests
```

### **Document Clerk Menu:**
```
Case Workflow (limited)
├── Cases (view only)
└── Notifications

Case Management
├── Documents
├── Tasks
└── Calendar (view only)

Communications
└── File Requests
```

### **Manager Menu:**
```
(Everything EXCEPT Administration)

Case Workflow
Case Management
Communications
Legal
Finance
Reports
```

### **Super Admin Menu:**
```
(EVERYTHING)

Case Workflow
Case Management
Communications
Legal
Finance
Reports
Administration ⭐
├── Admin Panel
├── User Management
├── Groups
└── Modules
```

---

## 🔄 Modifying Permissions

### **To Add a Module to a Role:**

```sql
INSERT INTO group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
VALUES (
    (SELECT id FROM groups WHERE group_name = 'Document Clerk'),
    (SELECT id FROM modules WHERE module_key = 'reports'),
    true, false, false, false, true, false, false
);
```

### **To Remove a Module from a Role:**

```sql
DELETE FROM group_module_permissions
WHERE group_id = (SELECT id FROM groups WHERE group_name = 'Document Clerk')
  AND module_id = (SELECT id FROM modules WHERE module_key = 'reports');
```

### **Or Use the UI:**
1. **Administration → Groups**
2. Find the group
3. Click **"Manage Permissions"**
4. Check/uncheck modules
5. Save

---

## 📊 Permission Levels Explained

| Permission | What It Means |
|------------|---------------|
| **Read** | Can view the module/page |
| **Create** | Can add new records |
| **Update** | Can edit existing records |
| **Delete** | Can remove records |
| **Print** | Can print/download records |
| **Approve** | Can approve actions (managers) |
| **Export** | Can export data to Excel/PDF |

---

## ✅ Success Criteria

After configuration, each user should:

- ✅ See ONLY menus they have permission for
- ✅ Land on an appropriate default page
- ✅ NOT see Dashboard Overview (unless admin)
- ✅ NOT see Administration menus (unless Super Admin)
- ✅ Have appropriate create/edit/delete capabilities
- ✅ Get clear "Access Denied" if trying unauthorized pages

---

## 🆘 Troubleshooting

### **User sees wrong menus:**
- Check which groups user is assigned to
- Run: `SELECT * FROM verify_all_user_assignments();`
- Use "Manage Groups" UI to fix

### **User has no menus (empty sidebar):**
- User not assigned to any group
- Assign them using UI or SQL

### **User can't access a page they should:**
- Check group permissions in database
- Verify module key is correct
- Re-run configuration script

---

**Run `CONFIGURE_ALL_USER_ROLES.sql` now to set up all roles!** 🚀

# 🔐 RBAC (Role-Based Access Control) Setup Instructions

## Overview

This document provides step-by-step instructions for implementing and using the Group-Based Access Control System in the DLPP Legal Case Management System.

---

## 📋 Table of Contents

1. [Database Setup](#1-database-setup)
2. [How the System Works](#2-how-the-system-works)
3. [Creating Groups](#3-creating-groups)
4. [Assigning Module Permissions](#4-assigning-module-permissions)
5. [Assigning Users to Groups](#5-assigning-users-to-groups)
6. [Permission Enforcement](#6-permission-enforcement)
7. [Audit Logging](#7-audit-logging)
8. [Best Practices](#8-best-practices)

---

## 1. Database Setup

### Step 1.1: Run the RBAC Schema

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `database-rbac-schema.sql`
5. Paste and **Run** the script

This will create:
- ✅ `groups` table
- ✅ `modules` table
- ✅ `group_module_permissions` table
- ✅ `user_groups` table
- ✅ `audit_logs` table
- ✅ Default groups (Super Admin, Case Officer, Auditor, etc.)
- ✅ Default modules (Dashboard, Cases, Reports, etc.)
- ✅ Helper functions for permission checking
- ✅ Row Level Security policies

### Step 1.2: Verify Installation

Run this query to verify:

```sql
SELECT
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM modules) as modules_count,
    (SELECT COUNT(*) FROM group_module_permissions) as permissions_count;
```

You should see:
- **8 groups** created
- **23 modules** created
- **Permissions** for Super Admin

---

## 2. How the System Works

### Architecture

```
User → User_Groups → Group → Group_Module_Permissions → Module
```

**Flow:**
1. Users are assigned to one or more **Groups**
2. Groups have **Permissions** for specific **Modules**
3. Each Permission has **7 actions**: Create, Read, Update, Delete, Print, Approve, Export
4. System checks permissions before allowing actions

### Permission Levels

| Permission | Description | Example |
|------------|-------------|---------|
| **Create** | Add new records | Register new case |
| **Read** | View records | View case details |
| **Update** | Modify existing records | Update case status |
| **Delete** | Remove records | Delete a case |
| **Print** | Generate printable reports | Print case summary |
| **Approve** | Approve/authorize actions | Approve case closure |
| **Export** | Export data (Excel/PDF) | Export cases to Excel |

---

## 3. Creating Groups

### Via Admin UI

1. **Navigate** to **Administration** → **Group Management**
2. Click **"New Group"** button
3. Fill in:
   - **Group Name** (e.g., "Case Officer")
   - **Description** (e.g., "Manages and processes legal cases")
4. Click **"Create Group"**

### Via SQL

```sql
INSERT INTO groups (group_name, description) VALUES
    ('Case Officer', 'Manages and processes legal cases');
```

### Default Groups Created

- **Super Admin** - Full system access
- **Department Admin** - Admin within department
- **Case Officer** - Manage legal cases
- **Legal Officer** - Handle litigation
- **Data Entry Clerk** - Basic data entry
- **Auditor** - Read-only audit access
- **Manager** - Managerial oversight
- **Reception** - Case registration

---

## 4. Assigning Module Permissions

### Via Admin UI (Recommended)

1. **Navigate** to **Administration** → **Group Management**
2. **Select** a group from the left panel
3. The **Permission Matrix** will appear
4. **Toggle switches** for each module and permission:
   - ✅ Check = Permission granted
   - ⬜ Unchecked = Permission denied
5. Use the **"All"** column to quickly enable/disable all permissions for a module
6. Click **"Save Permissions"** when done

### Permission Matrix Example

For **Case Officer** group:

| Module | Create | Read | Update | Delete | Print |
|--------|--------|------|--------|--------|-------|
| Dashboard | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| Case Management | ✅ | ✅ | ✅ | ⬜ | ✅ |
| Reports | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| Documents | ✅ | ✅ | ✅ | ⬜ | ✅ |
| Admin | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

### Via SQL

```sql
-- Grant Case Officer read access to Dashboard
INSERT INTO group_module_permissions (group_id, module_id, can_read)
VALUES (
    (SELECT id FROM groups WHERE group_name = 'Case Officer'),
    (SELECT id FROM modules WHERE module_key = 'dashboard'),
    TRUE
);
```

---

## 5. Assigning Users to Groups

### Via Admin UI

1. **Navigate** to **Administration** → **User Management**
2. **Click** on a user to edit
3. In the **"Groups"** section:
   - Select one or more groups from dropdown
   - Click **"Assign to Group"**
4. **Save** the changes

### Via SQL

```sql
-- Assign user to "Case Officer" group
INSERT INTO user_groups (user_id, group_id)
VALUES (
    '< USER_UUID>',
    (SELECT id FROM groups WHERE group_name = 'Case Officer')
);
```

### Multiple Groups

A user can belong to **multiple groups**. Permissions are **additive**:
- If Group A allows "Read" and Group B allows "Update"
- User in both groups has "Read" AND "Update"

---

## 6. Permission Enforcement

### Frontend (UI Level)

The system automatically:
- **Hides buttons** user doesn't have permission for
- **Disables forms** if user can't update
- **Hides menu items** user can't access

Example:
```typescript
import { hasPermission } from '@/lib/permissions';

// Check if user can create cases
const canCreate = await hasPermission('case_management', 'create');

if (canCreate) {
  // Show "Create New Case" button
}
```

### Backend (API Level)

All API routes should check permissions:

```typescript
// Example API route
import { hasPermission } from '@/lib/permissions';

export async function POST(request: Request) {
  // Check permission before processing
  const canCreate = await hasPermission('case_management', 'create');

  if (!canCreate) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Process request
}
```

### Database Level (RLS)

Row Level Security policies are automatically enforced:
- Users can only see data they have permission for
- Prevents unauthorized access even if frontend is bypassed

---

## 7. Audit Logging

All user actions are automatically logged to the `audit_logs` table.

### What Gets Logged

- **Who**: User ID
- **What**: Action (create/read/update/delete/print/export/approve)
- **Where**: Module
- **When**: Logged timestamp (logged_at)
- **Record**: Specific record affected
- **How**: IP address and user agent

### View Audit Logs

```sql
-- View recent audit logs
SELECT
    u.email,
    m.module_name,
    al.action,
    al.logged_at
FROM audit_logs al
JOIN auth.users u ON al.user_id = u.id
LEFT JOIN modules m ON al.module_id = m.id
ORDER BY al.logged_at DESC
LIMIT 100;
```

### Audit by User

```sql
-- View all actions by a specific user
SELECT * FROM audit_logs
WHERE user_id = '<USER_UUID>'
ORDER BY logged_at DESC;
```

---

## 8. Best Practices

### ✅ DO

1. **Create groups based on job roles**, not individual people
2. **Assign users to groups**, never create user-specific permissions
3. **Grant minimum required permissions** (Principle of Least Privilege)
4. **Review permissions regularly** (quarterly audit)
5. **Use descriptive group names** (e.g., "Case Officer" not "Group 1")
6. **Document permission changes** in group description
7. **Test permissions** before deploying to production
8. **Enable all 7 permissions for Super Admin only**

### ❌ DON'T

1. **Don't give everyone Super Admin** access
2. **Don't create duplicate groups** for same role
3. **Don't assign permissions directly to users**
4. **Don't grant Delete permission** unless absolutely necessary
5. **Don't bypass permission checks** in code
6. **Don't forget to save** after changing permissions
7. **Don't disable audit logging**

### Security Tips

1. **Segregation of Duties**:
   - Case Entry ≠ Case Approval
   - Financial Records ≠ Financial Approval

2. **Read-Only Auditors**:
   - Grant ONLY "Read" permission
   - No Create/Update/Delete

3. **Regular Reviews**:
   - Monthly: Review user-group assignments
   - Quarterly: Review group permissions
   - Yearly: Full access audit

---

## 9. Common Scenarios

### Scenario 1: New Employee (Case Officer)

1. Create user in **User Management**
2. Assign to **"Case Officer"** group
3. User automatically gets all Case Officer permissions

### Scenario 2: Promotion to Manager

1. Go to **User Management**
2. Find the user
3. Add **"Manager"** group (keep existing groups)
4. User now has combined permissions

### Scenario 3: Create Custom Group

1. Go to **Group Management**
2. Create new group: "Finance Officer"
3. Configure permissions:
   - Litigation Costs: ✅ All
   - Reports: ✅ Read, Print, Export
   - Cases: ✅ Read
   - Other modules: ⬜ (no access)
4. Assign users to group

### Scenario 4: Temporary Access

1. Assign user to group (e.g., "Data Entry Clerk")
2. When access no longer needed, remove from group
3. Audit logs preserve history

---

## 10. Troubleshooting

### User Can't See Menu Items

**Problem**: User logged in but menus are missing

**Solution**:
1. Check if user is assigned to any group
2. Check if group has `can_read` permission for that module
3. Clear browser cache and reload

### Permission Changes Don't Apply

**Problem**: Updated permissions but user still can't access

**Solution**:
1. Verify permissions were **saved** (click Save button)
2. User must **log out and log back in**
3. Check browser console for errors

### "Permission Denied" Error

**Problem**: User gets 403 error

**Solution**:
1. Check user's group assignments
2. Verify group has required permission
3. Check audit logs for details

---

## 11. Database Queries Reference

### Get User's Permissions

```sql
SELECT * FROM get_user_permissions('<USER_UUID>');
```

### Check Specific Permission

```sql
SELECT user_has_permission(
    '<USER_UUID>',
    'case_management',
    'create'
);
```

### List All Groups and Member Count

```sql
SELECT
    g.group_name,
    COUNT(ug.user_id) as member_count
FROM groups g
LEFT JOIN user_groups ug ON g.id = ug.group_id
GROUP BY g.id, g.group_name
ORDER BY g.group_name;
```

### Find Users Without Groups

```sql
SELECT u.email
FROM auth.users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
WHERE ug.id IS NULL;
```

---

## 12. Support

For technical assistance:
- **Email**: support@same.new
- **Documentation**: /docs/rbac
- **Audit Logs**: Check `audit_logs` table for debugging

---

**Last Updated**: February 2026
**System Version**: 2.0 (RBAC)

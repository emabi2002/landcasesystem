# User & Group Management Guide

## Overview

The Legal Case Management System uses a **Group-Based Access Control (GBAC)** system where:
- **Every user MUST be assigned to at least one group**
- **Groups determine what modules users can access**
- **Module permissions are granular** (Create, Read, Update, Delete, Print, Approve, Export)

This ensures that access control is centralized, auditable, and follows the principle of least privilege.

---

## Creating Users with Mandatory Group Assignment

### Access the User Management Page
1. Login as an Administrator
2. Navigate to **Administration → User Management**
3. Click the **"Create User"** button in the top-right corner

### Fill Out the User Creation Form

#### Required Fields

**Full Name** *
- Enter the user's complete name
- Example: "John Doe", "Sarah Williams"

**Email Address** *
- Must be a valid email format
- This will be their login username
- Example: "john.doe@dlpp.gov.pg"

**Password** *
- Minimum 8 characters
- Will be used for first login
- User can change it later

**Confirm Password** *
- Must match the password field exactly

**Group Assignment** * (MANDATORY)
- **This field is required** - users cannot be created without a group
- Select from available groups:
  - Super Admin
  - Manager
  - Case Officer
  - Legal Clerk
  - Document Clerk
  - Viewer
  - (Custom groups created by admins)

#### Optional Fields

**Department**
- User's organizational department
- Example: "Legal Services", "Land Registry", "Case Management"

---

## Group Permissions Preview

When you select a group, the system shows a **real-time permissions preview**:

### What You'll See

```
Group Permissions Preview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Case Management +C +U +D]
[Documents +C +U]
[Tasks +C +U +D]
[Calendar]
[Reports]

C = Create, U = Update, D = Delete
```

### Permission Badges Explained

| Badge | Meaning |
|-------|---------|
| `Module Name` | User can READ/VIEW this module |
| `+C` | User can CREATE new records |
| `+U` | User can UPDATE existing records |
| `+D` | User can DELETE records |

**Example Interpretation:**
- `[Documents +C +U]` = User can view, create, and update documents (but not delete)
- `[Calendar]` = User can only view the calendar (no modifications)

---

## Group Assignment Workflow

### During User Creation
1. Select a group from the dropdown
2. Preview appears showing what access this user will have
3. Click **"Create User"**
4. System:
   - Creates the authentication account
   - Automatically assigns user to the selected group
   - User inherits all group permissions immediately

### After User Creation
Administrators can:
- **Assign additional groups** using the "Assign Group" button
- **Remove users from groups** by clicking the X on group badges
- Users can belong to multiple groups (permissions are cumulative)

---

## Understanding Groups

### Default Groups

| Group | Typical Access | Use Case |
|-------|---------------|----------|
| **Super Admin** | Full system access | System administrators, IT staff |
| **Manager** | View all, limited create/update | Department heads, supervisors |
| **Case Officer** | Full case management | Legal officers handling cases |
| **Legal Clerk** | Documents, tasks, limited cases | Support staff, document processors |
| **Document Clerk** | Document management only | Filing clerks, document specialists |
| **Viewer** | Read-only access | External observers, auditors |

### Custom Groups

Administrators can create custom groups with specific module access:

1. Go to **Administration → Groups**
2. Click **"New Group"**
3. Enter group name and description
4. Select the group to configure permissions
5. Toggle permissions for each module
6. Save permissions

---

## Module Access Control

### Available Modules

The system has multiple modules, each with granular permissions:

**Case Workflow**
- Register Case
- Assignment Inbox
- My Cases
- All Cases
- Directions & Hearings
- Compliance

**Case Management**
- Calendar
- Tasks
- Documents
- Land Parcels

**Communications**
- Correspondence
- Notifications
- File Requests

**Legal**
- Lawyers Management
- Court Filings

**Finance**
- Litigation Costs
- Budget Tracking

**Reports**
- Case Reports
- Statistical Reports
- Export Data

**Administration**
- User Management
- Groups Management
- Master Files
- Internal Officers

### Permission Types Per Module

| Permission | What It Allows |
|------------|----------------|
| **Read** | View records, search, filter |
| **Create** | Add new records, register cases |
| **Update** | Edit existing records, update status |
| **Delete** | Remove records (usually restricted) |
| **Print** | Generate PDFs, print documents |
| **Approve** | Approve submissions, sign off |
| **Export** | Download data, export to Excel/CSV |

---

## Best Practices

### ✅ DO

- **Always assign users to the most restrictive group** that allows them to do their job
- **Review group permissions regularly** to ensure they match organizational needs
- **Use descriptive group names** that clearly indicate their purpose
- **Document custom groups** with clear descriptions
- **Assign users to multiple groups** only when necessary

### ❌ DON'T

- **Don't create users without groups** (system prevents this)
- **Don't give everyone Super Admin access**
- **Don't create too many custom groups** (causes management overhead)
- **Don't assign conflicting permissions** across multiple groups

---

## Security Features

### Mandatory Group Assignment
- **Users cannot be created without a group**
- The "Create User" button is disabled until a group is selected
- API validation ensures group exists before creating the user

### Automatic Cleanup
- If group assignment fails, the user account is deleted automatically
- Prevents orphaned accounts with no permissions

### Audit Trail
- System tracks who assigned users to groups
- Timestamps for all assignments
- Can view user's group history

---

## Troubleshooting

### "User not allowed" Error
**Cause:** Admin API requires service role key
**Solution:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### User Can't See Any Modules
**Cause:** No groups assigned or group has no permissions
**Solution:**
1. Check user's groups on User Management page
2. Verify group has permissions on Groups page
3. Assign user to appropriate group

### Permission Changes Not Taking Effect
**Cause:** Permissions cached in session
**Solution:** User needs to log out and log back in

### Can't Create User
**Cause:** Missing required fields or invalid group
**Solution:**
1. Ensure all required fields are filled
2. Verify group is selected
3. Check password meets minimum length

---

## Example Scenarios

### Scenario 1: New Legal Clerk
**Requirements:** Handle documents, view cases, create tasks
**Solution:**
1. Create user: "Jane Smith" (jane.smith@dlpp.gov.pg)
2. Assign to group: "Legal Clerk"
3. Permissions preview shows:
   - Documents: +C +U
   - Cases: Read only
   - Tasks: +C +U +D

### Scenario 2: External Auditor
**Requirements:** View cases and reports only
**Solution:**
1. Create custom group: "External Auditor"
2. Set permissions:
   - Cases: Read only
   - Reports: Read + Export
   - All other modules: No access
3. Create user and assign to "External Auditor" group

### Scenario 3: Promoted Staff Member
**Requirements:** Was clerk, now manages a team
**Solution:**
1. Keep existing "Legal Clerk" group (maintains document access)
2. Add "Manager" group using "Assign Group" button
3. User now has combined permissions from both groups

---

## Technical Implementation

### Database Schema

```sql
-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  group_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User-Group assignments
CREATE TABLE user_groups (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  group_id UUID REFERENCES groups(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- Group permissions per module
CREATE TABLE group_module_permissions (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  module_id UUID REFERENCES modules(id),
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_print BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false
);
```

### API Flow

1. **User Creation Request**
   ```json
   POST /api/admin/users/create
   {
     "email": "user@example.com",
     "password": "password123",
     "full_name": "John Doe",
     "group_id": "uuid-of-group",
     "department": "Legal Services"
   }
   ```

2. **Server Validates**
   - All required fields present
   - Group exists in database
   - Password meets requirements

3. **Server Creates User**
   - Creates auth.users record
   - Assigns to group in user_groups table
   - Returns success with group name

4. **Client Updates**
   - Closes dialog
   - Refreshes user list
   - Shows success toast

---

## Quick Reference

### User Creation Checklist
- [ ] Navigate to Administration → User Management
- [ ] Click "Create User" button
- [ ] Enter full name
- [ ] Enter email address
- [ ] Enter password (min 8 characters)
- [ ] Confirm password
- [ ] **Select a group (REQUIRED)**
- [ ] Review permissions preview
- [ ] (Optional) Enter department
- [ ] Click "Create User"

### Group Management Checklist
- [ ] Navigate to Administration → Groups
- [ ] Create or select a group
- [ ] Configure module permissions
- [ ] Save permissions
- [ ] Assign users to the group

---

**Last Updated:** Version 34
**Feature Status:** ✅ Complete and Production Ready

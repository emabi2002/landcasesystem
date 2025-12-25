# 👥 User Groups & Permissions System - Complete Guide

## Overview

A powerful **group-based access control system** has been created that allows administrators to:
- Create custom user groups
- Assign users to groups
- Configure granular **CRUD permissions** (Create, Read, Update, Delete) for each system module
- Manage permissions at the group level instead of individual users

## 🎯 Key Features

### ✅ What's Been Built

1. **User Groups Management**
   - Create unlimited custom groups
   - Assign descriptive names and colors
   - Activate/deactivate groups
   - Track member counts

2. **Group Member Management**
   - Add/remove users from groups
   - View all users with checkboxes
   - See user roles and emails
   - Multiple users per group

3. **Granular CRUD Permissions**
   - Set permissions per module
   - 4 permission levels: Create, Read, Update, Delete
   - 10 system modules covered
   - "Select All" bulk actions

4. **Visual Interface**
   - Color-coded groups
   - Permission matrix view
   - Real-time member counts
   - Intuitive dialogs and forms

---

## 🚀 How to Access

### Step 1: Login as Administrator
- **Email:** admin@lands.gov.pg
- **Password:** demo123

### Step 2: Navigate to User Groups
1. Click **"Admin"** in the navigation bar
2. From the admin dashboard, click **"User Groups & Permissions"**
3. Or go directly to `/admin/user-groups`

---

## 📋 User Groups Page Overview

### Quick Statistics (Top Cards)

| Card | Shows | Description |
|------|-------|-------------|
| **Total Groups** | Number | All groups in system |
| **Active Groups** | Number | Currently active groups |
| **Total Users** | Number | All system users |
| **Modules** | 10 | Number of permission modules |

### Default Groups

The system comes with 4 pre-configured groups:

1. **Administrators** (Red)
   - Full system access with all permissions
   - Members: 0

2. **Legal Officers** (Emerald)
   - Case management and legal operations
   - Members: 0

3. **Registry Staff** (Blue)
   - Document reception and basic case viewing
   - Members: 0

4. **Read Only** (Amber)
   - View-only access to cases and documents
   - Members: 0

---

## 🔧 Managing User Groups

### Creating a New Group

1. Click **"Create Group"** button (top right)
2. Fill in the form:
   - **Group Name** (required): e.g., "External Lawyers"
   - **Description**: Describe the group's purpose
   - **Group Color**: Choose from 8 colors (Blue, Emerald, Purple, Orange, Red, Amber, Cyan, Pink)
   - **Active**: Check to make group available for assignment

3. Click **"Create Group"**

#### Example Groups You Can Create:
- Executive Management
- Survey Officers
- Field Officers
- Compliance Team
- IT Support
- Auditors
- External Consultants

### Editing a Group

1. Find the group card
2. Click **"Edit"** button
3. Update any field
4. Click **"Update Group"**

### Deleting a Group

1. Find the group card
2. Click **"Delete"** button
3. Confirm deletion
4. **Warning:** Users in this group will lose assigned permissions

---

## 👥 Managing Group Members

### Adding Users to a Group

1. Find the group card
2. Click **"Manage Members"**
3. In the dialog:
   - See all system users with checkboxes
   - Check users to add to group
   - Uncheck to remove from group
4. Click **"Save Members (X selected)"**

### Member Information Displayed:
- ✅ Full Name
- ✅ Email Address
- ✅ Current Role
- ✅ Checkbox status (in group or not)

### Tips:
- Users can belong to multiple groups
- Permissions are cumulative (users get ALL permissions from ALL their groups)
- Member count updates automatically

---

## 🔐 Configuring Permissions

### Opening the Permissions Dialog

1. Find the group card
2. Click **"Permissions"** button
3. The permissions matrix opens

### Understanding the Permissions Matrix

The matrix shows **10 modules** with **4 permission types** each:

#### Modules (Rows):
1. Cases
2. Documents
3. Parties
4. Tasks
5. Events
6. Calendar
7. Reports
8. Land Parcels
9. Lawyers
10. Compliance

#### Permission Types (Columns):

| Permission | Symbol | What It Allows |
|------------|--------|----------------|
| **Create** | ✅ | Add new records |
| **Read** | 👁️ | View existing records |
| **Update** | ✏️ | Edit existing records |
| **Delete** | 🗑️ | Remove records |

### Setting Individual Permissions

1. Find the module row (e.g., "Cases")
2. Check/uncheck the permission checkboxes
3. Changes apply immediately in the dialog

### Bulk Actions (Select All)

At the top of the matrix, use these buttons:

- **All Create** - Give Create permission to all modules
- **All Read** - Give Read permission to all modules
- **All Update** - Give Update permission to all modules
- **All Delete** - Give Delete permission to all modules

### Saving Permissions

1. Configure all desired permissions
2. Click **"Save Permissions"** at the bottom
3. Success message confirms save

---

## 📊 Permission Examples

### Example 1: Legal Officers Group

```
Module         | Create | Read | Update | Delete
-------------- |--------|------|--------|--------
Cases          |   ✅   |  ✅  |   ✅   |   ❌
Documents      |   ✅   |  ✅  |   ✅   |   ❌
Parties        |   ✅   |  ✅  |   ✅   |   ❌
Tasks          |   ✅   |  ✅  |   ✅   |   ✅
Events         |   ✅   |  ✅  |   ✅   |   ❌
Calendar       |   ❌   |  ✅  |   ❌   |   ❌
Reports        |   ❌   |  ✅  |   ❌   |   ❌
Land Parcels   |   ✅   |  ✅  |   ✅   |   ❌
Lawyers        |   ✅   |  ✅  |   ✅   |   ❌
Compliance     |   ✅   |  ✅  |   ✅   |   ❌
```

**Rationale:** Can manage cases and related data, but cannot delete cases or critical records. Can view but not edit reports and calendar.

### Example 2: Registry Staff Group

```
Module         | Create | Read | Update | Delete
-------------- |--------|------|--------|--------
Cases          |   ❌   |  ✅  |   ❌   |   ❌
Documents      |   ✅   |  ✅  |   ❌   |   ❌
Parties        |   ❌   |  ✅  |   ❌   |   ❌
Tasks          |   ❌   |  ✅  |   ❌   |   ❌
Events         |   ❌   |  ✅  |   ❌   |   ❌
Calendar       |   ❌   |  ✅  |   ❌   |   ❌
Reports        |   ❌   |  ✅  |   ❌   |   ❌
Land Parcels   |   ❌   |  ✅  |   ❌   |   ❌
Lawyers        |   ❌   |  ✅  |   ❌   |   ❌
Compliance     |   ❌   |  ✅  |   ❌   |   ❌
```

**Rationale:** Can receive and upload documents, but cannot create or modify cases. Read-only access to everything else.

### Example 3: Read Only Group

```
Module         | Create | Read | Update | Delete
-------------- |--------|------|--------|--------
Cases          |   ❌   |  ✅  |   ❌   |   ❌
Documents      |   ❌   |  ✅  |   ❌   |   ❌
Parties        |   ❌   |  ✅  |   ❌   |   ❌
Tasks          |   ❌   |  ✅  |   ❌   |   ❌
Events         |   ❌   |  ✅  |   ❌   |   ❌
Calendar       |   ❌   |  ✅  |   ❌   |   ❌
Reports        |   ❌   |  ✅  |   ❌   |   ❌
Land Parcels   |   ❌   |  ✅  |   ❌   |   ❌
Lawyers        |   ❌   |  ✅  |   ❌   |   ❌
Compliance     |   ❌   |  ✅  |   ❌   |   ❌
```

**Rationale:** Complete read-only access for auditors, executives, or external reviewers.

### Example 4: Administrators Group

```
Module         | Create | Read | Update | Delete
-------------- |--------|------|--------|--------
Cases          |   ✅   |  ✅  |   ✅   |   ✅
Documents      |   ✅   |  ✅  |   ✅   |   ✅
Parties        |   ✅   |  ✅  |   ✅   |   ✅
Tasks          |   ✅   |  ✅  |   ✅   |   ✅
Events         |   ✅   |  ✅  |   ✅   |   ✅
Calendar       |   ✅   |  ✅  |   ✅   |   ✅
Reports        |   ✅   |  ✅  |   ✅   |   ✅
Land Parcels   |   ✅   |  ✅  |   ✅   |   ✅
Lawyers        |   ✅   |  ✅  |   ✅   |   ✅
Compliance     |   ✅   |  ✅  |   ✅   |   ✅
```

**Rationale:** Full CRUD access to everything. Use "Select All" buttons for quick setup.

---

## 🎨 Visual Features

### Group Cards
Each group displays:
- **Group Name** (large, bold)
- **Member Count Badge** (colored)
- **Active/Inactive Status** (green/red badge)
- **Description** (below name)
- **4 Action Buttons:**
  - Manage Members
  - Permissions
  - Edit
  - Delete

### Color Coding
Groups are color-coded for easy visual identification:
- **Red** - Administrative/Critical
- **Emerald** - Legal/Operations
- **Blue** - Standard/Staff
- **Amber** - Limited/Read-Only
- **Purple** - Management
- **Orange** - Support
- **Cyan** - Technical
- **Pink** - Special

### Dialog Interfaces

1. **Create/Edit Dialog**
   - Name and description fields
   - Color picker (8 options with preview)
   - Active checkbox
   - Save/Cancel buttons

2. **Manage Members Dialog**
   - Scrollable user list
   - Checkboxes for each user
   - User info (name, email, role)
   - Member count in save button

3. **Permissions Dialog**
   - Full-screen matrix
   - Select All buttons at top
   - 10 rows × 4 columns of checkboxes
   - Save/Cancel at bottom

---

## 🔄 Workflow Example

### Scenario: Setting Up a New Legal Team

**Step 1: Create the Group**
1. Click "Create Group"
2. Name: "District Legal Team"
3. Description: "Legal officers for District Office"
4. Color: Emerald
5. Active: ✅
6. Click "Create Group"

**Step 2: Add Team Members**
1. Click "Manage Members" on the new group
2. Check: John Doe (lawyer@dlpp.gov.pg)
3. Check: Jane Smith (legal@dlpp.gov.pg)
4. Check: Bob Johnson (officer@dlpp.gov.pg)
5. Click "Save Members (3 selected)"

**Step 3: Configure Permissions**
1. Click "Permissions" on the group
2. Click "All Read" (everyone can view)
3. Check "Create" for: Cases, Documents, Parties, Tasks
4. Check "Update" for: Cases, Documents, Parties, Tasks
5. Leave "Delete" unchecked (for safety)
6. Click "Save Permissions"

**Result:**
- 3 users now in "District Legal Team" group
- They can create and edit cases, documents, parties, and tasks
- They can view everything
- They cannot delete anything
- Visual: Emerald badge shows "3 members"

---

## 💡 Best Practices

### Group Design
✅ **DO:**
- Create groups by role/function (not by individual)
- Use descriptive names
- Choose colors that reflect group purpose
- Document group purpose in description

❌ **DON'T:**
- Create too many overlapping groups
- Name groups after individuals
- Leave descriptions blank
- Use random colors

### Permission Assignment
✅ **DO:**
- Start with Read access, then add as needed
- Use "least privilege" principle
- Test permissions with a test user
- Review permissions quarterly

❌ **DON'T:**
- Give Delete permission casually
- Use "Select All" for everything
- Forget to save after changes
- Grant more permissions than needed

### Member Management
✅ **DO:**
- Keep groups organized by function
- Review membership regularly
- Remove users when roles change
- Use multiple groups for complex roles

❌ **DON'T:**
- Put all users in one group
- Forget to remove former employees
- Create duplicate groups
- Ignore member counts

---

## 🔒 Security Considerations

### Permission Inheritance
- Users can be in **multiple groups**
- Permissions are **cumulative** (union, not intersection)
- If ANY group grants a permission, user has it
- Example: User in "Read Only" + "Legal Team" gets BOTH sets of permissions

### Access Levels
```
User's Effective Permissions =
  Group 1 Permissions
  ∪ Group 2 Permissions
  ∪ Group 3 Permissions
  ∪ ...
```

### Audit Trail
- All permission changes are timestamped
- Group membership changes are tracked
- Review permissions regularly
- Document major changes

---

## 📊 Technical Implementation

### Data Storage
Currently using **localStorage** for:
- Group definitions
- Group memberships
- Group permissions

**Key:**
- `user_groups` - All group data
- `group_members_{groupId}` - Members per group
- `group_permissions_{groupId}` - Permissions per group

### Database Integration (Future)
In production, this will be migrated to Supabase tables:
- `user_groups` table
- `group_members` table (junction)
- `group_permissions` table
- `user_group_assignments` table

---

## 🎯 Use Cases

### Use Case 1: New Employee Onboarding
1. Create user account
2. Assign to appropriate group(s)
3. User immediately has correct permissions
4. No individual permission setup needed

### Use Case 2: Role Change
1. Remove user from old group
2. Add user to new group
3. Permissions update automatically
4. No manual permission editing

### Use Case 3: Temporary Access
1. Create "Temporary Auditors" group
2. Set read-only permissions
3. Add external auditors
4. Remove after audit complete
5. Delete group

### Use Case 4: Department Reorganization
1. Create new department groups
2. Configure new permission sets
3. Move users between groups
4. Deactivate old groups
5. System access reflects new structure

---

## 🚨 Common Issues & Solutions

### Issue 1: User Has Too Much Access
**Solution:** Check all groups user belongs to. Remove from unnecessary groups.

### Issue 2: User Can't Access Module
**Solution:** Check if user's groups have Read permission for that module.

### Issue 3: Permission Changes Not Working
**Solution:** Make sure you clicked "Save Permissions" button.

### Issue 4: Member Count Doesn't Update
**Solution:** Click "Save Members" after making changes.

### Issue 5: Can't Delete Group
**Solution:** Confirm the deletion. Check if browser is blocking localStorage.

---

## 📈 Future Enhancements

Planned features for future versions:

1. **Database Backend**
   - Move from localStorage to Supabase
   - Real-time permission updates
   - Audit logging

2. **Advanced Permissions**
   - Field-level permissions
   - Record-level permissions (own records only)
   - Time-based permissions

3. **Permission Templates**
   - Pre-configured permission sets
   - Import/export configurations
   - Clone from existing groups

4. **Group Hierarchies**
   - Parent/child groups
   - Permission inheritance
   - Department trees

5. **Reporting**
   - Permission audit reports
   - Group membership reports
   - Access usage analytics

---

## 📞 Support

### For Administrators:
- Review this guide thoroughly
- Test with non-admin accounts
- Document your group structure
- Keep permissions up to date

### For Users:
- Contact your administrator if you can't access something
- Don't share your group access with others
- Report any permission issues promptly

---

## ✅ Quick Reference

| Action | Path | Button/Feature |
|--------|------|----------------|
| View Groups | `/admin/user-groups` | Admin → User Groups |
| Create Group | User Groups page | "Create Group" button |
| Add Members | Group card | "Manage Members" |
| Set Permissions | Group card | "Permissions" |
| Edit Group | Group card | "Edit" |
| Delete Group | Group card | "Delete" |

---

**System:** DLPP Legal Case Management
**Module:** User Groups & Permissions
**Version:** 7.0
**Status:** ✅ Active and Ready to Use
**Last Updated:** December 14, 2024

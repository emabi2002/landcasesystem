# RBAC System Guide
## Role-Based Access Control for DLPP Legal Case Management System

**Last Updated**: December 23, 2025
**Version**: 1.0
**Status**: Ready for Database Setup

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Database Setup](#database-setup)
4. [User Guide](#user-guide)
5. [Technical Details](#technical-details)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What is RBAC?

Role-Based Access Control (RBAC) is a security model that restricts system access based on a user's role. Instead of assigning permissions directly to individual users, you create groups and assign permissions to those groups. Users then inherit all permissions from their assigned groups.

### Benefits

- ✅ **Fine-grained control**: Specify exact permissions for each module
- ✅ **Easy management**: Manage permissions at group level, not per user
- ✅ **Scalable**: Easy to add new modules or groups
- ✅ **Audit trail**: Complete log of all permission changes
- ✅ **Flexible**: Users can belong to multiple groups

### How It Works

```
1. Admin creates User Groups (e.g., "Legal Officers", "Survey Staff")
2. Admin defines System Modules (e.g., "Cases", "Documents", "Land Parcels")
3. Admin grants Permissions to Groups for each Module (View, Create, Edit, Delete)
4. Admin assigns Users to Groups
5. Users inherit all permissions from their groups
```

---

## Quick Start

### Prerequisites

- Administrator access to the system
- Supabase database access
- Basic understanding of user roles

### 5-Minute Setup

1. **Run Database Migration**
   ```sql
   -- In Supabase SQL Editor, run: database-rbac-system.sql
   ```

2. **Access RBAC Admin**
   - Login as admin
   - Go to: Admin → RBAC Management

3. **Verify Setup**
   - Check that default groups exist
   - Check that system modules are populated
   - Ready to assign users!

---

## Database Setup

### Step 1: Run Migration Script

**File**: `database-rbac-system.sql`

**What it creates**:
- 6 database tables
- RLS policies for security
- Default user groups
- Default system modules
- Helper functions

**How to run**:

1. Open Supabase dashboard
2. Go to SQL Editor
3. Click "New query"
4. Open `database-rbac-system.sql` from project
5. Copy entire contents
6. Paste into SQL Editor
7. Click "Run" or press Ctrl/Cmd + Enter
8. Verify success messages

**Expected output**:
```
✅ Created 6 tables
✅ Created 7 default groups
✅ Created 18 system modules
✅ Created indexes
✅ Enabled RLS policies
```

### Step 2: Verify Tables Created

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_groups',
  'system_modules',
  'permissions',
  'group_module_access',
  'user_group_membership',
  'rbac_audit_log'
);
```

You should see all 6 tables listed.

---

## User Guide

### Accessing RBAC Management

1. Login as administrator
2. Click "Admin" in navigation
3. Click "RBAC Management" card

### Managing User Groups

#### Create a New Group

1. Go to RBAC Management
2. Click "User Groups" tab
3. Click "Create Group" button
4. Fill in:
   - **Group Name**: Display name (e.g., "Legal Officers")
   - **Group Code**: Unique code (e.g., "LEGAL_OFF")
   - **Description**: Purpose of the group
   - **Active**: Check if group should be active
5. Click "Create Group"

#### Edit a Group

1. Find the group in the list
2. Click "Edit" button
3. Modify details
4. Click "Update Group"

#### Delete a Group

1. Find the group in the list
2. Click "Delete" button
3. Confirm deletion
4. **Warning**: This removes all permissions and memberships

### Managing Permissions

#### Set Group Permissions

1. Find the group in the list
2. Click "Permissions" button
3. You'll see all system modules
4. For each module, check the permissions:
   - **View**: Can see the module
   - **Create**: Can add new items
   - **Edit**: Can modify existing items
   - **Delete**: Can remove items
5. Changes save automatically

#### Permission Examples

**Read-Only Group**:
- Cases: ✅ View
- Documents: ✅ View
- All other permissions: ❌

**Legal Officers Group**:
- Cases: ✅ View, ✅ Create, ✅ Edit
- Documents: ✅ View, ✅ Create, ✅ Edit
- Parties: ✅ View, ✅ Create, ✅ Edit
- Delete: ❌ (only admins)

**Administrator Group**:
- All modules: ✅ View, ✅ Create, ✅ Edit, ✅ Delete

### Managing Group Members

#### Add Users to a Group

1. Find the group in the list
2. Click "Members" button
3. Check the users you want to add
4. Changes save automatically

#### Remove Users from a Group

1. Find the group in the list
2. Click "Members" button
3. Uncheck the users you want to remove
4. Changes save automatically

### Viewing System Modules

1. Go to RBAC Management
2. Click "System Modules" tab
3. View all available modules

**Note**: System modules are pre-configured. Contact a developer to add new modules.

---

## Technical Details

### Database Schema

#### user_groups
```sql
- id: UUID (primary key)
- group_name: TEXT (unique)
- group_code: TEXT (unique)
- description: TEXT
- is_active: BOOLEAN
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### system_modules
```sql
- id: UUID (primary key)
- module_name: TEXT (unique)
- module_code: TEXT (unique)
- description: TEXT
- module_url: TEXT
- icon: TEXT
- parent_module_id: UUID
- display_order: INTEGER
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### group_module_access
```sql
- id: UUID (primary key)
- group_id: UUID (foreign key)
- module_id: UUID (foreign key)
- can_view: BOOLEAN
- can_create: BOOLEAN
- can_edit: BOOLEAN
- can_delete: BOOLEAN
- can_admin: BOOLEAN
- granted_by: UUID
- granted_at: TIMESTAMP
```

#### user_group_membership
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- group_id: UUID (foreign key)
- assigned_by: UUID
- assigned_at: TIMESTAMP
- is_active: BOOLEAN
```

#### rbac_audit_log
```sql
- id: UUID (primary key)
- action: TEXT
- entity_type: TEXT
- entity_id: UUID
- changed_by: UUID
- old_value: JSONB
- new_value: JSONB
- ip_address: TEXT
- user_agent: TEXT
- created_at: TIMESTAMP
```

### API Endpoints

**Groups Management**
- `GET /api/rbac/groups` - List all groups
- `POST /api/rbac/groups` - Create new group
- `PUT /api/rbac/groups` - Update group
- `DELETE /api/rbac/groups?id=<id>` - Delete group

**Modules Management**
- `GET /api/rbac/modules` - List all modules
- `POST /api/rbac/modules` - Create new module
- `PUT /api/rbac/modules` - Update module
- `DELETE /api/rbac/modules?id=<id>` - Delete module

**Access Control**
- `GET /api/rbac/access?group_id=<id>` - Get group permissions
- `POST /api/rbac/access` - Grant permission
- `DELETE /api/rbac/access?id=<id>` - Revoke permission

**Member Management**
- `GET /api/rbac/members?group_id=<id>` - Get group members
- `GET /api/rbac/members?user_id=<id>` - Get user's groups
- `POST /api/rbac/members` - Add user to group
- `DELETE /api/rbac/members?id=<id>` - Remove user from group

### Default Groups Created

1. **Administrators** - Full system access
2. **Legal Officers** - Case management and legal operations
3. **Survey Officers** - Land parcels and survey data
4. **Registry Staff** - Document reception and viewing
5. **Executive Officers** - Executive review and oversight
6. **Compliance Officers** - Compliance tracking
7. **Read Only** - View-only access

### Default Modules Created

1. Cases
2. Parties
3. Documents
4. Tasks
5. Events
6. Calendar
7. Land Parcels
8. Lawyers
9. Communications
10. Filings
11. Directions
12. File Requests
13. Compliance
14. Executive Review
15. Litigation
16. Correspondence
17. Closure
18. Reports

---

## Troubleshooting

### Database Migration Fails

**Problem**: SQL script returns errors

**Solution**:
1. Check you're running the script in the correct Supabase project
2. Verify `profiles` table exists (run `SELECT * FROM profiles LIMIT 1`)
3. Check for typos in the SQL
4. Try running in smaller sections

### No Groups Appear

**Problem**: RBAC page shows no groups

**Solution**:
1. Verify database migration ran successfully
2. Check browser console for errors
3. Verify you're logged in as admin
4. Run: `SELECT * FROM user_groups` in SQL Editor
5. If empty, re-run the seed data section of the migration

### Permissions Not Working

**Problem**: User can't access module despite permissions

**Solution**:
1. Verify user is assigned to correct group
2. Verify group has permissions for that module
3. Check `group_module_access` table
4. Verify module is active
5. Clear browser cache and re-login

### API Errors

**Problem**: API returns 500 errors

**Solution**:
1. Check Supabase logs for specific error
2. Verify Service Role Key is set in environment
3. Check RLS policies are enabled
4. Verify foreign key relationships

### Can't Delete Group

**Problem**: Delete fails with constraint error

**Solution**:
1. Remove all users from group first
2. Remove all permissions from group first
3. Or use CASCADE delete (requires SQL)

---

## Best Practices

### Group Design

1. **Keep groups focused**: Each group should have a clear purpose
2. **Use descriptive names**: "Legal Officers" not "Group 1"
3. **Plan hierarchy**: Consider creating parent/child groups
4. **Document purposes**: Use description field extensively

### Permission Assignment

1. **Principle of least privilege**: Grant minimum permissions needed
2. **Test thoroughly**: Test each group with actual user accounts
3. **Review regularly**: Audit permissions quarterly
4. **Document changes**: Use meaningful audit log entries

### User Assignment

1. **One primary group**: Assign users to their primary role group
2. **Additional groups**: Add supplementary groups as needed
3. **Temporary access**: Create temporary groups for special projects
4. **Remove inactive**: Regularly review and remove inactive users

### Security

1. **Limit admins**: Keep admin group small
2. **Audit regularly**: Review audit logs monthly
3. **Monitor changes**: Set up alerts for permission changes
4. **Backup database**: Regular backups before major changes

---

## Support

### Getting Help

1. **Documentation**: Check this guide first
2. **Database logs**: Review Supabase logs
3. **Audit trail**: Check `rbac_audit_log` table
4. **Browser console**: Check for JavaScript errors

### Contact

- **System Admin**: Contact your IT department
- **Technical Support**: support@same.new
- **Documentation**: Check README.md and other guides

---

## Appendix

### Sample Queries

**Get all permissions for a user**:
```sql
SELECT
  g.group_name,
  m.module_name,
  a.can_view,
  a.can_create,
  a.can_edit,
  a.can_delete
FROM user_group_membership ugm
JOIN user_groups g ON g.id = ugm.group_id
JOIN group_module_access a ON a.group_id = g.id
JOIN system_modules m ON m.id = a.module_id
WHERE ugm.user_id = '<user_id>'
AND ugm.is_active = true
AND g.is_active = true;
```

**Get all members of a group**:
```sql
SELECT
  p.full_name,
  p.email,
  p.role,
  ugm.assigned_at
FROM user_group_membership ugm
JOIN profiles p ON p.id = ugm.user_id
WHERE ugm.group_id = '<group_id>'
AND ugm.is_active = true
ORDER BY p.full_name;
```

**Audit trail for a group**:
```sql
SELECT
  action,
  changed_by,
  new_value,
  created_at
FROM rbac_audit_log
WHERE entity_type = 'group'
AND entity_id = '<group_id>'
ORDER BY created_at DESC;
```

---

**End of Guide**

For questions or feedback, contact the system administrator.

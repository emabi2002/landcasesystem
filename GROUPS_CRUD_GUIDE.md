# Groups Management - Full CRUD Guide

## Overview

The Groups Management page (`/admin/groups`) now has complete CRUD (Create, Read, Update, Delete) functionality for managing user groups in the Legal Case Management System.

## Features

### ✅ Create
- Click the **"New Group"** button in the Groups panel
- A form appears with fields for:
  - Group Name (required)
  - Description (optional)
- Click **"Create Group"** to save
- The form disappears and the new group appears in the list

### ✅ Read
- All groups are displayed in the left panel
- Click on any group to view its details and permissions
- Selected groups are highlighted with emerald background

### ✅ Update (NEW!)
- Click the **Edit** button (blue pencil icon) next to any group
- The group card transforms into an inline edit form with:
  - Group Name field (pre-filled)
  - Description field (pre-filled)
  - **Save** button (green)
  - **Cancel** button (gray)
- Make your changes and click **Save** to update
- Click **Cancel** to discard changes

### ✅ Delete
- Click the **Delete** button (red trash icon) next to any group
- Confirm the deletion in the dialog
- The group and all its associated permissions are permanently removed

## UI States

### Normal State
- Groups listed with name and description
- Two action buttons visible: Edit (blue) and Delete (red)
- Clicking on group loads its permissions

### Create Mode
- Triggered by clicking **"New Group"** button
- Form appears at the top with slate background
- Cancel button shows "X Cancel" text
- Other groups remain visible and clickable

### Edit Mode
- Triggered by clicking **Edit** button on a group
- The selected group card transforms with blue background
- Shows inline form with Save/Cancel buttons
- Other groups remain in normal state
- Cannot create new group while editing

### View Permissions Mode
- Triggered by clicking on a group (not on buttons)
- Right panel shows Permission Matrix
- Can toggle module permissions
- Can save permission changes

## Visual Feedback

| State | Border Color | Background | Indicator |
|-------|-------------|------------|-----------|
| Normal | Gray | White/Hover Slate-50 | - |
| Selected (viewing permissions) | Emerald-600 | Emerald-50 | - |
| Editing | Blue-300 | Blue-50 | Edit form visible |
| Creating | Gray | Slate-50 | Form at top |

## Validation

- **Group Name**: Required field
- **Description**: Optional
- Toast notifications show success/error messages
- Prevents empty group names

## Database Operations

### Create
```typescript
INSERT INTO groups (group_name, description)
VALUES ('New Group', 'Description')
```

### Update
```typescript
UPDATE groups
SET group_name = 'Updated Name',
    description = 'Updated Description',
    updated_at = NOW()
WHERE id = 'group-id'
```

### Delete
```typescript
DELETE FROM groups WHERE id = 'group-id'
-- Cascades to group_module_permissions and user_groups
```

## Permissions Management

After creating or editing a group:
1. Click the group to select it
2. The Permission Matrix appears on the right
3. Toggle permissions for each module:
   - Create, Read, Update, Delete
   - Print, Approve, Export
   - "All" toggle enables/disables all permissions for that module
4. Click **"Save Permissions"** to persist changes

## Example Workflow

### Creating a New Group
1. Navigate to `/admin/groups`
2. Click **"New Group"** button
3. Enter: Name = "Legal Clerk", Description = "Handles document filing"
4. Click **"Create Group"**
5. ✅ Group appears in the list

### Editing a Group
1. Find the group in the list
2. Click the **Edit** (pencil) button
3. Modify the name to "Senior Legal Clerk"
4. Update description
5. Click **"Save"**
6. ✅ Changes are saved and edit mode closes

### Assigning Permissions
1. Click on the "Senior Legal Clerk" group
2. Permission Matrix loads
3. Toggle switches for desired modules:
   - Documents: Read ✓, Create ✓
   - Cases: Read ✓
   - Tasks: All ✓
4. Click **"Save Permissions"**
5. ✅ Permissions saved

### Deleting a Group
1. Click the **Delete** (trash) button
2. Confirm in the dialog
3. ✅ Group removed with all permissions

## Technical Details

### State Management
- `isCreating`: Controls new group form visibility
- `editingGroupId`: Tracks which group is being edited
- `selectedGroup`: Tracks which group's permissions are shown
- `groupForm`: Holds form data for create/update

### Components Used
- Input, Textarea, Button from shadcn/ui
- Card, CardHeader, CardContent
- Icons: Plus, Edit, Trash2, Save, X, Shield

### Toast Notifications
- Success: "Group created/updated/deleted successfully"
- Error: "Failed to create/update/delete group"
- Validation: "Group name is required"

## Keyboard Shortcuts

- **Escape**: Cancels create or edit mode (future enhancement)
- **Enter**: Submits form when in input field (future enhancement)

## Accessibility

- All buttons have descriptive icons
- Color-coded actions (blue=edit, red=delete, green=save)
- Clear visual states for different modes
- Toast notifications for screen readers

## Database Schema

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

The page uses Supabase client directly:
- `supabase.from('groups').select('*')`
- `supabase.from('groups').insert({...})`
- `supabase.from('groups').update({...})`
- `supabase.from('groups').delete()`

## Related Pages

- `/admin/users` - Assign users to groups
- `/admin/master-files` - Manage other lookup tables
- `/admin/internal-officers` - Manage action officers

## Future Enhancements

- [ ] Bulk group operations
- [ ] Import/export groups
- [ ] Group templates
- [ ] Audit trail for group changes
- [ ] Clone group functionality
- [ ] Search/filter groups

## Testing Checklist

- [x] Create new group with name and description
- [x] Create group with name only (no description)
- [x] Edit existing group name
- [x] Edit existing group description
- [x] Cancel edit without saving
- [x] Delete group with confirmation
- [x] View group permissions
- [x] Save group permissions
- [x] Validation prevents empty names
- [x] UI updates after operations
- [x] Toast notifications display correctly

---

**Last Updated**: Version 33
**Feature Status**: ✅ Complete and Production Ready

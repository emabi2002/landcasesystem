# Case Officer Menu Fix Guide

## Problem
When logged in as a Case Officer user, the system is showing the superadmin menu instead of the restricted Case Officer menu.

## Root Cause
The issue occurs when:
1. The user is assigned to multiple groups (including admin/superadmin groups)
2. The user is not properly assigned to the Case Officer group
3. The `user_groups` table has incorrect or duplicate assignments

## How the Permission System Works

```
User → user_groups → groups → group_module_permissions → modules
```

1. **User logs in** → System gets their user ID
2. **System queries `user_groups`** → Finds which groups the user belongs to
3. **System queries `group_module_permissions`** → Gets all permissions for those groups
4. **System queries `modules`** → Gets module details
5. **Sidebar filters menu items** → Shows only modules where user has `can_read = true`

## Fix Steps

### Step 1: Run the Diagnostic Script

Open your Supabase SQL Editor and run:

```sql
\i landcasesystem/FIX_CASE_OFFICER_PERMISSIONS.sql
```

Or copy the contents of `FIX_CASE_OFFICER_PERMISSIONS.sql` and paste into Supabase SQL Editor.

This will show you:
- Current user-group assignments
- Case Officer group permissions
- All groups and their members

### Step 2: Identify the Case Officer User Email

Look at the diagnostic output and note the exact email address of the Case Officer user.

Example: `caseofficer@dlpp.gov`

### Step 3: Assign User to Case Officer Group ONLY

Run this command in Supabase SQL Editor (replace with actual email):

```sql
SELECT * FROM assign_user_to_case_officer_only('caseofficer@dlpp.gov');
```

This will:
- ✅ Remove the user from ALL groups
- ✅ Assign them ONLY to the Case Officer group
- ✅ Verify the assignment

### Step 4: Verify the Fix

Check what modules the user should see:

```sql
SELECT * FROM check_user_menu_access('caseofficer@dlpp.gov');
```

You should see ONLY the modules that Case Officer has permission to read:
- dashboard
- cases
- allocation
- directions
- notifications
- etc.

You should NOT see:
- administration
- rbac_management
- user_management
- etc.

### Step 5: Test in the Application

1. Log out of the application
2. Log in as the Case Officer user
3. The sidebar should now show ONLY Case Officer menus
4. Administrative menus should be hidden

## Understanding the User Groups Table

```sql
CREATE TABLE user_groups (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),  -- Which user
    group_id UUID REFERENCES groups(id),      -- Which group
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, group_id)  -- A user can only be in a group once
);
```

### Key Points:
- A user can be in MULTIPLE groups
- Permissions are ADDITIVE (if you're in Admin + Case Officer, you get ALL permissions from both)
- The `is_active` flag can disable a group assignment without deleting it

## Common Scenarios

### Scenario 1: User in Multiple Groups
```sql
-- User is in both Superadmin and Case Officer groups
user_id: abc-123
group_id: superadmin-id
group_id: case-officer-id

-- Result: User gets ALL permissions (superadmin + case officer)
```

**Fix**: Remove from all groups except Case Officer

### Scenario 2: User Not in Any Group
```sql
-- No records in user_groups for this user
-- Result: User sees empty sidebar (no menu items)
```

**Fix**: Assign to Case Officer group

### Scenario 3: Case Officer Group Has Wrong Permissions
```sql
-- Case Officer group has admin permissions in group_module_permissions
-- Result: Case Officer sees admin menus
```

**Fix**: Reconfigure Case Officer group permissions (use Admin → Groups → Manage Permissions UI)

## Quick Commands Reference

### Check all users and their groups
```sql
SELECT
    u.email,
    STRING_AGG(g.name, ', ') as groups
FROM auth.users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
LEFT JOIN groups g ON ug.group_id = g.id
WHERE ug.is_active = true
GROUP BY u.email
ORDER BY u.email;
```

### Check specific user's groups
```sql
SELECT
    u.email,
    g.name as group_name,
    ug.is_active
FROM auth.users u
JOIN user_groups ug ON u.id = ug.user_id
JOIN groups g ON ug.group_id = g.id
WHERE u.email = 'caseofficer@dlpp.gov';
```

### Manually remove user from a group
```sql
DELETE FROM user_groups
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'caseofficer@dlpp.gov')
  AND group_id = (SELECT id FROM groups WHERE name = 'Superadmin');
```

### Manually add user to a group
```sql
INSERT INTO user_groups (user_id, group_id, assigned_by, is_active)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'caseofficer@dlpp.gov'),
    (SELECT id FROM groups WHERE name = 'Case Officer'),
    (SELECT id FROM auth.users WHERE email = 'admin@dlpp.gov'),
    true
);
```

## Testing Checklist

After fixing, verify:

- [ ] Case Officer user sees ONLY Case Officer menus
- [ ] Case Officer user CANNOT see Administration menu
- [ ] Case Officer user CANNOT see User Management
- [ ] Case Officer user CANNOT see Groups Management
- [ ] Case Officer user CAN see Dashboard
- [ ] Case Officer user CAN see Cases
- [ ] Case Officer user CAN see Allocations
- [ ] Log out and log back in to confirm changes persist

## Troubleshooting

### Issue: Changes not reflecting after running SQL
**Solution**: Clear browser cache or log out and log back in. The permissions are cached on the client side for 5 minutes.

### Issue: User still sees admin menu
**Solution**:
1. Check if user is in multiple groups
2. Run diagnostic again
3. Verify Case Officer group doesn't have admin module permissions

### Issue: User sees empty sidebar
**Solution**: User might not be in any group. Assign them to Case Officer group.

### Issue: Function returns "User not found"
**Solution**: Check the email address spelling. It's case-sensitive.

## Need Help?

If you're still experiencing issues:

1. Run the full diagnostic: `FIX_CASE_OFFICER_PERMISSIONS.sql`
2. Share the output
3. Check the browser console for any JavaScript errors
4. Verify the database function `get_user_permissions` exists:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name = 'get_user_permissions';
   ```

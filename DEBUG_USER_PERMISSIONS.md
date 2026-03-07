# 🔍 Debug User Permissions

## Quick Diagnosis

### Method 1: Browser Console (FASTEST!)

1. **Log in as the problematic user** (e.g., Case Officer)
2. **Open browser console** (Press F12, then click "Console" tab)
3. **Refresh the page**
4. **Look for these log messages**:

```
📦 Using cached permissions: {...}
🔍 Fetching permissions for user: caseofficer@dlpp.gov
✅ Permissions fetched successfully: {...}
📊 User Permissions Loaded: {...}
```

### What to Look For:

#### ✅ CORRECT (Case Officer should see ~6-8 modules):
```javascript
✅ Permissions fetched successfully: {
  user: "caseofficer@dlpp.gov",
  permissionCount: 8,
  modules: [
    { key: "dashboard", name: "Dashboard", canRead: true },
    { key: "cases", name: "Cases", canRead: true },
    { key: "allocation", name: "Allocation", canRead: true },
    { key: "directions", name: "Directions & Hearings", canRead: true },
    { key: "notifications", name: "Notifications", canRead: true },
    { key: "calendar", name: "Calendar", canRead: true },
    { key: "tasks", name: "Tasks", canRead: true },
    { key: "documents", name: "Documents", canRead: true }
  ]
}
```

#### ❌ WRONG (User should NOT see 15+ modules):
```javascript
✅ Permissions fetched successfully: {
  user: "caseofficer@dlpp.gov",
  permissionCount: 20,  // ❌ TOO MANY!
  modules: [
    { key: "dashboard", name: "Dashboard", canRead: true },
    { key: "cases", name: "Cases", canRead: true },
    { key: "admin", name: "Admin Panel", canRead: true },  // ❌ SHOULD NOT BE HERE
    { key: "users", name: "User Management", canRead: true },  // ❌ SHOULD NOT BE HERE
    { key: "groups", name: "Groups", canRead: true },  // ❌ SHOULD NOT BE HERE
    ...
  ]
}
```

**If you see ❌ WRONG**: User is assigned to multiple groups (including admin groups)

---

## Method 2: SQL Query (In Supabase)

Run this in Supabase SQL Editor:

```sql
-- Check which groups the user is in
SELECT
    u.email,
    STRING_AGG(g.group_name, ', ') as groups,
    COUNT(ug.group_id) as group_count
FROM auth.users u
JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
JOIN public.groups g ON ug.group_id = g.id
WHERE u.email = 'caseofficer@dlpp.gov'  -- Change email here
GROUP BY u.email;
```

### Expected Results:

#### ✅ CORRECT:
```
email                    | groups        | group_count
-------------------------|---------------|-------------
caseofficer@dlpp.gov     | Case Officer  | 1
```

#### ❌ WRONG:
```
email                    | groups                          | group_count
-------------------------|----------------------------------|-------------
caseofficer@dlpp.gov     | Case Officer, Superadmin        | 2
```

**If group_count > 1**: User needs to be fixed!

---

## Method 3: API Endpoint (For Admins)

As an administrator, you can check any user's permissions:

1. Log in as Administrator
2. Open browser and go to:
   ```
   https://your-app.com/api/admin/debug-permissions?email=caseofficer@dlpp.gov
   ```

This will return JSON with:
- User's groups
- User's permissions
- Module keys they can access
- Summary showing if they're in multiple groups

---

## How to Fix

### Option 1: UI Method (RECOMMENDED)

1. Log in as **Administrator**
2. Go to **Administration → User Management**
3. Find the user
4. Click **"Manage Groups"**
5. Click **"Set as [Correct Group] ONLY"**
6. Done! ✅

### Option 2: SQL Method (BACKUP)

Run the emergency fix script:

```sql
-- Run the diagnostic script first
\i EMERGENCY_FIX_ALL_USERS.sql

-- Then fix the specific user
SELECT * FROM fix_user_group_assignment('caseofficer@dlpp.gov', 'Case Officer');
```

---

## Common Issues

### Issue 1: User sees ALL menus (including admin)

**Cause**: User is in multiple groups (e.g., both "Case Officer" and "Superadmin")

**Diagnosis**:
- Console shows 15+ modules
- SQL shows group_count > 1

**Fix**: Use "Set as Case Officer ONLY" button

---

### Issue 2: User sees NO menus (empty sidebar)

**Cause**: User is not in any group

**Diagnosis**:
- Console shows permissionCount: 0
- SQL shows group_count = 0

**Fix**: Assign user to appropriate group via UI

---

### Issue 3: Changes don't take effect

**Cause**: Browser cache / User didn't re-login

**Fix**:
1. User must log out
2. Clear browser cache (Ctrl + Shift + Delete)
3. Log back in

---

### Issue 4: Permissions load error

**Cause**: Database function missing or RLS blocking

**Diagnosis**: Console shows "❌ Error fetching user permissions"

**Fix**:
1. Check if `get_user_permissions` function exists
2. Check RLS policies on user_groups table
3. Run database schema migration

---

## Prevention

### Best Practices:

1. **One group per user** (generally)
   - Don't assign users to multiple groups unless necessary
   - Use "Set as [Group] ONLY" for role changes

2. **Regular audits**
   - Check user assignments monthly
   - Look for users in multiple groups
   - Clean up inactive users

3. **Clear documentation**
   - Document which users should be in which groups
   - Keep track of special cases

---

## Verification Checklist

After fixing a user:

- [ ] User logs out
- [ ] User clears browser cache
- [ ] User logs back in
- [ ] Open browser console (F12)
- [ ] Check permission count matches expected
- [ ] Verify sidebar shows correct menus
- [ ] Verify sidebar HIDES admin menus (if not admin)
- [ ] Test accessing a few pages
- [ ] Confirm no errors in console

---

## Expected Module Counts by Role

### Case Officer (~8 modules)
- Dashboard
- Cases
- Allocation
- Directions & Hearings
- Notifications
- Calendar
- Tasks
- Documents

### Document Clerk (~6 modules)
- Dashboard
- Documents
- Tasks
- Notifications
- Calendar
- File Requests

### Litigation Officer (~12 modules)
- Dashboard
- Cases
- Litigation
- Filings
- Lawyers
- Litigation Costs
- Calendar
- Tasks
- Documents
- Directions
- Notifications
- Compliance

### Administrator (~20 modules)
- Everything including:
- Admin Panel
- User Management
- Groups
- Modules
- Master Files
- Internal Officers

---

## Quick Reference Commands

### Check all users:
```sql
SELECT u.email, STRING_AGG(g.group_name, ', ') as groups, COUNT(ug.group_id) as count
FROM auth.users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
LEFT JOIN groups g ON ug.group_id = g.id
GROUP BY u.email;
```

### Find users in multiple groups:
```sql
SELECT u.email, STRING_AGG(g.group_name, ', ') as groups
FROM auth.users u
JOIN user_groups ug ON u.id = ug.user_id
JOIN groups g ON ug.group_id = g.id
GROUP BY u.email
HAVING COUNT(*) > 1;
```

### Fix a specific user:
```sql
SELECT * FROM fix_user_group_assignment('user@example.com', 'Case Officer');
```

---

**Remember**: Permissions are ADDITIVE. If a user is in multiple groups, they get ALL permissions from ALL groups!

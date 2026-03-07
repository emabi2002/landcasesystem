# 🚨 FIX CASE OFFICER MENU - Quick Start

## The Problem
Your Case Officer user is seeing the **superadmin menu** instead of the **Case Officer menu**.

## The Solution
The user is assigned to MULTIPLE groups or the WRONG group. We need to assign them to the **Case Officer group ONLY**.

---

## ⚡ FASTEST FIX (3 Steps)

### Step 1️⃣: Get the User's Email
Find out the exact email address of the Case Officer user.
Example: `caseofficer@dlpp.gov`

### Step 2️⃣: Run the Fix in Supabase

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Open the file: **`QUICK_FIX_CASE_OFFICER.sql`**
4. **Find line 79** and **edit the email address**:
   ```sql
   SELECT * FROM fix_case_officer_user('YOUR_EMAIL_HERE@example.com');
   ```
   Change to:
   ```sql
   SELECT * FROM fix_case_officer_user('caseofficer@dlpp.gov');
   ```
5. **Find line 111** and **edit the email address** again:
   ```sql
   SELECT * FROM verify_case_officer_menu('YOUR_EMAIL_HERE@example.com');
   ```
   Change to:
   ```sql
   SELECT * FROM verify_case_officer_menu('caseofficer@dlpp.gov');
   ```
6. Click **Run** (or press Ctrl+Enter)

### Step 3️⃣: Test the Fix

1. **Log out** of the application
2. **Log back in** as the Case Officer user
3. **Verify** you see ONLY these menus:
   - ✅ Dashboard
   - ✅ Cases
   - ✅ Allocations
   - ✅ Directions
   - ✅ Calendar
   - ✅ etc.

4. **Verify** you DO NOT see:
   - ❌ Administration
   - ❌ User Management
   - ❌ Groups
   - ❌ System Settings

---

## 📊 Expected SQL Output

When you run the fix, you should see:

```
1️⃣ User Found        | SUCCESS | User ID: abc-123...
2️⃣ Current Groups    | INFO    | User is in: Superadmin, Case Officer
3️⃣ Case Officer Group| SUCCESS | Group ID: def-456...
4️⃣ Removed from Groups| SUCCESS | Removed from 2 group(s)
5️⃣ Assigned to Case Officer| SUCCESS | User now belongs ONLY to Case Officer group
6️⃣ Verification      | SUCCESS | User is now in: Case Officer
✅ COMPLETE          | SUCCESS | Please log out and log back in
```

Then the verification query should show:

```
Module Name          | Can Read | Can Create | Can Update
Dashboard            | true     | false      | false
Cases               | true     | true       | true
Allocations         | true     | true       | true
Directions          | true     | true       | true
...etc
```

---

## 🔧 If It Still Doesn't Work

### Option 1: Clear Browser Cache
1. Press **Ctrl + Shift + Delete** (Windows) or **Cmd + Shift + Delete** (Mac)
2. Clear **cookies and cached files**
3. Log out and log back in

### Option 2: Run Full Diagnostic
1. Open **`FIX_CASE_OFFICER_PERMISSIONS.sql`** in Supabase
2. Run the entire script
3. Review the diagnostic output
4. Look for the Case Officer user in the results
5. Check which groups they're assigned to

### Option 3: Manual Fix
Run these commands in Supabase SQL Editor (replace the email):

```sql
-- Remove user from ALL groups
DELETE FROM user_groups
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'caseofficer@dlpp.gov');

-- Add user to Case Officer group ONLY
INSERT INTO user_groups (user_id, group_id, assigned_by, is_active)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'caseofficer@dlpp.gov'),
    (SELECT id FROM groups WHERE name = 'Case Officer'),
    (SELECT id FROM auth.users WHERE email = 'admin@dlpp.gov'),
    true
);
```

---

## 📚 More Information

For a complete understanding of the problem and solution, read:
- **`CASE_OFFICER_MENU_FIX_GUIDE.md`** - Full troubleshooting guide

---

## ✅ Success Checklist

After running the fix, verify:

- [ ] Ran `QUICK_FIX_CASE_OFFICER.sql` successfully
- [ ] Saw "✅ COMPLETE" message in SQL output
- [ ] Logged out of the application
- [ ] Logged back in as Case Officer
- [ ] See ONLY Case Officer menus (no admin menus)
- [ ] Can access Dashboard, Cases, Allocations
- [ ] CANNOT access Administration, User Management

---

## 🆘 Still Having Issues?

1. Check the exact email address (case-sensitive)
2. Verify the Case Officer group exists in your database
3. Check if the `user_groups` table has the correct data
4. Look for JavaScript errors in browser console (F12)
5. Verify the `get_user_permissions` function exists in your database

Run this to check:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_user_permissions';
```

If it returns no results, you need to run the RBAC schema migration first.

# 🔐 Admin User Setup Guide

**Issue:** Cannot login with `admin@dlpp.gov.pg` / `Admin@2025`
**Cause:** Admin user doesn't exist in Supabase Auth yet
**Solution:** Create the admin user (2 options below)

---

## ⚡ Quick Fix - Option 1: Use Existing Credentials

The login page has default credentials pre-filled. Try these instead:

**Email:** `admin@lands.gov.pg`
**Password:** `demo123`

If these work, skip to "Update Admin Credentials" section below.

---

## 🔧 Option 2: Create Admin User in Supabase

### **Step 1: Access Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project: **yvnkyjnwvylrweyzvibs**
3. Click **Authentication** in left sidebar
4. Click **Users** tab

### **Step 2: Create Admin User Manually**

1. Click **"Add user"** button (top right)
2. Click **"Create new user"**
3. Fill in the form:
   - **Email:** `admin@dlpp.gov.pg`
   - **Password:** `Admin@2025`
   - **Auto Confirm User:** ✅ Check this box
4. Click **"Create user"**

### **Step 3: Assign to Super Admin Group**

Now we need to assign this user to the Super Admin group.

1. In Supabase, click **SQL Editor** in left sidebar
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- Get the user ID of the admin user we just created
DO $$
DECLARE
  admin_user_id UUID;
  super_admin_group_id UUID;
BEGIN
  -- Get the admin user's ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@dlpp.gov.pg';

  -- Get the Super Admin group ID (create if doesn't exist)
  SELECT id INTO super_admin_group_id
  FROM public.groups
  WHERE group_name = 'Super Admin';

  -- If Super Admin group doesn't exist, create it
  IF super_admin_group_id IS NULL THEN
    INSERT INTO public.groups (group_name, description)
    VALUES ('Super Admin', 'Full system access - all modules, all permissions')
    RETURNING id INTO super_admin_group_id;

    RAISE NOTICE 'Created Super Admin group with ID: %', super_admin_group_id;
  END IF;

  -- Assign user to Super Admin group
  INSERT INTO public.user_groups (user_id, group_id)
  VALUES (admin_user_id, super_admin_group_id)
  ON CONFLICT (user_id, group_id) DO NOTHING;

  RAISE NOTICE 'Admin user % assigned to Super Admin group', admin_user_id;
END $$;
```

4. Click **RUN** button
5. You should see success messages

### **Step 4: Grant All Permissions to Super Admin**

Still in SQL Editor, run this to ensure Super Admin has all module permissions:

```sql
-- Grant all permissions to Super Admin group
DO $$
DECLARE
  super_admin_group_id UUID;
  module_record RECORD;
BEGIN
  -- Get Super Admin group ID
  SELECT id INTO super_admin_group_id
  FROM public.groups
  WHERE group_name = 'Super Admin';

  -- For each module, grant full permissions
  FOR module_record IN
    SELECT id FROM public.modules
  LOOP
    INSERT INTO public.group_module_permissions (
      group_id,
      module_id,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_print,
      can_approve,
      can_export
    )
    VALUES (
      super_admin_group_id,
      module_record.id,
      true, -- can_create
      true, -- can_read
      true, -- can_update
      true, -- can_delete
      true, -- can_print
      true, -- can_approve
      true  -- can_export
    )
    ON CONFLICT (group_id, module_id)
    DO UPDATE SET
      can_create = true,
      can_read = true,
      can_update = true,
      can_delete = true,
      can_print = true,
      can_approve = true,
      can_export = true;
  END LOOP;

  RAISE NOTICE 'Granted all permissions to Super Admin group';
END $$;
```

### **Step 5: Test Login**

1. Go to: http://localhost:3000/login
2. Enter:
   - Email: `admin@dlpp.gov.pg`
   - Password: `Admin@2025`
3. Click **Sign In**
4. You should now be logged in! ✅

---

## 🔄 Update Admin Credentials (If Using Default)

If you used the default credentials (`admin@lands.gov.pg` / `demo123`) and want to change them:

### **Option A: Change in Supabase Dashboard**

1. Go to: Supabase → Authentication → Users
2. Find the user `admin@lands.gov.pg`
3. Click the **...** menu → **Reset password**
4. Enter new password: `Admin@2025`
5. Click **Update user**

### **Option B: Change Email Address**

If you want to change the email to `admin@dlpp.gov.pg`:

1. In Supabase → Authentication → Users
2. Find `admin@lands.gov.pg`
3. Click **Edit user**
4. Change email to: `admin@dlpp.gov.pg`
5. Click **Save**

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Can login with `admin@dlpp.gov.pg` / `Admin@2025`
- [ ] Redirected to dashboard after login
- [ ] Can see all menu items in sidebar (Dashboard, Case Workflow, Administration, etc.)
- [ ] Can access Administration → User Management
- [ ] Can access Administration → Groups
- [ ] Can access Administration → Modules

---

## 🐛 Troubleshooting

### **Issue: "Invalid login credentials"**

**Cause:** User doesn't exist or password is wrong

**Solution:**
1. Check Supabase → Authentication → Users
2. Verify user exists
3. Try resetting password
4. Make sure "Email Confirm" is checked

---

### **Issue: "Only Dashboard visible in sidebar"**

**Cause:** User not assigned to any group, or group has no permissions

**Solution:**
1. Run the SQL scripts above to assign to Super Admin group
2. Run the permissions script to grant all permissions
3. Logout and login again
4. Hard refresh: `Ctrl + Shift + R`

---

### **Issue: "Error loading permissions"**

**Cause:** `get_user_permissions` RPC function doesn't exist

**Solution:**
Run this SQL to create the RPC function:

```sql
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  module_key TEXT,
  module_name TEXT,
  can_create BOOLEAN,
  can_read BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN,
  can_print BOOLEAN,
  can_approve BOOLEAN,
  can_export BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.module_key,
    m.module_name,
    MAX(gmp.can_create::INT)::BOOLEAN AS can_create,
    MAX(gmp.can_read::INT)::BOOLEAN AS can_read,
    MAX(gmp.can_update::INT)::BOOLEAN AS can_update,
    MAX(gmp.can_delete::INT)::BOOLEAN AS can_delete,
    MAX(gmp.can_print::INT)::BOOLEAN AS can_print,
    MAX(gmp.can_approve::INT)::BOOLEAN AS can_approve,
    MAX(gmp.can_export::INT)::BOOLEAN AS can_export
  FROM public.user_groups ug
  JOIN public.groups g ON ug.group_id = g.id
  JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
  JOIN public.modules m ON gmp.module_id = m.id
  WHERE ug.user_id = p_user_id
  GROUP BY m.module_key, m.module_name
  ORDER BY m.module_name;
END;
$$;
```

---

## 📋 Quick Reference

### **Default Credentials (Pre-filled in login page):**
- Email: `admin@lands.gov.pg`
- Password: `demo123`

### **Recommended Admin Credentials:**
- Email: `admin@dlpp.gov.pg`
- Password: `Admin@2025`

### **Supabase Project:**
- URL: https://yvnkyjnwvylrweyzvibs.supabase.co
- Dashboard: https://supabase.com/dashboard

---

## 🎯 Summary

**Problem:** Cannot login with `admin@dlpp.gov.pg` / `Admin@2025`

**Quick Solution:** Try default credentials: `admin@lands.gov.pg` / `demo123`

**Proper Solution:**
1. Create user in Supabase Authentication
2. Assign to Super Admin group
3. Grant all module permissions
4. Login with new credentials

**Status:** ✅ Ready to use after setup

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

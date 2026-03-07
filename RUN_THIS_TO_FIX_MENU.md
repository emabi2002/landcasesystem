# 🚨 RUN THIS NOW - Fix Case Officer Menu

## ⚡ Quick Fix (Authorization Error Resolved)

The previous script had RLS (Row Level Security) issues. This new version uses a **SECURITY DEFINER** function that bypasses RLS safely.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** → **New Query**

### Step 2: Run the Safe Fix Script

**Copy the ENTIRE contents of:** `FIX_CASE_OFFICER_SAFE.sql`

**Or use this command block** (replace the email with your actual Case Officer email):

```sql
-- This creates the fix function with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.fix_user_group_assignment(
    p_user_email TEXT,
    p_target_group_name TEXT
)
RETURNS TABLE (step TEXT, status TEXT, message TEXT) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_target_group_id UUID;
    v_admin_id UUID;
    v_removed_count INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;
    SELECT id INTO v_target_group_id FROM groups WHERE group_name = p_target_group_name;
    
    SELECT u.id INTO v_admin_id
    FROM auth.users u
    JOIN user_groups ug ON u.id = ug.user_id
    JOIN groups g ON ug.group_id = g.id
    WHERE g.group_name IN ('Super Admin', 'Superadmin')
    LIMIT 1;
    
    WITH deleted AS (
        DELETE FROM user_groups WHERE user_id = v_user_id RETURNING group_id
    )
    SELECT COUNT(*) INTO v_removed_count FROM deleted;
    
    INSERT INTO user_groups (user_id, group_id, assigned_by, is_active)
    VALUES (v_user_id, v_target_group_id, COALESCE(v_admin_id, v_user_id), true);
    
    RETURN QUERY SELECT 'SUCCESS'::TEXT, 'FIXED'::TEXT, 
        'User assigned to ' || p_target_group_name || ' ONLY';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.fix_user_group_assignment(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_user_group_assignment(TEXT, TEXT) TO service_role;

-- NOW FIX YOUR CASE OFFICER (replace email!)
SELECT * FROM public.fix_user_group_assignment('caseofficer@dlpp.gov', 'Case Officer');
```

### Step 3: Replace the Email

**CRITICAL**: In the last line, replace `'caseofficer@dlpp.gov'` with your **ACTUAL Case Officer email address**.

### Step 4: Click Run

You should see:
```
step    | status | message
--------|--------|----------------------------------
SUCCESS | FIXED  | User assigned to Case Officer ONLY
```

### Step 5: Case Officer Must Test

**The Case Officer user MUST:**
1. ✅ Log out of the application
2. ✅ Close ALL browser tabs
3. ✅ Clear browser cache:
   - Press **Ctrl + Shift + Delete**
   - Select **"All time"**
   - Check **"Cached images and files"**
   - Check **"Cookies and other site data"**
   - Click **"Clear data"**
4. ✅ Close browser completely
5. ✅ Reopen browser
6. ✅ Log back in

---

## ✅ Expected Result

### Case Officer Should See (10-12 modules):
- ✅ Case Workflow
  - Register Case
  - My Cases
  - All Cases
  - Directions & Hearings
  - Compliance
  - Notifications
- ✅ Case Management
  - Calendar
  - Tasks
  - Documents
  - Land Parcels
- ✅ Communications
  - Correspondence
  - Communications
  - File Requests

### Case Officer Should NOT See:
- ❌ Dashboard (with statistics)
- ❌ Legal
- ❌ Finance  
- ❌ Reports
- ❌ **Administration** ⛔ (This is the key one!)

---

## 🔧 Fix Multiple Users

If you have multiple Case Officers or other users with wrong menus:

```sql
-- Fix each user (replace emails!)
SELECT * FROM public.fix_user_group_assignment('officer1@dlpp.gov', 'Case Officer');
SELECT * FROM public.fix_user_group_assignment('officer2@dlpp.gov', 'Case Officer');
SELECT * FROM public.fix_user_group_assignment('manager@dlpp.gov', 'Manager');
SELECT * FROM public.fix_user_group_assignment('clerk@dlpp.gov', 'Legal Clerk');
```

---

## 🆘 Still Having Issues?

### Error: "function does not exist"
**Solution**: Make sure you ran the CREATE FUNCTION part first (the big block)

### Error: "authorization check failed"
**Solution**: Make sure you're logged in as a Super Admin in Supabase dashboard

### Menu still wrong after fix
**Solution**: 
1. Browser cache not cleared properly - try Incognito mode
2. User didn't log out completely - close ALL tabs
3. Check function ran successfully - should say "SUCCESS | FIXED"

### Verify user's current group:
```sql
SELECT u.email, g.group_name
FROM auth.users u
JOIN user_groups ug ON u.id = ug.user_id
JOIN groups g ON ug.group_id = g.id
WHERE u.email = 'caseofficer@dlpp.gov';
```

Should show ONLY ONE row with "Case Officer".

---

## 📊 Verify All Users

After fixing, check all users are correctly assigned:

```sql
SELECT 
    u.email,
    g.group_name,
    COUNT(DISTINCT m.id) as modules
FROM auth.users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
LEFT JOIN groups g ON ug.group_id = g.id
LEFT JOIN group_module_permissions gmp ON g.id = gmp.group_id
LEFT JOIN modules m ON gmp.module_id = m.id AND gmp.can_read = true
WHERE ug.is_active = true
GROUP BY u.email, g.group_name
ORDER BY u.email;
```

**Expected output:**
- Case Officer: 10 modules
- Manager: 28 modules
- Super Admin: 32 modules
- etc.

---

## ✅ Success Checklist

- [ ] Ran CREATE FUNCTION script
- [ ] Ran fix_user_group_assignment for Case Officer
- [ ] Saw "SUCCESS | FIXED" message
- [ ] Case Officer logged out
- [ ] Browser cache cleared
- [ ] ALL tabs closed
- [ ] Browser restarted
- [ ] Case Officer logged back in
- [ ] Sees ONLY Case Officer menus
- [ ] Does NOT see Administration menu
- [ ] Can access Cases page
- [ ] Can access Calendar, Tasks, Documents

---

**RUN THE SCRIPT NOW WITH YOUR ACTUAL EMAIL!** 🚀

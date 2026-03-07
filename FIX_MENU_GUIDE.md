# 🚨 EMERGENCY FIX: Case Officer Seeing Admin Menu

## The Problem
Your Case Officer user is seeing the **Super Admin menu** (Administration, User Management, Groups, etc.). This is because they're assigned to **MULTIPLE groups**.

## The Solution
Run the `FIX_CASE_OFFICER_NOW.sql` script to remove Case Officers from ALL groups and assign them ONLY to the Case Officer group.

---

## ⚡ Quick Fix (2 Minutes)

### Step 1: Run the Fix Script

1. **Open Supabase SQL Editor**
2. **Copy ALL contents** of `FIX_CASE_OFFICER_NOW.sql`
3. **Paste** into SQL Editor
4. **Click Run**

### Step 2: Check the Output

You should see:
```
========================================
Users in Multiple Groups (PROBLEM):
========================================

email                    | groups                      | group_count
-------------------------|-----------------------------|--------------
caseofficer@dlpp.gov    | Case Officer, Super Admin   | 2

========================================
FIXING Case Officers:
========================================
 Fixed: caseofficer@dlpp.gov → Case Officer ONLY

Total users fixed: 1

========================================
VERIFICATION - Current Assignments:
========================================

email                    | group_name     | total_modules
-------------------------|----------------|---------------
caseofficer@dlpp.gov    | Case Officer   | 10
admin@dlpp.gov          | Super Admin    | 32

 FIX COMPLETE!
```

### Step 3: Test

**AS CASE OFFICER:**
1. **Log out** of the application
2. **Close ALL browser tabs**
3. **Clear browser cache** (Ctrl + Shift + Delete)
4. **Open new browser tab**
5. **Log back in**

**Expected Result:**
- ✅ See: Case Workflow, Case Management, Communications
- ❌ Should NOT see: Administration menu

---

## 📊 What This Script Does

1. **Diagnoses** - Shows which users are in multiple groups
2. **Fixes** - Removes Case Officers from ALL groups, then adds them back to ONLY Case Officer group
3. **Verifies** - Shows final assignments and module counts

---

## ✅ Success Criteria

After the fix:

### Case Officer Should See:
```
Sidebar Menu:
 Case Workflow
   ├── Register Case
   ├── My Cases
   ├── All Cases
   ├── Directions & Hearings
   ├── Compliance
   └── Notifications
 Case Management
   ├── Calendar
   ├── Tasks
   ├── Documents
   └── Land Parcels
 Communications
    ├── Correspondence
    ├── Communications
    └── File Requests

Total: ~10 modules
```

### Case Officer Should NOT See:
- ❌ Dashboard (with statistics)
- ❌ Legal (Lawyers, Filings)
- ❌ Finance (Litigation Costs)
- ❌ Reports
- ❌ Administration (MOST IMPORTANT!)

### Super Admin Should Still See:
```
Everything (32 modules) including:
 All Case Officer menus
 Administration ⭐
    ├── Admin Panel
    ├── Master Files
    ├── Internal Officers
    ├── User Management
    ├── Groups
    └── Modules
```

---

## 🔧 Fixing Other Roles

If other users (Manager, Legal Clerk, etc.) also have wrong menus, use the **User Management UI**:

1. Log in as **Super Admin**
2. Go to **Administration → User Management**
3. Find the user
4. Click **"Manage Groups"**
5. Click **"Set as [Correct Role] ONLY"**

This ensures they're ONLY in that one group.

---

## 🆘 Troubleshooting

### Issue: Script runs but menu still wrong

**Solution**:
1. Did you log out COMPLETELY?
2. Did you close ALL browser tabs?
3. Did you clear browser cache?
4. Try incognito/private mode
5. Check browser console (F12) for errors

### Issue: User shows 10 modules but still sees admin menu

**Solution**: Browser cache not cleared properly
- Press Ctrl + Shift + Delete
- Select "All time"
- Check "Cached images and files"
- Check "Cookies and other site data"
- Click "Clear data"
- Restart browser

### Issue: After fix, Case Officer has NO menus (empty sidebar)

**Solution**: Run this to reassign:
```sql
SELECT * FROM fix_user_group_assignment('caseofficer@dlpp.gov', 'Case Officer');
```

---

## 📋 Quick Reference

### Check User's Groups:
```sql
SELECT u.email, g.group_name
FROM auth.users u
JOIN user_groups ug ON u.id = ug.user_id
JOIN groups g ON ug.group_id = g.id
WHERE u.email = 'caseofficer@dlpp.gov';
```

### Expected Output:
```
email                    | group_name
-------------------------|------------
caseofficer@dlpp.gov    | Case Officer
```

If you see MORE than one row, user is in MULTIPLE groups (PROBLEM!).

---

## ✅ Final Checklist

- [ ] Ran FIX_CASE_OFFICER_NOW.sql in Supabase
- [ ] Saw "✅ FIX COMPLETE!" message
- [ ] Saw user fixed in output
- [ ] Case Officer logged out
- [ ] Browser cache cleared
- [ ] All tabs closed
- [ ] Case Officer logged back in
- [ ] Sees ONLY 10 modules
- [ ] Does NOT see Administration menu
- [ ] Can access Cases, Directions, Calendar
- [ ] Super Admin still has full access

---

**RUN THE SCRIPT NOW!** Open `FIX_CASE_OFFICER_NOW.sql` and paste it into Supabase!

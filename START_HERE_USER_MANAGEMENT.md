# 🚀 Quick Start: Fix User Permissions (UI Method)

## ⚡ FASTEST WAY to Fix Case Officer Menu Issue

### Step 1: Log in as Administrator
Use your admin account to access the system.

### Step 2: Go to User Management
```
Click: Administration (left sidebar) → User Management
```

### Step 3: Find the Case Officer User
Search or scroll to find the user (e.g., `caseofficer@dlpp.gov`)

### Step 4: Click "Manage Groups"
Click the green **"Manage Groups"** button on the user's card.

### Step 5: Set User to Case Officer ONLY
In the dialog that opens:
1. Find the **"Case Officer"** group card
2. Click the **"Set as Case Officer ONLY"** button
3. Confirm the prompt
4. Done! ✅

### Step 6: User Tests
The Case Officer user should:
1. Log out
2. Log back in
3. See ONLY Case Officer menus (no admin menus)

---

## 🎯 For ALL Users Going Forward

### To Assign a New User to a Group:

**When Creating User:**
1. Click **"Create New User"** button
2. Fill in email, password, name
3. **Select group** from dropdown
4. See permission preview
5. Click **"Create User"**

**For Existing User:**
1. Find user in list
2. Click **"Manage Groups"**
3. Check the appropriate group(s)
4. Click **"Save Changes"**

### To Change User's Role:

1. Find user in User Management
2. Click **"Manage Groups"**
3. Click **"Set as [New Role] ONLY"** button
4. Done! User's menu will update ✅

### To Give User Multiple Roles:

1. Find user in User Management
2. Click **"Manage Groups"**
3. **Check multiple groups** (e.g., both "Case Officer" and "Compliance Officer")
4. See combined permissions in preview
5. Click **"Save Changes"**

---

## 📋 Common Tasks

### Task: Create a New Litigation Officer
```
1. Administration → User Management
2. Create New User
3. Email: litigationofficer@dlpp.gov
4. Select group: "Litigation Officer"
5. Create User
```

### Task: Promote User to Administrator
```
1. Find user
2. Manage Groups
3. Check "Administrator" group
4. Save Changes
```

### Task: Remove User's Access Temporarily
```
1. Find user
2. Manage Groups
3. Uncheck all groups
4. Save Changes
```

### Task: Fix Wrong Menu Display
```
1. Find user
2. Manage Groups
3. See which groups they're in
4. Use "Set as [Correct Group] ONLY" button
5. User logs out and back in
```

---

## 🎨 What You'll See

### User List View
- Email and join date
- All groups user belongs to (as badges)
- Quick "Manage Groups" button

### Manage Groups Dialog
- **Left side**: List of all groups with checkboxes
- **Right side**: Preview of permissions user will have
- **Quick action buttons**: "Set as [Group] ONLY"
- **Visual indicators**: Green for adding, Red for removing

### Permission Preview
Shows exactly what modules user can access:
- Blue "Read" badge
- Green "Create" badge
- Amber "Update" badge
- Red "Delete" badge

---

## ✅ Success Checklist

After fixing user permissions:

- [ ] Opened User Management page
- [ ] Found the correct user
- [ ] Clicked "Manage Groups"
- [ ] Assigned to correct group(s)
- [ ] Saw permission preview
- [ ] Saved changes
- [ ] User logged out and back in
- [ ] User sees correct menu items
- [ ] User does NOT see admin menus (if not admin)

---

## 📚 Full Documentation

For complete details, see: **`UI_DRIVEN_USER_MANAGEMENT_GUIDE.md`**

For old SQL method (not recommended), see: **`CASE_OFFICER_MENU_FIX_GUIDE.md`**

---

## 🎯 Key Points to Remember

1. **Permissions are additive** - Users in multiple groups get ALL permissions
2. **Use "Set as [Group] ONLY"** for clean role assignments
3. **Preview before saving** - Check permissions match expectations
4. **Users must re-login** - Changes take effect after logout/login
5. **No SQL needed** - Everything is done through the UI now!

---

**That's it! You can now manage all users through the UI. No more SQL scripts! 🎉**

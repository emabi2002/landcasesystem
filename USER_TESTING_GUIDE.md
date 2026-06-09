# User Management Testing Guide

## 🎯 How to Test User Groups and Permissions

This guide shows you how to test that users can only see modules based on their assigned groups.

---

## 📋 Prerequisites

Before testing, make sure:
- ✅ Database migrations have been run
- ✅ Groups have been created (use Quick Setup or manual creation)
- ✅ At least one test group exists with configured permissions

---

## 🧪 Testing Workflow

### Step 1: Create a Test User

1. **Login as Admin**
   - Navigate to `/admin/users`
   - You should see the User Management page

2. **Click "Create User" Button**
   - Fill in the form:
     - **Full Name:** Test User
     - **Email:** testuser@dlpp.gov.pg
     - **Password:** Test123456
     - **Confirm Password:** Test123456
     - **Group:** Select a group (e.g., "Legal Clerk")
   - **Important:** The group field is REQUIRED

3. **Review Permission Preview**
   - After selecting a group, you'll see badges showing what access the user will have:
     ```
     [Documents +C +U]  → Can Create and Update documents
     [Tasks +C +U +D]   → Can Create, Update, Delete tasks
     [Cases]            → Can only Read cases
     ```

4. **Click "Create User"**
   - User is created and automatically assigned to the selected group

---

### Step 2: Verify User Was Created

1. **Check User List**
   - You should see the new user in the list
   - User card shows:
     - Email address
     - Join date
     - Last login (null for new users)
     - Verification status
     - **Groups:** Shows the assigned group(s)

2. **User Card Example:**
   ```
   testuser@dlpp.gov.pg
   Joined: Mar 01, 2026

   Groups:
   [Legal Clerk] ×
   ```

---

### Step 3: Assign Additional Groups (Optional)

1. **Click "Assign Group" Button** on the user card
2. **Select Another Group** from the dropdown
3. **Click "Assign to Group"**
4. **Result:** User now has permissions from BOTH groups (permissions merge)

Example:
```
Before: [Legal Clerk]
After:  [Legal Clerk] × [Document Clerk] ×
```

---

### Step 4: Test User Login

1. **Logout from Admin Account**
   - Click your profile icon → Logout

2. **Login as Test User**
   - Email: `testuser@dlpp.gov.pg`
   - Password: `Test123456`

3. **Verify Sidebar Navigation**
   - Only modules the user has permission to READ should appear
   - Example for "Legal Clerk":
     ```
     ✅ Dashboard
     ✅ Case Workflow (collapsed, limited items)
     ✅ Case Management
       ✅ Calendar
       ✅ Tasks
       ✅ Documents
     ✅ Communications
       ✅ Correspondence
       ✅ File Requests
     ❌ Finance (not visible)
     ❌ Administration (not visible)
     ```

---

### Step 5: Test Permissions

#### Test Create Permission

1. **Navigate to Documents** (`/documents`)
2. **Click "Upload Document" or "Add Document"**
3. **Expected Results:**
   - ✅ **Legal Clerk:** Button is visible and works
   - ❌ **Viewer:** Button is hidden or disabled

#### Test Update Permission

1. **Navigate to Tasks** (`/tasks`)
2. **Click Edit on a task**
3. **Expected Results:**
   - ✅ **Legal Clerk:** Can edit and save
   - ❌ **Viewer:** Edit button hidden

#### Test Delete Permission

1. **Try to delete a task**
2. **Expected Results:**
   - ✅ **Legal Clerk:** Delete button visible
   - ❌ **Document Clerk:** Delete button hidden

#### Test Module Access

1. **Try to access Administration** (`/admin`)
2. **Expected Results:**
   - ✅ **Super Admin:** Full access
   - ❌ **Legal Clerk:** Redirected or "Access Denied"

---

### Step 6: Test Permission Changes

1. **Logout from Test User**
2. **Login as Admin Again**
3. **Go to Administration → Groups**
4. **Click on "Legal Clerk" Group**
5. **Modify Permissions:**
   - Example: Toggle OFF "Can Create" for Documents
6. **Click "Save Permissions"**
7. **Logout and Login as Test User Again**
8. **Verify Changes:**
   - Upload Document button should now be hidden

---

## 🔍 Verification Checklist

### User Creation
- [ ] Can create user with mandatory group assignment
- [ ] Permission preview shows correct modules
- [ ] User appears in user list after creation
- [ ] User can login with provided credentials

### Group Assignment
- [ ] Can assign additional groups to existing users
- [ ] Can remove users from groups
- [ ] Multiple group permissions merge correctly
- [ ] Removing group updates user's access immediately (after re-login)

### Permission Enforcement
- [ ] Users only see modules they have READ access to
- [ ] Create buttons hidden when no CREATE permission
- [ ] Edit buttons hidden when no UPDATE permission
- [ ] Delete buttons hidden when no DELETE permission
- [ ] Admin pages inaccessible to non-admin users

### Group Types
- [ ] **Super Admin:** Can see everything, all buttons work
- [ ] **Manager:** Can view most modules, approve, limited create
- [ ] **Case Officer:** Full case management, can create/edit cases
- [ ] **Legal Clerk:** Can manage documents and tasks
- [ ] **Document Clerk:** Limited to documents only
- [ ] **Viewer:** Read-only access, no modification buttons

---

## 🎨 Example Test Scenarios

### Scenario 1: Document Clerk Login
**Setup:**
- User: `clerk@dlpp.gov.pg`
- Group: Document Clerk

**Expected Sidebar:**
```
✅ Dashboard
❌ Case Workflow (not visible)
✅ Case Management (limited)
  ✅ Documents
  ✅ Tasks (read-only)
❌ Communications (not visible)
❌ Legal (not visible)
❌ Finance (not visible)
❌ Reports (not visible)
❌ Administration (not visible)
```

**Expected Behavior:**
- Can upload documents
- Can view cases (read-only)
- Can view tasks (read-only)
- Cannot create cases
- Cannot access admin panel

---

### Scenario 2: Case Officer Login
**Setup:**
- User: `officer@dlpp.gov.pg`
- Group: Case Officer

**Expected Sidebar:**
```
✅ Dashboard
✅ Case Workflow
  ✅ Register Case
  ✅ Assignment Inbox
  ✅ My Cases
  ✅ All Cases
  ✅ Directions & Hearings
  ✅ Compliance
✅ Case Management
  ✅ Calendar
  ✅ Tasks
  ✅ Documents
  ✅ Land Parcels
✅ Communications
  ✅ Correspondence
  ✅ File Requests
✅ Legal
  ✅ Lawyers
  ✅ Filings
✅ Reports
❌ Finance (not visible)
❌ Administration (not visible)
```

**Expected Behavior:**
- Can create new cases
- Can update case status
- Can upload documents and approve them
- Can create and delete tasks
- Can view reports and export data
- Cannot access Finance module
- Cannot access Administration

---

### Scenario 3: Viewer Login (External Auditor)
**Setup:**
- User: `auditor@external.com`
- Group: Viewer

**Expected Sidebar:**
```
✅ Dashboard
✅ Case Workflow (limited)
  ✅ All Cases (read-only)
✅ Documents (read-only)
✅ Calendar (read-only)
✅ Reports
  ✅ Can export reports
❌ All modification features disabled
```

**Expected Behavior:**
- Can view dashboard statistics
- Can view cases (no edit button)
- Can view documents (no upload button)
- Can generate and export reports
- Cannot create, edit, or delete anything
- Cannot access admin panel

---

## 🐛 Common Issues & Solutions

### Issue: User can't login after creation
**Solution:**
- Check email is verified (or auto-verify in user creation)
- Verify password meets minimum requirements (8+ characters)

### Issue: User sees no modules after login
**Solution:**
- Check user has at least one group assigned
- Verify group has permissions configured
- User needs to logout and login again after permission changes

### Issue: Permission changes not applying
**Solution:**
- User must logout and login again
- Permissions are checked on login, not real-time

### Issue: "User not allowed" error
**Solution:**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Restart development server

---

## 📊 Testing Matrix

| User Type | Can Create Cases | Can Edit Cases | Can Delete Cases | Can Upload Docs | Can Access Admin |
|-----------|-----------------|----------------|------------------|-----------------|------------------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Case Officer** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Legal Clerk** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Document Clerk** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Viewer** | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## ✅ Final Verification

After testing all scenarios, confirm:
- [ ] User creation works with mandatory group assignment
- [ ] Permission preview accurately shows user's access
- [ ] Users can be assigned to multiple groups
- [ ] Users can be removed from groups
- [ ] Users can be deleted
- [ ] Login works for all test users
- [ ] Sidebar only shows permitted modules
- [ ] Action buttons respect permissions (Create, Edit, Delete)
- [ ] Admin panel is restricted to Super Admin only
- [ ] Permission changes take effect after re-login

---

**Test Status:** Ready for Testing
**Version:** 41
**Last Updated:** March 1, 2026

🎉 **Your RBAC system is production-ready when all checks pass!**

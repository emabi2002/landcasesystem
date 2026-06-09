# 🧪 Testing Guide: RBAC Sidebar Navigation

**Version:** 50
**Status:** Ready for Testing

---

## 🎯 Quick Test Scenarios

### **Scenario 1: Full Access (Super Admin)**

**Steps:**
1. Login: `admin@dlpp.gov.pg` / `Admin@2025`
2. Check sidebar

**Expected:**
- ✅ All menu groups visible
- ✅ Dashboard
- ✅ Case Workflow (7 items)
- ✅ Case Management (4 items)
- ✅ Communications (3 items)
- ✅ Legal (2 items)
- ✅ Finance (1 item)
- ✅ Reports (1 item)
- ✅ Administration (6 items)

**If fails:** Check user is in "Super Admin" group

---

### **Scenario 2: Limited Access (Case Officer)**

**Steps:**
1. Create test user:
   - Go to: Administration → User Management
   - Click "Create New User"
   - Fill form:
     - Full Name: Test Officer
     - Email: testofficer@dlpp.gov.pg
     - Password: Test@2025
     - Group: Case Officer
   - Click "Create User"

2. Logout and login as test user

3. Check sidebar

**Expected:**
- ✅ Dashboard visible
- ✅ Case Workflow visible
- ✅ Case Management visible
- ❌ Administration NOT visible
- ❌ Finance NOT visible
- ❌ Reports NOT visible

**If fails:**
- Check "Case Officer" group has permissions for cases
- Check user is assigned to "Case Officer" group

---

### **Scenario 3: No Access (New User)**

**Steps:**
1. Create test user with NO groups:
   - Full Name: Test Viewer
   - Email: testviewer@dlpp.gov.pg
   - Password: Test@2025
   - Group: *(Leave blank - don't assign any group)*
   - Click "Create User"

2. Logout and login as test user

3. Check sidebar

**Expected:**
- ✅ Only Dashboard visible
- ❌ All other menu items hidden
- ❌ All menu groups hidden

**If fails:** User may have been auto-assigned to a group

---

### **Scenario 4: Multiple Groups (Merged Permissions)**

**Steps:**
1. Create test user
2. Assign to multiple groups:
   - Go to: Administration → User Management
   - Find user
   - Click "Assign Group"
   - Add "Case Officer" group
   - Click "Assign Group" again
   - Add "Document Clerk" group

3. Login as test user

4. Check sidebar

**Expected:**
- ✅ Dashboard visible
- ✅ Case Workflow visible (from Case Officer)
- ✅ Documents visible (from Document Clerk)
- ✅ Merged permissions from both groups

**If fails:** Check both groups have different module permissions

---

## 🔍 What to Verify

### **Visual Checks:**

1. **Loading State:**
   - [ ] Shows "Loading menu..." briefly
   - [ ] Logo and branding visible during load

2. **Menu Filtering:**
   - [ ] Only accessible items shown
   - [ ] Empty groups hidden
   - [ ] Dashboard always visible

3. **Group Behavior:**
   - [ ] Groups expand/collapse
   - [ ] Active items highlighted
   - [ ] Hover states work

4. **Mobile:**
   - [ ] Sidebar works on mobile
   - [ ] Overlay closes on click
   - [ ] Menu items accessible

### **Functional Checks:**

1. **Permission Loading:**
   - [ ] Permissions load on login
   - [ ] Menu updates correctly
   - [ ] No console errors

2. **Navigation:**
   - [ ] Click menu items → navigate
   - [ ] Active state updates
   - [ ] Back button works

3. **Error Handling:**
   - [ ] Network error → show dashboard only
   - [ ] No permissions → show dashboard only
   - [ ] Database error → graceful fallback

---

## 🐛 Common Issues & Solutions

### **Issue: All menus visible despite no groups**

**Cause:** User may have been auto-assigned to a default group

**Solution:**
1. Go to: Administration → User Management
2. Find user
3. Remove all group assignments
4. Logout and login again

---

### **Issue: No menus visible except Dashboard**

**Cause:** Groups don't have module permissions set

**Solution:**
1. Go to: Administration → Groups
2. Find the group
3. Click "Manage Permissions"
4. Assign modules with `can_read = true`

---

### **Issue: Loading menu... never finishes**

**Cause:** `get_user_permissions` RPC may not exist

**Solution:**
1. Check Supabase SQL Editor
2. Verify RPC exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'get_user_permissions';
   ```
3. If missing, run RBAC migration scripts

---

### **Issue: Some menus flicker on/off**

**Cause:** Permission cache being cleared

**Solution:**
- This is normal during development
- Permissions cache for 5 minutes
- Hard refresh clears cache

---

## 📊 Test Matrix

| User Type | Groups | Expected Menus |
|-----------|--------|----------------|
| Super Admin | Super Admin | All menus |
| Manager | Manager | All except some admin |
| Case Officer | Case Officer | Cases, Tasks, Docs |
| Doc Clerk | Document Clerk | Documents, Files |
| Viewer | Viewer | Read-only items |
| No Groups | *(none)* | Dashboard only |
| Multi-Group | Officer + Clerk | Merged permissions |

---

## ✅ Success Criteria

The implementation is successful if:

- ✅ Users see only modules they have `can_read` access to
- ✅ Dashboard always visible to authenticated users
- ✅ Empty groups automatically hidden
- ✅ Multiple groups merge permissions correctly
- ✅ Loading state shows briefly
- ✅ Error states fall back to dashboard
- ✅ No console errors during normal operation
- ✅ Mobile sidebar works correctly
- ✅ Active states highlight correctly
- ✅ No static role dependencies

---

## 🔄 Regression Testing

After making changes, verify:

1. **Permission Changes:**
   - [ ] Update group permissions
   - [ ] Logout and login
   - [ ] Menu updates correctly

2. **User Changes:**
   - [ ] Add user to group
   - [ ] User sees new menus
   - [ ] Remove user from group
   - [ ] User loses access

3. **Module Changes:**
   - [ ] Add new module
   - [ ] Assign to group
   - [ ] Menu item appears

---

## 📝 Test Log Template

```markdown
## Test Run: [Date]

**Tester:** [Your Name]
**Browser:** [Chrome/Firefox/Safari]
**Version:** 50

### Scenario 1: Super Admin
- [ ] All menus visible
- [ ] Navigation works
- [ ] Active states correct

### Scenario 2: Limited Access
- [ ] Only assigned menus visible
- [ ] Admin menus hidden
- [ ] Permissions correct

### Scenario 3: No Access
- [ ] Only Dashboard visible
- [ ] All other menus hidden

### Scenario 4: Multiple Groups
- [ ] Permissions merged
- [ ] All assigned menus visible

### Issues Found:
1. [Description]
2. [Description]

### Overall Result:
- [ ] PASS ✅
- [ ] FAIL ❌ (see issues)
```

---

## 🚀 Performance Checks

Monitor for:

1. **Load Time:**
   - Permission check should be < 100ms
   - Total sidebar load < 200ms

2. **Network Calls:**
   - Only 1 RPC call per login
   - Cached for 5 minutes

3. **Memory:**
   - No memory leaks
   - Permission cache cleared on logout

---

**Happy Testing!** 🎉

Report any issues to the development team.

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

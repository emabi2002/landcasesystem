# 🚀 Quick Start Guide for Administrators

**Configure everything through the web interface - No SQL required!**

---

## ⚡ 3-Minute Setup

### **Step 1: Login (30 seconds)**
```
1. Go to: http://localhost:3000/login
2. Email: admin@dlpp.gov.pg
3. Password: Admin@2025
4. Click "Sign In"
```

### **Step 2: Configure Case Officer Group (2 minutes)**
```
1. Sidebar → Administration → Groups
2. Find "Case Officer" group (or create it)
3. Click "Manage Permissions"
4. Enable these modules (check ✅ can_read):
   ✅ Cases
   ✅ Allocation
   ✅ Directions
   ✅ Compliance
   ✅ Notifications
   ✅ Calendar
   ✅ Tasks
   ✅ Documents
   ✅ Land Parcels

5. Disable these modules (uncheck all):
   ❌ Dashboard
   ❌ Admin
   ❌ Users
   ❌ Groups
   ❌ Modules

6. Click "Save Permissions"
```

### **Step 3: Create Case Officer User (30 seconds)**
```
1. Sidebar → Administration → User Management
2. Click "Create New User"
3. Fill in:
   - Full Name: John Doe
   - Email: john.doe@dlpp.gov.pg
   - Password: SecurePass123
   - Group: Case Officer ← Select this!
4. Click "Create User"
5. Done! ✅
```

---

## 🎯 What You Get

**Case Officer users will see:**
```
✅ Case Workflow
   ├── Register Case
   ├── Assignment Inbox
   ├── My Cases
   ├── All Cases
   ├── Directions & Hearings
   ├── Compliance
   └── Notifications

✅ Case Management
   ├── Calendar
   ├── Tasks
   ├── Documents
   └── Land Parcels

❌ Dashboard (hidden)
❌ Administration (hidden)
```

**Header will show:** "Case Officer" or their full name

---

## 📚 Full Documentation

**For detailed instructions, see:**
- `ADMIN_UI_PERMISSION_GUIDE.md` - Complete UI-based guide
- `CASE_OFFICER_MENU_REFERENCE.md` - Menu structure reference

**SQL Scripts (Optional - Not Required):**
- `SETUP_CASE_OFFICER_FULL_PERMISSIONS.sql` - Automated setup
- Only use if you prefer SQL over UI

---

## ✅ Quick Checklist

### **Initial Setup:**
- [ ] Login as admin
- [ ] Configure Case Officer group permissions
- [ ] Create first Case Officer user
- [ ] Test login as Case Officer
- [ ] Verify correct menu items show

### **Regular Tasks:**
- [ ] Create new users when needed
- [ ] Assign users to appropriate groups
- [ ] Update group permissions as needed
- [ ] Review user access quarterly

---

## 🆘 Need Help?

**Issue:** Case Officer sees Dashboard
**Fix:** Administration → Groups → Case Officer → Manage Permissions → Dashboard → Uncheck all

**Issue:** Case Officer can't see Cases menu
**Fix:** Administration → Groups → Case Officer → Manage Permissions → Cases → Check can_read

**Issue:** Header shows "Admin"
**Fix:** Hard refresh browser: `Ctrl + Shift + R`

---

## 🎊 That's It!

**All configuration is UI-driven. No coding needed!** 🎯

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

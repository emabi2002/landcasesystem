# 📋 Case Officer Menu - Complete Reference

**Status:** ✅ Configured
**Date:** March 7, 2026

---

## 🎯 What Case Officers See

### **Header (Top-Right)**
```
[Avatar: CO] Case Officer ▼
```
- Shows "Case Officer" or their full name
- Avatar displays initials

---

### **Sidebar Menu Structure**

```
✅ Case Workflow (7 items)
   ├── Register Case
   ├── Assignment Inbox
   ├── My Cases
   ├── All Cases
   ├── Directions & Hearings
   ├── Compliance
   └── Notifications

✅ Case Management (4 items)
   ├── Calendar
   ├── Tasks
   ├── Documents
   └── Land Parcels

❌ Dashboard (HIDDEN)
   └── Overview (not visible)

❌ Administration (HIDDEN)
   └── All admin items (not visible)
```

---

## 📊 Detailed Permissions

### **Case Workflow Modules**

| Menu Item | Module | Create | Read | Update | Delete | Print | Export |
|-----------|--------|--------|------|--------|--------|-------|--------|
| Register Case | cases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assignment Inbox | allocation | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| My Cases | cases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| All Cases | cases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Directions & Hearings | directions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Compliance | compliance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | notifications | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

### **Case Management Modules**

| Menu Item | Module | Create | Read | Update | Delete | Print | Export |
|-----------|--------|--------|------|--------|--------|-------|--------|
| Calendar | calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tasks | tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Documents | documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Land Parcels | land_parcels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### **Hidden Modules (No Access)**

| Menu Item | Module | Visible? |
|-----------|--------|----------|
| Dashboard Overview | dashboard | ❌ NO |
| Admin Panel | admin | ❌ NO |
| User Management | users | ❌ NO |
| Groups | groups | ❌ NO |
| Modules | modules | ❌ NO |
| Master Files | master_files | ❌ NO |

---

## 🔧 Setup Instructions

### **Step 1: Run SQL Script**

1. Open Supabase SQL Editor
2. Open file: `SETUP_CASE_OFFICER_FULL_PERMISSIONS.sql`
3. Copy all content
4. Paste into SQL Editor
5. Click **RUN**
6. Verify results table shows correct permissions

### **Step 2: Assign User to Case Officer Group**

**If creating new user:**
```
1. Go to: Administration → User Management
2. Click "Create New User"
3. Fill in:
   - Full Name: "John Doe"
   - Email: "john.doe@dlpp.gov.pg"
   - Password: "SecurePass123"
   - Group: Case Officer ← Important!
4. Click "Create User"
```

**If updating existing user:**
```
1. Go to: Administration → User Management
2. Find the user
3. Click "Assign Group"
4. Select: Case Officer
5. Click "Assign to Group"
```

### **Step 3: Test Login**

```
1. Logout from current session
2. Login as Case Officer user
3. Hard refresh: Ctrl + Shift + R
4. Verify sidebar shows:
   ✅ Case Workflow (7 items)
   ✅ Case Management (4 items)
   ❌ No Dashboard Overview
   ❌ No Administration
```

---

## 🎯 What Case Officers Can Do

### **✅ Register New Cases**
- Create new case records
- Fill in case details
- Upload documents
- Assign cases

### **✅ Manage Assigned Cases**
- View cases assigned to them
- Update case information
- Track case progress
- Add notes and updates

### **✅ Handle Directions & Hearings**
- Schedule hearings
- Record directions
- Track compliance with court orders
- Manage hearing documents

### **✅ Track Compliance**
- Monitor compliance deadlines
- Update compliance status
- Generate compliance reports

### **✅ Manage Tasks**
- Create tasks
- Assign tasks
- Track task completion
- Set deadlines

### **✅ Handle Documents**
- Upload documents
- Organize files
- Download and print documents
- Share documents

### **✅ View Calendar**
- See upcoming hearings
- View deadlines
- Schedule events
- Get notifications

### **✅ Manage Land Parcels**
- Add parcel information
- Update parcel details
- View parcel history

---

## ❌ What Case Officers CANNOT Do

### **Dashboard Access**
- ❌ Cannot see Dashboard Overview
- ❌ Cannot view system-wide statistics
- ❌ Cannot see litigation cost summaries

### **Administration**
- ❌ Cannot create/edit users
- ❌ Cannot manage groups
- ❌ Cannot configure permissions
- ❌ Cannot access system settings
- ❌ Cannot manage master files

### **Approval Actions**
- ❌ Cannot approve cases
- ❌ Cannot approve budgets
- ❌ Cannot approve filings
- (Only managers can approve)

---

## 🔄 Comparison: Case Officer vs Admin

| Feature | Case Officer | Admin |
|---------|--------------|-------|
| **Dashboard Overview** | ❌ Hidden | ✅ Visible |
| **Register Cases** | ✅ Yes | ✅ Yes |
| **Manage Cases** | ✅ Yes | ✅ Yes |
| **View All Cases** | ✅ Yes | ✅ Yes |
| **Directions & Hearings** | ✅ Yes | ✅ Yes |
| **Documents** | ✅ Yes | ✅ Yes |
| **Tasks** | ✅ Yes | ✅ Yes |
| **Calendar** | ✅ Yes | ✅ Yes |
| **User Management** | ❌ No | ✅ Yes |
| **Groups** | ❌ No | ✅ Yes |
| **Modules** | ❌ No | ✅ Yes |
| **System Settings** | ❌ No | ✅ Yes |

---

## 📝 Testing Checklist

### **As Case Officer, you should:**

- [ ] See "Case Officer" in header (or your full name)
- [ ] See Case Workflow menu with 7 items
- [ ] See Case Management menu with 4 items
- [ ] NOT see Dashboard Overview
- [ ] NOT see Administration menu
- [ ] Be able to register new cases
- [ ] Be able to view assigned cases
- [ ] Be able to create tasks
- [ ] Be able to upload documents
- [ ] Be able to schedule events

---

## 🆘 Troubleshooting

### **Issue: Case Officer sees Dashboard Overview**

**Solution:**
1. Run the SQL script again: `SETUP_CASE_OFFICER_FULL_PERMISSIONS.sql`
2. Logout and login
3. Hard refresh: `Ctrl + Shift + R`
4. Check group permissions in Administration → Groups

---

### **Issue: Case Officer can't see Case Workflow**

**Solution:**
1. Verify user is assigned to "Case Officer" group
2. Run the SQL script to set permissions
3. Logout and login
4. Check that modules exist in database

---

### **Issue: Header still shows "Admin"**

**Solution:**
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache
3. Check user's full_name in profiles table
4. Verify user is in Case Officer group

---

## ✅ Summary

**Case Officer users have:**
- ✅ Full access to case management features
- ✅ Ability to register and manage cases
- ✅ Access to workflow tools
- ❌ No dashboard overview
- ❌ No administrative functions

**This is the correct configuration for Case Officers!**

---

🤖 Generated with [Same](https://same.new)

Co-Authored-By: Same <noreply@same.new>

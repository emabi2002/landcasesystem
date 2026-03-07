# Admin-Driven RBAC System Guide

## 🎯 Overview

**Good News!** You no longer need to run SQL scripts or write code to set up groups and permissions. Everything is now controlled by administrators through the user-friendly web interface.

### What This Means

✅ **No SQL Knowledge Required** - Everything done through UI
✅ **Quick Setup Wizard** - Get started in 2 minutes
✅ **Fully Customizable** - Modify any permission anytime
✅ **No Technical Deployment** - Just click and configure

---

## 🚀 Quick Start (First Time Setup)

### Step 1: Login as Administrator
```
Email: admin@lands.gov.pg
Password: [your password]
```

### Step 2: Navigate to Groups
**Sidebar → Administration → Groups**

You'll see a welcome banner since no groups exist yet.

### Step 3: Click "Quick Setup" Button
Two options appear:
1. **Use Quick Setup** (Recommended) - Creates groups with smart defaults
2. **Create Custom Group** - Start from scratch

### Step 4: Select Group Templates
In the Quick Setup wizard:
- ☑️ **Super Admin** - For system administrators
- ☑️ **Manager** - For department heads
- ☑️ **Case Officer** - For legal officers
- ☑️ **Legal Clerk** - For support staff
- ☑️ **Document Clerk** - For file management
- ☑️ **Viewer** - For read-only access

Select the ones you need (you can select all 6 if you want).

### Step 5: Click "Create Groups"
The system will:
- Create each selected group
- Apply smart default permissions based on group type
- Show success message

**Done!** Your groups are ready.

---

## 📋 Managing Groups After Setup

### View All Groups
**Administration → Groups**

You'll see all your groups listed on the left panel.

### Edit Group Details
1. Click the **Edit (pencil)** button next to any group
2. Modify name or description
3. Click **Save**

### Configure Permissions
1. **Click on a group** to select it
2. **Permission Matrix** appears on the right
3. Toggle switches to grant/revoke permissions
4. Click **"Save Permissions"** when done

### Create Additional Custom Groups
1. Click **"New Group"** button
2. Enter name and description
3. Select the new group
4. Configure permissions in the matrix
5. Save

### Delete a Group
1. Click the **Delete (trash)** button
2. Confirm deletion
3. All associated permissions are removed

---

## 🔧 Managing Modules

Modules represent different features of your system (Cases, Documents, Tasks, etc.).

### View All Modules
**Administration → Modules**

### Create New Module
1. Click **"New Module"** button
2. Enter:
   - **Module Name**: e.g., "Case Management"
   - **Module Key**: e.g., "case_management" (lowercase_with_underscores)
   - **Description**: What this module does
3. Click **"Create Module"**

### Edit Existing Module
1. Click **Edit (pencil)** button next to the module
2. Update name, key, or description
3. Click **Save**

### Delete a Module
1. Click **Delete (trash)** button
2. Confirm deletion
3. All permissions for this module are removed from all groups

---

## 🎨 Understanding the Quick Setup Templates

### Super Admin Template
**Permissions Applied:**
- ✅ **All modules** - Complete access
- ✅ **All permissions** - Create, Read, Update, Delete, Print, Approve, Export

**Use Case:**
System administrators who manage the entire system.

---

### Manager Template
**Permissions Applied:**
- ✅ **Can view** - All modules (except User/Group Management)
- ✅ **Can approve** - Everything
- ✅ **Can update** - Cases, Tasks, Calendar, Correspondence, Compliance
- ✅ **Can create** - Tasks, Correspondence, Notifications
- ❌ **Cannot delete** - Anything (safety measure)

**Use Case:**
Department heads who oversee teams but don't handle cases directly.

---

### Case Officer Template
**Permissions Applied:**
- ✅ **Can create** - Cases, Documents, Tasks, Calendar, Court Filings, Compliance
- ✅ **Can update** - Same as create, plus Directions & Hearings
- ✅ **Can approve** - Court Filings, Documents, Compliance
- ✅ **Can delete** - Tasks, Correspondence, File Requests
- ✅ **Can view** - 15 modules (everything except admin)
- ❌ **Cannot delete** - Cases (safety measure)

**Use Case:**
Legal officers who handle day-to-day case management.

---

### Legal Clerk Template
**Permissions Applied:**
- ✅ **Can create** - Documents, Tasks, Correspondence, File Requests, Calendar
- ✅ **Can update** - Same as create
- ✅ **Can view** - Cases (read-only), plus 11 other modules
- ✅ **Can delete** - Tasks, Correspondence
- ❌ **Cannot approve** - Anything
- ❌ **Cannot modify cases** - Read-only

**Use Case:**
Support staff assisting legal officers.

---

### Document Clerk Template
**Permissions Applied:**
- ✅ **Can create** - Documents, File Requests
- ✅ **Can update** - Same as create
- ✅ **Can view** - Dashboard, Cases, Documents, Tasks, File Requests, Notifications
- ❌ **Cannot delete** - Anything
- ❌ **Cannot approve** - Anything
- ❌ **Very limited scope** - Only 6 modules

**Use Case:**
File clerks focused on document management.

---

### Viewer Template
**Permissions Applied:**
- ✅ **Can read** - Dashboard, Cases, Documents, Calendar, Reports, Land Parcels, Notifications
- ✅ **Can print** - Cases, Reports, Documents
- ✅ **Can export** - Reports only
- ❌ **Cannot create** - Anything
- ❌ **Cannot modify** - Anything
- ❌ **Cannot approve** - Anything

**Use Case:**
External auditors, consultants, observers.

---

## 🔄 Complete Workflow Example

### Scenario: Setting Up a New Legal Department

**Step 1: Create Groups** (Using Quick Setup)
```
✓ Super Admin (for IT)
✓ Manager (for department head)
✓ Case Officer (for 5 legal officers)
✓ Legal Clerk (for 3 support staff)
✓ Document Clerk (for 1 file clerk)
```

**Step 2: Customize Permissions** (Optional)
- Click "Case Officer" group
- Adjust permissions in matrix if needed
- Save changes

**Step 3: Create Users**
```
Administration → User Management → Create User

User 1:
- Name: John Doe
- Email: john@dlpp.gov.pg
- Group: Super Admin ✓

User 2:
- Name: Jane Smith
- Email: jane@dlpp.gov.pg
- Group: Manager ✓

User 3-7:
- Assign to: Case Officer ✓

User 8-10:
- Assign to: Legal Clerk ✓

User 11:
- Assign to: Document Clerk ✓
```

**Step 4: Test**
- Login as each user type
- Verify correct modules visible
- Test permissions

**Done!** Your department is set up.

---

## ⚙️ Customization Examples

### Example 1: Create a "Senior Legal Officer" Group
```
1. Administration → Groups → New Group
2. Name: "Senior Legal Officer"
3. Description: "Experienced officers with approval rights"
4. Click on the new group
5. Permission Matrix:
   - Copy Case Officer permissions
   - Add: Can Approve (for more modules)
   - Add: Can Delete (cases)
6. Save Permissions
```

### Example 2: Restrict a Group Further
```
1. Select "Legal Clerk" group
2. Permission Matrix:
   - Remove: Can Delete (Tasks)
   - Remove: Can Create (Calendar)
3. Save Permissions
```

### Example 3: Add a New Module
```
1. Administration → Modules → New Module
2. Name: "Audit Trail"
3. Key: "audit_trail"
4. Description: "System activity logging"
5. Create Module
6. Go to each group and set permissions for this module
```

---

## 🔐 Permission Types Explained

Each module can have 7 types of permissions:

| Permission | What It Allows |
|------------|----------------|
| **Create** | Add new records (cases, documents, tasks) |
| **Read** | View and search records |
| **Update** | Edit existing records |
| **Delete** | Remove records |
| **Print** | Generate PDFs, print documents |
| **Approve** | Approve submissions, authorize actions |
| **Export** | Download data (Excel, CSV) |

---

## 📊 Permission Matrix Guide

### How to Use the Permission Matrix

1. **Select a Group** - Click on any group in the left panel
2. **View Matrix** - Right panel shows all modules with permission toggles
3. **Toggle Permissions** - Click switches to grant/revoke permissions
4. **Bulk Toggle** - Use "All" column to enable/disable all permissions for a module
5. **Save Changes** - Click "Save Permissions" button

### Visual Guide

```
Module              Create  Read  Update  Delete  Print  Approve  Export  All
═══════════════════════════════════════════════════════════════════════════
Case Management      ☑      ☑     ☑       ☐       ☑      ☐        ☑       ☐
Documents            ☑      ☑     ☑       ☐       ☑      ☑        ☑       ☐
Tasks                ☑      ☑     ☑       ☑       ☐      ☐        ☐       ☑
Calendar             ☑      ☑     ☑       ☐       ☑      ☐        ☑       ☐
```

**Legend:**
- ☑ = Permission granted
- ☐ = Permission denied
- **All** = Quick toggle for entire row

---

## 🎓 Best Practices

### ✅ DO

1. **Start with Quick Setup** - Use templates, then customize
2. **Grant minimum necessary permissions** - Principle of least privilege
3. **Test after changes** - Login as different users to verify
4. **Document custom groups** - Add clear descriptions
5. **Review permissions quarterly** - Ensure they're still appropriate

### ❌ DON'T

1. **Don't make everyone Super Admin** - Defeats security
2. **Don't delete built-in modules** - System depends on them
3. **Don't grant Delete permission casually** - Data loss risk
4. **Don't forget to save** - Click "Save Permissions" after changes
5. **Don't create duplicate groups** - Consolidate similar roles

---

## 🔍 Troubleshooting

### "User can't see any modules"
**Cause:** User not assigned to any group
**Solution:** Administration → User Management → Assign user to a group

### "User sees wrong modules"
**Cause:** Wrong group assigned
**Solution:** Remove from current group, assign to correct group

### "Changes not taking effect"
**Cause:** User needs to logout and login again
**Solution:** Ask user to logout and login

### "Can't delete a module"
**Cause:** Module is in use by groups
**Solution:** This is by design (cascading delete). Confirm deletion.

### "Quick Setup button missing"
**Cause:** Groups already exist
**Solution:** Quick Setup only shows when no groups exist. Create manually or delete all groups first.

---

## 📖 Key Differences from SQL Approach

| Aspect | Old Way (SQL) | New Way (Admin-Driven) |
|--------|--------------|------------------------|
| **Setup** | Run SQL script in Supabase | Click Quick Setup in UI |
| **Knowledge Required** | SQL, Database access | Web browser only |
| **Time to Setup** | 5+ minutes | 2 minutes |
| **Modifications** | Edit SQL, re-run script | Click, toggle, save |
| **Add Module** | Write SQL INSERT | Click "New Module" |
| **Add Group** | Write SQL INSERT | Click "New Group" |
| **Customize Permissions** | Edit complex SQL logic | Toggle switches |
| **See Changes** | Query database | Visual immediately |
| **Undo Changes** | Re-run old script | Click toggle back |
| **Training Required** | Database administrator | Any admin user |

---

## 🎯 Quick Reference

### Common Tasks

| Task | Navigation | Time |
|------|-----------|------|
| First-time setup | Groups → Quick Setup | 2 min |
| Create custom group | Groups → New Group | 1 min |
| Edit group permissions | Groups → Select group → Toggle → Save | 30 sec |
| Add new module | Modules → New Module | 30 sec |
| Assign user to group | User Management → Create/Edit User | 1 min |
| Change user's group | User Management → Remove old → Assign new | 30 sec |

---

## 📚 Related Features

### User Management
- **Create users** with mandatory group assignment
- **View permissions preview** during user creation
- **Assign multiple groups** to one user (permissions merge)
- **Remove from groups** anytime

### Audit Trail (Future)
- Track who modified permissions
- See permission history
- Generate audit reports

### Import/Export (Future)
- Export group configurations
- Import groups from another system
- Clone groups across environments

---

## ✅ Summary

**You're in Control!**

- ✅ No SQL scripts needed
- ✅ Everything through web interface
- ✅ Quick Setup wizard for fast start
- ✅ Fully customizable after setup
- ✅ Add modules as you need them
- ✅ Modify permissions anytime
- ✅ Visual, intuitive, user-friendly

**Get Started:**
1. Login as admin
2. Go to Administration → Groups
3. Click "Quick Setup"
4. Select templates
5. Click "Create Groups"
6. Start creating users!

---

**Last Updated:** Version 38
**Feature Status:** ✅ Production Ready - No SQL Scripts Required!

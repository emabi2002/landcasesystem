# Default Groups and Permissions Setup Guide

## Overview

This guide explains the **6 default groups** and their permissions that have been configured for the Legal Case Management System. These groups provide a complete role-based access control (RBAC) structure ready for immediate use.

---

## 📋 Quick Start

### Step 1: Run the Setup Script
1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `SETUP_DEFAULT_GROUPS_AND_PERMISSIONS.sql`
5. Click **Run**
6. Verify success messages in the output

### Step 2: Verify Groups Created
Navigate to **Administration → Groups** in your app to see all 6 default groups.

### Step 3: Create Your First User
1. Go to **Administration → User Management**
2. Click **Create User**
3. Fill in details and select a group
4. User will immediately inherit that group's permissions

---

## 👥 Default Groups Explained

### 1. Super Admin
**Purpose:** System administrators and IT staff

**Description:** Full system access including user management, configuration, and all modules.

**Permissions:**
- ✅ **ALL** modules
- ✅ **ALL** permissions (Create, Read, Update, Delete, Print, Approve, Export)

**Typical Users:**
- IT Administrator
- System Owner
- Technical Support

**Use Case:**
> "I need to configure the system, create users, manage groups, and have emergency access to fix any issues."

---

### 2. Manager
**Purpose:** Department heads and supervisors

**Description:** Can view all cases, approve actions, generate reports, and monitor team performance.

**Permissions:**

| Module | Create | Read | Update | Delete | Print | Approve | Export |
|--------|--------|------|--------|--------|-------|---------|--------|
| Dashboard | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Case Management | - | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Documents | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Tasks | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Calendar | - | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Correspondence | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Lawyers | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Land Parcels | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Court Filings | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Directions & Hearings | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Compliance | - | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Litigation Costs | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Reports | - | ✓ | - | - | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | - | - | ✓ | ✓ | ✓ |

**Key Features:**
- Can **view** everything
- Can **approve** all actions
- Can **update** cases and compliance
- Cannot **create** new cases
- Cannot **delete** anything
- No access to User/Group management

**Typical Users:**
- Legal Department Head
- Team Supervisor
- Operations Manager

**Use Case:**
> "I need to oversee my team's work, approve documents, review case progress, and generate management reports."

---

### 3. Case Officer
**Purpose:** Legal officers who handle case assignments

**Description:** Full case management capabilities including registration, updates, and document handling.

**Permissions:**

| Module | Create | Read | Update | Delete | Print | Approve | Export |
|--------|--------|------|--------|--------|-------|---------|--------|
| Dashboard | - | ✓ | - | - | - | - | - |
| Case Management | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| Documents | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| Tasks | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Calendar | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| Correspondence | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Lawyers | - | ✓ | - | - | - | - | - |
| Land Parcels | - | ✓ | - | - | - | - | - |
| Court Filings | ✓ | ✓ | ✓ | - | ✓ | ✓ | - |
| Directions & Hearings | ✓ | ✓ | ✓ | - | - | - | - |
| Compliance | ✓ | ✓ | ✓ | - | - | ✓ | - |
| Litigation Costs | - | ✓ | - | - | - | - | - |
| Reports | - | ✓ | - | - | ✓ | - | ✓ |
| Notifications | ✓ | ✓ | - | - | - | - | - |
| File Requests | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Internal Officers | - | ✓ | - | - | - | - | - |

**Key Features:**
- Can **register** new cases
- Can **create and manage** documents
- Can **update** case status and details
- Can **approve** documents and court filings
- Can **delete** tasks and correspondence
- Cannot delete cases (safety measure)

**Typical Users:**
- Legal Officer
- Case Handler
- Litigation Specialist

**Use Case:**
> "I handle cases from registration through to resolution. I need to create cases, upload documents, track tasks, and manage all case-related activities."

---

### 4. Legal Clerk
**Purpose:** Support staff assisting with case processing

**Description:** Can manage documents, tasks, and correspondence but limited case modification rights.

**Permissions:**

| Module | Create | Read | Update | Delete | Print | Approve | Export |
|--------|--------|------|--------|--------|-------|---------|--------|
| Dashboard | - | ✓ | - | - | - | - | - |
| Case Management | - | ✓ | - | - | ✓ | - | - |
| Documents | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| Tasks | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |
| Calendar | ✓ | ✓ | ✓ | - | ✓ | - | - |
| Correspondence | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Lawyers | - | ✓ | - | - | - | - | - |
| Land Parcels | - | ✓ | - | - | - | - | - |
| Directions & Hearings | - | ✓ | - | - | - | - | - |
| Notifications | - | ✓ | - | - | - | - | - |
| File Requests | ✓ | ✓ | ✓ | - | - | - | - |
| Internal Officers | - | ✓ | - | - | - | - | - |

**Key Features:**
- Can **view** cases (read-only)
- Can **create and manage** documents
- Can **create and manage** tasks
- Can **handle** correspondence
- Can **print** case and document reports
- Cannot modify case details
- Cannot approve anything
- No access to compliance or court filings

**Typical Users:**
- Legal Secretary
- Administrative Assistant
- Case Support Staff

**Use Case:**
> "I support the legal team by managing documents, scheduling tasks, handling correspondence, and organizing files."

---

### 5. Document Clerk
**Purpose:** Document management specialists

**Description:** Primary focus on uploading, organizing, and tracking documents and physical files.

**Permissions:**

| Module | Create | Read | Update | Delete | Print | Approve | Export |
|--------|--------|------|--------|--------|-------|---------|--------|
| Dashboard | - | ✓ | - | - | - | - | - |
| Case Management | - | ✓ | - | - | ✓ | - | - |
| Documents | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| Tasks | - | ✓ | - | - | - | - | - |
| File Requests | ✓ | ✓ | ✓ | - | - | - | - |
| Notifications | - | ✓ | - | - | - | - | - |

**Key Features:**
- **Focused** on document management
- Can **upload** new documents
- Can **edit** document metadata
- Can **track** physical file movements
- Can **view** cases and tasks (read-only)
- Cannot modify cases or tasks
- Very **restricted scope** (only 6 modules)

**Typical Users:**
- File Clerk
- Document Controller
- Records Management Specialist

**Use Case:**
> "I'm responsible for organizing all case documents, scanning files, tracking physical file locations, and maintaining the document repository."

---

### 6. Viewer
**Purpose:** Read-only access for external observers

**Description:** Can view cases and generate reports but cannot modify any data.

**Permissions:**

| Module | Create | Read | Update | Delete | Print | Approve | Export |
|--------|--------|------|--------|--------|-------|---------|--------|
| Dashboard | - | ✓ | - | - | - | - | - |
| Case Management | - | ✓ | - | - | ✓ | - | - |
| Documents | - | ✓ | - | - | ✓ | - | - |
| Calendar | - | ✓ | - | - | - | - | - |
| Reports | - | ✓ | - | - | ✓ | - | ✓ |
| Land Parcels | - | ✓ | - | - | - | - | - |
| Notifications | - | ✓ | - | - | - | - | - |

**Key Features:**
- **Read-only** access to everything
- Can **print** cases and documents
- Can **export** reports only
- Cannot **create** anything
- Cannot **modify** anything
- Cannot **delete** anything
- Cannot **approve** anything

**Typical Users:**
- External Auditor
- Consultant
- Observer
- Intern (limited access)

**Use Case:**
> "I need to review case information and generate reports for compliance audits, but I shouldn't be able to change any data."

---

## 📊 Permission Comparison Matrix

### High-Level Overview

| Group | Modules Accessible | Create | Update | Delete | Approve |
|-------|-------------------|--------|--------|--------|---------|
| **Super Admin** | All 20 | All | All | All | All |
| **Manager** | 14 modules | Tasks, Correspondence | Cases, Tasks, Calendar | None | All |
| **Case Officer** | 15 modules | Cases, Docs, Tasks | Cases, Docs, Tasks | Tasks, Correspondence | Docs, Filings |
| **Legal Clerk** | 12 modules | Docs, Tasks, Correspondence | Docs, Tasks | Tasks, Correspondence | None |
| **Document Clerk** | 6 modules | Docs, Files | Docs, Files | None | None |
| **Viewer** | 7 modules | None | None | None | None |

### Permission Intensity Scale

```
Super Admin  ████████████████████  100% (Full Access)
Manager      ████████████░░░░░░░░   60% (View All, Selective Modify)
Case Officer ███████████░░░░░░░░░   55% (Full Case Management)
Legal Clerk  ██████░░░░░░░░░░░░░░   30% (Support Functions)
Doc Clerk    ████░░░░░░░░░░░░░░░░   20% (Document Focus)
Viewer       ██░░░░░░░░░░░░░░░░░░   10% (Read Only)
```

---

## 🎯 Common Scenarios

### Scenario 1: New Legal Department
**Need:** Set up a complete legal team

**Solution:**
```
1. Create Admin User → Assign to: Super Admin
2. Create Department Head → Assign to: Manager
3. Create 3 Legal Officers → Assign to: Case Officer
4. Create 2 Secretaries → Assign to: Legal Clerk
5. Create 1 File Clerk → Assign to: Document Clerk
```

---

### Scenario 2: Promoted Employee
**Before:** Sarah is a Legal Clerk
**After:** Sarah promoted to Case Officer

**Solution:**
1. Go to User Management
2. Find Sarah's account
3. Click "Assign Group"
4. Add "Case Officer" group
5. Remove "Legal Clerk" group (or keep both if she maintains dual responsibilities)

---

### Scenario 3: External Audit
**Need:** Give auditor temporary access

**Solution:**
```
1. Create User: auditor@external.com
2. Assign to Group: Viewer
3. After audit complete:
   - Remove from Viewer group, OR
   - Delete user account
```

---

### Scenario 4: Custom Requirements
**Need:** Case officer who can also manage users

**Solution:**
```
Option A: Assign to multiple groups
  - Keep: Case Officer
  - Add: Super Admin (if trusted)

Option B: Create custom group
  - Create: "Senior Case Officer"
  - Clone permissions from: Case Officer
  - Add: User Management permissions
  - Assign user to new group
```

---

## 🔧 Customization

### Modifying Default Groups

You can customize any default group:

1. Navigate to **Administration → Groups**
2. Click on the group to select it
3. Modify permissions in the Permission Matrix
4. Click **Save Permissions**

**Warning:** Changes affect **all users** in that group immediately.

---

### Creating Custom Groups

For specialized roles:

1. Click **"New Group"** button
2. Name it (e.g., "Senior Legal Officer", "Compliance Specialist")
3. Add description
4. Configure permissions based on needs
5. Assign users to the new group

**Best Practice:** Start with the closest default group as a reference.

---

## 📋 Module List (All 20 Modules)

| # | Module | Module Key | Description |
|---|--------|------------|-------------|
| 1 | Dashboard | `dashboard` | System overview and statistics |
| 2 | Case Management | `case_management` | Register and track cases |
| 3 | Documents | `documents` | Document repository |
| 4 | Tasks | `tasks` | Task management |
| 5 | Calendar | `calendar` | Events and hearings |
| 6 | Correspondence | `correspondence` | Letters and communications |
| 7 | Lawyers | `lawyers` | External counsel management |
| 8 | Land Parcels | `land_parcels` | Property records |
| 9 | Court Filings | `court_filings` | Legal submissions |
| 10 | Directions & Hearings | `directions_hearings` | Court directions |
| 11 | Compliance | `compliance` | Compliance tracking |
| 12 | Litigation Costs | `litigation_costs` | Budget and expenses |
| 13 | Reports | `reports` | Analytics and exports |
| 14 | Notifications | `notifications` | System alerts |
| 15 | File Requests | `file_requests` | Physical file tracking |
| 16 | Communications | `communications` | Internal communications |
| 17 | User Management | `user_management` | User accounts |
| 18 | Groups Management | `groups_management` | Group permissions |
| 19 | Master Files | `master_files` | Lookup tables |
| 20 | Internal Officers | `internal_officers` | Staff management |

---

## ✅ Verification Checklist

After running the setup script:

- [ ] Navigate to **Administration → Groups**
- [ ] Verify 6 default groups appear
- [ ] Click on "Super Admin" group
- [ ] Verify Permission Matrix shows all checkmarks
- [ ] Click on "Viewer" group
- [ ] Verify limited permissions (only Read)
- [ ] Click on "Case Officer" group
- [ ] Verify balanced permissions
- [ ] Create a test user
- [ ] Assign to "Legal Clerk" group
- [ ] Login as test user
- [ ] Verify limited module visibility
- [ ] Logout and login as admin
- [ ] Delete test user

---

## 🔒 Security Best Practices

### ✅ DO

1. **Assign users to the least privileged group** that allows them to do their job
2. **Review group permissions quarterly** to ensure they align with current needs
3. **Use Super Admin sparingly** - only for actual administrators
4. **Audit user-group assignments** regularly
5. **Remove access immediately** when employees leave or change roles

### ❌ DON'T

1. **Don't make everyone a Super Admin** - defeats the purpose of RBAC
2. **Don't modify default groups recklessly** - document changes
3. **Don't delete default groups** - they serve as templates
4. **Don't assign multiple groups unnecessarily** - causes confusion
5. **Don't forget to test** permission changes before deploying

---

## 📚 Related Documentation

- `USER_GROUP_MANAGEMENT_GUIDE.md` - How to create users and assign groups
- `RBAC_COMPLETE_WORKFLOW.md` - Complete RBAC architecture
- `GROUPS_CRUD_GUIDE.md` - Managing groups

---

## 🐛 Troubleshooting

### Groups Not Appearing
**Cause:** Script didn't run successfully
**Solution:** Re-run the SQL script in Supabase

### No Permissions Showing
**Cause:** Permissions not created
**Solution:** Check `group_module_permissions` table has data

### User Can't See Modules
**Cause:** User not assigned to any group
**Solution:** Assign user to a group via User Management page

### Too Many Permissions
**Cause:** User in multiple groups (cumulative)
**Solution:** Remove user from unnecessary groups

---

## 📊 Summary

**6 Default Groups Created:**
1. ✅ Super Admin (Full Access)
2. ✅ Manager (View All, Approve)
3. ✅ Case Officer (Full Case Management)
4. ✅ Legal Clerk (Document & Task Support)
5. ✅ Document Clerk (Document Focused)
6. ✅ Viewer (Read Only)

**20 System Modules Configured**

**Permissions Set:**
- Super Admin: 140 permissions (7 × 20 modules)
- Manager: ~60 permissions
- Case Officer: ~85 permissions
- Legal Clerk: ~45 permissions
- Document Clerk: ~15 permissions
- Viewer: ~20 permissions

**Total:** ~365 permission records created

---

**Last Updated:** Version 36
**Status:** ✅ Ready for Production

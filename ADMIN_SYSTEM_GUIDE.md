# 🛠️ Administrative Menu System - Complete Guide

## Overview

A comprehensive administrative system has been created for managing users, case types, and other system reference data. This guide explains all the features and how to use them.

## 🔐 Access Requirements

**Who can access:** Administrators and Managers only
- **Email:** admin@lands.gov.pg
- **Password:** demo123

## 📋 Administrative Menu Structure

### Main Admin Dashboard (`/admin`)

The admin dashboard provides a centralized hub for all administrative functions with:

- **Quick Statistics**
  - Total Users
  - Active Users
  - Total Cases
  - Case Types Count

- **8 Administrative Modules** (arranged in a grid)

---

## 🎯 Module 1: User Management
**Path:** `/admin/users`
**Status:** ✅ Active (pre-existing)

### Features:
- Create new user accounts
- Assign roles and permissions
- Edit user information
- Activate/deactivate users
- View role-based access matrix

### User Roles:
1. **Administrator** - Full system access + user management
2. **Manager** - Full access to all modules
3. **Lawyer/Legal Officer** - Case management, compliance, closure
4. **Officer/Registry Clerk** - Document reception only
5. **Executive Management** - Dashboard + directions commenting

### How to Use:
1. Navigate to `/admin/users`
2. Click "Add New User"
3. Fill in:
   - Full Name
   - Email
   - Phone
   - Role
   - Initial Password
4. Click "Create User"

---

## 📁 Module 2: Case Types Management
**Path:** `/admin/case-types`
**Status:** ✅ Active (NEW)

### Features:
- View all case type categories
- See usage statistics for each type
- Edit case type descriptions
- Monitor which types are most used

### Current Case Types:
1. **Court Matter** - General court proceedings
2. **Dispute** - Land disputes and conflicts
3. **Title Claim** - Land ownership disputes
4. **Administrative Review** - Review of admin decisions
5. **Judicial Review** - Review of govt decisions
6. **Tort** - Civil wrongs and liability
7. **Compensation Claim** - Damages claims
8. **Fraud** - Fraud and misrepresentation
9. **Other** - Uncategorized cases

### Case Type Cards Show:
- Type name
- Type code (e.g., `court_matter`)
- Description
- Number of cases using this type
- Active/Inactive status

### Technical Note:
Case types are currently defined in the database schema. To add new types, you need to:
1. Update the database CHECK constraint
2. Add to the case registration form
3. Refresh the admin page

---

## ⚙️ Module 3: System Settings
**Path:** `/admin/settings`
**Status:** ✅ Active (NEW)

### Tabs Available:

#### 1️⃣ Priorities Tab
Define case priority levels:
- **Low** - Non-urgent matters
- **Medium** - Standard priority (default)
- **High** - Requires attention
- **Urgent** - Immediate action needed

#### 2️⃣ Statuses Tab
Case lifecycle statuses:
- Draft
- Registered
- Active
- Pending
- Closed
- Archived

#### 3️⃣ Regions Tab
All 22 PNG Provinces:
- National Capital District (NCD)
- Central Province (CPR)
- Western Province (WPR)
- ... and 19 more

Each region has a code for reporting.

#### 4️⃣ Other Tab
Additional reference data:
- **Document Types:** Filing, Affidavit, Correspondence, Survey Report, etc.
- **Party Roles:** Plaintiff, Defendant, Witness, Legal Representative
- **Party Types:** Individual, Company, Government Entity, Clan/Community
- **User Roles:** Admin, Manager, Lawyer, Officer, Executive

---

## 📍 Module 4: Regions & Courts
**Path:** `/admin/locations`
**Status:** 🔜 Coming Soon

### Planned Features:
- Manage regional DLPP offices
- Add court locations and jurisdictions
- Map courts to provinces
- Track regional case distribution

---

## 🏢 Module 5: Departments
**Path:** `/admin/departments`
**Status:** 🔜 Coming Soon

### Planned Features:
- Create organizational structure
- Manage department hierarchies
- Assign users to departments
- Track departmental responsibilities

---

## 📊 Module 6: Case Statuses
**Path:** `/admin/case-statuses`
**Status:** 🔜 Coming Soon

### Planned Features:
- Define custom workflow states
- Set status transitions
- Configure automatic status updates
- Create status-based automations

---

## 💾 Module 7: Database Management
**Path:** `/admin/database`
**Status:** 🔜 Coming Soon

### Planned Features:
- Database health monitoring
- Backup and restore
- Data cleanup utilities
- Performance metrics
- Query analyzer

---

## 📈 Module 8: Reports & Analytics
**Path:** `/admin/reports`
**Status:** 🔜 Coming Soon

### Planned Features:
- User activity reports
- System usage statistics
- Case type distribution
- Performance dashboards
- Custom report builder

---

## 🚀 How to Access the Admin System

### Step 1: Login
1. Go to the login page
2. Use admin credentials:
   - Email: `admin@lands.gov.pg`
   - Password: `demo123`

### Step 2: Navigate to Admin
Look for the **"Admin"** button in the navigation bar (top right)

### Step 3: Explore Modules
From the admin dashboard:
- Click on any module card
- Each card shows:
  - Module icon and color
  - Module title
  - Description
  - Current stats
  - Status badge (Core/New/Coming Soon)
  - "Manage" button

### Step 4: Manage Settings
- Click "Manage" on any active module
- Make changes as needed
- Changes affect all users immediately

---

## ⚠️ Important Warnings

### Security Notice
The admin dashboard shows this warning:
> "You have administrator privileges. Please be careful when making changes to users, case types, or system settings as they affect all users. Always test changes in a non-production environment first. Changes to reference data (case types, statuses, etc.) will immediately affect all active cases."

### Impact of Changes:
- **User Management:** Affects who can access the system
- **Case Types:** Changes appear in all forms and reports
- **Settings:** Immediately affects dropdowns and options
- **Statuses/Priorities:** Changes what users can select

---

## 📊 Admin Dashboard Quick Stats

The top of the admin dashboard shows 4 key metrics:

1. **Total Users**
   - Blue card
   - Shows total registered users
   - Icon: Users

2. **Active Users**
   - Green card
   - Shows currently active users
   - Icon: CheckCircle

3. **Total Cases**
   - Purple card
   - Shows all cases in system
   - Icon: FileText

4. **Case Types**
   - Orange card
   - Shows number of case types (9)
   - Icon: Briefcase

---

## 🎨 Visual Design

### Module Cards:
Each module has a unique color gradient:
- **User Management:** Blue
- **Case Types:** Emerald Green
- **System Settings:** Purple
- **Regions & Courts:** Orange
- **Departments:** Cyan
- **Case Statuses:** Indigo
- **Database:** Red
- **Reports:** Amber

### Status Badges:
- **Core** (Blue) - Essential system features
- **New** (Various) - Recently added modules
- **Advanced** (Red) - Technical features
- **Coming Soon** (Amber) - Planned features

---

## 🔄 Navigation Flow

```
Login → Dashboard → Admin Button → Admin Dashboard
                                    ↓
                    ┌──────────────────────────────┐
                    │                              │
                    ├─→ User Management            │
                    ├─→ Case Types ✨ NEW          │
                    ├─→ System Settings ✨ NEW     │
                    ├─→ Regions & Courts (Soon)    │
                    ├─→ Departments (Soon)         │
                    ├─→ Case Statuses (Soon)       │
                    ├─→ Database (Soon)            │
                    └─→ Reports (Soon)             │
```

---

## 📝 What's Been Built

### ✅ Completed (Active Now):
1. **Admin Dashboard** - Central hub with stats and module cards
2. **User Management** - Full CRUD for users (pre-existing, enhanced)
3. **Case Types** - View and manage case type categories
4. **System Settings** - Reference data browser with 4 tabs

### 🔜 Planned (Coming Soon):
5. Regions & Courts Management
6. Departments Management
7. Case Statuses Configuration
8. Database Management Tools
9. Reports & Analytics Dashboard

---

## 💡 Usage Tips

### For Administrators:
1. **Check Stats Regularly** - Monitor user and case counts
2. **Review Case Types** - See which types are most used
3. **Verify Settings** - Ensure reference data is accurate
4. **Plan Changes** - Test in development first

### For Managers:
1. **User Oversight** - Keep user list current
2. **Type Usage** - Monitor case type distribution
3. **Report Issues** - Note any needed reference data

### Best Practices:
- ✅ Review changes before saving
- ✅ Document custom configurations
- ✅ Keep backups before major changes
- ✅ Train users on new reference data
- ❌ Don't delete types that are in use
- ❌ Don't change codes after creation

---

## 🐛 Troubleshooting

### Can't Access Admin:
- **Check:** Are you logged in as admin or manager?
- **Fix:** Use admin@lands.gov.pg / demo123

### Can't See All Modules:
- **Check:** Some show "Coming Soon"
- **Fix:** Only 3 modules are currently active

### Changes Not Appearing:
- **Check:** Did you save the changes?
- **Fix:** Refresh the page

### Stats Not Loading:
- **Check:** Database connection
- **Fix:** Verify Supabase credentials in .env.local

---

## 📞 Support

For technical issues with the admin system:
- **Developer:** Check console logs
- **Database:** Verify Supabase connection
- **Permissions:** Check user role in profiles table

---

## 🎯 Next Steps

### For Users:
1. Login with admin credentials
2. Navigate to `/admin`
3. Explore the 3 active modules
4. Familiarize yourself with the interface

### For Development:
1. Complete "Coming Soon" modules
2. Add database CRUD operations
3. Implement dynamic reference data
4. Build reporting dashboards

---

**Version:** 5.0
**Last Updated:** December 14, 2024
**Status:** ✅ Core Admin System Active

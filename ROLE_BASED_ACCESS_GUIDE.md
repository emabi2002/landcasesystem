# 🔐 Role-Based Access Control System - Complete Guide

## ✅ Status: Implemented and Ready

**Date**: December 9, 2025  
**Repository**: https://github.com/emabi2002/landcasesystem

---

## 🎯 Overview

A comprehensive role-based access control (RBAC) system has been implemented to manage user permissions across the 8-step workflow modules based on your organizational structure.

---

## 👥 User Roles

### 1. **Executive Management**
- **Access**: Dashboard + Step 2 (Directions)
- **Permissions**:
  - ✅ View dashboard and case statistics
  - ✅ View directions from Secretary/Director/Manager
  - ✅ Comment on directions
  - ❌ Cannot access other workflow modules
  - ❌ Cannot create cases

**Use Case**: Secretary Lands, Director Legal Services review and provide high-level directions

---

### 2. **Manager**
- **Access**: All modules (Full System Access)
- **Permissions**:
  - ✅ Step 1: Document Reception
  - ✅ Step 2: Directions (issue and comment)
  - ✅ Step 3: Registration & Assignment
  - ✅ Step 4: Officer Actions
  - ✅ Step 5: External Filings
  - ✅ Step 6: Compliance
  - ✅ Step 7: Case Closure
  - ✅ Step 8: Parties & Lawyers
  - ✅ Create and manage cases
  - ❌ Cannot access admin panel

**Use Case**: Manager Legal Services with full operational oversight

---

### 3. **Lawyer / Legal Officer**
- **Access**: Step 3 through Step 7 (Registration to Closure)
- **Permissions**:
  - ❌ Cannot access Step 1 (Reception)
  - ❌ Cannot access Step 2 (Directions)
  - ✅ Step 3: Registration & Assignment
  - ✅ Step 4: Officer Actions (letters, memos, instructions)
  - ✅ Step 5: External Filings (Solicitor General/Private Lawyers)
  - ✅ Step 6: Compliance
  - ✅ Step 7: Case Closure
  - ✅ Step 8: Parties & Lawyers
  - ✅ Create and manage cases
  - ✅ Unlimited lawyer communications

**Use Case**: Legal officers handling active litigation from assignment through closure

---

### 4. **Officer / Registry Clerk**
- **Access**: Step 1 (Document Reception) Only
- **Permissions**:
  - ✅ Step 1: Document Reception (register incoming documents)
  - ✅ View all cases (read-only)
  - ✅ Create minimal case records
  - ❌ Cannot access Steps 2-7
  - ❌ Cannot access Parties & Lawyers module

**Use Case**: Legal Section staff who receive and register court documents

---

### 5. **System Administrator**
- **Access**: Full System + User Management
- **Permissions**:
  - ✅ All workflow modules (Steps 1-8)
  - ✅ Admin panel
  - ✅ User management (create, edit, delete users)
  - ✅ Role assignment
  - ✅ System configuration
  - ✅ Full access to everything

**Use Case**: IT staff managing the system and users

---

## 📊 Access Control Matrix

| Module | Executive | Manager | Lawyer | Officer | Admin |
|--------|-----------|---------|--------|---------|-------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Step 1: Reception** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Step 2: Directions** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Step 3: Registration** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Step 3a: Create Files** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Step 3b: Delegation** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Step 4: Officer Actions** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Step 5: External Filings** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Step 6: Compliance** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Step 7: Closure** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Step 8: Parties & Lawyers** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Admin Panel** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🏗️ Implementation Components

### 1. Admin Panel
**Location**: `/admin`

**Features**:
- Create new users
- Assign roles
- Update user roles
- Activate/deactivate users
- Delete users
- View role permissions matrix
- Audit trail of role changes

**Access**: Admin and Manager roles only

### 2. Access Control Utility
**File**: `src/lib/access-control.ts`

**Functions**:
- `getCurrentUserRole()` - Get logged-in user's role
- `getUserPermissions()` - Get all permissions for user
- `checkAccess(permission)` - Check specific permission
- `checkModuleAccess(module)` - Check access to workflow module
- `getRoleName(role)` - Get display name for role
- `getRoleColor(role)` - Get color scheme for role badge

### 3. Database Schema
**SQL File**: `ROLE_BASED_ACCESS_CONTROL.sql`

**Tables**:
- `users` - Extended with `role` column
- `system_roles` - Role definitions and permissions
- `user_role_audit` - Audit trail for role changes

**Functions**:
- `check_user_permission(user_id, permission)` - Database-level permission check
- `get_user_permissions(user_id)` - Get user permissions as JSON
- `log_role_change()` - Automatic audit logging

---

## 🚀 How to Use

### For Administrators

#### 1. Access Admin Panel
```
Navigate to: /admin
```

#### 2. Create New User
1. Click "Add New User"
2. Fill in:
   - Full Name
   - Email
   - Phone (optional)
   - Initial Password
   - Role (select from dropdown)
3. Click "Create User"

#### 3. Manage Existing Users
- **Change Role**: Select new role from dropdown
- **Activate/Deactivate**: Click status button
- **Delete User**: Click trash icon (requires confirmation)

### For Users

#### Access Based on Role

**Executive Management**:
```
1. Login
2. View Dashboard
3. Access Directions module
4. Comment on directions
```

**Manager**:
```
1. Login
2. Access any workflow module
3. Full operational control
```

**Lawyer**:
```
1. Login
2. Access Step 3 (Registration) onwards
3. Handle assigned cases
4. Communicate with external lawyers
```

**Officer**:
```
1. Login
2. Access Document Reception
3. Register incoming court documents
4. Create minimal case records
```

---

## 🔒 Security Features

### 1. Role-Based Restrictions
- Users can only access modules permitted by their role
- Automatic redirects if access denied
- Error messages explain permission requirements

### 2. Audit Trail
- All role changes logged
- Who changed what, when
- Queryable audit history

### 3. Row-Level Security (RLS)
- Database-level access control
- Users can only see permitted data
- Enforced at database layer

### 4. Password Requirements
- Minimum 8 characters
- Must be set at user creation
- Users can change their own password

---

## 📝 SQL Setup

### Run in Supabase SQL Editor

```sql
-- Run this script to set up role-based access control
-- File: ROLE_BASED_ACCESS_CONTROL.sql
```

**Steps**:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Paste contents of `ROLE_BASED_ACCESS_CONTROL.sql`
5. Run

**Expected Output**:
```
========================================
  ROLE-BASED ACCESS CONTROL READY!
========================================

ROLES CREATED:
  1. Executive Management
  2. Manager
  3. Lawyer/Legal Officer
  4. Officer/Registry Clerk
  5. System Administrator

FEATURES:
  ✅ Role column added to users table
  ✅ System roles table created
  ✅ Audit trail for role changes
  ✅ Permission checking functions
  ✅ RLS policies enabled
```

---

## 🎨 UI Components

### Role Badges

Each role has a distinctive color scheme:
- **Executive**: Purple
- **Manager**: Blue
- **Lawyer**: Green
- **Officer**: Amber
- **Admin**: Red

### Access Control Indicators

When a user tries to access a restricted module:
```
 Access Denied
Your role (Officer / Registry Clerk) does not have 
access to this module.

Required: Manager, Lawyer, or Admin role
```

---

## 🔄 Workflow Integration

### Module-Level Protection

Each workflow module checks access:
```typescript
// Example: Reception module
const access = await checkModuleAccess('reception');
if (!access.allowed) {
  router.push('/dashboard');
  toast.error(access.reason);
  return;
}
```

### Navigation Filtering

Navigation menu shows only accessible items:
- Executive sees: Dashboard, Directions
- Manager sees: All modules
- Lawyer sees: Dashboard, Steps 3-8
- Officer sees: Dashboard, Reception, Cases (view)
- Admin sees: Everything + Admin panel

---

## 📊 Reporting & Analytics

### User Activity by Role

```sql
-- Get active users by role
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM users
GROUP BY role
ORDER BY user_count DESC;
```

### Role Change History

```sql
-- View role change audit trail
SELECT 
  u.full_name,
  a.old_role,
  a.new_role,
  a.changed_at,
  c.full_name as changed_by
FROM user_role_audit a
JOIN users u ON u.id = a.user_id
LEFT JOIN users c ON c.id = a.changed_by
ORDER BY a.changed_at DESC
LIMIT 50;
```

### Permission Check

```sql
-- Check if user can access a module
SELECT check_user_permission(
  'user-uuid-here',
  'canAccessReception'
);
```

---

## 🎯 Best Practices

### 1. Initial Setup
- Create admin user first
- Assign appropriate roles to existing users
- Test each role's access
- Document role assignments

### 2. Role Assignment
- Assign most restrictive role first
- Promote as needed
- Document reason for role changes
- Review roles periodically

### 3. User Management
- Use strong initial passwords
- Require users to change password on first login
- Deactivate users instead of deleting (preserves audit trail)
- Review inactive users quarterly

### 4. Security
- Limit admin role to IT staff only
- Manager role for operational managers
- Regular role audits
- Monitor role change logs

---

## 🔧 Troubleshooting

### User Can't Access Module

**Check**:
1. User's assigned role
2. Required role for module
3. User is active
4. User is logged in

**Fix**:
- Update user's role if appropriate
- Reactivate user if deactivated
- Verify user authentication

### Role Changes Not Taking Effect

**Check**:
1. Database `users` table has `role` column
2. Role change saved successfully
3. User logged out and back in

**Fix**:
- Run `ROLE_BASED_ACCESS_CONTROL.sql` if column missing
- Clear browser cache
- Force logout/login

### Admin Panel Not Accessible

**Check**:
1. User has `admin` or `manager` role
2. `/admin` route exists
3. Navigation includes admin link

**Fix**:
- Assign admin role to user
- Verify file `src/app/admin/page.tsx` exists
- Update `DashboardNav.tsx` if needed

---

## 📚 Related Documentation

- **WORKFLOW_MODULE_ARCHITECTURE.md** - Complete workflow specifications
- **MODULAR_WORKFLOW_IMPLEMENTATION.md** - Implementation status
- **ROLE_BASED_ACCESS_CONTROL.sql** - Database setup script

---

## 🎊 Summary

Your Land Case Management System now has:

 **5 Distinct Roles**
- Executive Management
- Manager
- Lawyer / Legal Officer
- Officer / Registry Clerk
- System Administrator

 **Role-Based Module Access**
- Executive: Dashboard + Directions
- Manager: Full access
- Lawyer: Steps 3-7
- Officer: Step 1 only
- Admin: Everything + user management

 **Admin Panel**
- User creation
- Role assignment
- User management
- Access control matrix
- Audit trail

 **Security Features**
- Database-level permissions
- Audit trail
- RLS policies
- Access control utilities

 **Deployed to GitHub**
- Ready for production
- Complete documentation
- SQL setup scripts

---

**Status**: ✅ Complete and Ready  
**Access**: `/admin` for user management  
**Next**: Assign roles to users and test access control

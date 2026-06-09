# COMPLETE RBAC + DATA SCOPE IMPLEMENTATION GUIDE
**System:** DLPP Legal Case Management
**Version:** 2.0 (Enhanced with Data Scope)
**Status:** Ready for Implementation

---

## 🎯 EXECUTIVE SUMMARY

### What This Implements

✅ **Two-Layer Permission System:**
1. **Feature Permissions (RBAC)** - Can user perform action X?
2. **Data Scope Permissions** - Which records can user access?

### Current Status

| Component | Before | After |
|-----------|--------|-------|
| RBAC Tables | ✅ Exists | ✅ Enhanced |
| Data Scope | ❌ Missing | ✅ Implemented |
| Case Protection | ❌ Open to all | ✅ RLS Enforced |
| Specialized Actions | 🔶 Partial | ✅ Complete |
| Admin Console | 🔶 Basic | ✅ Full CRUD |

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [Database Schema](#database-schema)
5. [Default Policies](#default-policies)
6. [Admin Console Usage](#admin-console-usage)
7. [Testing Procedures](#testing-procedures)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 QUICK START

### Prerequisites

- ✅ Supabase project running
- ✅ Existing RBAC tables deployed (`database-rbac-schema.sql`)
- ✅ Admin access to Supabase SQL Editor

### Installation Steps

#### **Step 1: Discovery (Optional but Recommended)**

Run discovery script to verify current state:

```sql
-- File: RBAC_DISCOVERY_SUPABASE.sql
-- Run in Supabase SQL Editor
-- Review output to confirm existing RBAC tables
```

#### **Step 2: Deploy Enhanced Schema**

```sql
-- File: RBAC_PHASE_B_ENHANCED_SCHEMA.sql
-- This extends existing RBAC with data scopes
-- Run in Supabase SQL Editor
```

**Expected Result:**
```
✅ Phase B Complete: Enhanced RBAC + Data Scope System
✅ Data scopes table created
✅ Group scope rules table created
✅ Specialized actions added to permissions
✅ Cases table extended with ownership columns
✅ RLS policies created on cases table
✅ Scope enforcement function created
✅ Default scope rules seeded
⚠️  CRITICAL: RLS NOW ENFORCED ON CASES TABLE
```

#### **Step 3: Verify Installation**

```sql
-- Check data scopes exist
SELECT * FROM public.data_scopes ORDER BY sort_order;

-- Should show: OWN, ASSIGNED, GROUP, DEPARTMENT, ALL

-- Check scope rules seeded
SELECT
  g.group_name,
  m.module_name,
  ds.code as scope
FROM public.group_scope_rules gsr
JOIN public.groups g ON g.id = gsr.group_id
JOIN public.modules m ON m.id = gsr.module_id
JOIN public.data_scopes ds ON ds.id = gsr.scope_id
WHERE gsr.allow = TRUE;
```

#### **Step 4: Test Access Control**

```sql
-- Test as basic user (should see only OWN cases)
SELECT * FROM public.cases; -- Will be filtered by RLS

-- Test as manager (should see GROUP cases)
-- Test as admin (should see ALL cases)
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### Two-Layer Permission Model

```
┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                         │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────▼───────────┐
          │  LAYER 1: RBAC CHECK   │
          │  (Feature Permission)  │
          └────────────┬───────────┘
                       │
              ┌────────▼────────┐
              │ Has Permission? │
              └────────┬────────┘
                   YES │  NO → DENY
          ┌────────────▼───────────┐
          │  LAYER 2: SCOPE CHECK  │
          │  (Data Permission)     │
          └────────────┬───────────┘
                       │
              ┌────────▼────────┐
              │ In User's Scope?│
              └────────┬────────┘
                  YES  │  NO → DENY
          ┌────────────▼───────────┐
          │    GRANT ACCESS        │
          └────────────────────────┘
```

### Database Schema Layers

```
LAYER 1: Users & Groups
├── auth.users (Supabase Auth)
├── profiles (user metadata)
├── groups (roles)
└── user_groups (user ↔ group mapping)

LAYER 2: Modules & Actions
├── modules (features)
├── group_module_permissions (CRUD + special actions)
└── audit_logs (all actions logged)

LAYER 3: Data Scope (NEW!)
├── data_scopes (OWN, GROUP, ALL, etc.)
├── group_scope_rules (group ↔ scope mapping)
└── Scope enforcement function

LAYER 4: Record Ownership
├── cases.created_by
├── cases.created_group_id (NEW!)
├── cases.assigned_to
├── cases.assigned_group_id (NEW!)
└── RLS policies enforcing scope
```

---

## 📊 IMPLEMENTATION PHASES

### Phase A: Discovery ✅ COMPLETE

**What We Found:**
- ✅ Existing RBAC tables functional
- ❌ Data scope system missing
- ❌ Cases table not protected
- 🔶 Specialized actions partial

**Deliverable:** `RBAC_DISCOVERY_REPORT.md`

### Phase B: Enhanced Schema Design ✅ READY TO DEPLOY

**What We Built:**
- ✅ Data scopes table
- ✅ Group scope rules table
- ✅ Cases table ownership columns
- ✅ RLS policies on cases
- ✅ Scope enforcement function
- ✅ Specialized action columns

**Deliverable:** `RBAC_PHASE_B_ENHANCED_SCHEMA.sql`

### Phase C: Implementation (IN PROGRESS)

**Steps:**
1. Run enhanced schema SQL
2. Update admin console
3. Add scope management UI
4. Test with real users

### Phase D: Testing (NEXT)

**Test Scenarios:**
- Basic user sees only OWN cases
- Manager sees GROUP cases
- Admin sees ALL cases
- Allocate/Recommend/Directive permissions work
- Audit trail captures scope access

### Phase E: Documentation (FINAL)

**Deliverables:**
- Admin user manual
- Developer API docs
- Permission matrix
- Troubleshooting guide

---

## 🗄️ DATABASE SCHEMA

### Core Tables

#### 1. data_scopes

```sql
CREATE TABLE public.data_scopes (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,           -- OWN, GROUP, ALL, etc.
  name TEXT,
  description TEXT,
  sort_order INT,
  is_active BOOLEAN
);
```

**Default Values:**
| Code | Name | Description |
|------|------|-------------|
| OWN | Own Records Only | User's created records |
| ASSIGNED | Assigned Records | Records assigned to user |
| GROUP | Group Records | Group's records |
| DEPARTMENT | Department Records | Department's records |
| ALL | All Records | System-wide access |

#### 2. group_scope_rules

```sql
CREATE TABLE public.group_scope_rules (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups,
  module_id UUID REFERENCES modules,
  scope_id UUID REFERENCES data_scopes,
  allow BOOLEAN,
  UNIQUE(group_id, module_id, scope_id)
);
```

**Example Rules:**
| Group | Module | Scope | Allow |
|-------|--------|-------|-------|
| Case Officer | Case Management | OWN | TRUE |
| Case Officer | Case Management | ASSIGNED | TRUE |
| Manager | Case Management | GROUP | TRUE |
| Super Admin | Case Management | ALL | TRUE |

#### 3. Cases Table Extensions

**New Columns Added:**
```sql
ALTER TABLE cases ADD COLUMN created_group_id UUID;
ALTER TABLE cases ADD COLUMN assigned_group_id UUID;
ALTER TABLE cases ADD COLUMN department_id UUID;
ALTER TABLE cases ADD COLUMN is_confidential BOOLEAN;
```

#### 4. group_module_permissions Extensions

**New Columns Added:**
```sql
ALTER TABLE group_module_permissions
ADD COLUMN can_allocate BOOLEAN,
ADD COLUMN can_recommend BOOLEAN,
ADD COLUMN can_directive BOOLEAN,
ADD COLUMN can_close_case BOOLEAN,
ADD COLUMN can_reassign BOOLEAN;
```

---

## 🔐 DEFAULT POLICIES

### Permission Matrix

| Group | Module | Create | Read | Update | Delete | Print | Allocate | Recommend | Directive | Scope |
|-------|--------|--------|------|--------|--------|-------|----------|-----------|-----------|-------|
| **Super Admin** | All | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ALL |
| **Manager** | Case Mgmt | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | GROUP |
| **Case Officer** | Case Mgmt | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | OWN + ASSIGNED |
| **Legal Officer** | Case Mgmt | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | OWN + ASSIGNED |
| **Auditor** | Case Mgmt | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ALL |
| **Reception** | Case Reg | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | OWN |

### Scope Rules Explained

#### OWN Scope
```sql
-- User sees cases WHERE created_by = auth.uid()
SELECT * FROM cases WHERE created_by = auth.uid();
```

#### ASSIGNED Scope
```sql
-- User sees cases WHERE assigned_to = auth.uid()
SELECT * FROM cases WHERE assigned_to = auth.uid();
```

#### GROUP Scope
```sql
-- User sees cases WHERE created_group_id IN (user's groups)
--                    OR assigned_group_id IN (user's groups)
SELECT * FROM cases
WHERE created_group_id IN (
  SELECT group_id FROM user_groups WHERE user_id = auth.uid()
)
OR assigned_group_id IN (
  SELECT group_id FROM user_groups WHERE user_id = auth.uid()
);
```

#### ALL Scope
```sql
-- User sees all cases (no filter)
SELECT * FROM cases;
```

---

## 🎛️ ADMIN CONSOLE USAGE

### Managing Groups

**Navigate to:** `/admin/groups`

**Actions:**
1. **Create Group**
   - Click "Add Group"
   - Enter name & description
   - Save

2. **Assign Permissions**
   - Select group
   - Check/uncheck module permissions
   - Set CRUD + specialized actions
   - Save

3. **Assign Scope Rules**
   - Select group
   - Select module
   - Choose scope (OWN, GROUP, ALL)
   - Save

### Managing Users

**Navigate to:** `/admin/users`

**Actions:**
1. **Create User**
   - Email & temporary password
   - Assign to group(s)
   - User can belong to multiple groups

2. **View Effective Permissions**
   - Select user
   - See combined permissions from all groups
   - See data scope rules

### Managing Modules

**Navigate to:** `/admin/master-files`

**Note:** Modules are seeded; rarely need to add new ones

---

## 🧪 TESTING PROCEDURES

### Test 1: Basic User (OWN Scope)

**Setup:**
1. Create user: `officer@test.com`
2. Assign to group: "Case Officer"
3. Login as this user

**Test:**
```sql
-- Create a case as this user
INSERT INTO cases (title, created_by, created_group_id)
VALUES ('Test Case', auth.uid(), user's group_id);

-- Query cases
SELECT * FROM cases;
-- Should ONLY see cases created by this user
```

**Expected:** User sees ONLY their own cases

### Test 2: Manager (GROUP Scope)

**Setup:**
1. Create user: `manager@test.com`
2. Assign to group: "Manager"
3. Add other users to same group
4. Login as manager

**Test:**
```sql
-- Query cases
SELECT * FROM cases;
-- Should see all cases from the manager's group
```

**Expected:** Manager sees all group's cases

### Test 3: Admin (ALL Scope)

**Setup:**
1. Create user: `admin@test.com`
2. Assign to group: "Super Admin"
3. Login as admin

**Test:**
```sql
-- Query cases
SELECT * FROM cases;
-- Should see ALL cases in system
```

**Expected:** Admin sees everything

### Test 4: Specialized Actions

**Test Allocate Permission:**
```sql
-- As Case Officer (should FAIL)
UPDATE cases SET assigned_to = 'another_user_id';
-- ERROR: Permission denied

-- As Manager (should SUCCEED)
UPDATE cases SET assigned_to = 'another_user_id';
-- SUCCESS
```

### Test 5: Cross-Group Isolation

**Setup:**
1. Create Group A and Group B
2. User A in Group A creates case
3. User B in Group B tries to access

**Expected:** User B CANNOT see User A's case

---

## 🐛 TROUBLESHOOTING

### Issue: User Can't See ANY Cases

**Diagnosis:**
```sql
-- Check user's groups
SELECT * FROM user_groups WHERE user_id = '[user_id]';

-- Check scope rules for those groups
SELECT * FROM group_scope_rules
WHERE group_id IN (SELECT group_id FROM user_groups WHERE user_id = '[user_id]');
```

**Fix:** Assign user to a group with scope rules

### Issue: User Can See ALL Cases (Should Only See OWN)

**Diagnosis:**
```sql
-- Check if user has ALL scope
SELECT ds.code
FROM group_scope_rules gsr
JOIN data_scopes ds ON ds.id = gsr.scope_id
WHERE gsr.group_id IN (
  SELECT group_id FROM user_groups WHERE user_id = '[user_id]'
);
```

**Fix:** Remove ALL scope, add OWN scope instead

### Issue: RLS Blocking Service Role

**Symptom:** Admin operations failing

**Fix:**
```sql
-- Service role should bypass RLS
-- Check policies allow service_role
```

### Issue: Scope Function Failing

**Diagnosis:**
```sql
-- Test function directly
SELECT user_can_access_case('[user_id]', '[case_id]');
```

**Fix:** Check function logs, verify case ownership columns populated

---

## 📚 REFERENCE

### SQL Files

| File | Purpose | When to Run |
|------|---------|-------------|
| `database-rbac-schema.sql` | Base RBAC | Initial setup (DONE) |
| `RBAC_DISCOVERY_SUPABASE.sql` | Discovery | Before enhancement |
| `RBAC_PHASE_B_ENHANCED_SCHEMA.sql` | Data Scope | NOW (main deployment) |

### Key Functions

| Function | Purpose |
|----------|---------|
| `user_can_access_case(user_id, case_id)` | Check scope access |
| `user_has_permission(user_id, module, action)` | Check RBAC permission |
| `get_user_permissions(user_id)` | Get all user permissions |

### Admin Pages

| URL | Purpose |
|-----|---------|
| `/admin/groups` | Manage groups & permissions |
| `/admin/users` | Manage users |
| `/admin/master-files` | Manage lookup tables |

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Backup database
- [ ] Review discovery report
- [ ] Confirm existing RBAC tables
- [ ] Identify test users

### Deployment

- [ ] Run `RBAC_PHASE_B_ENHANCED_SCHEMA.sql`
- [ ] Verify success message
- [ ] Check data scopes created
- [ ] Check scope rules seeded
- [ ] Verify RLS enabled on cases

### Post-Deployment

- [ ] Test as basic user (OWN scope)
- [ ] Test as manager (GROUP scope)
- [ ] Test as admin (ALL scope)
- [ ] Test specialized actions (Allocate, Recommend)
- [ ] Verify audit logs working
- [ ] Train administrators
- [ ] Document any custom scopes added

---

## 🎓 TRAINING MATERIALS

### For Administrators

**Topic 1: Understanding Scopes**
- OWN = User's records only
- GROUP = Team's records
- ALL = Everything

**Topic 2: Assigning Permissions**
- Group → Permissions (CRUD + actions)
- Group → Scope (data access)
- User → Group (membership)

**Topic 3: Troubleshooting Access Issues**
- Check user's groups
- Check group's scopes
- Check group's permissions

### For Developers

**API Integration:**
```typescript
import { usePermissions } from '@/components/rbac/usePermissions';

const { canCreate, canRead, canUpdate, canDelete } =
  usePermissions('case_management');

if (!canCreate) {
  // Hide create button
}
```

**Backend Checks:**
```typescript
// RLS handles scope automatically
const { data } = await supabase.from('cases').select('*');
// User only sees cases they have scope for
```

---

## 🚀 NEXT STEPS

1. ✅ **Deploy Phase B Schema** (READY NOW)
2. ⏳ **Update Admin Console** for scope management UI
3. ⏳ **Create User Manual** with screenshots
4. ⏳ **Conduct User Training**
5. ⏳ **Monitor Audit Logs**

---

## 📞 SUPPORT

**For Issues:**
- Check troubleshooting section
- Review audit logs
- Verify scope rules

**For Questions:**
- Refer to this guide
- Check discovery report
- Review schema SQL comments

---

**END OF IMPLEMENTATION GUIDE**

**Status:** ✅ Ready for Production Deployment
**Version:** 2.0 Enhanced RBAC + Data Scope
**Last Updated:** Today

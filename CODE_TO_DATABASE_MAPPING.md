# Code to Database Mapping Analysis
## DLPP Legal Case Management System

**Date**: December 23, 2025
**Purpose**: Verify code-to-database relationships after restore
**Status**: Comprehensive System Audit

---

## 📊 Database Tables Required

### CORE SYSTEM TABLES (12 tables)

1. **`profiles`** - User accounts and authentication
2. **`cases`** - Legal case records
3. **`parties`** - Individuals/entities involved in cases
4. **`documents`** - Case documents and attachments
5. **`tasks`** - Task assignments and tracking
6. **`events`** - Calendar events and hearings
7. **`land_parcels`** - Land parcel information
8. **`case_history`** - Audit trail for case changes
9. **`notifications`** - System notifications
10. **`case_comments`** - Comments and discussions
11. **`executive_workflow`** - Executive review workflow
12. **`case_assignments`** - Case officer assignments

### RBAC SYSTEM TABLES (6 tables)

13. **`user_groups`** - User group definitions
14. **`system_modules`** - System module registry
15. **`permissions`** - Permission definitions
16. **`group_module_access`** - Group-to-module permissions
17. **`user_group_membership`** - User-to-group assignments
18. **`rbac_audit_log`** - RBAC change history

**TOTAL: 18 Tables Required**

---

## 🔗 Code-to-Table Relationships

### 1. Authentication & User Management

**Files**:
- `src/app/login/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/components/admin/AddUserDialog.tsx`
- `src/components/admin/EditUserDialog.tsx`
- `src/app/api/admin/users/create/route.ts`

**Tables Used**:
- ✅ `profiles` (PRIMARY)
  - Columns: id, email, full_name, role, department, phone

**Business Logic**:
- User login authentication
- User profile management
- Role-based access control
- User creation and editing

---

### 2. Case Management

**Files**:
- `src/app/cases/page.tsx` (case list)
- `src/app/cases/[id]/page.tsx` (case details)
- `src/app/cases/new/page.tsx` (new case)
- `src/app/cases/create-minimal/page.tsx` (quick create)
- `src/app/api/cases/register/route.ts`
- `src/components/forms/EditCaseDialog.tsx`

**Tables Used**:
- ✅ `cases` (PRIMARY)
  - Columns: id, case_number, title, description, status, case_type, priority, region, assigned_officer_id, created_by, court_file_number, etc.
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: cases.assigned_officer_id → profiles.id
  - Relationship: cases.created_by → profiles.id
- ✅ `case_history` (DEPENDENT)
  - Relationship: case_history.case_id → cases.id
- ✅ `notifications` (DEPENDENT)
  - Relationship: notifications.case_id → cases.id

**Business Logic**:
- Case registration and creation
- Case status management
- Case assignment to officers
- Case search and filtering
- Case detail viewing
- Audit trail generation

---

### 3. Parties Management

**Files**:
- `src/app/cases/[id]/page.tsx` (parties tab)
- `src/components/forms/AddPartyDialog.tsx`
- `src/components/forms/EditPartyDialog.tsx`

**Tables Used**:
- ✅ `parties` (PRIMARY)
  - Columns: id, case_id, name, party_type, role, contact_info
- ✅ `cases` (FOREIGN KEY)
  - Relationship: parties.case_id → cases.id

**Business Logic**:
- Add parties to cases
- Edit party information
- View parties involved in cases
- Store contact information (JSONB)

---

### 4. Document Management

**Files**:
- `src/app/documents/page.tsx`
- `src/app/cases/[id]/page.tsx` (documents tab)
- `src/components/forms/AddDocumentDialog.tsx`
- `src/components/forms/EditDocumentDialog.tsx`
- `src/components/forms/DocumentUpload.tsx`

**Tables Used**:
- ✅ `documents` (PRIMARY)
  - Columns: id, case_id, title, description, file_url, file_type, file_size, document_type, uploaded_by
- ✅ `cases` (FOREIGN KEY)
  - Relationship: documents.case_id → cases.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: documents.uploaded_by → profiles.id

**Business Logic**:
- Document upload and storage
- Document categorization
- Version control
- Document download
- Document search

---

### 5. Task Management

**Files**:
- `src/app/tasks/page.tsx`
- `src/app/cases/[id]/page.tsx` (tasks tab)
- `src/components/forms/AddTaskDialog.tsx`
- `src/components/forms/EditTaskDialog.tsx`

**Tables Used**:
- ✅ `tasks` (PRIMARY)
  - Columns: id, case_id, title, description, assigned_to, due_date, status, priority, created_by
- ✅ `cases` (FOREIGN KEY)
  - Relationship: tasks.case_id → cases.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: tasks.assigned_to → profiles.id
  - Relationship: tasks.created_by → profiles.id

**Business Logic**:
- Task creation and assignment
- Task status tracking
- Due date management
- Task completion
- Task filtering by status/priority

---

### 6. Calendar & Events

**Files**:
- `src/app/calendar/page.tsx`
- `src/app/cases/[id]/page.tsx` (events tab)
- `src/components/forms/AddEventDialog.tsx`
- `src/components/forms/EditEventDialog.tsx`

**Tables Used**:
- ✅ `events` (PRIMARY)
  - Columns: id, case_id, event_type, title, description, event_date, location, reminder_sent, auto_created, created_by
- ✅ `cases` (FOREIGN KEY)
  - Relationship: events.case_id → cases.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: events.created_by → profiles.id

**Business Logic**:
- Event scheduling
- Hearing reminders
- Deadline tracking
- Calendar view (month/week)
- Event notifications

---

### 7. Land Parcels Management

**Files**:
- `src/app/land-parcels/page.tsx`
- `src/app/cases/[id]/page.tsx` (land parcels tab)
- `src/components/forms/AddLandParcelDialog.tsx`
- `src/components/forms/EditLandParcelDialog.tsx`
- `src/components/maps/ParcelMap.tsx`

**Tables Used**:
- ✅ `land_parcels` (PRIMARY)
  - Columns: id, case_id, parcel_number, location, coordinates, area_sqm, survey_plan_url, notes
- ✅ `cases` (FOREIGN KEY)
  - Relationship: land_parcels.case_id → cases.id

**Business Logic**:
- Land parcel registration
- GIS coordinates storage (JSONB)
- Map visualization
- Survey plan linking
- Area calculations

---

### 8. Notifications System

**Files**:
- `src/app/notifications/page.tsx`
- `src/lib/notification-utils.ts`
- All API routes that create notifications

**Tables Used**:
- ✅ `notifications` (PRIMARY)
  - Columns: id, user_id, case_id, title, message, type, priority, read, read_at, action_required, action_url, metadata
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: notifications.user_id → profiles.id
- ✅ `cases` (FOREIGN KEY)
  - Relationship: notifications.case_id → cases.id

**Business Logic**:
- Notification creation
- Notification delivery
- Read/unread tracking
- Action items
- Notification filtering

---

### 9. Comments & Discussions

**Files**:
- `src/app/cases/[id]/page.tsx` (comments tab)
- `src/components/forms/CaseCommentsSection.tsx`

**Tables Used**:
- ✅ `case_comments` (PRIMARY)
  - Columns: id, case_id, user_id, comment, comment_type, is_private, parent_comment_id, attachments, workflow_stage, requires_response
- ✅ `cases` (FOREIGN KEY)
  - Relationship: case_comments.case_id → cases.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: case_comments.user_id → profiles.id
- ✅ `case_comments` (SELF-REFERENCE)
  - Relationship: case_comments.parent_comment_id → case_comments.id (for threaded comments)

**Business Logic**:
- Comment posting
- Threaded discussions
- Private/public comments
- Attachment support (JSONB)
- Workflow integration

---

### 10. Executive Workflow

**Files**:
- `src/app/executive/review/page.tsx`
- `src/app/api/executive/advice/route.ts`
- `src/app/api/cases/register/route.ts` (triggers workflow)

**Tables Used**:
- ✅ `executive_workflow` (PRIMARY)
  - Columns: id, case_id, stage, officer_role, officer_id, officer_name, action_taken, commentary, advice, instructions, recommendations, metadata, is_new_case
- ✅ `cases` (FOREIGN KEY)
  - Relationship: executive_workflow.case_id → cases.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: executive_workflow.officer_id → profiles.id
- ✅ `notifications` (DEPENDENT)
  - Created when workflow stages trigger
- ✅ `case_comments` (DEPENDENT)
  - Executive advice stored as comments

**Business Logic**:
- Automated executive notifications
- Workflow stage tracking
- Executive advice and commentary
- Case assignment workflow
- Workflow status monitoring

---

### 11. Case Assignments

**Files**:
- `src/app/allocation/page.tsx`
- `src/app/api/cases/assign/route.ts`

**Tables Used**:
- ✅ `case_assignments` (PRIMARY)
  - Columns: id, case_id, assigned_to, assigned_by, assigned_to_name, assigned_by_name, assignment_type, instructions, executive_commentary, secretary_advice, director_guidance, manager_instructions
- ✅ `cases` (FOREIGN KEY)
  - Relationship: case_assignments.case_id → cases.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: case_assignments.assigned_to → profiles.id
  - Relationship: case_assignments.assigned_by → profiles.id

**Business Logic**:
- Formal case assignments
- Assignment tracking
- Executive input compilation
- Assignment notifications
- Assignment history

---

### 12. RBAC - User Groups

**Files**:
- `src/app/admin/rbac/page.tsx`
- `src/app/admin/user-groups/page.tsx`
- `src/app/api/rbac/groups/route.ts`

**Tables Used**:
- ✅ `user_groups` (PRIMARY)
  - Columns: id, group_name, group_code, description, is_active, created_by
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: user_groups.created_by → profiles.id

**Business Logic**:
- Group creation and management
- Group activation/deactivation
- Group description and metadata
- Group code uniqueness

---

### 13. RBAC - System Modules

**Files**:
- `src/app/admin/rbac/page.tsx`
- `src/app/api/rbac/modules/route.ts`

**Tables Used**:
- ✅ `system_modules` (PRIMARY)
  - Columns: id, module_name, module_code, description, module_url, icon, parent_module_id, display_order, is_active
- ✅ `system_modules` (SELF-REFERENCE)
  - Relationship: system_modules.parent_module_id → system_modules.id (for module hierarchy)

**Business Logic**:
- Module registry
- Module hierarchy
- Module activation
- Module URL mapping

---

### 14. RBAC - Access Control

**Files**:
- `src/app/admin/rbac/page.tsx` (permissions dialog)
- `src/app/api/rbac/access/route.ts`
- `src/lib/access-control.ts`

**Tables Used**:
- ✅ `group_module_access` (PRIMARY)
  - Columns: id, group_id, module_id, can_view, can_create, can_edit, can_delete, can_admin, granted_by
- ✅ `user_groups` (FOREIGN KEY)
  - Relationship: group_module_access.group_id → user_groups.id
- ✅ `system_modules` (FOREIGN KEY)
  - Relationship: group_module_access.module_id → system_modules.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: group_module_access.granted_by → profiles.id

**Business Logic**:
- Permission assignment
- Access checking
- CRUD permission management
- Permission inheritance

---

### 15. RBAC - Group Membership

**Files**:
- `src/app/admin/rbac/page.tsx` (members dialog)
- `src/app/api/rbac/members/route.ts`

**Tables Used**:
- ✅ `user_group_membership` (PRIMARY)
  - Columns: id, user_id, group_id, assigned_by, assigned_at, is_active
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: user_group_membership.user_id → profiles.id
  - Relationship: user_group_membership.assigned_by → profiles.id
- ✅ `user_groups` (FOREIGN KEY)
  - Relationship: user_group_membership.group_id → user_groups.id

**Business Logic**:
- User-to-group assignment
- Membership activation/deactivation
- Membership tracking
- Assignment history

---

### 16. RBAC - Audit Log

**Files**:
- All RBAC API routes
- `src/app/api/rbac/groups/route.ts`
- `src/app/api/rbac/access/route.ts`
- `src/app/api/rbac/members/route.ts`

**Tables Used**:
- ✅ `rbac_audit_log` (PRIMARY)
  - Columns: id, action, entity_type, entity_id, changed_by, old_value, new_value, ip_address, user_agent, created_at
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: rbac_audit_log.changed_by → profiles.id

**Business Logic**:
- Change tracking
- Audit trail
- Security logging
- Compliance reporting

---

### 17. Dashboard & Reports

**Files**:
- `src/app/dashboard/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/api/dashboard/stats/route.ts`
- `src/lib/report-utils.ts`

**Tables Used**:
- ✅ `cases` (statistics)
- ✅ `tasks` (task counts)
- ✅ `events` (upcoming events)
- ✅ `profiles` (user stats)
- ✅ `documents` (document counts)
- ✅ `case_assignments` (assignment stats)

**Business Logic**:
- Dashboard statistics
- Report generation
- Data aggregation
- Chart data preparation

---

### 18. Case History / Audit Trail

**Files**:
- Triggered by changes in case-related tables
- `src/app/cases/[id]/page.tsx` (history tab)

**Tables Used**:
- ✅ `case_history` (PRIMARY)
  - Columns: id, case_id, action, description, performed_by, metadata, created_at
- ✅ `cases` (FOREIGN KEY)
  - Relationship: case_history.case_id → cases.id
- ✅ `profiles` (FOREIGN KEY)
  - Relationship: case_history.performed_by → profiles.id

**Business Logic**:
- Change tracking
- Action logging
- Audit compliance
- History display

---

## 🔍 Database Functions Required

### Executive Workflow Functions

1. **`get_executive_officers()`**
   - Used by: `src/app/api/cases/register/route.ts`
   - Purpose: Get list of executive officers
   - Returns: Table of officer profiles

2. **`notify_executive_officers(...)`**
   - Used by: `src/app/api/cases/register/route.ts`
   - Purpose: Send notifications to all executive officers
   - Parameters: case details
   - Returns: Count of notifications sent

3. **`initialize_executive_workflow(...)`**
   - Used by: `src/app/api/cases/register/route.ts`
   - Purpose: Create workflow entries for executives
   - Parameters: case_id, is_new_case, case_summary

### RBAC Functions (Optional but Recommended)

4. **`user_has_module_access(...)`**
   - Used by: Access control middleware
   - Purpose: Check if user can access a module
   - Parameters: user_id, module_code, permission_type

5. **`get_user_accessible_modules(...)`**
   - Used by: Navigation generation
   - Purpose: Get all modules user can access
   - Parameters: user_id

---

## 📋 Database Views Required

### Executive Workflow Views

1. **`executive_workflow_summary`**
   - Used by: `src/app/executive/review/page.tsx`
   - Purpose: Summary of workflow status per case
   - Columns: case_id, case_number, title, workflow_entries, pending_reviews, completed_reviews

2. **`pending_executive_reviews`**
   - Used by: `src/app/executive/review/page.tsx`
   - Purpose: List of cases pending executive review
   - Columns: workflow_id, case_id, case_number, stage, officer_role, days_pending

3. **`case_assignment_status`**
   - Used by: `src/app/allocation/page.tsx`
   - Purpose: Assignment tracking and status
   - Columns: assignment_id, case_id, case_number, assigned_to_name, status, days_since_assignment

---

## ⚠️ Critical Foreign Key Relationships

```
profiles (root table - no foreign keys)
    ↓
    ├── cases.assigned_officer_id → profiles.id
    ├── cases.created_by → profiles.id
    ├── documents.uploaded_by → profiles.id
    ├── tasks.assigned_to → profiles.id
    ├── tasks.created_by → profiles.id
    ├── events.created_by → profiles.id
    ├── notifications.user_id → profiles.id
    ├── case_comments.user_id → profiles.id
    ├── case_history.performed_by → profiles.id
    ├── executive_workflow.officer_id → profiles.id
    ├── case_assignments.assigned_to → profiles.id
    ├── case_assignments.assigned_by → profiles.id
    ├── user_groups.created_by → profiles.id
    ├── user_group_membership.user_id → profiles.id
    ├── user_group_membership.assigned_by → profiles.id
    ├── group_module_access.granted_by → profiles.id
    └── rbac_audit_log.changed_by → profiles.id

cases (central table)
    ↓
    ├── parties.case_id → cases.id
    ├── documents.case_id → cases.id
    ├── tasks.case_id → cases.id
    ├── events.case_id → cases.id
    ├── land_parcels.case_id → cases.id
    ├── case_history.case_id → cases.id
    ├── notifications.case_id → cases.id
    ├── case_comments.case_id → cases.id
    ├── executive_workflow.case_id → cases.id
    └── case_assignments.case_id → cases.id

user_groups
    ↓
    ├── user_group_membership.group_id → user_groups.id
    └── group_module_access.group_id → user_groups.id

system_modules
    ↓
    ├── group_module_access.module_id → system_modules.id
    └── system_modules.parent_module_id → system_modules.id (self)

case_comments
    ↓
    └── case_comments.parent_comment_id → case_comments.id (self)
```

---

## 🚨 What Happens if Tables Are Missing

### Missing: `profiles`
**Impact**: ❌ CRITICAL - System completely broken
- Cannot login
- Cannot create users
- Cannot assign tasks/cases
- All foreign keys will fail

### Missing: `cases`
**Impact**: ❌ CRITICAL - Core functionality broken
- Cannot manage cases
- Cannot create documents/tasks/events
- Dashboard will fail
- Reports will fail

### Missing: `parties`, `documents`, `tasks`, `events`, `land_parcels`
**Impact**: ⚠️ HIGH - Major features broken
- Related modules will not work
- Case detail page will show errors
- Users cannot complete workflows

### Missing: `notifications`, `case_comments`, `case_history`
**Impact**: ⚠️ MEDIUM - Important features broken
- No notifications to users
- No discussion threads
- No audit trail

### Missing: `executive_workflow`, `case_assignments`
**Impact**: ⚠️ MEDIUM - Workflow features broken
- No executive oversight
- No formal assignments
- Manual workarounds needed

### Missing: RBAC tables (`user_groups`, `system_modules`, etc.)
**Impact**: ⚠️ LOW-MEDIUM - RBAC features broken
- No granular permissions
- Falls back to role-based access
- RBAC admin pages will error

---

## ✅ Verification Checklist

After database restore, verify:

- [ ] All 18 tables exist
- [ ] All foreign key constraints exist
- [ ] All 3 required functions exist
- [ ] All 3 required views exist
- [ ] RLS policies are enabled
- [ ] Indexes are created
- [ ] Extension `uuid-ossp` is enabled
- [ ] No orphaned records (foreign key violations)
- [ ] Default RBAC data loaded (7 groups, 18 modules)
- [ ] Critical columns present

**Run**: `COMPLETE_DATABASE_VERIFICATION.sql` to automate this check!

---

## 📝 Restoration Instructions

If verification fails, run scripts in this order:

1. **`FRESH_DATABASE_SETUP.sql`** - Core system (12 tables + functions + views)
2. **`database-rbac-system.sql`** - RBAC system (6 tables + seed data)
3. **`COMPLETE_DATABASE_VERIFICATION.sql`** - Verify everything

**Total time**: 5-10 minutes

---

## 🎯 Summary

**Total Code Files**: ~50+ files
**Total Database Tables**: 18 tables
**Total Functions**: 5 functions
**Total Views**: 3 views
**Foreign Key Relationships**: 25+ relationships

**Every piece of code** in this system has a corresponding database table.
**Every database table** is actively used by the application code.

**System Integrity**: ✅ Fully mapped and documented

---

**Date Created**: December 23, 2025
**Created For**: Database restoration verification
**Status**: Complete documentation

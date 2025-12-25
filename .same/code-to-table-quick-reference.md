# Code to Database Table - Quick Reference
**Last Updated**: December 26, 2025
**All tables now use `legal_` prefix**

---

## 🗂️ Table Reference by Feature

### Authentication & Users
**Route**: `/login`, `/admin/users`
**Tables Used**:
- `legal_profiles` - User accounts, roles, authentication

**Example Code**:
```typescript
await supabase.from('legal_profiles').select('*')
```

---

### Cases Management
**Routes**: `/cases`, `/cases/[id]`, `/cases/new`, `/cases/create-minimal`
**Tables Used**:
- `legal_cases` - Case records
- `legal_case_history` - Audit trail
- `legal_notifications` - Case notifications

**Example Code**:
```typescript
await supabase.from('legal_cases')
  .select(`
    *,
    assigned_officer:legal_profiles!legal_cases_assigned_officer_id_fkey(*)
  `)
```

---

### Parties
**Route**: `/cases/[id]` (Parties tab)
**Tables Used**:
- `legal_parties` - Parties involved in cases
- `legal_cases` - Parent case

**Example Code**:
```typescript
await supabase.from('legal_parties')
  .select('*, legal_cases(*)')
  .eq('case_id', caseId)
```

---

### Documents
**Routes**: `/documents`, `/cases/[id]` (Documents tab)
**Tables Used**:
- `legal_documents` - Document metadata
- `legal_cases` - Parent case
- `legal_profiles` - Uploaded by user

**Example Code**:
```typescript
await supabase.from('legal_documents')
  .select(`
    *,
    legal_cases(case_number, title),
    uploaded_by:legal_profiles(full_name)
  `)
```

---

### Tasks
**Routes**: `/tasks`, `/cases/[id]` (Tasks tab)
**Tables Used**:
- `legal_tasks` - Task records
- `legal_cases` - Parent case
- `legal_profiles` - Assigned to, created by

**Example Code**:
```typescript
await supabase.from('legal_tasks')
  .select(`
    *,
    legal_cases(*),
    assigned_to:legal_profiles!legal_tasks_assigned_to_fkey(*),
    created_by:legal_profiles!legal_tasks_created_by_fkey(*)
  `)
```

---

### Calendar & Events
**Routes**: `/calendar`, `/cases/[id]` (Events tab)
**Tables Used**:
- `legal_events` - Calendar events
- `legal_cases` - Parent case
- `legal_profiles` - Created by

**Example Code**:
```typescript
await supabase.from('legal_events')
  .select('*, legal_cases(*), legal_profiles(*)')
  .gte('event_date', startDate)
```

---

### Land Parcels
**Routes**: `/land-parcels`, `/cases/[id]` (Land tab)
**Tables Used**:
- `legal_land_parcels` - Parcel information
- `legal_cases` - Parent case

**Example Code**:
```typescript
await supabase.from('legal_land_parcels')
  .select('*, legal_cases(*)')
  .eq('case_id', caseId)
```

---

### Notifications
**Route**: `/notifications`
**Tables Used**:
- `legal_notifications` - User notifications
- `legal_cases` - Related case
- `legal_profiles` - Recipient

**Example Code**:
```typescript
await supabase.from('legal_notifications')
  .select(`
    *,
    legal_cases(case_number, title),
    user:legal_profiles(full_name)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

---

### Comments & Discussions
**Route**: `/cases/[id]` (Comments tab)
**Tables Used**:
- `legal_case_comments` - Comments
- `legal_cases` - Parent case
- `legal_profiles` - Comment author

**Example Code**:
```typescript
await supabase.from('legal_case_comments')
  .select(`
    *,
    legal_cases(*),
    user:legal_profiles(full_name, role)
  `)
  .eq('case_id', caseId)
```

---

### Executive Workflow
**Route**: `/executive/review`
**Tables Used**:
- `legal_executive_workflow` - Workflow records
- `legal_cases` - Case being reviewed
- `legal_profiles` - Executive officer

**Example Code**:
```typescript
await supabase.from('legal_executive_workflow')
  .select(`
    *,
    legal_cases(case_number, title, court_file_number),
    officer:legal_profiles(full_name, role)
  `)
  .eq('status', 'pending')
```

---

### Case Assignments
**Route**: `/allocation`
**Tables Used**:
- `legal_case_assignments` - Assignment records
- `legal_cases` - Case being assigned
- `legal_profiles` - Assigned to, assigned by

**Example Code**:
```typescript
await supabase.from('legal_case_assignments')
  .select(`
    *,
    legal_cases(*),
    assigned_to:legal_profiles!legal_case_assignments_assigned_to_fkey(*),
    assigned_by:legal_profiles!legal_case_assignments_assigned_by_fkey(*)
  `)
```

---

### Dashboard & Statistics
**Route**: `/dashboard`, `/admin`
**Tables Used** (Read from multiple):
- `legal_cases` - Case counts
- `legal_tasks` - Task counts
- `legal_events` - Upcoming events
- `legal_documents` - Document counts
- `legal_profiles` - User counts

**Example Code**:
```typescript
const [casesCount] = await supabase
  .from('legal_cases')
  .select('*', { count: 'exact', head: true })

const [tasksCount] = await supabase
  .from('legal_tasks')
  .select('*', { count: 'exact', head: true })
```

---

### RBAC System
**Route**: `/admin/rbac`
**Tables Used**:
- `legal_user_groups` - User groups
- `legal_system_modules` - System modules
- `legal_permissions` - Permissions (not currently used)
- `legal_group_module_access` - Group-to-module permissions
- `legal_user_group_membership` - User-to-group assignments
- `legal_rbac_audit_log` - Change history

**Example Code**:
```typescript
// Get all groups
await supabase.from('legal_user_groups')
  .select('*')
  .eq('is_active', true)

// Get modules with access
await supabase.from('legal_group_module_access')
  .select(`
    *,
    group:legal_user_groups(*),
    module:legal_system_modules(*)
  `)
  .eq('group_id', groupId)

// Get user memberships
await supabase.from('legal_user_group_membership')
  .select(`
    *,
    user:legal_profiles(*),
    group:legal_user_groups(*)
  `)
  .eq('is_active', true)
```

---

### User Management
**Route**: `/admin/users`
**Tables Used**:
- `legal_profiles` - User accounts
- `legal_user_group_membership` - User group memberships

**Example Code**:
```typescript
await supabase.from('legal_profiles')
  .select(`
    *,
    memberships:legal_user_group_membership(
      *,
      group:legal_user_groups(*)
    )
  `)
```

---

## 🔗 Foreign Key Relationships

### Primary Dependencies
```
legal_profiles (root)
    ↓
    ├── legal_cases.assigned_officer_id → legal_profiles.id
    ├── legal_cases.created_by → legal_profiles.id
    ├── legal_documents.uploaded_by → legal_profiles.id
    ├── legal_tasks.assigned_to → legal_profiles.id
    ├── legal_tasks.created_by → legal_profiles.id
    ├── legal_events.created_by → legal_profiles.id
    ├── legal_notifications.user_id → legal_profiles.id
    ├── legal_case_comments.user_id → legal_profiles.id
    ├── legal_case_history.performed_by → legal_profiles.id
    ├── legal_executive_workflow.officer_id → legal_profiles.id
    ├── legal_case_assignments.assigned_to → legal_profiles.id
    ├── legal_case_assignments.assigned_by → legal_profiles.id
    ├── legal_user_groups.created_by → legal_profiles.id
    ├── legal_user_group_membership.user_id → legal_profiles.id
    ├── legal_user_group_membership.assigned_by → legal_profiles.id
    ├── legal_group_module_access.granted_by → legal_profiles.id
    └── legal_rbac_audit_log.changed_by → legal_profiles.id
```

### Case Dependencies
```
legal_cases
    ↓
    ├── legal_parties.case_id → legal_cases.id
    ├── legal_documents.case_id → legal_cases.id
    ├── legal_tasks.case_id → legal_cases.id
    ├── legal_events.case_id → legal_cases.id
    ├── legal_land_parcels.case_id → legal_cases.id
    ├── legal_case_history.case_id → legal_cases.id
    ├── legal_notifications.case_id → legal_cases.id
    ├── legal_case_comments.case_id → legal_cases.id
    ├── legal_executive_workflow.case_id → legal_cases.id
    └── legal_case_assignments.case_id → legal_cases.id
```

### RBAC Dependencies
```
legal_user_groups
    ↓
    ├── legal_user_group_membership.group_id → legal_user_groups.id
    └── legal_group_module_access.group_id → legal_user_groups.id

legal_system_modules
    ↓
    ├── legal_group_module_access.module_id → legal_system_modules.id
    └── legal_system_modules.parent_module_id → legal_system_modules.id (self)
```

---

## 📝 Common Query Patterns

### Get case with all related data
```typescript
const { data } = await supabase
  .from('legal_cases')
  .select(`
    *,
    assigned_officer:legal_profiles!legal_cases_assigned_officer_id_fkey(*),
    created_by_user:legal_profiles!legal_cases_created_by_fkey(*),
    parties:legal_parties(*),
    documents:legal_documents(*),
    tasks:legal_tasks(*),
    events:legal_events(*),
    land_parcels:legal_land_parcels(*),
    comments:legal_case_comments(*, user:legal_profiles(*)),
    workflow:legal_executive_workflow(*, officer:legal_profiles(*)),
    assignments:legal_case_assignments(*, assigned_to:legal_profiles(*))
  `)
  .eq('id', caseId)
  .single()
```

### Get user with permissions
```typescript
const { data } = await supabase
  .from('legal_profiles')
  .select(`
    *,
    memberships:legal_user_group_membership!inner(
      *,
      group:legal_user_groups!inner(
        *,
        access:legal_group_module_access(
          *,
          module:legal_system_modules(*)
        )
      )
    )
  `)
  .eq('id', userId)
  .eq('memberships.is_active', true)
  .single()
```

### Get pending tasks for user
```typescript
const { data } = await supabase
  .from('legal_tasks')
  .select(`
    *,
    legal_cases(case_number, title),
    created_by:legal_profiles(full_name)
  `)
  .eq('assigned_to', userId)
  .eq('status', 'pending')
  .order('due_date', { ascending: true })
```

---

## ⚡ Quick Table Lookup

| Feature | Primary Table | Related Tables |
|---------|--------------|----------------|
| Authentication | `legal_profiles` | - |
| Cases | `legal_cases` | All case-related tables |
| Parties | `legal_parties` | `legal_cases` |
| Documents | `legal_documents` | `legal_cases`, `legal_profiles` |
| Tasks | `legal_tasks` | `legal_cases`, `legal_profiles` |
| Calendar | `legal_events` | `legal_cases`, `legal_profiles` |
| Land | `legal_land_parcels` | `legal_cases` |
| Notifications | `legal_notifications` | `legal_cases`, `legal_profiles` |
| Comments | `legal_case_comments` | `legal_cases`, `legal_profiles` |
| Executive | `legal_executive_workflow` | `legal_cases`, `legal_profiles` |
| Assignments | `legal_case_assignments` | `legal_cases`, `legal_profiles` |
| RBAC Groups | `legal_user_groups` | `legal_profiles` |
| RBAC Modules | `legal_system_modules` | - |
| RBAC Access | `legal_group_module_access` | `legal_user_groups`, `legal_system_modules` |
| RBAC Membership | `legal_user_group_membership` | `legal_profiles`, `legal_user_groups` |

---

## 🔍 Finding Table References

### In Code
```bash
# Find all references to a specific table
grep -r "\.from('legal_cases')" src/

# Find all Supabase queries in a file
grep "\.from(" src/app/cases/page.tsx

# Count table references
grep -r "\.from('legal_" src/ | wc -l
```

### In Database
```sql
-- Get table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'legal_cases'
ORDER BY ordinal_position;

-- Get foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'legal_%';
```

---

**Quick Reference Guide**
**Version**: 2.0 (with `legal_` prefix)
**Last Updated**: December 26, 2025
**Status**: Current and Accurate

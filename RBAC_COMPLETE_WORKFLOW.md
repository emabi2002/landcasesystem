# Complete RBAC (Role-Based Access Control) Workflow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LEGAL CASE MANAGEMENT SYSTEM              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │     GROUP-BASED ACCESS CONTROL       │
        └─────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────┐                          ┌───────────────┐
│    GROUPS     │                          │    MODULES    │
├───────────────┤                          ├───────────────┤
│ Super Admin   │                          │ Case Mgmt     │
│ Manager       │                          │ Documents     │
│ Case Officer  │                          │ Tasks         │
│ Legal Clerk   │                          │ Calendar      │
│ Doc Clerk     │                          │ Reports       │
│ Viewer        │                          │ Finance       │
│ [Custom...]   │                          │ Admin         │
└───────┬───────┘                          └───────┬───────┘
        │                                           │
        └─────────────────┬─────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  GROUP_MODULE_PERMS   │
              ├───────────────────────┤
              │ ✓ Create              │
              │ ✓ Read                │
              │ ✓ Update              │
              │ ✓ Delete              │
              │ ✓ Print               │
              │ ✓ Approve             │
              │ ✓ Export              │
              └───────────┬───────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │     USERS     │
                  ├───────────────┤
                  │ john@dlpp.com │
                  │ jane@dlpp.com │
                  │ admin@...     │
                  └───────────────┘
```

---

## Step-by-Step Workflow

### Phase 1: Setup Groups and Permissions

#### 1.1 Create Groups
**Admin Panel → Groups → New Group**

```
Group: Case Officer
Description: Legal officers who handle case assignments
```

#### 1.2 Configure Module Permissions
**Click on the group → Permission Matrix**

| Module | Create | Read | Update | Delete | Print | Approve | Export |
|--------|--------|------|--------|--------|-------|---------|--------|
| Case Management | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Documents | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ |
| Tasks | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Calendar | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Reports | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |

#### 1.3 Save Permissions
Click **"Save Permissions"** button

---

### Phase 2: Create Users with Group Assignment

#### 2.1 Navigate to User Management
**Admin Panel → User Management → Create User**

#### 2.2 Fill User Details
```
Full Name: John Doe
Email: john.doe@dlpp.gov.pg
Password: SecurePass123!
Confirm Password: SecurePass123!
Department: Legal Services
```

#### 2.3 Select Group (MANDATORY)
```
Group: Case Officer ▼
```

#### 2.4 Review Permissions Preview
System shows:
```
┌────────────────────────────────────┐
│ Group Permissions Preview          │
├────────────────────────────────────┤
│ [Case Management +C +U +P +A +E]   │
│ [Documents +C +U +P +E]            │
│ [Tasks +C +U +D]                   │
│ [Calendar +C +U +D +P +E]          │
│ [Reports +P +E]                    │
└────────────────────────────────────┘
```

#### 2.5 Create User
- System creates auth account
- System assigns user to "Case Officer" group
- User inherits all group permissions
- Success: "User created and assigned to group successfully!"

---

### Phase 3: User Login and Access

#### 3.1 User Logs In
```
Email: john.doe@dlpp.gov.pg
Password: SecurePass123!
```

#### 3.2 System Checks Permissions
```javascript
// On each page load
1. Get current user ID
2. Query: SELECT groups FROM user_groups WHERE user_id = ?
3. Query: SELECT permissions FROM group_module_permissions WHERE group_id IN (...)
4. Build permission map
5. Show/hide UI elements based on permissions
```

#### 3.3 User Sees Personalized Interface

**Navigation Sidebar** (visible modules only)
```
✓ Dashboard
✓ Case Workflow
  ✓ Register Case (can_create)
  ✓ My Cases (can_read)
  ✓ Directions (can_update)
✓ Case Management
  ✓ Calendar (can_create, can_update)
  ✓ Tasks (can_create, can_update, can_delete)
  ✓ Documents (can_create, can_read)
✓ Reports (can_read, can_export)
✗ Finance (no access)
✗ Administration (no access)
```

**Action Buttons** (permission-based)
```
✓ Register New Case (can_create)
✓ Update Case Status (can_update)
✓ Upload Document (can_create)
✓ Export to PDF (can_export)
✗ Delete Case (no permission)
✗ Manage Users (no access to admin)
```

---

## Permission Inheritance and Merging

### Single Group
User has 1 group → Inherits that group's permissions

```
User: Jane Smith
Group: Legal Clerk
Permissions: Documents (C,R,U), Tasks (R), Cases (R)
```

### Multiple Groups
User has 2+ groups → **Permissions are MERGED (cumulative)**

```
User: John Manager
Groups:
  - Case Officer → Cases (C,R,U), Docs (C,R,U)
  - Manager → Cases (R,U,D), Reports (R,E,A)

Merged Permissions:
  - Cases: C, R, U, D (union of both)
  - Documents: C, R, U (from Case Officer)
  - Reports: R, E, A (from Manager)
```

---

## Real-World Example Scenarios

### Scenario A: New Employee - Document Clerk

**Step 1: Create Group**
```
Group Name: Document Clerk
Description: Handles document filing and organization
```

**Step 2: Set Permissions**
| Module | Permissions |
|--------|-------------|
| Documents | Create, Read, Update, Print |
| Tasks | Read |
| Cases | Read only |

**Step 3: Create User**
```
Name: Sarah Williams
Email: sarah.williams@dlpp.gov.pg
Group: Document Clerk
```

**Step 4: User Experience**
- Sarah logs in
- Can upload and edit documents
- Can view tasks assigned to her
- Can view case details (read-only)
- Cannot create cases or approve anything

---

### Scenario B: Promoted Staff - Add Responsibilities

**Existing:**
```
User: Michael Brown
Current Group: Document Clerk
```

**New Requirement:** Also manage team and approve documents

**Solution:**
1. Keep "Document Clerk" group (maintains current access)
2. Admin → User Management → Find Michael → Click "Assign Group"
3. Select "Team Lead" group
4. Michael now has merged permissions from both groups

**Result:**
```
Permissions (Before):
  Documents: C, R, U, P

Permissions (After):
  Documents: C, R, U, D, P, A (added Delete & Approve)
  Tasks: C, R, U, D (new - from Team Lead)
  Reports: R, E (new - from Team Lead)
```

---

### Scenario C: Temporary Access for Auditor

**Step 1: Create Restricted Group**
```
Group Name: External Auditor
Description: Read-only access for compliance reviews
```

**Step 2: Minimal Permissions**
| Module | Permissions |
|--------|-------------|
| Cases | Read only |
| Reports | Read, Export |
| All others | No access |

**Step 3: Create Temporary User**
```
Name: Audit Team
Email: auditor@external.com
Group: External Auditor
```

**Step 4: Revoke When Done**
- Remove user from group, OR
- Delete user account

---

## Security Best Practices

### ✅ Principle of Least Privilege
- **Always start with minimum permissions**
- Grant additional access only when needed
- Regular permission audits

### ✅ Separation of Duties
- Don't give case officers admin access
- Don't give clerks deletion rights
- Financial permissions separate from case management

### ✅ Audit Trail
```
WHO        WHAT                    WHEN
admin      Created group: Clerk    2026-03-01 10:00
admin      Assigned John → Clerk   2026-03-01 10:05
admin      Updated Clerk perms     2026-03-01 14:30
manager    Assigned Jane → Lead    2026-03-02 09:00
```

---

## Permission Enforcement Points

### 1. Frontend (UI/UX)
```typescript
// Hide/show buttons
{hasPermission('cases', 'create') && (
  <Button>Register New Case</Button>
)}

// Disable fields
<Input disabled={!hasPermission('cases', 'update')} />
```

### 2. Backend (API)
```typescript
// Verify before executing
if (!userHasPermission(userId, 'cases', 'delete')) {
  return { error: 'Unauthorized' };
}
```

### 3. Database (RLS - Future)
```sql
-- Row Level Security
CREATE POLICY user_group_access ON cases
  USING (
    created_group_id IN (
      SELECT group_id FROM user_groups WHERE user_id = auth.uid()
    )
  );
```

---

## Module Registry

### Complete Module List

| Module ID | Module Name | Description |
|-----------|-------------|-------------|
| `case_management` | Case Management | Register, assign, track cases |
| `documents` | Documents | Upload, organize, retrieve files |
| `tasks` | Tasks | Task assignments and tracking |
| `calendar` | Calendar | Events, hearings, deadlines |
| `correspondence` | Correspondence | Letters, emails, communications |
| `lawyers` | Lawyers | External counsel management |
| `land_parcels` | Land Parcels | Property records and maps |
| `filings` | Court Filings | Legal submissions |
| `finance` | Litigation Costs | Budget tracking, expenses |
| `reports` | Reports | Analytics and exports |
| `admin` | Administration | Users, groups, system config |

---

## Testing the RBAC System

### Test Case 1: Create User Without Group
**Expected:** Button disabled, error message
**Result:** ✓ Cannot submit form

### Test Case 2: Group Permission Changes
**Steps:**
1. Create user with Group A
2. User logs in, sees Module X
3. Admin removes Module X from Group A
4. User logs out and back in
5. Module X no longer visible

### Test Case 3: Multiple Group Merge
**Steps:**
1. Create user with Group A (Cases: Read)
2. Assign user to Group B (Cases: Create)
3. User now has Cases: Read + Create

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| User sees no modules | No groups assigned | Assign user to a group |
| Can't create user | No group selected | Select a group (mandatory) |
| Permissions not updating | Cache issue | Log out and back in |
| "Not authorized" errors | Missing permissions | Check group permissions |

---

## Summary: Complete Flow

```
1. SETUP
   └─ Create Groups
   └─ Configure Permissions per Module
   └─ Save

2. USER MANAGEMENT
   └─ Create User
   └─ Assign to Group (MANDATORY)
   └─ User inherits permissions

3. RUNTIME
   └─ User logs in
   └─ System loads group permissions
   └─ UI adapts to permissions
   └─ API enforces permissions

4. MAINTENANCE
   └─ Review group permissions regularly
   └─ Audit user-group assignments
   └─ Update as org structure changes
```

---

**Documentation Version:** 34
**Last Updated:** March 2026
**System Status:** ✅ Production Ready

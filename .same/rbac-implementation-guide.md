# RBAC Implementation Guide

## 🎯 Quick Start

The DLPP Legal Case Management System now has a fully-functional Role-Based Access Control (RBAC) system. This guide will help you implement permission checks in your pages and components.

## 📦 What's Included

### 1. Database Layer
- **Location**: `database-rbac-schema.sql`
- **Tables**: `groups`, `modules`, `group_module_permissions`, `user_groups`, `audit_logs`
- **Functions**: `user_has_permission()`, `get_user_permissions()`
- **Status**: ✅ Ready to run in Supabase

### 2. TypeScript Types
- **Location**: `src/lib/rbac-types.ts`
- **Exports**: `Group`, `Module`, `GroupModulePermission`, `UserGroup`, `PermissionAction`, etc.

### 3. Permission Utilities
- **Location**: `src/lib/permissions.ts`
- **Functions**:
  - `getUserPermissions()` - Get all user permissions
  - `hasPermission(moduleKey, action)` - Check single permission
  - `hasAnyPermission(moduleKey, actions[])` - Check if user has ANY of the permissions
  - `hasAllPermissions(moduleKey, actions[])` - Check if user has ALL permissions
  - `getModulePermissions(moduleKey)` - Get all permissions for a module
  - `logAudit(action, moduleKey, ...)` - Log user actions

### 4. React Components & Hooks
- **Location**: `src/components/rbac/`
- **Components**:
  - `PermissionGate` - Conditional rendering based on permissions
- **Hooks**:
  - `usePermissions(moduleKey)` - Get all permissions for a module
  - `useHasPermission(moduleKey, action)` - Check single permission
  - `useAllPermissions()` - Get all user permissions

### 5. Admin Pages
- **Group Management**: `src/app/admin/groups/page.tsx`
- **User Management**: `src/app/admin/users/page.tsx`

## 🚀 Implementation Steps

### Step 1: Run the Database Schema

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `database-rbac-schema.sql`
4. Run the script

This will create:
- ✅ 8 default groups (Super Admin, Case Officer, etc.)
- ✅ 23 modules (Dashboard, Cases, Reports, etc.)
- ✅ Full permissions for Super Admin
- ✅ Helper functions and RLS policies

### Step 2: Assign Users to Groups

1. Go to **/admin/users**
2. Click **"Assign Group"** for each user
3. Select one or more groups
4. Click **"Assign to Group"**

### Step 3: Configure Group Permissions

1. Go to **/admin/groups**
2. Select a group from the left panel
3. Toggle permissions in the matrix
4. Click **"Save Permissions"**

### Step 4: Implement Permission Checks

Choose one of the following methods:

#### Method A: Using the `PermissionGate` Component

```tsx
import { PermissionGate } from '@/components/rbac';

export default function CasesPage() {
  return (
    <AppLayout>
      <div>
        <h1>Cases</h1>

        {/* Only show if user can create cases */}
        <PermissionGate moduleKey="case_management" action="create">
          <Button onClick={handleCreateCase}>
            Create New Case
          </Button>
        </PermissionGate>

        {/* Only show if user can update OR delete */}
        <PermissionGate moduleKey="case_management" anyOf={['update', 'delete']}>
          <Button>Edit or Delete</Button>
        </PermissionGate>

        {/* Show fallback if no permission */}
        <PermissionGate
          moduleKey="case_management"
          action="delete"
          fallback={<p className="text-red-600">You don't have permission to delete</p>}
        >
          <Button variant="destructive">Delete</Button>
        </PermissionGate>
      </div>
    </AppLayout>
  );
}
```

#### Method B: Using the `usePermissions` Hook

```tsx
import { usePermissions } from '@/components/rbac';

export default function CasesPage() {
  const { canCreate, canUpdate, canDelete, loading } = usePermissions('case_management');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AppLayout>
      <div>
        <h1>Cases</h1>

        {canCreate && (
          <Button onClick={handleCreateCase}>
            Create New Case
          </Button>
        )}

        {canUpdate && <Button>Edit</Button>}
        {canDelete && <Button>Delete</Button>}
      </div>
    </AppLayout>
  );
}
```

#### Method C: Using Direct Permission Checks

```tsx
import { hasPermission } from '@/lib/permissions';

export default function CasesPage() {
  const handleDeleteCase = async () => {
    const canDelete = await hasPermission('case_management', 'delete');

    if (!canDelete) {
      toast.error('You don't have permission to delete cases');
      return;
    }

    // Proceed with deletion
    await deleteCase();
  };

  return <Button onClick={handleDeleteCase}>Delete</Button>;
}
```

## 🔍 Module Keys Reference

When checking permissions, use these module keys:

| Module Key | Description | Route |
|------------|-------------|-------|
| `dashboard` | Main dashboard | `/dashboard` |
| `case_registration` | Register new cases | `/cases/create-minimal` |
| `case_management` | Manage all cases | `/cases` |
| `directions` | Secretary/Director instructions | `/directions` |
| `case_allocation` | Assign cases to officers | `/allocation` |
| `litigation` | Litigation and filings | `/litigation` |
| `compliance_tracking` | Compliance tracking | `/compliance` |
| `case_closure` | Case closure | `/closure` |
| `calendar` | Events and deadlines | `/calendar` |
| `tasks` | Task management | `/tasks` |
| `documents` | Document repository | `/documents` |
| `land_parcels` | Land parcel info | `/land-parcels` |
| `communications` | Communication logs | `/communications` |
| `correspondence` | Incoming/outgoing correspondence | `/correspondence` |
| `file_requests` | File movement tracking | `/file-requests` |
| `lawyers` | External lawyer management | `/lawyers` |
| `filings` | Court filings | `/filings` |
| `litigation_costs` | Financial tracking | `/litigation-costs` |
| `reports` | Generate reports | `/reports` |
| `notifications` | System notifications | `/notifications` |
| `user_management` | Manage users | `/admin/users` |
| `group_management` | Manage groups | `/admin/groups` |
| `system_admin` | System configuration | `/admin` |

## 📊 Permission Actions

Each module can have the following permissions:

| Action | Description | Use Case |
|--------|-------------|----------|
| `create` | Add new records | Creating a new case |
| `read` | View records | Viewing case details |
| `update` | Modify existing records | Editing case information |
| `delete` | Remove records | Deleting a case |
| `print` | Generate printable reports | Printing case summary |
| `approve` | Approve/authorize actions | Approving case closure |
| `export` | Export data (Excel/PDF) | Exporting cases to Excel |

## 🛡️ Best Practices

### 1. Principle of Least Privilege
Grant users only the minimum permissions they need to perform their job.

```tsx
// ❌ BAD: Checking only 'read' when action requires 'update'
const canView = await hasPermission('case_management', 'read');
if (canView) {
  await updateCase(); // User might not have update permission!
}

// ✅ GOOD: Check the specific permission needed
const canUpdate = await hasPermission('case_management', 'update');
if (canUpdate) {
  await updateCase();
}
```

### 2. Client-Side AND Server-Side Checks

```tsx
// Client-side (UI protection)
<PermissionGate moduleKey="case_management" action="delete">
  <Button onClick={handleDelete}>Delete</Button>
</PermissionGate>

// Server-side (API protection)
// In /api/cases/[id]/route.ts
export async function DELETE(request: Request) {
  const canDelete = await hasPermission('case_management', 'delete');

  if (!canDelete) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Proceed with deletion
}
```

### 3. Audit Logging

Always log sensitive actions:

```tsx
import { logAudit } from '@/lib/permissions';

const handleDeleteCase = async (caseId: string) => {
  const canDelete = await hasPermission('case_management', 'delete');

  if (!canDelete) {
    toast.error('Permission denied');
    return;
  }

  await deleteCase(caseId);

  // Log the action
  await logAudit('delete', 'case_management', caseId, 'case', {
    reason: 'User requested deletion',
  });

  toast.success('Case deleted and action logged');
};
```

### 4. Graceful Degradation

Always provide fallback UI:

```tsx
<PermissionGate
  moduleKey="case_management"
  action="create"
  fallback={
    <Card className="p-6 bg-yellow-50 border-yellow-200">
      <p className="text-yellow-800">
        You don't have permission to create cases. Please contact your administrator.
      </p>
    </Card>
  }
>
  <CreateCaseForm />
</PermissionGate>
```

## 🧪 Testing Permissions

### Test Different User Roles

1. Create test users in **/admin/users**
2. Assign them to different groups
3. Log in as each user and verify:
   - Correct menu items are visible
   - Correct buttons are shown/hidden
   - API calls respect permissions

### Example Test Scenarios

| User Group | Should See | Should NOT See |
|------------|-----------|----------------|
| Super Admin | Everything | Nothing hidden |
| Case Officer | Create/Edit cases | Admin panel |
| Auditor | View all data | Edit/Delete buttons |
| Data Entry Clerk | Basic forms | Reports, admin |

## 🔧 Troubleshooting

### Issue: "Permission denied" even though user is in the right group

**Solution**:
1. Check if the group has the correct permissions in `/admin/groups`
2. User must **log out and log back in** for permission changes to take effect
3. Clear permissions cache: The system caches permissions for 5 minutes

### Issue: RLS policies preventing access

**Solution**:
- Ensure you're using the service role key for admin operations
- Check Supabase logs for RLS policy violations

### Issue: Module key not found

**Solution**:
- Verify the module exists in the `modules` table
- Use the correct `module_key` (not `module_name`)

## 📚 Additional Resources

- **RBAC Setup Instructions**: See `RBAC_SETUP_INSTRUCTIONS.md`
- **Database Schema**: See `database-rbac-schema.sql`
- **Permission Types**: See `src/lib/rbac-types.ts`
- **Admin UI**: Visit `/admin/groups` and `/admin/users`

## ✅ Implementation Checklist

- [ ] Run RBAC database schema in Supabase
- [ ] Create groups in **/admin/groups**
- [ ] Configure permissions for each group
- [ ] Assign users to groups in **/admin/users**
- [ ] Add `PermissionGate` components to pages
- [ ] Add permission checks to API routes
- [ ] Test with different user roles
- [ ] Add audit logging for sensitive actions
- [ ] Document role requirements for your team
- [ ] Train administrators on managing groups/users

---

**Last Updated**: February 2026
**RBAC Version**: 1.0

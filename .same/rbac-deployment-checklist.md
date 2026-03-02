# 🚀 RBAC System Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Implementation - COMPLETE
- [x] Database schema created (`database-rbac-schema.sql`)
- [x] TypeScript types defined (`src/lib/rbac-types.ts`)
- [x] Permission utilities created (`src/lib/permissions.ts`)
- [x] React components created:
  - [x] PermissionGate (`src/components/rbac/PermissionGate.tsx`)
  - [x] usePermissions hook (`src/components/rbac/usePermissions.ts`)
- [x] Admin pages created:
  - [x] Group Management (`src/app/admin/groups/page.tsx`)
  - [x] User Management (`src/app/admin/users/page.tsx`)
- [x] Example implementation on Cases page
- [x] Supabase types updated with RBAC tables
- [x] All TypeScript errors fixed
- [x] Documentation created

## 📋 Deployment Steps

### Step 1: Deploy Database Schema

**CRITICAL: This must be done first!**

1. Open your Supabase Dashboard: https://yvnkyjnwvylrweyzvibs.supabase.co
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Open `database-rbac-schema.sql` file
5. Copy entire contents (all ~500 lines)
6. Paste into SQL Editor
7. Click **"Run"** button
8. Wait for success message

**Verification:**
```sql
-- Run this query to verify installation
SELECT
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM modules) as modules_count,
    (SELECT COUNT(*) FROM group_module_permissions) as permissions_count;
```

Expected Results:
- `groups_count`: 8
- `modules_count`: 23
- `permissions_count`: Should show Super Admin permissions (161 rows = 23 modules × 7 permissions)

### Step 2: Create First Admin User

1. Log in to the application: http://localhost:3000/login
   - Email: `admin@lands.gov.pg`
   - Password: `demo123`

2. Navigate to **Administration** → **User Management**

3. You should see the admin user in the list

4. Click **"Assign Group"** for the admin user

5. Select **"Super Admin"** from dropdown

6. Click **"Assign to Group"**

7. **Important**: Log out and log back in for permissions to take effect

### Step 3: Configure Other Groups

1. Navigate to **Administration** → **Group Management**

2. Select a group from the left (e.g., "Case Officer")

3. Configure permissions in the matrix:
   - Toggle permissions for each module
   - Use the "All" column to quickly enable/disable all permissions
   - Click **"Save Permissions"**

4. Repeat for other groups:
   - **Case Officer**: Create/Read/Update cases, documents, tasks
   - **Auditor**: Read-only access to all modules
   - **Data Entry Clerk**: Create cases and documents only
   - **Legal Officer**: Full access to litigation, filings, compliance
   - **Manager**: Approve permissions, oversight access

### Step 4: Test Permissions

1. Create test users in **User Management** or use existing users

2. Assign users to different groups:
   - User A → Case Officer
   - User B → Auditor (read-only)
   - User C → Super Admin

3. Log in as each user and verify:
   - **Navigation**: Correct menu items visible
   - **Cases Page**:
     - Case Officer: Can see "Create New Case" button
     - Auditor: Can view cases but no create button
     - Super Admin: Full access
   - **Admin Pages**: Only Super Admin can access

4. Test permission enforcement:
   - Try to access pages without permission (should show "Access Denied")
   - Try to create/edit without permission (buttons should be hidden)

### Step 5: Deploy to Production

1. Commit all changes to GitHub:
   ```bash
   cd landcasesystem
   git add .
   git commit -m "feat: Implement RBAC system with group-based permissions"
   git push origin main
   ```

2. Deploy the database schema to production Supabase:
   - Repeat Step 1 on production Supabase instance

3. Verify deployment:
   - Check that all pages load correctly
   - Test permissions with different user roles
   - Check audit logs are being created

## 🔒 Security Checklist

- [ ] All API routes check permissions server-side
- [ ] Row Level Security (RLS) policies enabled on RBAC tables
- [ ] Audit logging enabled for sensitive actions
- [ ] Super Admin access limited to trusted administrators
- [ ] Regular permission audits scheduled (quarterly)
- [ ] User access reviews scheduled (monthly)
- [ ] Backup of groups and permissions configuration

## 📊 Monitoring & Maintenance

### Daily
- Monitor audit logs for suspicious activity
- Check for failed permission attempts

### Weekly
- Review new user assignments
- Verify group membership is accurate

### Monthly
- Audit user permissions
- Remove inactive users from groups
- Review and update group permissions as needed

### Quarterly
- Full security audit
- Review and update RBAC policy
- Train new administrators

## 🐛 Troubleshooting

### Issue: "Permission denied" even though user is in correct group

**Solution:**
1. Verify group has correct permissions in `/admin/groups`
2. User must **log out and log back in** for changes to take effect
3. Check browser console for errors
4. Clear permissions cache (automatic after 5 minutes)

### Issue: Admin pages show "Access Denied"

**Solution:**
1. Ensure user is assigned to "Super Admin" group
2. Check `/admin/users` to verify group assignment
3. Log out and log back in
4. Verify RLS policies are enabled but not blocking admin access

### Issue: Tables not found errors

**Solution:**
1. Database schema not deployed - run `database-rbac-schema.sql`
2. Check Supabase logs for migration errors
3. Verify tables exist in Supabase Table Editor

## 📚 Documentation Links

- **Setup Instructions**: `RBAC_SETUP_INSTRUCTIONS.md`
- **Implementation Guide**: `.same/rbac-implementation-guide.md`
- **Database Schema**: `database-rbac-schema.sql`
- **Type Definitions**: `src/lib/rbac-types.ts`

## ✅ Final Checklist

Before going live:
- [ ] Database schema deployed successfully
- [ ] Super Admin user created and tested
- [ ] All 8 groups configured with appropriate permissions
- [ ] Test users created and assigned to groups
- [ ] Permission tests passed for all roles
- [ ] Admin pages accessible only to Super Admin
- [ ] Cases page shows correct UI based on permissions
- [ ] Audit logging working correctly
- [ ] Documentation reviewed by team
- [ ] Training session conducted for administrators

## 🎯 Success Criteria

The RBAC system is successfully deployed when:
1. ✅ All database tables exist and contain default data
2. ✅ Super Admin can access all features
3. ✅ Case Officer can create/edit cases but not access admin
4. ✅ Auditor can view data but cannot modify anything
5. ✅ Unauthorized users see "Access Denied" messages
6. ✅ All actions are logged in audit_logs table
7. ✅ No TypeScript or runtime errors in console

---

**Deployment Date**: __________
**Deployed By**: __________
**Verified By**: __________

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

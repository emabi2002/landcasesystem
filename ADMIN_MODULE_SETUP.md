# System Administration Module Setup Guide

## Overview

The System Administration module allows administrators to manage user accounts, roles, and permissions within the DLPP Legal CMS.

## Features

- ✅ User creation and management
- ✅ Role-based access control (RBAC)
- ✅ Password management and reset
- ✅ User activation/deactivation
- ✅ Department assignment
- ✅ User statistics dashboard
- ✅ Secure authentication with Supabase

## User Roles

### Administrator
- **Full system access**
- Can create and manage users
- Can access all modules
- Can modify system settings
- Can view all cases and documents

### Case Manager
- **Create and manage all cases**
- Full access to case lifecycle
- Can assign tasks
- Can upload documents
- Can generate reports

### Legal Officer
- **Manage cases and documents**
- Can create and edit cases
- Can upload and manage documents
- Can add parties and events
- Cannot manage users

### Document Clerk
- **Upload and manage documents**
- Can upload documents to cases
- Can organize document library
- Read-only access to cases
- Cannot create cases

### Viewer
- **Read-only access**
- Can view cases
- Can view documents
- Cannot create or edit
- Limited to assigned cases (optional)

## Database Setup

### Step 1: Run the SQL Schema

Execute the `database-users-schema.sql` file in your Supabase SQL editor:

```bash
# Option 1: In Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Copy contents of database-users-schema.sql
5. Click "Run"
```

### Step 2: Create Your First Admin User

After running the schema, you need to create your first admin user:

1. **Sign up through the application** (if you haven't already)
2. **Get your user ID** from Supabase Auth:
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
   ```

3. **Insert your admin profile**:
   ```sql
   INSERT INTO users (id, email, full_name, role, department, status)
   VALUES (
     '<your-user-id-from-step-2>',
     'your-email@dlpp.gov.pg',
     'Your Full Name',
     'admin',
     'IT Department',
     'active'
   );
   ```

### Step 3: Verify Setup

Run this query to verify your admin user:

```sql
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.department,
  u.status,
  au.last_sign_in_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin';
```

## Accessing the Admin Module

1. **Login** with your admin account
2. **Click "Admin"** in the navigation bar
3. You'll see the User Management dashboard

## Using the Admin Module

### Adding a New User

1. Click **"Add New User"** button
2. Fill in the required information:
   - Full Name *
   - Email Address *
   - Password * (minimum 8 characters)
   - Confirm Password *
   - Role *
   - Department (optional)
   - Account Status *
3. Click **"Create User"**
4. User will receive a confirmation email (if email service is configured)

### Editing a User

1. Find the user in the table
2. Click **"Edit"** button
3. Update information:
   - Full Name
   - Role
   - Department
   - Status
   - Password (optional - leave blank to keep current)
4. Click **"Save Changes"**

### Activating/Deactivating Users

**Quick Toggle:**
- Click **"Deactivate"** button to disable a user's access
- Click **"Activate"** button to restore access

**Note:** Inactive users cannot log in but their data remains in the system.

### Deleting a User

1. Click **"Edit"** on the user
2. Click **"Delete User"** button (red, bottom-left)
3. Confirm deletion
4. User's auth account and profile will be permanently deleted

**Warning:** Deletion is permanent and cannot be undone!

### Searching Users

Use the search bar to find users by:
- Email address
- Full name
- Role
- Department

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- Mix of uppercase and lowercase
- Include numbers
- Include special characters

### Access Control
- Only admins can access `/admin/users`
- RLS policies enforce role-based permissions
- Inactive users cannot sign in
- Session tokens expire after inactivity

### Recommendations
1. **Regular Audits**: Review user list monthly
2. **Deactivate Unused Accounts**: Don't delete, deactivate
3. **Strong Passwords**: Enforce password complexity
4. **Least Privilege**: Assign minimum necessary role
5. **Department Assignment**: Keep organizational structure clear

## Troubleshooting

### Can't Access Admin Module

**Problem:** "Access Denied" or 404 error

**Solutions:**
1. Verify you're logged in as an admin:
   ```sql
   SELECT role FROM users WHERE id = '<your-user-id>';
   ```
2. Check your user status is 'active'
3. Ensure RLS policies are enabled
4. Try logging out and back in

### Can't Create Users

**Problem:** User creation fails with error

**Solutions:**
1. Check email doesn't already exist
2. Verify password meets requirements (8+ characters)
3. Ensure you have admin role
4. Check Supabase auth settings:
   - Go to Authentication > Settings
   - Ensure "Enable email confirmations" is configured
   - Check "Email Templates" are set up

### User Not Receiving Emails

**Problem:** New users don't get confirmation emails

**Solutions:**
1. Configure Supabase email service:
   - Go to Project Settings > Auth
   - Add custom SMTP settings
   - Or use Supabase's default (limited)
2. Check spam folder
3. Verify email address is correct
4. For development, you can manually mark emails as confirmed in Supabase

### RLS Policy Errors

**Problem:** "Row-level security policy violation"

**Solutions:**
1. Disable RLS temporarily to test:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```
2. Re-enable with proper policies:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```
3. Re-run the schema file to recreate policies

## Advanced Configuration

### Custom Email Templates

Edit Supabase email templates for better branding:

1. Go to **Authentication > Email Templates**
2. Customize:
   - Confirmation Email
   - Magic Link
   - Password Reset
   - Email Change

### Session Management

Configure session duration in Supabase:

1. Go to **Authentication > Settings**
2. Adjust:
   - JWT expiry time
   - Refresh token rotation
   - Session timeout

### API Access for User Management

If you need programmatic access:

```typescript
// Admin SDK (server-side only)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Create user
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'secure-password',
  email_confirm: true,
  user_metadata: { full_name: 'John Doe' }
})
```

## Database Schema Reference

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users(id) |
| email | TEXT | Unique email address |
| full_name | TEXT | User's full name |
| role | TEXT | User role (admin, case_manager, etc.) |
| department | TEXT | Department or division |
| status | TEXT | active or inactive |
| created_at | TIMESTAMPTZ | Account creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| last_sign_in_at | TIMESTAMPTZ | Last successful login |

### Indexes

- `idx_users_email` - Fast email lookups
- `idx_users_role` - Filter by role
- `idx_users_status` - Filter by status
- `idx_users_department` - Group by department

## Migration from Existing System

If you have existing users, migrate them with:

```sql
-- Insert existing users
INSERT INTO users (id, email, full_name, role, department, status)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  COALESCE(au.raw_user_meta_data->>'role', 'viewer'),
  au.raw_user_meta_data->>'department',
  'active'
FROM auth.users au
ON CONFLICT (id) DO NOTHING;
```

## Support

For technical support:
- **Email**: support@dlpp.gov.pg
- **Documentation**: [DLPP Legal CMS Docs]
- **GitHub**: [Repository Issues]

---

## Quick Reference Commands

### Create Admin User
```sql
INSERT INTO users (id, email, full_name, role, status)
VALUES ('<user-id>', 'admin@example.com', 'Admin Name', 'admin', 'active');
```

### List All Users
```sql
SELECT email, full_name, role, status FROM users ORDER BY created_at DESC;
```

### Find User by Email
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### Update User Role
```sql
UPDATE users SET role = 'case_manager' WHERE email = 'user@example.com';
```

### Deactivate User
```sql
UPDATE users SET status = 'inactive' WHERE email = 'user@example.com';
```

### Count Users by Role
```sql
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC;
```

---

**Last Updated:** October 31, 2025
**Version:** 1.0
**Module:** System Administration

# Database Setup Guide - Consolidated Schema

## Overview
This guide will help you set up the Land Case Management System database from scratch using the consolidated schema.

## Prerequisites
- Active Supabase account
- Project created in Supabase
- Supabase credentials (URL and keys)

## Step 1: Run the Consolidated Schema

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to: **SQL Editor** (left sidebar)
   - Click **New query**

2. **Copy and Paste the Schema**
   - Open the file: `database-schema-consolidated.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor

3. **Execute the Script**
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for execution to complete (should take 10-30 seconds)
   - Check for any errors in the output panel

4. **Verify Installation**
   - Scroll to the bottom of the results
   - You should see verification queries showing:
     - Total tables created (should be 20+)
     - Table categories and names
   - Check that all tables appear without errors

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref <your-project-ref>

# Run the migration
supabase db push --file database-schema-consolidated.sql
```

## Step 2: Create Storage Bucket

### Using Supabase Dashboard:

1. Navigate to **Storage** in left sidebar
2. Click **Create a new bucket**
3. Bucket configuration:
   - **Name**: `case-documents`
   - **Public bucket**: ❌ Unchecked (keep private)
   - **File size limit**: 50 MB (or your preference)
   - **Allowed MIME types**: Leave empty (allow all)

4. Click **Create bucket**

### Configure Storage Policies:

After creating the bucket, go to **Storage** → **Policies** and run this SQL:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-documents');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-documents');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'case-documents');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'case-documents');
```

## Step 3: Create Your First Admin User

### Method 1: Using Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter:
   - **Email**: your-email@example.com
   - **Password**: (choose a strong password)
   - **Email confirm**: ✅ Checked (auto-confirm)
4. Click **Create user**

### Method 2: Using SQL

```sql
-- Note the user_id from the auth.users table after signup
-- Then insert into profiles table
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    '<user-id-from-auth-users>',
    'admin@example.com',
    'System Administrator',
    'admin'
);

-- Assign to Super Admin group
INSERT INTO public.user_groups (user_id, group_id)
SELECT
    '<user-id-from-auth-users>',
    g.id
FROM public.groups g
WHERE g.group_name = 'Super Admin';
```

### Method 3: Sign Up Through the App

1. Start your Next.js development server
2. Go to the login page
3. Sign up with your email
4. Manually assign admin role via SQL:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Update profile to admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<your-user-id>';

-- Assign to Super Admin group
INSERT INTO public.user_groups (user_id, group_id)
SELECT
    '<your-user-id>',
    g.id
FROM public.groups g
WHERE g.group_name = 'Super Admin';
```

## Step 4: Verify Database Setup

Run these verification queries in the SQL Editor:

```sql
-- Check all tables exist
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 20+ tables

-- Check default data
SELECT 'Cost Categories' as table_name, COUNT(*) as count FROM cost_categories
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Modules', COUNT(*) FROM modules
UNION ALL
SELECT 'Permissions', COUNT(*) FROM group_module_permissions;
-- Expected:
--   Cost Categories: 10
--   Groups: 6
--   Modules: 10
--   Permissions: 20 (10 modules x 2 groups with full permissions)

-- Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check functions
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
-- Expected: 4 functions
```

## Step 5: Test the Application

1. **Start the development server**
   ```bash
   cd landcasesystem
   bun run dev
   ```

2. **Login to the application**
   - Navigate to http://localhost:3000
   - Login with your admin credentials

3. **Test each module:**
   - ✅ Dashboard loads without errors
   - ✅ Can create a new case
   - ✅ Can upload documents
   - ✅ Can create tasks and events
   - ✅ Can view reports
   - ✅ Admin panel accessible

## Troubleshooting

### Error: "relation already exists"
**Solution**: Some tables already exist. You have two options:
1. Drop existing tables first (see "Clean Install" below)
2. Ignore the error - the schema uses `IF NOT EXISTS` clauses

### Error: "column already exists"
**Solution**: This is normal if you're running the schema multiple times. The schema is idempotent.

### Error: "permission denied"
**Solution**:
1. Check that you're logged into Supabase
2. Verify you have admin access to the project
3. Try running with service role key

### Storage Upload Fails
**Solution**:
1. Verify bucket `case-documents` exists
2. Check storage policies are configured
3. Verify file size is under limit

### Cannot Login
**Solution**:
1. Check user exists in Authentication → Users
2. Verify profile exists: `SELECT * FROM profiles WHERE id = '<user-id>'`
3. Check user has group assignment: `SELECT * FROM user_groups WHERE user_id = '<user-id>'`

## Clean Install (Fresh Start)

If you need to completely reset the database:

```sql
-- WARNING: This will delete ALL data!

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS public.cost_alerts CASCADE;
DROP TABLE IF EXISTS public.litigation_cost_history CASCADE;
DROP TABLE IF EXISTS public.litigation_cost_documents CASCADE;
DROP TABLE IF EXISTS public.litigation_costs CASCADE;
DROP TABLE IF EXISTS public.cost_categories CASCADE;
DROP TABLE IF EXISTS public.case_compliance_links CASCADE;
DROP TABLE IF EXISTS public.compliance_recommendations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.case_history CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.land_parcels CASCADE;
DROP TABLE IF EXISTS public.evidence CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.court_orders CASCADE;
DROP TABLE IF EXISTS public.parties CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.group_module_permissions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.check_returnable_date_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_returnable_date_event() CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission(UUID, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Now run the consolidated schema
```

After dropping, run the `database-schema-consolidated.sql` file again.

## Migration from Old Schema

If you have existing data:

1. **Export existing data**
   ```sql
   -- Export cases
   COPY (SELECT * FROM cases) TO '/tmp/cases.csv' CSV HEADER;

   -- Repeat for other tables...
   ```

2. **Run new schema**

3. **Import data**
   ```sql
   -- Import cases
   COPY cases FROM '/tmp/cases.csv' CSV HEADER;

   -- Repeat for other tables...
   ```

## Next Steps

After successful database setup:

1. ✅ Configure environment variables in `.env.local`
2. ✅ Test all application features
3. ✅ Import existing case data (if any)
4. ✅ Configure user roles and permissions
5. ✅ Set up automated backups
6. ✅ Review and customize RBAC permissions
7. ✅ Deploy to production

## Support

If you encounter issues:
1. Check the Supabase logs: Dashboard → Logs
2. Review the `.same/schema-review.md` file
3. Check runtime errors in browser console
4. Verify all environment variables are set correctly

## Schema Information

- **Total Tables**: 24
- **Total Indexes**: 30+
- **Total Functions**: 4
- **Total Triggers**: 7
- **Initial Data**: 10 cost categories, 6 user groups, 10 modules

## Security Notes

⚠️ **IMPORTANT**: The consolidated schema has RLS **DISABLED** for development purposes.

For production deployment:
1. Enable RLS on all tables
2. Create appropriate policies
3. Test with different user roles
4. Review and audit permissions

See `PRODUCTION_SECURITY_GUIDE.md` (to be created) for production security setup.

# 🚀 Quick Setup - Copy & Paste Instructions

## Step 1: Run the Database Schema (2 minutes)

### A. Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Click on your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query** button

### B. Copy and Paste the Schema
1. Open the file: **`RUN_THIS_SCHEMA.sql`** (in this project folder)
2. Press `Ctrl+A` (Windows/Linux) or `Cmd+A` (Mac) to select all
3. Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac) to copy
4. Go back to Supabase SQL Editor
5. Press `Ctrl+V` (Windows/Linux) or `Cmd+V` (Mac) to paste
6. Click the **RUN** button (or press Ctrl+Enter / Cmd+Enter)

### C. Wait for Completion
- ⏳ Takes 15-45 seconds to complete
- ✅ You should see: "✅ Schema Installation Complete!"
- ✅ You should see: "total_tables_created: 24"

**If you see any errors**, take a screenshot and let me know!

---

## Step 2: Create Storage Bucket (1 minute)

### A. Create Bucket
1. In Supabase Dashboard, click **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Fill in:
   - **Name**: `case-documents`
   - **Public bucket**: ❌ Leave UNCHECKED (keep private)
4. Click **Create bucket**

### B. Add Storage Policies
1. After creating bucket, stay in Storage section
2. Click on **Policies** tab
3. Click **New policy** → **For full customization**
4. Copy and paste this SQL:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'case-documents');

-- Allow authenticated users to view
CREATE POLICY "Authenticated users view"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'case-documents');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'case-documents');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'case-documents');
```

5. Click **Review** then **Save policy**

---

## Step 3: Create Your Admin Account (2 minutes)

### Option A: Sign Up Through the App (Easiest)

1. Go to your app: http://localhost:3000
2. If there's a "Sign Up" link, click it and create an account
3. Use your email and create a password
4. After signing up, you'll be logged in

### Option B: Create User in Supabase Dashboard

1. Go to **Authentication** → **Users** in Supabase
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email**: your-email@example.com
   - **Password**: (choose a strong password)
   - **Auto Confirm User**: ✅ Check this box
4. Click **Create user**
5. **IMPORTANT**: Copy the User ID that appears (you'll need it next)

---

## Step 4: Assign Super Admin Role (1 minute)

After creating your user account (either method above):

1. Go to **SQL Editor** in Supabase
2. Click **New query**
3. Copy this SQL and replace `<YOUR-USER-ID>` with your actual user ID:

```sql
-- First, find your user ID if you don't have it
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Then assign Super Admin (replace <YOUR-USER-ID> below)
INSERT INTO public.user_groups (user_id, group_id)
SELECT
    '<YOUR-USER-ID>',
    id
FROM public.groups
WHERE group_name = 'Super Admin';
```

4. Click **RUN**
5. You should see: "Success. 1 row affected."

---

## Step 5: Login and Test (1 minute)

1. Go to: http://localhost:3000
2. Login with your email and password
3. You should see the Dashboard!

✅ **SUCCESS!** Your database is now set up and ready to use.

---

## Troubleshooting

### "Table already exists" error
- This is OK! The schema uses `DROP TABLE IF EXISTS` to clean up first
- Just check if the final message shows "✅ Schema Installation Complete!"

### "Could not find table" error in app
- Make sure you ran the entire `RUN_THIS_SCHEMA.sql` file
- Check in Supabase under **Table Editor** - you should see 24 tables

### Storage upload fails
- Verify bucket `case-documents` exists in Storage
- Check that storage policies were created
- Make sure bucket is NOT public

### Cannot login / Authentication error
- Check user exists in Authentication → Users
- Verify you assigned the user to Super Admin group
- Try logging out and logging back in

---

## Verification Checklist

After completing all steps, verify:

- ✅ 24 tables created (check in Supabase Table Editor)
- ✅ Storage bucket `case-documents` exists
- ✅ User created in Authentication
- ✅ User assigned to Super Admin group
- ✅ Can login to the app
- ✅ Dashboard displays without errors

---

## Need Help?

If you encounter any issues:
1. Take a screenshot of the error
2. Share it with me
3. Tell me which step you're on

I'll help you fix it!

# Fix: "Failed to create user" Error

## Problem

When trying to create a user in the Admin module, you get the error: **"Error: Failed to create user"**

## Root Cause

The user creation requires a Supabase **Service Role Key** which was not configured in your environment variables.

## Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your DLPP project
3. Navigate to: **Project Settings** (gear icon) > **API**
4. Find the **`service_role`** key (NOT the `anon` key)
5. Click the eye icon to reveal it
6. Copy the entire key

**⚠️ IMPORTANT:** The service_role key has admin privileges. **NEVER** expose it in client-side code or commit it to GitHub!

### Step 2: Add to Environment Variables

1. **Open** your `.env.local` file in the project root
2. **Add** this line (replace with your actual key):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
   ```

3. **Save** the file

Your `.env.local` should look like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Restart Your Development Server

The server needs to reload to pick up the new environment variable:

1. **Stop** the current dev server (Ctrl+C)
2. **Start** it again:
   ```bash
   cd dlpp-legal-cms
   bun run dev
   ```

### Step 4: Test User Creation

1. Go to: **Admin > Users**
2. Click **"Add New User"**
3. Fill in the form:
   - Full Name: Test User
   - Email: test@dlpp.gov.pg
   - Password: TestPassword123
   - Confirm Password: TestPassword123
   - Role: Viewer
   - Status: Active
4. Click **"Create User"**

✅ You should see: **"User created successfully!"**

## Why This is Needed

The service role key allows the server-side API to:
- Create users directly (bypassing email confirmation)
- Auto-confirm user emails
- Manage user accounts with admin privileges
- Perform secure operations that clients can't do

## Security Best Practices

### ✅ DO:
- Keep the service role key in `.env.local` ONLY
- Use it ONLY in server-side API routes (files in `/app/api/`)
- Add `.env.local` to `.gitignore` (already done)
- Rotate the key if exposed

### ❌ DON'T:
- Commit `.env.local` to Git
- Use the service role key in client components
- Share the key publicly
- Hardcode it anywhere

## Verification

After completing the steps, verify it's working:

```bash
# Check if environment variable is loaded
node -e "console.log(process.env.SUPABASE_SERVICE_ROLE_KEY ? 'KEY LOADED' : 'KEY MISSING')"
```

Should output: `KEY LOADED`

## Still Having Issues?

### Error: "service_role key not found"

**Solution:** Make sure you:
1. Copied the correct key from Supabase (service_role, not anon)
2. Named the variable exactly: `SUPABASE_SERVICE_ROLE_KEY`
3. Restarted the dev server after adding it

### Error: "Invalid JWT"

**Solution:** Your service role key might be incorrect or expired
1. Go back to Supabase Dashboard > API
2. Copy the service_role key again
3. Update `.env.local`
4. Restart the server

### Error: "Table users does not exist"

**Solution:** You need to run the database schema first
1. Go to Supabase Dashboard > SQL Editor
2. Run the contents of `database-users-schema.sql`
3. Try creating user again

## Production Deployment

When deploying to production (Netlify, Vercel, etc.):

1. Add the `SUPABASE_SERVICE_ROLE_KEY` to your hosting platform's environment variables
2. **DO NOT** include it in the code
3. Restart the deployment after adding the variable

### For Netlify:
1. Go to Site settings > Environment variables
2. Add: `SUPABASE_SERVICE_ROLE_KEY` = your-key
3. Redeploy the site

### For Vercel:
1. Go to Project Settings > Environment Variables
2. Add: `SUPABASE_SERVICE_ROLE_KEY` = your-key
3. Redeploy

## Summary

**Quick Fix Checklist:**
- [ ] Get service_role key from Supabase Dashboard
- [ ] Add to `.env.local` file
- [ ] Restart development server
- [ ] Test user creation
- [ ] Success! ✅

---

**Need more help?** Check `ADMIN_MODULE_SETUP.md` for complete documentation.

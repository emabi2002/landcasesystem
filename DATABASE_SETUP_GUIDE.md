# 📊 Database Setup Guide - DLPP Legal Case Management System

## ⚠️ IMPORTANT - You MUST Complete This Setup First!

The Legal Case Management System will **NOT work** until you complete these database setup steps. This guide will walk you through the entire process.

---

## Step 1: Access Your Supabase Project (2 minutes)

1. Open a web browser and go to **https://supabase.com**
2. Sign in with your Supabase account credentials:
   - Username: `lands`
   - Password: `eXtort1on001`
3. Once logged in, you should see your project with ID: `yvnkyjnwvylrweyzvibs`
4. Click on the project to enter the dashboard

---

## Step 2: Run the Database Schema (5 minutes)

### 2.1 Open SQL Editor
1. In the Supabase dashboard, look at the **left sidebar**
2. Click on **"SQL Editor"** (icon looks like </> )
3. Click the **"New query"** button at the top

### 2.2 Copy the Database Schema
1. Open the file `database-schema.sql` in this project
2. **Select ALL the text** in the file (Ctrl+A or Cmd+A)
3. **Copy** the entire content (Ctrl+C or Cmd+C)

### 2.3 Execute the Schema
1. Go back to Supabase SQL Editor
2. **Paste** all the copied SQL code into the editor
3. Click **"Run"** or press **Ctrl/Cmd + Enter**
4. Wait for the execution to complete (should take 10-30 seconds)
5. You should see a green message: **"Success. No rows returned"**

### ✅ What This Creates:
- **10 database tables**: cases, parties, documents, tasks, events, land_parcels, case_history, evidence, notifications, profiles
- **Indexes** for fast queries
- **Row Level Security (RLS)** for data protection
- **Triggers** for automatic logging
- **Functions** for data validation

---

## Step 3: Create Your Admin User (3 minutes)

### 3.1 Create User in Authentication
1. In Supabase, click **"Authentication"** in the left sidebar
2. Click the **"Users"** tab
3. Click the green **"Add user"** button
4. Select **"Create new user"**
5. Fill in the form:
   ```
   Email: admin@lands.gov.pg
   Password: demo123
   Confirm Password: demo123
   ```
6. Click **"Create user"**

### 3.2 Copy the User ID
1. After creating the user, you'll see a list of users
2. Find the user you just created (`admin@lands.gov.pg`)
3. Look for the **"ID"** column - it's a long string like:
   ```
   a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```
4. **Copy this entire ID** - you'll need it in the next step

---

## Step 4: Link User to Profile Table (2 minutes)

### 4.1 Run the Profile Insert Query
1. Go back to **SQL Editor**
2. Click **"New query"** to start fresh
3. Paste this SQL code, **BUT REPLACE** `YOUR_USER_ID` with the ID you copied:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('YOUR_USER_ID', 'admin@lands.gov.pg', 'System Administrator', 'admin');
```

**Example** (yours will have a different ID):
```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@lands.gov.pg', 'System Administrator', 'admin');
```

4. Click **"Run"**
5. You should see: **"Success. No rows returned"**

---

## Step 5: Load Sample Data (OPTIONAL - 3 minutes)

Want to see the system with realistic data immediately? Load our sample data!

### 5.1 Run Sample Data Script
1. In Supabase, go to **SQL Editor**
2. Click **"New query"**
3. Open the file `sample-data.sql` in this project
4. **Copy ALL** the SQL code
5. Paste it into the SQL Editor
6. Click **"Run"**
7. Wait for completion (should take 10-20 seconds)

### ✅ What This Creates:
- **5 User Profiles** - Legal officers, registrar, survey officer, director
- **7 Legal Cases** - Various types (disputes, court matters, title claims)
- **24 Parties** - Individuals, companies, government entities
- **19 Documents** - Case files and evidence
- **17 Tasks** - With different priorities and statuses
- **19 Events** - Hearings, deadlines, meetings
- **8 Land Parcels** - With GPS coordinates
- **6 Case History** - Audit trail entries
- **8 Evidence Items** - Photos, videos, audio recordings
- **9 Notifications** - System alerts

You'll immediately have realistic Papua New Guinea legal cases to explore!

---

## Step 6: Verify Setup (1 minute)

Let's verify everything is working:

### 6.1 Check Tables
1. In Supabase, click **"Table Editor"** in the left sidebar
2. You should see all these tables:
   - ✅ cases
   - ✅ case_history
   - ✅ documents
   - ✅ events
   - ✅ evidence
   - ✅ land_parcels
   - ✅ notifications
   - ✅ parties
   - ✅ profiles
   - ✅ tasks

### 6.2 Check Profile
1. Click on the **"profiles"** table
2. You should see at least **1 row** with your admin user (or 6 rows if you loaded sample data):
   - Email: `admin@lands.gov.pg`
   - Role: `admin`
   - Full Name: `System Administrator`

---

## Step 7: Test Login! (1 minute)

1. Go back to your Legal Case Management System (the preview)
2. Refresh the page if needed
3. You should see the login page with the DLPP logo
4. Enter:
   ```
   Email: admin@lands.gov.pg
   Password: demo123
   ```
5. Click **"Sign In"**
6. 🎉 You should now be logged in and see the dashboard!

---

## 🎯 What You Can Do Now

Once logged in, you can:

### ✅ Explore the Dashboard
- View statistics (will be empty initially)
- See recent cases section
- Access quick actions

### ✅ Register Your First Case
1. Click **"Register New Case"** button
2. Fill in:
   - Case Number: e.g., `DLPP-2025-001`
   - Title: e.g., `Land Dispute - Port Moresby`
   - Description: Brief details about the case
   - Case Type: Select one (Dispute, Court Matter, etc.)
   - Status: Select current status
   - Priority: Select priority level
   - Region: e.g., `Central Province`
3. Click **"Register Case"**
4. View your newly created case!

### ✅ Navigate the System
- **Cases**: View all cases, search, filter
- **Calendar**: View events and hearings
- **Tasks**: Manage tasks and deadlines
- **Documents**: Upload case documents (coming soon)
- **Land Parcels**: Link land information
- **Reports**: Generate reports

---

## 🛠️ Troubleshooting

### Problem: "Failed to login"
**Solution:**
- Make sure you created the user in Supabase Authentication
- Verify the email is exactly: `admin@lands.gov.pg`
- Verify the password is exactly: `demo123`
- Make sure you linked the user to the profiles table (Step 4)

### Problem: "Database tables not found"
**Solution:**
- Go back to Step 2 and run the database schema again
- Make sure you copied **ALL** the SQL code from `database-schema.sql`
- Check for any error messages in the SQL Editor

### Problem: "Profile not found"
**Solution:**
- The User ID in Step 4 must match exactly
- Go to Authentication > Users and copy the ID again
- Run the INSERT query again with the correct ID

### Problem: Can't see the database schema
**Solution:**
- Make sure you're using the correct Supabase project (`yvnkyjnwvylrweyzvibs`)
- Check that you have the right permissions (project owner)

---

## 📝 Next Steps After Setup

Once you have the system working:

1. **Create More Users**:
   - Add legal officers, registrars, survey officers
   - Assign appropriate roles
   - Each user needs an entry in both `auth.users` and `profiles`

2. **Customize Data**:
   - Add your actual cases
   - Upload documents
   - Create tasks and events
   - Link land parcels

3. **Configure Storage** (Optional):
   - Set up Supabase Storage buckets for file uploads
   - Configure file upload policies
   - Enable document management

4. **Deploy to Production**:
   - Set up a production Supabase project
   - Run the same schema
   - Update environment variables
   - Deploy to Netlify or Vercel

---

## 📞 Need Help?

- **Supabase Documentation**: https://supabase.com/docs
- **Same Platform Support**: support@same.new
- **DLPP IT Department**: Contact your internal IT team

---

## ✅ Setup Checklist

Use this checklist to track your progress:

- [ ] Accessed Supabase dashboard
- [ ] Opened SQL Editor
- [ ] Ran database-schema.sql successfully
- [ ] Created admin user in Authentication
- [ ] Copied User ID
- [ ] Inserted profile record with correct User ID
- [ ] Verified tables exist in Table Editor
- [ ] Verified profile exists in profiles table
- [ ] Successfully logged in to Legal CMS
- [ ] Created first test case
- [ ] Explored all sections of the system

---

**Congratulations!** 🎉 Your DLPP Legal Case Management System is now fully set up and ready to use!

---

**Last Updated**: October 29, 2025
**Version**: 1.0
**System**: DLPP Legal Case Management System

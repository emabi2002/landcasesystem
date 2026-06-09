# 🚀 Load Sample Data - Step by Step Guide

## ⏱️ Time Required: 5 minutes

Follow these exact steps to load 100+ realistic records into your database.

---

## ✅ Prerequisites Check

Before you start, make sure you have:
- [x] Completed `database-schema.sql` setup
- [x] Created admin user in Supabase Auth
- [x] Linked admin user to profiles table
- [x] Successfully logged into the system at least once

If you haven't done these, go to `DATABASE_SETUP_GUIDE.md` first.

---

## 📋 Step 1: Access Supabase (1 minute)

1. Open your browser
2. Go to **https://supabase.com**
3. Login with your credentials:
   - Username: `lands`
   - Password: `eXtort1on001`
4. You should see your project dashboard
5. Confirm project ID shows: `yvnkyjnwvylrweyzvibs`

✅ **Checkpoint**: You can see the Supabase dashboard

---

## 📋 Step 2: Open SQL Editor (30 seconds)

1. Look at the **left sidebar** in Supabase
2. Find and click **"SQL Editor"** (icon: </> )
3. Click the green **"New query"** button at the top
4. You should see an empty SQL editor

✅ **Checkpoint**: Empty SQL editor is ready

---

## 📋 Step 3: Load Sample Data File (1 minute)

### Option A: From Your Computer
1. Open the file `sample-data.sql` from this project
2. Use your text editor or VS Code
3. Select **ALL** content (Ctrl+A on Windows, Cmd+A on Mac)
4. Copy it (Ctrl+C or Cmd+C)

### Option B: From Same Editor
1. If you're in Same.new, open `sample-data.sql`
2. Click to open the file
3. Select all and copy

✅ **Checkpoint**: You have the SQL code copied to clipboard

---

## 📋 Step 4: Paste and Run (1 minute)

1. Go back to the Supabase SQL Editor tab
2. Click inside the editor area
3. Paste the SQL code (Ctrl+V or Cmd+V)
4. You should see a LOT of SQL code (INSERT statements)
5. Scroll down to verify it's all there (should be about 800+ lines)

### Now Run It:
6. Click the **"Run"** button (or press Ctrl/Cmd + Enter)
7. Wait 10-30 seconds for execution
8. Watch for the success message at the bottom

✅ **Checkpoint**: You see "Success" message

---

## 📋 Step 5: Verify Data Loaded (2 minutes)

### Check Tables Have Data:

1. In Supabase left sidebar, click **"Table Editor"**
2. Check each table by clicking on it:

#### Expected Counts:

| Table | Expected Count | What to Look For |
|-------|----------------|------------------|
| **profiles** | 6 rows | 5 sample users + your admin |
| **cases** | 7 rows | DLPP-2025-001 through DLPP-2025-007 |
| **parties** | 24 rows | Names like "Joseph Kome", "Bougainville Clan" |
| **documents** | 19 rows | Titles like "Survey Plan 1985" |
| **tasks** | 17 rows | Various titles and statuses |
| **events** | 19 rows | Hearings and deadlines |
| **land_parcels** | 8 rows | LOT numbers and locations |
| **case_history** | 10+ rows | Actions and descriptions |
| **evidence** | 8 rows | Photos and videos |
| **notifications** | 9 rows | Alerts for users |

### Quick Verification:

3. Click on **"cases"** table
4. You should see 7 rows
5. Look for case numbers: DLPP-2025-001, DLPP-2025-002, etc.
6. Check titles mention real PNG locations (Hohola, Madang, Mount Hagen, etc.)

✅ **Checkpoint**: All tables have data

---

## 📋 Step 6: Test the Login (30 seconds)

1. Go back to your Legal Case Management System preview
2. If you're already logged in, **logout** first
3. Login again with:
   ```
   Email: admin@lands.gov.pg
   Password: demo123
   ```
4. You should see the dashboard

✅ **Checkpoint**: You're logged into the dashboard

---

## 🎯 Step 7: Explore the Data!

Now let's see all that sample data in action!

### A. Dashboard (Start Here)
1. You should see statistics:
   - Total Cases: **7**
   - Open Cases: **6**
   - Closed Cases: **1**
   - Overdue Tasks: **1** (at least)

2. Scroll down to "Recent Cases"
3. You should see:
   - DLPP-2025-001 - Land Boundary Dispute - Hohola
   - DLPP-2025-002 - Customary Land Title Claim - Madang
   - DLPP-2025-003 - Illegal Occupation - Mount Hagen
   - And more...

### B. Cases Page
1. Click **"Cases"** in the navigation
2. You should see **7 cases** listed
3. Try the search:
   - Type "Hohola" → should find Case 001
   - Type "mining" → should find Case 007
   - Type "Madang" → should find Case 002

4. Try filters:
   - Filter by Status: "In Court" → should show 2-3 cases
   - Filter by Status: "Settled" → should show Case 005
   - Filter by Type: "Dispute" → should show disputes

### C. View a Case Detail
1. Click on **"DLPP-2025-001 - Land Boundary Dispute"**
2. You should see full case detail page with:
   - Case title and status badge
   - 4 info cards (Type, Priority, Region, Created)
   - Tabs for different sections

3. Click through each tab:
   - **Overview**: See parties, events, tasks summary
   - **Parties**: Should show 3 parties (Joseph Kome, Margaret Toea, PNG Surveying Ltd)
   - **Documents**: Should show 5 documents (survey plans, writ, affidavit, photos)
   - **Tasks**: Should show 3 tasks
   - **Events**: Should show 3 events (hearing, deadline, inspection)
   - **Land**: Should show 2 land parcels (Lot 45 & 46)
   - **History**: Should show timeline of actions

### D. Calendar
1. Click **"Calendar"** in navigation
2. Navigate to **March 2025**
3. You should see dots on days with events
4. Click on **March 15** → should show the hearing for Case 001
5. Look at "Upcoming Events" list → should show multiple events

### E. Tasks Page
1. Click **"Tasks"** in navigation
2. You should see statistics:
   - Pending: Several tasks
   - In Progress: Some tasks
   - Overdue: At least 1 task
   - Completed: Some tasks

3. Try different tabs:
   - **All Tasks**: Shows all 17 tasks
   - **Pending**: Shows pending only
   - **Overdue**: Shows overdue tasks (in red)
   - **Completed**: Shows completed tasks

✅ **Checkpoint**: You can see all the sample data!

---

## 🎨 Step 8: Test Adding Your Own Data

Now that you have sample data, let's add something new!

### Add a Party to a Case:

1. Go to **Cases** → Click on **DLPP-2025-001**
2. Click the **"Parties"** tab
3. Click **"Add Party"** button
4. Fill in the form:
   ```
   Name: Your Test Name
   Type: Individual
   Role: Witness
   Contact: +675 7xxx xxxx
   ```
5. Click **"Add Party"**
6. You should see success message
7. The new party appears in the list!

### Upload a Test Document:

1. Same case, click **"Documents"** tab
2. Click **"Upload Document"** button
3. Select any file from your computer (PDF, image, etc.)
4. Fill in:
   ```
   Title: Test Document
   Type: Evidence
   Description: Testing document upload
   ```
5. Click **"Upload"**
6. You should see success message
7. Document appears in the list!

### Create a Task:

1. Same case, click **"Tasks"** tab
2. Click **"Add Task"** button
3. Fill in:
   ```
   Title: Test Task
   Description: Testing task creation
   Due Date: Pick a future date
   Priority: Medium
   Status: Pending
   ```
4. Click **"Create Task"**
5. Task appears in the list!

✅ **Checkpoint**: You can add your own data!

---

## 📊 Step 9: Verification Checklist

Use this checklist to confirm everything is working:

### Data Loading:
- [ ] All 10 tables have data
- [ ] Cases table has 7 rows
- [ ] Parties table has 24 rows
- [ ] Documents table has 19 rows

### System Features:
- [ ] Can login successfully
- [ ] Dashboard shows case statistics
- [ ] Can view all 7 cases
- [ ] Search works (try "Hohola")
- [ ] Filters work (try "In Court")
- [ ] Can view case details
- [ ] All tabs work in case detail
- [ ] Calendar shows events
- [ ] Tasks page shows all tasks

### CRUD Operations:
- [ ] Can add a party to a case
- [ ] Can upload a document
- [ ] Can create a task
- [ ] Can schedule an event
- [ ] See success notifications

### Data Quality:
- [ ] Case numbers are DLPP-2025-001 to 007
- [ ] Locations are real PNG provinces
- [ ] Dates are realistic (2024-2025)
- [ ] GPS coordinates present on land parcels

---

## 🎯 Step 10: What's Next?

Now that you have sample data loaded and tested:

### Immediate Tasks:
1. **Explore More Cases**:
   - View all 7 cases one by one
   - Check different statuses
   - See completed vs pending tasks

2. **Test All Forms**:
   - Add parties to different cases
   - Upload various document types
   - Create tasks with different priorities
   - Schedule events on calendar

3. **Customize the Data**:
   - Edit case details
   - Update task statuses
   - Mark tasks as completed
   - Add your own cases

### Short Term:
1. **Create Real Cases**:
   - Use sample format as template
   - Register actual cases
   - Upload real documents
   - Assign to real officers

2. **Add Real Users**:
   - Create accounts in Supabase Auth
   - Link to profiles table
   - Assign proper roles
   - Test permissions

3. **Configure Storage**:
   - Set up Supabase Storage buckets
   - Configure upload policies
   - Test file access

### Production Ready:
1. **Clean Sample Data** (optional):
   - Delete sample cases if needed
   - Keep only real cases
   - Or use separate production database

2. **Deploy to Production**:
   - See deployment guide
   - Set up production Supabase
   - Migrate schema and real data
   - Deploy to Netlify/Vercel

3. **Train Your Team**:
   - Show them the system
   - Demonstrate workflows
   - Provide user guides
   - Collect feedback

---

## 🐛 Troubleshooting

### Problem: SQL Error When Running sample-data.sql

**Possible Causes:**
1. Database schema not created first
2. Missing tables
3. Foreign key violations

**Solution:**
1. Run `database-schema.sql` first
2. Verify all tables exist
3. Check for any error messages
4. Try running sample-data.sql again

### Problem: No Data Shows in Tables

**Possible Causes:**
1. SQL didn't complete
2. Wrong database selected
3. RLS policies blocking view

**Solution:**
1. Check SQL Editor for errors
2. Confirm project ID is correct
3. Check table counts in Table Editor
4. Look at raw data in Supabase

### Problem: Login Works but No Cases Show

**Possible Causes:**
1. Data loaded but not visible
2. RLS policies issue
3. Frontend not fetching

**Solution:**
1. Check cases table in Supabase directly
2. Verify 7 rows exist
3. Check browser console for errors
4. Refresh the page

### Problem: Can't Add New Data

**Possible Causes:**
1. User not authenticated
2. Profile not linked correctly
3. RLS policy issue

**Solution:**
1. Verify you're logged in
2. Check your user ID in profiles table
3. Try logging out and back in

---

## 📞 Support

If you encounter issues:

1. **Check the Guides**:
   - DATABASE_SETUP_GUIDE.md
   - SAMPLE_DATA_README.md
   - README.md

2. **Verify Database**:
   - Go to Supabase Table Editor
   - Manually check data exists
   - Look for error messages

3. **Browser Console**:
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Report any red errors

4. **Contact Support**:
   - Same Platform: support@same.new
   - Supabase Docs: https://supabase.com/docs

---

## ✅ Success!

If you can see:
- ✅ 7 cases on the cases page
- ✅ Case details with parties, documents, tasks
- ✅ Events on the calendar
- ✅ Tasks with different statuses
- ✅ Notifications in the system

**Congratulations!** 🎉 Your Legal Case Management System is fully loaded with sample data and ready to use!

---

**Version**: 1.0
**Last Updated**: October 29, 2025
**Records Loaded**: 100+ across 10 tables
**Time to Complete**: 5-10 minutes
**Difficulty**: Easy - just copy and paste!

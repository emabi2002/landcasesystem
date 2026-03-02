# ✅ Activate Auto Calendar Events - Quick Checklist

## 📋 Follow These Steps (5 minutes total)

### ☐ Step 1: Open Supabase (1 minute)
1. Go to https://supabase.com
2. Sign in to your account
3. Select project: **yvnkyjnwvylrweyzvibs**
4. Click **"SQL Editor"** in left sidebar

### ☐ Step 2: Run the SQL Script (2 minutes)
1. Click **"New query"** button
2. Open file `database-auto-calendar-events.sql` from your project folder
3. Copy **ALL** the code (it's a long file, scroll to bottom to verify)
4. Paste into Supabase SQL Editor
5. Click **"Run"** (or press Ctrl/Cmd + Enter)
6. Wait for completion
7. ✅ You should see: "AUTO CALENDAR EVENTS SYSTEM INSTALLED SUCCESSFULLY!"

**What this does:**
- Adds `first_hearing_date` field to cases table
- Creates 3 automatic trigger functions
- Creates enhanced calendar view
- Sets up all permissions

### ☐ Step 3: Verify Installation (1 minute)

Run this query in SQL Editor to verify:
```sql
-- Check triggers exist
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'auto_create%'
ORDER BY trigger_name;
```

**Expected result - 3 rows:**
```
auto_create_case_calendar_event          | INSERT
auto_create_hearing_calendar_event       | INSERT, UPDATE
auto_create_status_calendar_event        | UPDATE
```

### ☐ Step 4: Test with a Case (1 minute)

1. Go to your app: http://localhost:3000
2. Click **"Register New Case"**
3. Fill in:
   - **Case Number**: `TEST-AUTO-CAL-001`
   - **Title**: `Test Auto Calendar Events`
   - **Case Type**: Dispute
   - **First Hearing Date**: Pick tomorrow at 10:00 AM
   - Fill other required fields
4. Click **"Register Case"**
5. Success message should say: "Calendar events created..."

### ☐ Step 5: Check Calendar (30 seconds)

1. Click **"Calendar"** in navigation
2. ✅ **Verify you see:**
   - **Today**: "Case Registered: TEST-AUTO-CAL-001" with 🤖 icon
   - **Tomorrow**: "First Hearing: TEST-AUTO-CAL-001" with 🤖 icon

### ☐ Step 6: Verify Database (30 seconds)

In Supabase SQL Editor, run:
```sql
SELECT title, event_type, event_date, location
FROM events
WHERE title LIKE '%TEST-AUTO-CAL-001%'
ORDER BY event_date;
```

**Expected result - 2 rows:**
```
Case Registered: TEST-AUTO-CAL-001    | other     | [today]     | DLPP Headquarters
First Hearing: TEST-AUTO-CAL-001      | hearing   | [tomorrow]  | Court House
```

---

## ✅ Success Criteria

You've successfully activated the feature when:

- [x] SQL script ran without errors
- [x] 3 triggers are visible in database
- [x] Test case created successfully
- [x] 2 events appear in calendar
- [x] Events show 🤖 "Auto-created" indicator
- [x] Events are linked to the test case

---

## 🎉 You're Done!

### What Happens Now:

**Every time you create a case:**
- ✅ Auto-creates "Case Registered" event

**When you set a first hearing date:**
- ✅ Auto-creates "First Hearing" event

**When you update status to In Court, Judgment, Closed, or Settled:**
- ✅ Auto-creates "Status Changed" event

**No manual calendar entry needed anymore!** 📅✨

---

## 📚 Next Steps

1. **Clean up test case** (optional):
   ```sql
   DELETE FROM cases WHERE case_number = 'TEST-AUTO-CAL-001';
   -- This will also delete related events (cascade delete)
   ```

2. **Read full documentation**:
   - `SETUP_AUTO_CALENDAR.md` - Setup guide
   - `AUTO_CALENDAR_EVENTS_GUIDE.md` - Complete feature guide

3. **Train your team**:
   - Show them the new "First Hearing Date" field
   - Explain auto-calendar feature
   - Demo the calendar view

4. **Start using it**:
   - Register real cases
   - Set hearing dates
   - Update statuses
   - Watch events appear automatically!

---

## 🐛 If Something Went Wrong

### SQL Script Failed?

**Common issues:**

1. **"column already exists"**
   - Solution: That's okay! Run the rest of the script

2. **"permission denied"**
   - Solution: Make sure you're logged into Supabase with the right account

3. **"trigger already exists"**
   - Solution: Script includes DROP TRIGGER IF EXISTS, run it again

### No Events Created?

**Check:**

1. Did SQL script complete successfully?
2. Are triggers visible in database?
3. Did you fill in all required fields in the form?
4. Is the app connected to the right Supabase project?

**Run diagnostic:**
```sql
-- Check if triggers exist
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_name LIKE 'auto_create%';
```

Should return: `trigger_count: 3`

### Events Created but Not Visible?

1. Refresh calendar page
2. Check the correct date (registration event is today)
3. Verify no filter is hiding them
4. Check events table directly in Supabase

---

## 📞 Need Help?

1. Check troubleshooting section in `SETUP_AUTO_CALENDAR.md`
2. Review SQL execution log in Supabase
3. Check case_history table for any error logs
4. Contact system administrator

---

## 🎯 Quick Reference

| What You Want | What to Do |
|---------------|------------|
| **Activate feature** | Run `database-auto-calendar-events.sql` |
| **Test it works** | Create case with hearing date |
| **Verify events** | Check calendar for 🤖 events |
| **See triggers** | Query `information_schema.triggers` |
| **View all auto-events** | `SELECT * FROM events WHERE title LIKE '%Registered%' OR title LIKE '%Hearing%'` |
| **Disable feature** | `DROP TRIGGER` commands in SQL |

---

**Total Time:** ~5 minutes
**Difficulty:** Easy
**Result:** Automatic calendar events for all cases! 🚀

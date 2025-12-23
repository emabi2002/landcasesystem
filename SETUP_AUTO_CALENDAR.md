# 📅 Quick Setup: Automatic Calendar Events

## What This Feature Does

When you register a new case or update important details, the system **automatically creates calendar events** so you never miss important dates!

### Auto-Created Events:
- ✅ **Case Registration** - When a new case is created
- ✅ **First Hearing** - When you set a first hearing date
- ✅ **Status Changes** - When case moves to important stages (In Court, Judgment, Closed, Settled)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Run the SQL Script

1. Go to your Supabase dashboard: https://supabase.com
2. Select your project: `yvnkyjnwvylrweyzvibs`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Open the file `database-auto-calendar-events.sql` from this project
6. Copy **ALL** the SQL code
7. Paste into Supabase SQL Editor
8. Click **"Run"** or press Ctrl/Cmd + Enter
9. Wait for success message: ✅ "AUTO CALENDAR EVENTS SYSTEM INSTALLED SUCCESSFULLY!"

### Step 2: Test It!

1. Go to your application: http://localhost:3000
2. Click **"Register New Case"**
3. Fill in the form:
   - **Case Number**: TEST-2025-001
   - **Title**: Test Case for Auto Calendar
   - **First Hearing Date**: Pick a future date (e.g., next week)
   - Fill in other required fields
4. Click **"Register Case"**
5. You should see: "Case registered successfully! Calendar events created..."
6. Click **"Calendar"** in the navigation
7. ✅ **You should see TWO events:**
   - "Case Registered: TEST-2025-001" (today)
   - "First Hearing: TEST-2025-001" (your selected date)

---

## 📋 What Gets Created

### Event 1: Case Registration
```
Title: "Case Registered: [CASE_NUMBER]"
Date: [Today]
Type: Other
Location: [Case Region] or "DLPP Headquarters"
Description:
  Case Title: [Your Case Title]
  Case Type: [dispute/court_matter/etc]
  Status: Under Review
  Priority: [Your Priority]
```

### Event 2: First Hearing (if date provided)
```
Title: "First Hearing: [CASE_NUMBER]"
Date: [Your Selected Hearing Date]
Type: Hearing
Location: [Case Region] or "Court House"
Description:
  First hearing for case: [Your Case Title]
  Case Number: [CASE_NUMBER]
  Case Type: [dispute/court_matter/etc]
```

### Event 3: Status Changes (automatic)
When you update a case status to **In Court**, **Judgment**, **Closed**, or **Settled**:
```
Title: "Status Changed: [CASE_NUMBER] - [NEW STATUS]"
Date: [Today]
Type: Other
Location: [Case Region] or "DLPP Headquarters"
Description:
  Case status changed from [OLD STATUS] to [NEW STATUS]
  Case: [Your Case Title]
```

---

## 🎯 How to Use

### When Creating a New Case:

1. Go to **Cases** → **Register New Case**
2. Fill in all required fields
3. **Optional:** Set the **First Hearing Date** field
   - Pick date and time
   - This automatically creates a hearing event
4. Click **Register Case**
5. ✅ Events appear in calendar immediately!

### When Updating Case Status:

1. Open any case detail page
2. Change the status to:
   - In Court
   - Judgment
   - Closed
   - Settled
3. Save changes
4. ✅ Status change event created automatically!

---

## 🔍 Verify It's Working

### Check Events Were Created:

In Supabase SQL Editor, run:
```sql
-- See all auto-created events
SELECT
  title,
  event_type,
  event_date,
  location
FROM events
WHERE title LIKE 'Case Registered:%'
   OR title LIKE 'First Hearing:%'
   OR title LIKE 'Status Changed:%'
ORDER BY created_at DESC;
```

### Check Case History Was Logged:

```sql
-- See audit trail
SELECT
  action,
  description,
  created_at
FROM case_history
WHERE action IN ('Calendar Event Created', 'First Hearing Scheduled')
ORDER BY created_at DESC;
```

---

## 🎨 Visual Indicators

Auto-created events show a **🤖 Auto-created** indicator in the calendar:

- In the selected date panel
- In the upcoming events list
- Helps you distinguish manual vs automatic events

---

## ❓ Troubleshooting

### Events not appearing?

**Check 1:** Did you run the SQL script?
```sql
-- Verify triggers exist
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name LIKE 'auto_create%';
```

You should see:
- `auto_create_case_calendar_event`
- `auto_create_hearing_calendar_event`
- `auto_create_status_calendar_event`

**Check 2:** Does the field exist?
```sql
-- Verify first_hearing_date column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'cases'
  AND column_name = 'first_hearing_date';
```

**Check 3:** Check for errors in case history
```sql
SELECT * FROM case_history
WHERE description LIKE '%error%'
ORDER BY created_at DESC;
```

### Duplicate events?

This shouldn't happen, but if it does:
1. The system checks if hearing events already exist before creating
2. You can safely delete duplicates from the calendar

---

## 🔧 Customization

### Change Event Titles:

Edit the SQL functions in `database-auto-calendar-events.sql`:

```sql
-- Line ~25
v_event_title := 'Case Registered: ' || NEW.case_number;

-- Change to:
v_event_title := 'New Case: ' || NEW.case_number || ' - ' || NEW.title;
```

### Change Event Types:

```sql
-- Line ~48
event_type := 'other',

-- Change to:
event_type := 'meeting',  -- or 'hearing', 'filing_deadline', etc.
```

### Disable Auto-Creation:

If you want to turn off auto-creation:
```sql
-- Drop the triggers
DROP TRIGGER auto_create_case_calendar_event ON public.cases;
DROP TRIGGER auto_create_hearing_calendar_event ON public.cases;
DROP TRIGGER auto_create_status_calendar_event ON public.cases;
```

---

## 📊 Enhanced Calendar View

The SQL script also creates a new view: `calendar_events_with_cases`

This gives you enhanced calendar data:

```sql
SELECT * FROM calendar_events_with_cases
WHERE is_this_week = true
ORDER BY event_date ASC;
```

**Includes:**
- Event details
- Linked case information
- Assigned officer name/email
- Days until event
- Boolean flags: is_past, is_today, is_this_week

---

## ✅ Summary Checklist

- [ ] Ran `database-auto-calendar-events.sql` in Supabase
- [ ] Verified triggers created (3 triggers)
- [ ] Created a test case with hearing date
- [ ] Checked calendar shows 2 events
- [ ] Verified events show "🤖 Auto-created" indicator
- [ ] Tested status change creates event
- [ ] Checked case history logs the events

---

## 🎉 You're Done!

Your calendar now automatically tracks:
- ✅ Every new case registration
- ✅ All scheduled hearings
- ✅ Important status changes
- ✅ Complete audit trail

**No more manual calendar entry!** 📅✨

---

## 📚 Related Documentation

- **Complete Guide**: [AUTO_CALENDAR_EVENTS_GUIDE.md](AUTO_CALENDAR_EVENTS_GUIDE.md)
- **Database Schema**: [database-schema.sql](database-schema.sql)
- **Tracking Features**: [TRACKING_AND_MONITORING_GUIDE.md](TRACKING_AND_MONITORING_GUIDE.md)

---

**Questions?** Check the complete guide or contact your system administrator.

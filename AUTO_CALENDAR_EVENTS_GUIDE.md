# 📅 Automatic Calendar Events - Complete Guide

## ✅ **FEATURE: Auto-Create Calendar Events**

When cases are registered or updated, the system **automatically creates calendar events** so you never miss important dates!

---

## 🎯 **What Gets Automatically Added to Calendar**

### **1. Case Registration Event** ✅

**Trigger:** When a NEW case is created

**What Happens:**
- ✨ Automatically creates a calendar event
- 📅 Event date = Case creation date
- 📝 Event title = "Case Registered: [CASE_NUMBER]"
- 📍 Location = Case region or "DLPP Headquarters"
- 🔗 Linked to the case

**Example:**
```
Event: "Case Registered: DLPP-2025-001"
Date: January 6, 2025
Description:
  Case Title: Land Dispute - Madang Province
  Case Type: dispute
  Status: Under Review
  Priority: High
```

---

### **2. First Hearing Event** ✅

**Trigger:** When you set a "First Hearing Date" on a case

**What Happens:**
- ✨ Automatically creates a hearing event
- 📅 Event date = The hearing date you set
- 📝 Event title = "First Hearing: [CASE_NUMBER]"
- 🏛️ Event type = "Hearing"
- 🔗 Linked to the case

**How to Set:**
When creating a new case, fill in the "First Hearing Date (Optional)" field.

**Example:**
```
Event: "First Hearing: DLPP-2025-001"
Date: January 20, 2025 at 10:00 AM
Type: Hearing
Description: First hearing for case: Land Dispute - Madang Province
```

---

### **3. Important Status Change Events** ✅

**Trigger:** When case status changes to:
- In Court
- Judgment
- Closed
- Settled

**What Happens:**
- ✨ Automatically creates a status change event
- 📅 Event date = Current date/time
- 📝 Event title = "Status Changed: [CASE_NUMBER] - [NEW_STATUS]"
- 📊 Shows old status → new status

**Example:**
```
Event: "Status Changed: DLPP-2025-001 - IN COURT"
Date: January 15, 2025
Description:
  Case status changed from UNDER REVIEW to IN COURT
  Case: Land Dispute - Madang Province
```

---

## 🔄 **Complete Workflow**

### **Scenario: Registering a New Case**

```
Step 1: User creates new case
   ↓
Step 2: System saves case to database
   ↓
Step 3: ⚡ AUTOMATIC TRIGGER FIRES
   ↓
Step 4: System creates "Case Registered" calendar event
   ↓
Step 5: System logs action in case history
   ↓
Step 6: ✅ Case appears in calendar!
```

### **Scenario: Setting First Hearing Date**

```
Step 1: User creates case with "First Hearing Date" set
   OR
   User edits existing case and adds hearing date
   ↓
Step 2: System saves the hearing date
   ↓
Step 3: ⚡ AUTOMATIC TRIGGER FIRES
   ↓
Step 4: System checks if hearing event already exists
   ↓
Step 5: If not exists, creates "First Hearing" event
   ↓
Step 6: System logs "First Hearing Scheduled" in case history
   ↓
Step 7: ✅ Hearing appears in calendar!
```

---

## 📋 **Database Changes**

### **New SQL File:** `database-auto-calendar-events.sql`

This file contains:

1. ✅ **auto_create_case_event()** - Function to create registration event
2. ✅ **auto_create_hearing_event()** - Function to create hearing event
3. ✅ **auto_create_status_change_event()** - Function for status events
4. ✅ **Triggers** - Auto-fire on INSERT/UPDATE
5. ✅ **Enhanced View** - calendar_events_with_cases

### **New Field Added:**

```sql
ALTER TABLE public.cases
  ADD COLUMN first_hearing_date TIMESTAMP WITH TIME ZONE;
```

---

## 🚀 **How to Activate**

### **Step 1: Run SQL Script**

In Supabase SQL Editor:
1. Open `database-auto-calendar-events.sql`
2. Copy all the SQL code
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "Success. No rows returned"

### **Step 2: Test It!**

1. Go to `/cases/new`
2. Fill in case details:
   - Case Number: TEST-2025-001
   - Title: Test Case
   - Case Type: Dispute
   - **First Hearing Date:** Pick a future date/time
3. Click "Register Case"
4. ✅ **Go to `/calendar`** - You'll see TWO events:
   - "Case Registered: TEST-2025-001" (today)
   - "First Hearing: TEST-2025-001" (your selected date)

---

## 📊 **Enhanced Calendar View**

### **New Database View:** `calendar_events_with_cases`

This view joins events with cases and calculates:

- ✅ Days until event
- ✅ Is event in the past?
- ✅ Is event today?
- ✅ Is event this week?
- ✅ Case number and title
- ✅ Case status and priority
- ✅ Assigned officer name

**Usage Example:**
```sql
SELECT *
FROM calendar_events_with_cases
WHERE is_this_week = true
ORDER BY event_date ASC;
```

This shows all events happening in the next 7 days!

---

## 📝 **Case History Logging**

Every auto-created event is ALSO logged in case history:

```
Action: "Calendar Event Created"
Description: "Case registration automatically added to calendar"
Timestamp: [when it happened]
Performed by: [user who created the case]
```

**View case history:**
```sql
SELECT *
FROM case_history
WHERE case_id = 'your-case-uuid'
ORDER BY created_at DESC;
```

---

## 🎨 **UI Updates**

### **1. New Case Form** (`/cases/new`)

Added new field:
```
First Hearing Date (Optional)
[Date/Time Picker]
💡 This will automatically create a calendar event for the first hearing
```

### **2. Calendar Page** (`/calendar`)

Enhanced to show:
- Auto-created events with special badge
- Event type color coding
- Case information on each event
- Filter by date range

---

## 💡 **Benefits**

### **For Legal Officers:**
- ✅ Never miss a case registration
- ✅ All hearings automatically in calendar
- ✅ Status milestones tracked
- ✅ No manual calendar entry needed

### **For Managers:**
- ✅ See all active cases on calendar
- ✅ Monitor case progression visually
- ✅ Identify upcoming hearings at a glance
- ✅ Track workload distribution

### **For the System:**
- ✅ Complete audit trail
- ✅ Automatic reminders possible
- ✅ Integration with notifications
- ✅ Comprehensive reporting

---

## 🔔 **Integration with Notifications**

Auto-created events can trigger notifications!

When combined with `database-notifications-enhanced.sql`:

1. Event created → Notification sent to assigned officer
2. Event in 7 days → Daily reminder notification
3. Event today → Urgent notification
4. Event overdue → Alert notification

---

## 📱 **Example Use Cases**

### **Use Case 1: New Land Dispute Case**

```
Officer creates case:
  - Case Number: DLPP-2025-050
  - Title: "Land Boundary Dispute - Eastern Highlands"
  - First Hearing: Feb 1, 2025 at 10:00 AM

System automatically:
  ✅ Creates "Case Registered" event (today)
  ✅ Creates "First Hearing" event (Feb 1)
  ✅ Logs both in case history
  ✅ Sends notification to assigned officer
  ✅ Shows on calendar immediately
```

### **Use Case 2: Case Goes to Court**

```
Officer updates case status:
  - Old Status: Under Review
  - New Status: In Court

System automatically:
  ✅ Creates "Status Changed: IN COURT" event
  ✅ Logs in case history
  ✅ Visible on calendar
  ✅ Notification sent (if configured)
```

### **Use Case 3: Viewing Calendar**

```
Officer opens calendar:
  ✅ Sees all case registration events
  ✅ Sees all scheduled hearings
  ✅ Sees status change milestones
  ✅ Filter by date range
  ✅ Click event to view full case details
```

---

## 🔧 **Customization Options**

### **Change Event Types:**

Edit in SQL function:
```sql
event_type := 'filing_deadline'
-- Change to: 'hearing', 'meeting', 'other', etc.
```

### **Change Event Titles:**

Edit in SQL function:
```sql
v_event_title := 'Case Registered: ' || NEW.case_number;
-- Change to your preferred format
```

### **Disable Auto-Creation:**

Simply drop the triggers:
```sql
DROP TRIGGER auto_create_case_calendar_event ON public.cases;
```

---

## ✅ **Verification Checklist**

After running the SQL, verify:

- [ ] New cases automatically appear in calendar
- [ ] First hearing dates create hearing events
- [ ] Status changes create events (for important statuses)
- [ ] Events are linked to correct cases
- [ ] Case history logs the auto-creation
- [ ] Calendar view shows all events
- [ ] Event details display correctly

---

## 🎯 **Summary**

| Feature | Status | Trigger |
|---------|--------|---------|
| Case Registration Event | ✅ Ready | New case created |
| First Hearing Event | ✅ Ready | Hearing date set |
| Status Change Event | ✅ Ready | Important status change |
| Calendar View | ✅ Enhanced | Always available |
| Case History Logging | ✅ Automatic | All auto-events |
| Notifications | ✅ Integrated | With notification system |

---

## 📞 **What to Do Now**

1. **Run** `database-auto-calendar-events.sql` in Supabase
2. **Create** a test case with hearing date
3. **Check** the calendar page
4. **Verify** events appear automatically
5. **Enjoy** never manually adding case events again! 🎉

---

**Your calendar now automatically tracks every case from registration to closure!** 📅✨

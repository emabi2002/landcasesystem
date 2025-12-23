# ✅ RUN DATABASE NORMALIZATION - FIXED VERSION

## 🔧 ISSUES FIXED!

**Two errors have been fixed:**

1. ✅ **"column created_at of relation documents does not exist"**
   - Fixed: Changed `created_at` to `uploaded_at` for documents table

2. ✅ **"column must appear in GROUP BY clause or be used in aggregate function"**
   - Fixed: Moved `ORDER BY` clauses inside `json_agg()` functions for views

The migration script has been corrected and is ready to run!

---

## 🚀 RUN THIS NOW (5 MINUTES)

### STEP 1: Open the Fixed Migration File

**File**: `database-normalization-migration.sql`

This file has been corrected and is ready to run!

---

### STEP 2: Run in Supabase

1. **Open the file** `database-normalization-migration.sql` in a text editor
2. **Select ALL** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Go to**: https://supabase.com/dashboard
5. **Login** and select your DLPP project
6. **Click**: "SQL Editor" in the left sidebar
7. **Click**: "New Query"
8. **Paste** the SQL code
9. **Click**: "Run"
10. **Wait** for completion (2-3 minutes)

---

### STEP 3: Look for Success Message

You should see:

```
============================================
  DATABASE NORMALIZATION COMPLETE
============================================

Data extracted from cases table to:
  - Parties: 4,086 records
  - Land Parcels: 2,043 records
  - Events: 2,043 records
  - Tasks: 2,043 records
  - Documents: 2,043 records

Views created:
  - case_complete_view (all related data)
  - cases_with_parties (easy party display)

All tables now properly linked with foreign keys!
============================================
```

---

### STEP 4: Verify It Worked

Run this query in Supabase:

```sql
SELECT
  (SELECT COUNT(*) FROM cases) as cases,
  (SELECT COUNT(*) FROM parties) as parties,
  (SELECT COUNT(*) FROM land_parcels) as land_parcels,
  (SELECT COUNT(*) FROM events) as events,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM documents) as documents;
```

**Expected Results:**
- cases: **2,043**
- parties: **4,086+**
- land_parcels: **~2,043**
- events: **~2,043**
- tasks: **~2,043**
- documents: **~2,043**

---

### STEP 5: Test with a Sample Query

View a complete case with all related data:

```sql
SELECT * FROM case_complete_view
WHERE case_number LIKE 'DLPP%'
LIMIT 1;
```

You should see:
- Case fields
- Parties array (JSON)
- Land parcels array
- Events array
- Tasks array
- Documents array

---

## ✅ WHAT WAS FIXED

### Fix #1: Column Name Error

**Error:**
```
ERROR: 42703: column "created_at" of relation "documents" does not exist
```

**Fix:**
Changed `created_at` to `uploaded_at` for documents table (lines 211 and 224)

**Why:**
The `documents` table uses `uploaded_at` instead of `created_at` (all other tables use `created_at`)

### Fix #2: GROUP BY Error

**Error:**
```
ERROR: 42803: column "e.event_date" must appear in the GROUP BY clause or be used in an aggregate function
```

**Fix:**
Moved `ORDER BY` clauses inside the `json_agg()` aggregate functions

**Changed from:**
```sql
SELECT json_agg(json_build_object(...))
FROM events e
WHERE e.case_id = c.id
ORDER BY e.event_date  -- ❌ Wrong position
```

**Changed to:**
```sql
SELECT json_agg(json_build_object(...) ORDER BY e.event_date)  -- ✅ Correct
FROM events e
WHERE e.case_id = c.id
```

**Why:**
PostgreSQL requires `ORDER BY` to be inside aggregate functions when used in subqueries

**Fixed for:**
- Events (ORDER BY e.event_date)
- Tasks (ORDER BY t.due_date)
- Documents (ORDER BY d.uploaded_at DESC)

---

## 🎯 WHAT HAPPENS WHEN YOU RUN THIS

The migration will:

1. ✅ Extract parties from `parties_description` → `parties` table
   - DLPP added as a party
   - Opposing parties extracted and added

2. ✅ Extract land info → `land_parcels` table
   - Survey plan numbers
   - Locations
   - Zoning info
   - Lease details

3. ✅ Create events from `returnable_date` → `events` table
   - Automatic 3-day alerts
   - Hearing types

4. ✅ Create tasks from officer assignments → `tasks` table
   - DLPP action officer
   - Sol Gen officer
   - Due dates

5. ✅ Create document placeholders → `documents` table
   - Court document references
   - Filing information

6. ✅ Create audit trail → `case_history` table
   - Case registration
   - Status changes

7. ✅ Create database views
   - `case_complete_view` - All related data
   - `cases_with_parties` - Easy display

8. ✅ Add performance indexes
   - All foreign keys indexed

---

## 📊 DATABASE STRUCTURE AFTER

```
cases (2,043)
  │
  ├─→ parties (~4,086)           [case_id → cases.id]
  ├─→ land_parcels (~2,043)      [case_id → cases.id]
  ├─→ events (~2,043)            [case_id → cases.id]
  ├─→ tasks (~2,043)             [case_id → cases.id]
  ├─→ documents (~2,043)         [case_id → cases.id]
  └─→ case_history (~4,086)      [case_id → cases.id]
```

**All linked with foreign keys!**

---

## 🎉 AFTER NORMALIZATION

### New Case Registration Will:

1. Insert case into `cases` table
2. Add DLPP to `parties` table
3. Add opposing party to `parties` table
4. Add land parcel to `land_parcels` table (if provided)
5. Add event to `events` table (if returnable date)
6. Add task to `tasks` table (if officer assigned)
7. Add document to `documents` table (if court docs)
8. Add entry to `case_history` table

**All automatically linked via foreign keys!**

---

## ⚡ BENEFITS

**Before:**
- ❌ All data in `cases` table
- ❌ Parties as text
- ❌ No relationships
- ❌ Hard to query

**After:**
- ✅ Normalized structure
- ✅ Foreign key relationships
- ✅ Multiple parties per case
- ✅ Easy queries
- ✅ Referential integrity
- ✅ Fast performance

---

## 🔍 SAMPLE QUERIES AFTER NORMALIZATION

### Get all parties for a case:
```sql
SELECT name, role FROM parties
WHERE case_id = (SELECT id FROM cases WHERE case_number = 'DLPP-2025-0001');
```

### Get cases with upcoming events:
```sql
SELECT c.case_number, e.title, e.event_date
FROM cases c
JOIN events e ON e.case_id = c.id
WHERE e.event_date > NOW()
ORDER BY e.event_date;
```

### Get cases by region with party count:
```sql
SELECT c.region, COUNT(DISTINCT c.id) as case_count, COUNT(p.id) as total_parties
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
GROUP BY c.region
ORDER BY case_count DESC;
```

---

## 📞 IF YOU STILL GET ERRORS

**Take a screenshot** of:
1. The error message
2. The line number where it failed

**Common issues:**
- Missing tables → Run `database-schema.sql` first
- Duplicate data → Script has `NOT EXISTS` checks to prevent this
- Foreign key errors → Make sure `cases` table exists first

---

## ✅ YOU'RE READY!

The migration script is fixed and ready to run!

**GO RUN IT NOW:**
1. Copy `database-normalization-migration.sql`
2. Paste in Supabase SQL Editor
3. Click "Run"
4. Wait for success message
5. Enjoy your normalized database! 🎉

---

**Questions?** Check `DATABASE_NORMALIZATION_INSTRUCTIONS.md` for full details.

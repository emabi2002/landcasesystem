# 🗄️ DATABASE NORMALIZATION - STEP-BY-STEP INSTRUCTIONS

## ✅ WHAT WE'VE CREATED FOR YOU

Your DLPP Legal CMS now has a **properly normalized database structure** with foreign key relationships!

---

## 📊 THE PROBLEM (BEFORE)

Everything was stored in the `cases` table:
```
cases table contains:
- Case info
- Parties description (text)
- Land description (text)
- Officer names (text)
- Returnable dates
- Everything in one big table!
```

**Issues:**
- ❌ Data duplication
- ❌ No referential integrity
- ❌ Hard to query related data
- ❌ Can't easily add multiple parties per case

---

## ✅ THE SOLUTION (AFTER)

Data is now properly separated into related tables:

```
cases (1) ──┬─→ (N) parties          ← People involved
            ├─→ (N) land_parcels     ← Land information
            ├─→ (N) events           ← Hearings, deadlines
            ├─→ (N) tasks            ← Officer assignments
            ├─→ (N) documents        ← Court filings
            └─→ (N) case_history     ← Audit trail
```

**Benefits:**
- ✅ No duplication
- ✅ Foreign keys enforce relationships
- ✅ Easy to query related data
- ✅ Multiple parties/land parcels per case
- ✅ Better performance
- ✅ Scalable structure

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### STEP 1: Run the Normalization Script (10 minutes)

**What to do:**

1. **Open Supabase**:
   - Go to https://supabase.com/dashboard
   - Select your DLPP project
   - Click **"SQL Editor"** in the left sidebar

2. **Open the migration file**:
   - In your project folder, find: `database-normalization-migration.sql`
   - Open it in a text editor
   - **Select ALL the code** (Ctrl+A or Cmd+A)
   - **Copy** it (Ctrl+C or Cmd+C)

3. **Run in Supabase**:
   - In Supabase SQL Editor, click **"New Query"**
   - **Paste** the SQL code (Ctrl+V or Cmd+V)
   - Click **"Run"** button (bottom right)
   - **Wait** for it to complete (2-3 minutes)

4. **Look for success message**:
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

### STEP 2: Verify the Normalization (5 minutes)

**Check the data was extracted correctly:**

Run this query in Supabase SQL Editor:

```sql
SELECT
  (SELECT COUNT(*) FROM cases) as total_cases,
  (SELECT COUNT(*) FROM parties) as total_parties,
  (SELECT COUNT(*) FROM land_parcels) as total_land_parcels,
  (SELECT COUNT(*) FROM events) as total_events,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM documents) as total_documents;
```

**You should see:**
- total_cases: **2,043**
- total_parties: **4,086+** (2 per case minimum: DLPP + opposing party)
- total_land_parcels: **~2,043** (where land data exists)
- total_events: **~2,043+** (where returnable dates exist)
- total_tasks: **~2,043+** (where officers assigned)
- total_documents: **~2,043+** (court document placeholders)

---

### STEP 3: Test with a Sample Query (2 minutes)

**View a complete case with all related data:**

```sql
SELECT * FROM case_complete_view
WHERE case_number LIKE 'DLPP%'
LIMIT 1;
```

This will show you:
- All case fields
- JSON array of parties
- JSON array of land parcels
- JSON array of events
- JSON array of tasks
- JSON array of documents
- Counts of each type

**You should see something like:**
```json
{
  "case_number": "DLPP-1992-0002",
  "title": "Timothy Timas vs Andy Kurkue...",
  "parties": [
    {"name": "Department of Lands & Physical Planning", "role": "defendant"},
    {"name": "Timothy Timas", "role": "plaintiff"}
  ],
  "land_parcels": [...],
  "events": [...],
  "tasks": [...],
  "documents": [...]
}
```

---

### STEP 4: Test New Case Registration (5 minutes)

**The registration form now uses normalization!**

1. **Go to your app**: http://localhost:3000
2. **Login**: admin@lands.gov.pg / demo123
3. **Click**: Cases → Register New Case
4. **Fill in the form**:
   - Select DLPP role (Defendant or Plaintiff)
   - Enter case details
   - Fill in parties description
   - Add land description
   - Set returnable date
   - Assign officer

5. **Submit the form**

6. **What happens behind the scenes**:
   - ✅ Case inserted into `cases` table
   - ✅ DLPP added to `parties` table (linked via case_id)
   - ✅ Opposing party extracted and added to `parties` table
   - ✅ Land info added to `land_parcels` table
   - ✅ Event created in `events` table (with 3-day alert)
   - ✅ Task created in `tasks` table
   - ✅ Document placeholder in `documents` table
   - ✅ Audit entry in `case_history` table

7. **Verify it worked**:
   ```sql
   -- Check the latest case
   SELECT * FROM case_complete_view
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   You should see all related data properly linked!

---

## 📋 WHAT THE MIGRATION DOES

### 1. **Extracts Parties** (from `parties_description`)

**Before:**
```
cases.parties_description = "John Doe -v- DLPP"
```

**After:**
```sql
parties table:
  - name: "John Doe", role: "plaintiff", case_id: <case-id>
  - name: "Dept of Lands...", role: "defendant", case_id: <case-id>
```

### 2. **Extracts Land Parcels** (from `land_description` etc.)

**Before:**
```
cases.land_description = "Lot 123, Port Moresby..."
cases.survey_plan_no = "SP-12345"
cases.zoning = "Residential"
```

**After:**
```sql
land_parcels table:
  - parcel_number: "SP-12345"
  - location: "Port Moresby"
  - notes: "Land Description: Lot 123... Zoning: Residential..."
  - case_id: <case-id>
```

### 3. **Creates Events** (from `returnable_date`)

**Before:**
```
cases.returnable_date = "2025-12-15"
cases.returnable_type = "Directions Hearing"
```

**After:**
```sql
events table:
  - title: "Directions Hearing - DLPP-2025-001"
  - event_date: "2025-12-15"
  - auto_created: true
  - case_id: <case-id>
```

### 4. **Creates Tasks** (from `dlpp_action_officer`)

**Before:**
```
cases.dlpp_action_officer = "Officer Name"
cases.sol_gen_officer = "Sol Gen Name"
```

**After:**
```sql
tasks table:
  - title: "Case Assignment: DLPP-2025-001"
  - description: "DLPP Officer: Officer Name..."
  - status: "pending"
  - case_id: <case-id>
```

### 5. **Creates Document Placeholders** (from `court_file_number`)

**Before:**
```
cases.court_file_number = "NC 123/2025"
cases.court_documents_type = "Writ of Summons"
```

**After:**
```sql
documents table:
  - title: "Court Documents - NC 123/2025"
  - document_type: "filing"
  - file_url: "#" (placeholder)
  - case_id: <case-id>
```

### 6. **Creates Case History** (audit trail)

**New:**
```sql
case_history table:
  - action: "Case Registered"
  - description: "Case registered with court ref: NC 123/2025"
  - metadata: {"dlpp_role": "defendant", "matter_type": "tort"}
  - case_id: <case-id>
```

---

## 🔍 NEW DATABASE VIEWS

### 1. `case_complete_view`

**Purpose**: Get all case data with related records in JSON format

**Usage:**
```sql
SELECT * FROM case_complete_view WHERE case_number = 'DLPP-2025-0001';
```

**Returns:**
- All case fields
- `parties` - JSON array of all parties
- `land_parcels` - JSON array of land parcels
- `events` - JSON array of events/hearings
- `tasks` - JSON array of tasks
- `documents` - JSON array of documents
- Counts of each type

### 2. `cases_with_parties`

**Purpose**: Easy display of plaintiff and defendant names

**Usage:**
```sql
SELECT
  case_number,
  title,
  plaintiffs,
  defendants,
  status
FROM cases_with_parties
WHERE status = 'in_court';
```

**Returns:**
- All case fields
- `plaintiffs` - Comma-separated plaintiff names
- `defendants` - Comma-separated defendant names

---

## 📊 QUERYING NORMALIZED DATA

### Get All Parties for a Case

```sql
SELECT
  p.name,
  p.role,
  p.party_type,
  c.case_number
FROM parties p
JOIN cases c ON c.id = p.case_id
WHERE c.case_number = 'DLPP-2025-0001';
```

### Get All Events for a Case

```sql
SELECT
  e.title,
  e.event_type,
  e.event_date,
  c.case_number
FROM events e
JOIN cases c ON c.id = e.case_id
WHERE c.case_number = 'DLPP-2025-0001'
ORDER BY e.event_date;
```

### Get Cases with Multiple Parties

```sql
SELECT
  c.case_number,
  c.title,
  COUNT(p.id) as party_count
FROM cases c
JOIN parties p ON p.case_id = c.id
GROUP BY c.id
HAVING COUNT(p.id) > 2
ORDER BY party_count DESC;
```

### Get Cases with Upcoming Events

```sql
SELECT
  c.case_number,
  c.title,
  e.title as event_title,
  e.event_date,
  EXTRACT(DAY FROM e.event_date - NOW()) as days_until
FROM cases c
JOIN events e ON e.case_id = c.id
WHERE e.event_date > NOW()
  AND e.event_date <= NOW() + INTERVAL '30 days'
ORDER BY e.event_date;
```

---

## ⚡ PERFORMANCE IMPROVEMENTS

The normalization includes indexes on all foreign keys:

```sql
CREATE INDEX idx_parties_case_id ON parties(case_id);
CREATE INDEX idx_land_parcels_case_id ON land_parcels(case_id);
CREATE INDEX idx_events_case_id ON events(case_id);
CREATE INDEX idx_tasks_case_id ON tasks(case_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
```

**Benefits:**
- ✅ Fast joins between tables
- ✅ Quick filtering by case
- ✅ Efficient related data queries

---

## ✅ VERIFICATION CHECKLIST

After running the normalization:

- [ ] Ran `database-normalization-migration.sql` in Supabase
- [ ] Saw success message with record counts
- [ ] Verified counts with query (Step 2)
- [ ] Tested `case_complete_view` query
- [ ] Tested new case registration
- [ ] Verified new case has related data in all tables

---

## 🎉 SUCCESS CRITERIA

**You'll know it worked when:**

1. ✅ `parties` table has ~4,086+ records
2. ✅ Each case has at least 2 parties (DLPP + opposing)
3. ✅ `land_parcels` table has records for cases with land data
4. ✅ `events` table has records for cases with returnable dates
5. ✅ New case registration creates records in all related tables
6. ✅ Queries using `case_complete_view` return JSON with all data

---

## 📞 TROUBLESHOOTING

### Issue: "Duplicate parties created"

**Solution:**
```sql
DELETE FROM parties p1
USING parties p2
WHERE p1.id > p2.id
  AND p1.case_id = p2.case_id
  AND p1.name = p2.name;
```

### Issue: "Foreign key constraint error"

**Cause:** Trying to insert related data without a valid case_id

**Solution:** Always insert the case first, then use the returned `case_id` for related data

### Issue: "Case registration fails"

**Solution:**
1. Check browser console (F12) for errors
2. Verify API route is working: `/api/cases/register`
3. Check Supabase logs for database errors

---

## 🎯 NEXT STEPS

After normalization is complete:

1. ✅ Update existing cases with missing data
2. ✅ Add more parties to cases as needed
3. ✅ Upload actual documents (replace placeholders)
4. ✅ Create reports using normalized structure
5. ✅ Train staff on new data model

---

## 📚 FILES REFERENCE

- **`database-normalization-migration.sql`** - Run this in Supabase
- **`NORMALIZATION_GUIDE.md`** - Complete technical guide
- **`src/app/api/cases/register/route.ts`** - New normalized API
- **`src/app/cases/new/page.tsx`** - Updated registration form

---

## 🚀 YOU'RE READY!

Your database is now properly normalized with:
- ✅ Foreign key relationships
- ✅ No data duplication
- ✅ Easy to query and maintain
- ✅ Scalable structure
- ✅ Production-ready

**Run the migration script now and enjoy your normalized database!** 🎉

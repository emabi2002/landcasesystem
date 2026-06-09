# 🔄 REIMPORT CASES GUIDE

**Clean slate → Fix spreadsheet → Reimport → Add workflow**

---

## 🎯 WHAT YOU WANT TO DO

1. **Empty** all case data from database
2. **Fix** errors in Excel spreadsheet
3. **Reimport** corrected data
4. **Then** run workflow migration

**Time needed**: 15-30 minutes

---

## ⚠️ BEFORE YOU START

### Create Backup (CRITICAL!)

**Option 1: Supabase Dashboard**
1. Go to Database → Backups
2. Create manual backup
3. Wait for completion

**Option 2: SQL Dump**
```bash
# In terminal
cd landcasesystem
mkdir backups
# Backup will be in Supabase dashboard
```

**Don't skip this!** You can restore if something goes wrong.

---

## 📋 STEP-BY-STEP PROCESS

### STEP 1: Empty All Case Data (2 minutes)

**What this does:**
- Deletes all cases (2,043+ records)
- Deletes all parties (4,086+ records)
- Deletes all documents, events, tasks, land parcels
- Deletes case history
- Leaves table structure intact

**How to do it:**

1. Open Supabase dashboard
2. Go to **SQL Editor**
3. Create **New Query**
4. Open file: `EMPTY_AND_REIMPORT_CASES.sql`
5. Copy ALL the code
6. Paste into Supabase
7. Click **Run**

**Expected output:**
```
✅ Deleted case_history records
✅ Deleted documents records
✅ Deleted events records
✅ Deleted tasks records
✅ Deleted land_parcels records
✅ Deleted parties records
✅ Deleted calendar_events linked to cases
✅ Deleted cases records

========================================
  CASE DATA DELETED SUCCESSFULLY
========================================

Current counts (should all be 0):
  Cases: 0
  Parties: 0
  Documents: 0
  Events: 0
  Tasks: 0
  Land Parcels: 0
  Case History: 0

Database is now ready for fresh import!
========================================
```

**Verify it worked:**
```sql
SELECT COUNT(*) FROM cases;
-- Should return 0
```

---

### STEP 2: Fix Your Excel Spreadsheet (10-20 minutes)

**What to fix:**

You mentioned there are errors. Common issues:

1. **Duplicate case numbers**
   - Each case number should be unique
   - Check for duplicates in Excel

2. **Missing required data**
   - Case title required
   - Case number required

3. **Date formatting**
   - Dates should be: YYYY-MM-DD or DD/MM/YYYY
   - Empty dates are OK (will be NULL)

4. **Party information**
   - Check plaintiff/defendant names
   - Remove extra spaces

5. **Court references**
   - Verify court file numbers
   - Check for typos

**How to check for duplicates in Excel:**
```
1. Select case_number column
2. Click Data → Remove Duplicates (or check for duplicates)
3. Or use formula: =COUNTIF($A:$A, A2) > 1
```

**Save corrected file:**
- Keep original filename or note new filename
- Save in same location

---

### STEP 3: Reimport Corrected Data (5 minutes)

**Which import script to use:**

You previously used: `scripts/simple-import.js`

**Update the script if needed:**

1. Open `scripts/simple-import.js`
2. Check file path points to your Excel file:
   ```javascript
   const filePath = './data/your-file.xlsx'; // Update this
   ```
3. Check sheet name:
   ```javascript
   const sheetName = 'Sheet1'; // Update if different
   ```

**Run the import:**

```bash
cd landcasesystem
bun run scripts/simple-import.js
```

**Or if that doesn't work:**
```bash
node scripts/simple-import.js
```

**Expected output:**
```
📊 Starting import...
✅ Connected to Supabase
✅ Excel file loaded
✅ Processing 2,043 rows...
✅ Imported 2,043 cases
✅ Created 4,086 party relationships
✅ Import complete!

Summary:
  Cases imported: 2,043
  Parties created: 4,086
  Time: 45 seconds
```

**Verify import:**
```sql
-- Check case count
SELECT COUNT(*) FROM cases;

-- Check some cases
SELECT case_number, title, status
FROM cases
LIMIT 10;

-- Check parties
SELECT COUNT(*) FROM parties;
```

---

### STEP 4: Run Workflow Migration (2 minutes)

**Now that data is clean:**

1. Open `DATABASE_WORKFLOW_SCHEMA_MIGRATION.sql`
2. Copy all code
3. Paste in Supabase SQL Editor
4. Run it

**Expected output:**
```
✅ Your 2,043 cases remain intact
✅ All parties, documents, events preserved
✅ New workflow tables created
✅ Cases table extended with workflow columns
```

---

## 🔍 TROUBLESHOOTING

### Issue: Import script not found

**Check file location:**
```bash
ls -la scripts/simple-import.js
```

**If missing, I can recreate it:**
Let me know and I'll generate a fresh import script.

---

### Issue: Excel file not found

**Check path in script:**
```javascript
// In simple-import.js, look for:
const filePath = './data/Cases.xlsx';

// Make sure file exists:
ls -la data/Cases.xlsx
```

**Update path if needed:**
```javascript
const filePath = './your-actual-path/YourFile.xlsx';
```

---

### Issue: Column mapping errors

**The script expects these columns:**
- Case Number
- Title / Case Name
- Status
- Court Reference
- Plaintiff / Applicant
- Defendant / Respondent
- (Other columns optional)

**If your columns are named differently:**
Edit the mapping in `simple-import.js` around line 30-50.

---

### Issue: Supabase connection error

**Check environment variables:**
```bash
# Make sure .env.local has:
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

**Script uses service role key for imports.**

---

## 📊 VERIFICATION CHECKLIST

After reimporting:

- [ ] Case count matches spreadsheet row count
- [ ] Sample cases have correct data
- [ ] Parties created and linked
- [ ] No duplicate case numbers
- [ ] Dates formatted correctly
- [ ] All required fields populated
- [ ] Can view cases in UI
- [ ] Can search cases
- [ ] No database errors

**SQL checks:**
```sql
-- Total cases
SELECT COUNT(*) FROM cases;

-- Cases by status
SELECT status, COUNT(*)
FROM cases
GROUP BY status;

-- Check for duplicates
SELECT case_number, COUNT(*)
FROM cases
GROUP BY case_number
HAVING COUNT(*) > 1;

-- Sample data
SELECT case_number, title, status, created_at
FROM cases
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 COMPLETE WORKFLOW

**Summary of full process:**

```
1. Backup database ✅
   ↓
2. Run EMPTY_AND_REIMPORT_CASES.sql ✅
   ↓
3. Fix Excel spreadsheet ✅
   ↓
4. Run import script ✅
   ↓
5. Verify data imported correctly ✅
   ↓
6. Run DATABASE_WORKFLOW_SCHEMA_MIGRATION.sql ✅
   ↓
7. Start using workflow modules! 🚀
```

---

## 📝 COMMON SPREADSHEET ERRORS

### Error 1: Duplicate Case Numbers

**Symptom:** Import fails or creates duplicate cases

**Fix:**
```excel
1. In Excel, select Case Number column
2. Data → Remove Duplicates
3. Or manually review and fix
```

### Error 2: Invalid Dates

**Symptom:** Dates show as NULL or wrong values

**Fix:**
```excel
1. Select date columns
2. Format Cells → Date → YYYY-MM-DD
3. Or use formula: =TEXT(A2, "YYYY-MM-DD")
```

### Error 3: Extra Spaces

**Symptom:** Names don't match, weird formatting

**Fix:**
```excel
1. Use TRIM function: =TRIM(A2)
2. Or Find & Replace: "  " → " "
```

### Error 4: Empty Required Fields

**Symptom:** Import fails on certain rows

**Fix:**
```excel
1. Filter for empty Case Number or Title
2. Fill in or delete rows
3. At minimum, need: Case Number + Title
```

---

## 🆘 NEED HELP?

**If import script needs updating:**
I can recreate it with your exact column names.

**If you get errors:**
Share the error message and I'll fix it.

**If data looks wrong:**
We can write SQL to fix specific issues.

---

## 📚 FILES INVOLVED

**SQL Scripts:**
- `EMPTY_AND_REIMPORT_CASES.sql` - Empties database
- `DATABASE_WORKFLOW_SCHEMA_MIGRATION.sql` - Adds workflow

**Import Scripts:**
- `scripts/simple-import.js` - Main import script
- `scripts/verify-import.js` - Verification script

**Your Data:**
- Excel spreadsheet (wherever you saved it)

---

## ✅ READY TO START?

**Checklist:**
- [ ] Database backup created
- [ ] Know what needs fixing in spreadsheet
- [ ] Have access to Excel file
- [ ] Know location of import script
- [ ] Supabase credentials in .env.local

**Time needed:**
- Empty: 2 minutes
- Fix spreadsheet: 10-20 minutes
- Reimport: 5 minutes
- Workflow migration: 2 minutes
- **Total: ~20-30 minutes**

---

**Let's do this!** 🚀

Start with Step 1: Run `EMPTY_AND_REIMPORT_CASES.sql`

# 🔄 FRESH START GUIDE

**Empty all data and reimport with normalized database**

---

## ⚠️ BEFORE YOU START

**CRITICAL: Create Backup!**

1. Go to Supabase Dashboard
2. Database → Backups
3. Click "Create Backup"
4. Wait for completion
5. Then proceed

---

## 🗑️ STEP 1: Empty All Data (2 minutes)

### Run the Empty Script

**File**: `EMPTY_ALL_DATA_FRESH_START.sql`

**Where**: Supabase SQL Editor

**Steps**:
1. Open Supabase SQL Editor
2. Create New Query
3. Copy **ALL** code from `EMPTY_ALL_DATA_FRESH_START.sql`
4. Paste into editor
5. Click **Run**
6. Wait ~30 seconds

### Expected Output

```
========================================
  DATABASE EMPTIED SUCCESSFULLY!
========================================

WHAT WAS DELETED:
  ✅ All cases
  ✅ All parties
  ✅ All case documents
  ✅ All court references
  ✅ All workflow records
  ✅ All amendments
  ✅ All related data

WHAT WAS KEPT:
  ✅ All table structures
  ✅ All functions and triggers
  ✅ Users and roles
  ✅ Database schema intact

READY FOR FRESH IMPORT!
========================================
```

### Verify It's Empty

```sql
SELECT
  'Cases' as table_name,
  COUNT(*)::text as count
FROM cases

UNION ALL

SELECT
  'Parties' as table_name,
  COUNT(*)::text as count
FROM parties

UNION ALL

SELECT
  'Court References' as table_name,
  COUNT(*)::text as count
FROM court_references;
```

**Expected**: All counts should be 0

---

## 📋 STEP 2: Fix Your Spreadsheet (15 minutes)

**File**: Your Excel file (`Litigation_File_Register.xlsx`)

**Use this guide**: `SPREADSHEET_FIX_CHECKLIST.md`

### Quick Checklist

**Must Fix**:
- [ ] Remove duplicate case numbers
- [ ] Ensure all cases have titles
- [ ] Fix date formatting (YYYY-MM-DD)
- [ ] Remove extra spaces in names

**Should Fix**:
- [ ] Standardize court references
- [ ] Clean up party names
- [ ] Verify status values

**Save** the corrected file!

---

## 🚀 STEP 3: Import Fresh Data (3 minutes)

### Update Import Script Path

**File**: `scripts/simple-import.js`

Check line 10:
```javascript
const EXCEL_FILE = '/home/project/uploads/Litigation_File_Register.xlsx';
```

Make sure this points to your corrected file.

### Run the Import

```bash
cd landcasesystem
bun run scripts/simple-import.js
```

**Expected Output**:
```
✅ Found 2,043 valid records
✅ Mapped 2,043 records
✅ Batch 82/82: 25 records | Total: 2,043/2,043 (100%)
🎉 Import completed successfully!
```

### Verify Import Worked

```sql
-- Check cases imported
SELECT COUNT(*) FROM cases;
-- Should show your expected count

-- Sample the data
SELECT
  case_number,
  title,
  status,
  created_at
FROM cases
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 STEP 4: Use the Normalized System

Now you can start using all the workflow features!

### Create Sample Court Reference

```sql
-- Add a court reference to one of your cases
INSERT INTO court_references (
  case_id,
  court_reference,
  court_type,
  assigned_date,
  is_current,
  assignment_reason
)
SELECT
  id,
  'WS 123/2023',
  'National Court',
  CURRENT_DATE,
  true,
  'Initial court reference'
FROM cases
LIMIT 1;
```

### Create Sample Case Amendment

```sql
-- Test the amendment function
-- First, get a case_id and court_ref_id
SELECT
  c.id as case_id,
  cr.id as court_ref_id,
  c.case_number,
  cr.court_reference
FROM cases c
JOIN court_references cr ON cr.case_id = c.id
LIMIT 1;

-- Then use those IDs in create_case_amendment function
-- (Replace with actual UUIDs from above query)
```

---

## 📊 WHAT YOU NOW HAVE

After completing all steps:

### **Clean Database**:
- ✅ No old/duplicate data
- ✅ All normalized structures intact
- ✅ All workflow tables ready
- ✅ All functions working

### **Fresh Data**:
- ✅ Corrected case information
- ✅ Proper formatting
- ✅ Ready for workflow usage

### **Complete Features**:
- ✅ Multiple court references per case
- ✅ Court reference reassignment
- ✅ File maintenance tracking
- ✅ Append-only reception records
- ✅ 8-step legal workflow

---

## ⏱️ TOTAL TIME

| Step | Time | Description |
|------|------|-------------|
| 1 | 2 min | Empty all data |
| 2 | 15 min | Fix spreadsheet |
| 3 | 3 min | Import fresh data |
| 4 | 5 min | Verify and test |
| **Total** | **~25 min** | **Complete fresh start** |

---

## ✅ VERIFICATION CHECKLIST

**After Step 1 (Empty)**:
- [ ] Run empty script
- [ ] Saw success message
- [ ] Verified counts are 0
- [ ] Tables still exist
- [ ] Functions still exist

**After Step 2 (Fix)**:
- [ ] Removed duplicates
- [ ] Fixed dates
- [ ] Cleaned names
- [ ] Saved file

**After Step 3 (Import)**:
- [ ] Import script ran
- [ ] No errors
- [ ] Cases count correct
- [ ] Sample data looks good

**After Step 4 (Test)**:
- [ ] Created test court reference
- [ ] Functions work
- [ ] Ready to use!

---

## 🆘 TROUBLESHOOTING

### Import Script Can't Find File

**Error**: `ENOENT: no such file or directory`

**Fix**: Check the file path in `scripts/simple-import.js` line 10

```javascript
// Update this to your actual file location
const EXCEL_FILE = '/home/project/uploads/YOUR_FILE.xlsx';
```

---

### Import Has Duplicate Errors

**Error**: `duplicate key value violates unique constraint`

**Fix**:
1. Check your Excel file for duplicate case numbers
2. Remove duplicates
3. Run import again

---

### Some Tables Still Have Data

**Error**: Counts not showing 0 after empty script

**Fix**:
1. Check which tables still have data
2. Run the empty script again
3. Or manually delete: `DELETE FROM table_name;`

---

## 📚 RELATED GUIDES

**Spreadsheet Fixes**:
- `SPREADSHEET_FIX_CHECKLIST.md` - Complete fixing guide

**Import Help**:
- `REIMPORT_GUIDE.md` - Detailed import guide
- `START_HERE_REIMPORT.md` - Quick import reference

**System Features**:
- `COURT_REFERENCE_REASSIGNMENT_GUIDE.md` - Reassignment guide
- `AUDIT_TRAIL_GUIDE.md` - Audit features guide
- `WORKFLOW_IMPLEMENTATION_GUIDE.md` - Workflow guide

---

## 🎊 SUMMARY

**What This Does**:
1. ✅ Empties ALL data from database
2. ✅ Keeps table structures intact
3. ✅ Keeps functions and triggers
4. ✅ Prepares for fresh import

**What You Get**:
- ✅ Clean slate
- ✅ Normalized database
- ✅ All workflow features
- ✅ Ready for corrected data

**Time Required**: ~25 minutes total

---

**Ready to start fresh?** Begin with Step 1: Run `EMPTY_ALL_DATA_FRESH_START.sql`! 🚀

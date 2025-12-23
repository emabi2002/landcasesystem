# 🚀 QUICK START: Reimport Cases

**3 Simple Steps - 20 Minutes Total**

---

## STEP 1: Empty Database (2 min)

**File**: `EMPTY_AND_REIMPORT_CASES.sql`

**Where**: Supabase → SQL Editor → New Query

**Do**:
1. Copy all SQL code
2. Paste in Supabase
3. Click Run
4. See: "✅ CASE DATA DELETED SUCCESSFULLY"

---

## STEP 2: Fix Your Spreadsheet (15 min)

**File**: `Litigation_File_Register.xlsx` (in `/uploads/` folder)

**What to fix**:
- [ ] Remove duplicate case numbers
- [ ] Fix date formatting (YYYY-MM-DD)
- [ ] Check party names (remove extra spaces)
- [ ] Verify court references
- [ ] Ensure case titles exist

**Save when done!**

---

## STEP 3: Reimport (3 min)

**Terminal command**:
```bash
cd landcasesystem
bun run scripts/simple-import.js
```

**Expected**:
```
✅ Found 2,043 valid records
✅ Mapped 2,043 records
✅ Batch 82/82: 25 records | Total: 2,043/2,043 (100%)
🎉 Import completed successfully!
```

**Verify**:
```sql
SELECT COUNT(*) FROM cases;
-- Should show your case count
```

---

## STEP 4: Add Workflow (2 min)

**File**: `DATABASE_WORKFLOW_SCHEMA_MIGRATION.sql`

**Where**: Supabase → SQL Editor

**Do**:
1. Copy all SQL code
2. Paste in Supabase
3. Click Run
4. See: "✅ WORKFLOW SCHEMA MIGRATION COMPLETE"

---

## ✅ DONE!

Now you have:
- ✅ Clean, corrected case data
- ✅ All workflow tables ready
- ✅ System ready to use

**Total time**: ~20 minutes

---

## 🆘 Need Help?

**Import script location changed?**
Update line 10 in `scripts/simple-import.js`:
```javascript
const EXCEL_FILE = '/path/to/your/file.xlsx';
```

**Column names different?**
The script auto-detects court references and parties.
Should work with any column layout.

**Errors during import?**
Share the error message - I'll fix it!

---

## 📋 Checklist

Before starting:
- [ ] Created database backup
- [ ] Excel file ready to edit
- [ ] Know what needs fixing
- [ ] Terminal access ready

After completing:
- [ ] Cases table empty (Step 1)
- [ ] Spreadsheet fixed (Step 2)
- [ ] Data reimported (Step 3)
- [ ] Workflow added (Step 4)

---

**Ready? Start with Step 1!** 🚀

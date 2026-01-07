# 📋 SPREADSHEET FIX CHECKLIST

**Common errors and how to fix them**

---

## 🔍 ERROR 1: Duplicate Case Numbers

**How to find**:
```excel
1. Click on Case Number column header
2. Go to: Data → Remove Duplicates
3. Excel will show how many duplicates found
```

**Or use formula**:
```excel
In a new column: =COUNTIF($A:$A, A2)
If result > 1, it's a duplicate
```

**How to fix**:
- Option 1: Delete duplicate rows (keep the best one)
- Option 2: Append suffix: "CASE-001-A", "CASE-001-B"
- Option 3: Renumber sequentially

---

## 🔍 ERROR 2: Empty Case Numbers or Titles

**How to find**:
```excel
1. Select Case Number column
2. Go to: Home → Find & Select → Go To Special → Blanks
3. Excel highlights empty cells
```

**How to fix**:
- Fill in missing case numbers
- Or generate: `DLPP-2025-0001`, `DLPP-2025-0002`, etc.
- For titles: Use party names or "Case 001", "Case 002", etc.

---

## 🔍 ERROR 3: Date Formatting Issues

**How to find**:
```excel
Dates showing as:
- Numbers (44950 instead of 2023-01-15)
- Text ("Jan 15" instead of 2023-01-15)
- Inconsistent formats
```

**How to fix**:
```excel
1. Select all date columns
2. Right-click → Format Cells
3. Category: Date
4. Choose: YYYY-MM-DD (2023-01-15)
5. Click OK
```

**Or use formula**:
```excel
=TEXT(A2, "YYYY-MM-DD")
```

---

## 🔍 ERROR 4: Extra Spaces in Names

**How to find**:
```excel
Look for:
- "John  Doe" (double space)
- " John Doe" (leading space)
- "John Doe " (trailing space)
```

**How to fix**:
```excel
Use TRIM function:
=TRIM(A2)

Or Find & Replace:
Find: "  " (two spaces)
Replace: " " (one space)
Repeat until no more found
```

---

## 🔍 ERROR 5: Inconsistent Court References

**Examples**:
- "WS 123/2023" vs "WS123/2023" vs "WS No. 123 of 2023"
- Missing court references

**How to fix**:
- Choose one format and stick to it
- Recommended: "WS 123/2023" (space before number, slash before year)
- Empty is OK (will be NULL in database)

---

## 🔍 ERROR 6: Party Names Not Separated

**Bad**:
- "JohnDoevsDepartment" (no spaces)
- "John Doe Vs. Department" (inconsistent vs/v)

**Good**:
- "John Doe -v- Department of Lands"
- Or separate columns: "John Doe" | "Department of Lands"

**How to fix**:
```excel
Find & Replace:
Find: " Vs "
Replace: " -v- "

Find: " V "
Replace: " -v- "
```

---

## 🔍 ERROR 7: Special Characters

**Problems**:
- Curly quotes: " " instead of " "
- Fancy dashes: – — instead of -
- Hidden characters from copy-paste

**How to fix**:
```excel
Find & Replace:
Find: " (curly quote)
Replace: " (straight quote)

Find: – (en dash)
Replace: - (hyphen)
```

---

## 🔍 ERROR 8: Status Inconsistencies

**Problems**:
- "In Court" vs "in_court" vs "IN COURT"
- Typos: "Closde" instead of "Closed"

**Valid statuses** (recommended):
- `under_review`
- `in_court`
- `mediation`
- `tribunal`
- `judgment`
- `closed`
- `settled`

**How to fix**:
```excel
1. List all unique statuses
2. Standardize to one format (lowercase with underscores)
3. Use Find & Replace for each variant
```

---

## ✅ PRE-IMPORT VALIDATION

**Before reimporting, check**:

### Required Fields
- [ ] Every row has Case Number
- [ ] Every row has Title/Case Name
- [ ] No duplicate Case Numbers

### Data Quality
- [ ] Dates in YYYY-MM-DD format
- [ ] No extra spaces in names
- [ ] Court references standardized
- [ ] Status values consistent
- [ ] Party names properly formatted

### Excel Health
- [ ] No empty rows in middle of data
- [ ] No merged cells
- [ ] Column headers in Row 1 (or Row 4 if using current format)
- [ ] No formulas (convert to values if needed)

---

## 🔧 BATCH FIXES

**Fix all dates at once**:
```excel
1. Select all date columns
2. Data → Text to Columns
3. Choose: Delimited → Next
4. Uncheck all delimiters → Next
5. Column data format: Date (YMD) → Finish
```

**Fix all text at once**:
```excel
1. Select all text columns
2. Press Ctrl+H (Find & Replace)
3. Find: "  " (double space)
4. Replace: " " (single space)
5. Replace All
6. Repeat until 0 replacements
```

**Remove all blank rows**:
```excel
1. Select all data
2. Go to: Data → Filter
3. Click filter dropdown on Case Number
4. Uncheck (Blanks)
5. Delete visible rows
6. Clear filter
```

---

## 📊 VALIDATION FORMULAS

**Add these in new columns for checking**:

**Check for duplicates**:
```excel
=COUNTIF($A:$A, A2)
Result > 1 = duplicate
```

**Check for empty required fields**:
```excel
=IF(OR(ISBLANK(A2), ISBLANK(B2)), "MISSING", "OK")
```

**Check date format**:
```excel
=IF(ISNUMBER(C2), "OK", "FIX")
```

**Check length limits**:
```excel
=IF(LEN(B2)>200, "TOO LONG", "OK")
```

---

## 🎯 RECOMMENDED WORKFLOW

1. **Save a copy** of original file
2. **Work on the copy**
3. **Fix errors one type at a time**:
   - Duplicates first
   - Empty fields second
   - Dates third
   - Text cleanup last
4. **Validate** using formulas above
5. **Save** when all checks pass
6. **Test** with small import first (optional)

---

## 📝 EXAMPLE: Good Data

```
Case Number  | Title                           | Status     | Date Filed  | Court Ref
-------------|--------------------------------|------------|-------------|------------
DLPP-2023-001| John Doe -v- Dept of Lands     | in_court   | 2023-01-15  | WS 123/2023
DLPP-2023-002| Jane Smith -v- PNG Power       | closed     | 2023-02-20  | NC 456/2023
DLPP-2023-003| ABC Ltd -v- NCD Commission     | mediation  | 2023-03-10  | OS 789/2023
```

**Notice**:
- ✅ Unique case numbers
- ✅ Complete titles
- ✅ Consistent status format
- ✅ Proper date format (YYYY-MM-DD)
- ✅ Standardized court references

---

## 🆘 STILL STUCK?

**If you need help**:
1. Share a sample (5-10 rows)
2. Describe what looks wrong
3. I'll create a fix script

**Common tools**:
- Excel: Find & Replace, Remove Duplicates, Text to Columns
- Google Sheets: QUERY, UNIQUE, ARRAYFORMULA
- Text editors: Regex find/replace

---

## ✅ FINAL CHECK

Before importing:

```excel
1. All required fields filled?        [ ]
2. No duplicates?                      [ ]
3. Dates formatted correctly?          [ ]
4. No extra spaces?                    [ ]
5. Consistent values?                  [ ]
6. File saved?                         [ ]
```

**If all checked → Ready to import!** 🚀

---

**Time estimate**: 10-20 minutes for typical cleanup
**Tools needed**: Microsoft Excel or Google Sheets
**Difficulty**: Easy (mostly point-and-click)

# 📋 AUDIT TRAIL & MULTIPLE REFERENCES GUIDE

**Complete record keeping for legal case management**

---

## 🎯 NEW FEATURES

### 1. **Multiple Court References Per Case**
- A case can have many court references over time
- Track when each reference was assigned
- Maintain history of all references
- Know which is current vs historical

### 2. **File Maintenance Tracking**
- Track WHO maintains case files
- Track WHEN maintenance occurred
- Track WHAT was done
- Complete audit trail of all file handlers

### 3. **Append-Only Reception Records**
- Old records cannot be modified
- Always create new records for additional info
- Complete historical record preserved
- Audit trail protected

---

## 📊 DATABASE TABLES

### 1. `court_references` - Multiple Court References

**Purpose**: Track all court references assigned to a case over its lifetime

**Schema**:
```sql
court_references
  ├─ id                    (UUID, primary key)
  ├─ case_id               (references cases.id)
  ├─ court_reference       (text, e.g., "WS 123/2023")
  ├─ court_type            (text, "National Court", "Supreme Court", etc.)
  ├─ assigned_date         (date, when assigned)
  ├─ assigned_by           (user who assigned it)
  ├─ is_current            (boolean, TRUE = active reference)
  ├─ assignment_reason     (text, why assigned)
  ├─ superseded_date       (date, when replaced)
  ├─ superseded_by_ref_id  (references court_references.id)
  ├─ superseded_reason     (text, why replaced)
  └─ created_at, updated_at, notes
```

---

### 2. `file_maintenance_log` - File Maintenance Tracking

**Purpose**: **APPEND-ONLY** log of who maintained files and when

**Schema**:
```sql
file_maintenance_log
  ├─ id                    (UUID, primary key)
  ├─ case_id               (references cases.id)
  ├─ maintained_by         (user who maintained file)
  ├─ maintenance_date      (timestamp, when maintained)
  ├─ maintenance_type      (type of maintenance)
  ├─ file_type             ("Court File", "Land File", etc.)
  ├─ description           (what was done)
  ├─ changes_made          (JSONB, structured changes)
  ├─ previous_maintainer   (who had it before)
  └─ created_at, notes
```

**Maintenance Types**:
- `file_creation` - Initial file creation
- `file_update` - Updated existing file
- `document_added` - Added documents
- `document_removed` - Removed/archived documents
- `file_transfer` - Transferred to another officer
- `file_review` - Reviewed file
- `file_correction` - Corrected information
- `file_closure` - Closed file

---

### 3. `case_files` - Enhanced with Maintainer Tracking

**New Columns**:
- `current_maintainer` - Who currently maintains the file
- `last_maintained_date` - When last maintained

**Automatic Logging**: Any update to `case_files` automatically creates entry in `file_maintenance_log`

---

## 🔄 USE CASES & EXAMPLES

### USE CASE 1: Case Gets New Court Reference

**Scenario**: Case initially filed as WS 123/2023, then appealed to Supreme Court as SCA 456/2024

**SQL**:
```sql
-- Initial court reference (National Court)
INSERT INTO court_references (
  case_id,
  court_reference,
  court_type,
  assigned_date,
  assigned_by,
  is_current,
  assignment_reason
) VALUES (
  [case_id],
  'WS 123/2023',
  'National Court',
  '2023-01-15',
  [user_id],
  TRUE,
  'Initial filing in National Court'
);

-- Case appealed to Supreme Court (new reference)
-- Step 1: Mark old reference as superseded
UPDATE court_references
SET
  is_current = FALSE,
  superseded_date = '2024-03-20',
  superseded_reason = 'Case appealed to Supreme Court'
WHERE case_id = [case_id] AND court_reference = 'WS 123/2023';

-- Step 2: Add new Supreme Court reference
INSERT INTO court_references (
  case_id,
  court_reference,
  court_type,
  assigned_date,
  assigned_by,
  is_current,
  assignment_reason
) VALUES (
  [case_id],
  'SCA 456/2024',
  'Supreme Court of Appeal',
  '2024-03-20',
  [user_id],
  TRUE,
  'Case appealed from National Court'
);
```

**Result**: Complete history of both court references with dates!

---

### USE CASE 2: Case Transferred Between Courts

**Scenario**: Case starts in National Court Port Moresby, transferred to National Court Lae

**SQL**:
```sql
-- Original reference
INSERT INTO court_references (
  case_id, court_reference, court_type, assigned_date, is_current, assignment_reason
) VALUES (
  [case_id],
  'NC 789/2023',
  'National Court - Port Moresby',
  '2023-05-10',
  TRUE,
  'Initial filing in Port Moresby'
);

-- Transfer to Lae (new reference)
-- Mark old as superseded
UPDATE court_references
SET is_current = FALSE, superseded_date = '2024-01-15',
    superseded_reason = 'Case transferred to Lae'
WHERE case_id = [case_id] AND court_reference = 'NC 789/2023';

-- Add new Lae reference
INSERT INTO court_references (
  case_id, court_reference, court_type, assigned_date, is_current, assignment_reason
) VALUES (
  [case_id],
  'NC 890/2024',
  'National Court - Lae',
  '2024-01-15',
  TRUE,
  'Case transferred from Port Moresby'
);
```

---

### USE CASE 3: Multiple Officers Maintain Same File

**Scenario**:
- Officer A creates court file (Jan 15)
- Officer B updates it with land file number (Feb 10)
- Officer C adds titles file number (Mar 5)

**SQL**:
```sql
-- Officer A creates file
INSERT INTO case_files (
  case_id,
  court_file_number,
  current_maintainer,
  created_by
) VALUES (
  [case_id],
  'NC 123/2024',
  [officer_a_id],
  [officer_a_id]
);
-- Automatic log entry created: "file_creation" by Officer A

-- Officer B adds land file number (2 weeks later)
UPDATE case_files
SET
  land_file_number = 'LF-456',
  current_maintainer = [officer_b_id],
  updated_by = [officer_b_id]
WHERE case_id = [case_id];
-- Automatic log entry created: "file_update" by Officer B
-- Previous maintainer: Officer A

-- Officer C adds titles file number (3 weeks later)
UPDATE case_files
SET
  titles_file_number = 'TF-789',
  current_maintainer = [officer_c_id],
  updated_by = [officer_c_id]
WHERE case_id = [case_id];
-- Automatic log entry created: "file_update" by Officer C
-- Previous maintainer: Officer B
```

**View maintenance history**:
```sql
SELECT
  m.maintenance_date,
  u.full_name as maintained_by,
  m.maintenance_type,
  m.description,
  m.changes_made
FROM file_maintenance_log m
JOIN users u ON u.id = m.maintained_by
WHERE m.case_id = [case_id]
ORDER BY m.maintenance_date;
```

**Result**:
```
Date         | Maintained By  | Type           | Description
-------------|---------------|----------------|---------------------------
2024-01-15   | Officer A     | file_creation  | Initial case files created
2024-02-10   | Officer B     | file_update    | Case files updated
2024-03-05   | Officer C     | file_update    | Case files updated
```

---

### USE CASE 4: Manual Maintenance Logging

**Scenario**: Officer reviews file and adds documents (not just updating case_files table)

**SQL**:
```sql
INSERT INTO file_maintenance_log (
  case_id,
  maintained_by,
  maintenance_type,
  file_type,
  description,
  changes_made,
  notes
) VALUES (
  [case_id],
  [officer_id],
  'document_added',
  'Court File',
  'Added affidavit of service and notice of motion',
  jsonb_build_object(
    'documents_added', ARRAY['Affidavit of Service', 'Notice of Motion'],
    'document_count', 2,
    'file_location', 'Registry Shelf 3B'
  ),
  'Documents received from opposing counsel on 2024-04-15'
);
```

---

### USE CASE 5: Reception - Append-Only Records

**Scenario**:
- Day 1: Reception receives initial writ
- Day 5: Same case - additional documents arrive
- Old record must NOT be modified, create new record

**WRONG (will fail after 1 hour)**:
```sql
-- This will FAIL if record is older than 1 hour
UPDATE case_intake_records
SET document_type = 'Writ + Affidavit'
WHERE id = [intake_record_id];
-- ERROR: Cannot modify intake records older than 1 hour
```

**CORRECT (create new record)**:
```sql
-- Original intake (Day 1)
INSERT INTO case_intake_records (
  case_id,
  received_by,
  received_date,
  document_type,
  source,
  notes
) VALUES (
  [case_id],
  [reception_user_id],
  '2024-01-15',
  'Writ of Summons',
  'National Court',
  'Initial filing documents received'
);

-- Additional documents arrive (Day 5)
-- Create NEW record linked to SAME case
INSERT INTO case_intake_records (
  case_id,
  received_by,
  received_date,
  document_type,
  source,
  notes
) VALUES (
  [case_id],
  [reception_user_id],
  '2024-01-20',
  'Affidavit in Support + Notice of Motion',
  'Plaintiff Lawyer',
  'Additional documents for same case - supplementary filing'
);
```

**View all intake records for case**:
```sql
SELECT
  received_date,
  document_type,
  source,
  notes
FROM case_intake_records
WHERE case_id = [case_id]
ORDER BY received_date;
```

**Result**: Complete history of all documents received, original record untouched!

---

## 📊 REPORTING QUERIES

### Query 1: Current vs Historical Court References

```sql
-- Get current court reference for a case
SELECT
  court_reference,
  court_type,
  assigned_date
FROM court_references
WHERE case_id = [case_id] AND is_current = TRUE;

-- Get all historical references
SELECT
  court_reference,
  court_type,
  assigned_date,
  superseded_date,
  superseded_reason
FROM court_references
WHERE case_id = [case_id] AND is_current = FALSE
ORDER BY assigned_date;
```

---

### Query 2: File Maintenance History

```sql
-- Complete maintenance history for a case
SELECT
  m.maintenance_date,
  u.full_name as officer_name,
  m.maintenance_type,
  m.file_type,
  m.description,
  prev_u.full_name as previous_officer
FROM file_maintenance_log m
JOIN users u ON u.id = m.maintained_by
LEFT JOIN users prev_u ON prev_u.id = m.previous_maintainer
WHERE m.case_id = [case_id]
ORDER BY m.maintenance_date DESC;
```

---

### Query 3: Who Currently Maintains Which Files

```sql
-- List of cases and their current file maintainers
SELECT
  c.case_number,
  c.title,
  u.full_name as current_maintainer,
  cf.last_maintained_date,
  cf.court_file_number,
  cf.land_file_number,
  cf.titles_file_number
FROM cases c
JOIN case_files cf ON cf.case_id = c.id
LEFT JOIN users u ON u.id = cf.current_maintainer
WHERE cf.current_maintainer IS NOT NULL
ORDER BY cf.last_maintained_date DESC;
```

---

### Query 4: Officer Workload - File Maintenance

```sql
-- How many files each officer has maintained this month
SELECT
  u.full_name,
  COUNT(DISTINCT m.case_id) as files_maintained,
  COUNT(m.id) as total_maintenance_actions
FROM file_maintenance_log m
JOIN users u ON u.id = m.maintained_by
WHERE m.maintenance_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id, u.full_name
ORDER BY files_maintained DESC;
```

---

### Query 5: Cases with Multiple Court References

```sql
-- Cases that have been reassigned court references
SELECT
  c.case_number,
  c.title,
  COUNT(cr.id) as reference_count,
  string_agg(cr.court_reference, ' → ' ORDER BY cr.assigned_date) as reference_history
FROM cases c
JOIN court_references cr ON cr.case_id = c.id
GROUP BY c.id
HAVING COUNT(cr.id) > 1
ORDER BY reference_count DESC;
```

---

## 🔒 PROTECTION MECHANISMS

### 1. **Prevent Old Intake Record Modification**

**Protection**: Trigger prevents modification after 1 hour

**Why 1 hour?** Allows quick typo fixes, prevents later tampering

**Bypass**: Not possible (by design) - create new record instead

---

### 2. **Prevent File Maintenance Log Deletion**

**Protection**: RLS policy prevents deletion

**Why?** Maintenance log is legal audit trail - cannot be destroyed

**Bypass**: Only database admin can override (extreme cases)

---

### 3. **Automatic Logging**

**Trigger**: Any change to `case_files` table automatically logs to `file_maintenance_log`

**What's logged**:
- Who made change
- When
- What changed (JSONB diff)
- Previous maintainer

---

## ✅ BEST PRACTICES

### Reception Desk

**DO**:
- ✅ Create new intake record for each document batch received
- ✅ Link all records to same `case_id`
- ✅ Record exact date received
- ✅ Note who received it

**DON'T**:
- ❌ Modify old intake records (after 1 hour)
- ❌ Delete intake records
- ❌ Combine multiple receipts into one record

---

### File Maintenance

**DO**:
- ✅ Update `current_maintainer` when transferring files
- ✅ Add manual log entries for significant actions
- ✅ Include detailed descriptions
- ✅ Use structured `changes_made` JSONB

**DON'T**:
- ❌ Delete maintenance log entries
- ❌ Skip logging file transfers
- ❌ Leave `current_maintainer` empty

---

### Court References

**DO**:
- ✅ Mark old reference as `is_current = FALSE` when adding new
- ✅ Record `superseded_date` and `superseded_reason`
- ✅ Keep all historical references
- ✅ Link superseding references

**DON'T**:
- ❌ Delete old court references
- ❌ Have multiple `is_current = TRUE` for same case
- ❌ Modify historical reference numbers

---

## 🚀 ACTIVATION

**Run this script**:
```
File: WORKFLOW_ENHANCEMENTS_AUDIT_TRAIL.sql
Where: Supabase SQL Editor
When: After reimporting data
Time: 2 minutes
```

**What it creates**:
1. `court_references` table
2. `file_maintenance_log` table
3. Extends `case_files` with maintainer tracking
4. Adds triggers for automatic logging
5. Adds protections for append-only tables

---

## 📋 SUMMARY

### Multiple Court References
- ✅ Track all court refs per case over time
- ✅ Know which is current
- ✅ See complete history
- ✅ Record when and why changed

### File Maintenance Tracking
- ✅ WHO maintained files (complete list)
- ✅ WHEN maintenance occurred (exact timestamps)
- ✅ WHAT was done (detailed descriptions)
- ✅ Automatic logging on file updates

### Append-Only Reception
- ✅ Old records protected from modification
- ✅ New records for additional info
- ✅ Complete audit trail
- ✅ Legal record integrity preserved

---

**These features ensure complete legal record keeping compliance!** ✅

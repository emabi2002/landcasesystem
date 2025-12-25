# 📋 STEP 3: ASSIGNMENT MODULE - COMPLETE GUIDE

**Multiple Lawyers | New vs Existing Cases | Reassignments**

---

## 🎯 KEY FEATURES

### ✅ Multiple Lawyers Per Case
- **A single case can have MULTIPLE lawyers assigned** simultaneously
- Each lawyer has a defined role (Lead Counsel, Co-Counsel, Assisting Officer)
- All active at the same time - working together on the case

### ✅ New vs Existing Case Tracking
- **New Case (3a)**: Requires court file creation, land file requests, etc.
- **Existing Case (3b)**: Just assign lawyer and resume work
- System tracks which path was taken

### ✅ Reassignment Support
- Cases can be **reassigned** from one lawyer to another
- **Mandatory explanation** required for reassignments
- Full audit trail of who had the case when

---

## 📊 DATABASE FIELDS

### `case_assignments` Table

```sql
-- Core assignment
assigned_to          → Which lawyer/officer
assigned_by          → Who assigned them (Manager)
assigned_date        → When assigned

-- New vs Existing
is_new_case          → TRUE = new case (3a), FALSE = existing (3b)

-- Assignment type
assignment_type      → 'initial', 'additional', 'reassignment', 'temporary', 'lead_counsel'
assignment_reason    → General reason for assignment
reassignment_explanation → REQUIRED if type = 'reassignment'

-- Status
is_active            → Currently working on case?
ended_at             → When assignment ended
ended_by             → Who ended it
ending_reason        → Why ended

-- Multiple lawyer support
role_on_case         → "Lead Counsel", "Co-Counsel", "Assisting Officer", etc.

-- Notes & audit
notes, created_at, created_by
```

---

## 🔄 ASSIGNMENT SCENARIOS

### Scenario 1: New Case - Single Lawyer (3a)

**Situation**: Court documents just received, need to assign to new lawyer

```sql
-- Manager assigns Officer A to NEW case
INSERT INTO case_assignments (
  case_id,
  assigned_to,
  assigned_by,
  is_new_case,               -- TRUE
  assignment_type,
  assignment_reason,
  role_on_case,
  is_active
) VALUES (
  [case_id],
  [officer_a_id],
  [manager_id],
  TRUE,                      -- This is a NEW case (3a)
  'initial',
  'First assignment for newly filed case',
  'Lead Counsel',
  TRUE
);

-- Officer A then creates court file (3a actions)
INSERT INTO case_files (
  case_id,
  court_file_number,
  land_file_number,
  titles_file_number
) VALUES (
  [case_id],
  'NC 123/2025',
  'LF-456',
  'TF-789'
);
```

**Result**: Officer A assigned to new case, files created

---

### Scenario 2: Existing Case - Single Lawyer (3b)

**Situation**: Case already exists, assigning lawyer to handle it

```sql
-- Manager assigns Officer B to EXISTING case
INSERT INTO case_assignments (
  case_id,
  assigned_to,
  assigned_by,
  is_new_case,               -- FALSE
  assignment_type,
  assignment_reason,
  role_on_case,
  is_active
) VALUES (
  [case_id],
  [officer_b_id],
  [manager_id],
  FALSE,                     -- This is an EXISTING case (3b)
  'initial',
  'Assigning officer to ongoing case',
  'Lead Counsel',
  TRUE
);

-- Officer B just continues work - no file creation needed
```

**Result**: Officer B assigned to existing case, resumes work

---

### Scenario 3: Multiple Lawyers - Team Assignment

**Situation**: Complex case needs multiple lawyers working together

```sql
-- Step 1: Assign Lead Counsel
INSERT INTO case_assignments (
  case_id,
  assigned_to,
  assigned_by,
  is_new_case,
  assignment_type,
  assignment_reason,
  role_on_case,
  is_active
) VALUES (
  [case_id],
  [senior_lawyer_id],
  [manager_id],
  FALSE,
  'lead_counsel',
  'Complex case requiring senior lawyer as lead',
  'Lead Counsel',
  TRUE
);

-- Step 2: Add Co-Counsel
INSERT INTO case_assignments (
  case_id,
  assigned_to,
  assigned_by,
  is_new_case,
  assignment_type,
  assignment_reason,
  role_on_case,
  is_active
) VALUES (
  [case_id],
  [lawyer_2_id],
  [manager_id],
  FALSE,
  'additional',              -- ADDITIONAL lawyer on same case
  'Adding co-counsel for large case',
  'Co-Counsel',
  TRUE
);

-- Step 3: Add Assisting Officer
INSERT INTO case_assignments (
  case_id,
  assigned_to,
  assigned_by,
  is_new_case,
  assignment_type,
  assignment_reason,
  role_on_case,
  is_active
) VALUES (
  [case_id],
  [junior_officer_id],
  [manager_id],
  FALSE,
  'additional',              -- ADDITIONAL lawyer on same case
  'Adding assisting officer for research',
  'Assisting Officer',
  TRUE
);
```

**Result**: **3 lawyers actively working on same case**:
- Lead Counsel (senior lawyer)
- Co-Counsel (lawyer 2)
- Assisting Officer (junior officer)

**Query to see all active lawyers on a case**:
```sql
SELECT
  u.full_name as lawyer_name,
  a.role_on_case,
  a.assignment_type,
  a.assigned_date
FROM case_assignments a
JOIN users u ON u.id = a.assigned_to
WHERE a.case_id = [case_id]
  AND a.is_active = TRUE
ORDER BY a.assigned_date;
```

---

### Scenario 4: Reassignment - Change of Lawyer

**Situation**: Case needs to be reassigned from Officer A to Officer B

**Step 1: End Officer A's assignment**
```sql
UPDATE case_assignments
SET
  is_active = FALSE,
  ended_at = NOW(),
  ended_by = [manager_id],
  ending_reason = 'Reassigned to another officer due to workload'
WHERE case_id = [case_id]
  AND assigned_to = [officer_a_id]
  AND is_active = TRUE;
```

**Step 2: Create new assignment for Officer B**
```sql
INSERT INTO case_assignments (
  case_id,
  assigned_to,
  assigned_by,
  is_new_case,
  assignment_type,
  assignment_reason,
  reassignment_explanation,      -- REQUIRED for reassignments!
  role_on_case,
  is_active
) VALUES (
  [case_id],
  [officer_b_id],
  [manager_id],
  FALSE,
  'reassignment',                 -- Type is REASSIGNMENT
  'Case workload rebalancing',
  'Officer A has too many cases. Officer B has capacity and relevant experience. Transfer approved by Manager Legal Services on 2025-01-15.',  -- Detailed explanation
  'Lead Counsel',
  TRUE
);
```

**Result**: Case transferred from Officer A to Officer B with full explanation

---

### Scenario 5: Temporary Coverage

**Situation**: Lead counsel on leave, need temporary coverage

```sql
-- Original lawyer still assigned but inactive temporarily
UPDATE case_assignments
SET
  is_active = FALSE,
  ended_at = NOW(),
  ended_by = [manager_id],
  ending_reason = 'Annual leave - temporary coverage assigned'
WHERE case_id = [case_id]
  AND assigned_to = [original_lawyer_id]
  AND is_active = TRUE;

-- Assign temporary cover
INSERT INTO case_assignments (
  case_id,
  assigned_to,
  assigned_by,
  is_new_case,
  assignment_type,
  assignment_reason,
  role_on_case,
  is_active
) VALUES (
  [case_id],
  [cover_lawyer_id],
  [manager_id],
  FALSE,
  'temporary',               -- Temporary coverage
  'Covering for Officer A during annual leave (2 weeks)',
  'Acting Lead Counsel',
  TRUE
);
```

---

## 🖥️ UI IMPLEMENTATION

### Assignment Form Fields

**Section 1: Case Type**
```
[ ] New Case (3a) - Requires court file creation
[ ] Existing Case (3b) - Resume work
```

**Section 2: Lawyer Selection**
```
Assign to: [Dropdown: All litigation officers]
Role: [Dropdown: Lead Counsel, Co-Counsel, Assisting Officer]
```

**Section 3: Assignment Type**
```
( ) Initial Assignment - First time assigning this case
( ) Additional Lawyer - Add to team (multiple lawyers)
( ) Reassignment - Transfer from another lawyer
( ) Temporary - Covering for another lawyer
( ) Lead Counsel - Designate as lead on case
```

**Section 4: Reason (Conditional)**

If type = 'Reassignment':
```
Reassignment Explanation: [Required Text Area]
(Explain why case is being reassigned - workload, expertise, availability, etc.)
```

Otherwise:
```
Assignment Reason: [Optional Text Field]
(General reason for this assignment)
```

**Section 5: Notes**
```
Additional Notes: [Text Area]
```

---

## 📊 QUERIES FOR REPORTS

### 1. Current Lawyers on a Case
```sql
SELECT
  u.full_name,
  u.email,
  a.role_on_case,
  a.assignment_type,
  a.assigned_date,
  a.assignment_reason
FROM case_assignments a
JOIN users u ON u.id = a.assigned_to
WHERE a.case_id = [case_id]
  AND a.is_active = TRUE
ORDER BY
  CASE a.role_on_case
    WHEN 'Lead Counsel' THEN 1
    WHEN 'Co-Counsel' THEN 2
    WHEN 'Assisting Officer' THEN 3
    ELSE 4
  END;
```

### 2. Assignment History for a Case
```sql
SELECT
  u.full_name as lawyer,
  a.role_on_case,
  a.assignment_type,
  a.assigned_date,
  a.is_active,
  a.ended_at,
  a.ending_reason,
  a.reassignment_explanation
FROM case_assignments a
JOIN users u ON u.id = a.assigned_to
WHERE a.case_id = [case_id]
ORDER BY a.assigned_date DESC;
```

### 3. Lawyer Workload (Active Cases)
```sql
SELECT
  u.full_name as lawyer,
  COUNT(DISTINCT a.case_id) as active_cases,
  COUNT(CASE WHEN a.role_on_case = 'Lead Counsel' THEN 1 END) as lead_cases,
  COUNT(CASE WHEN a.role_on_case = 'Co-Counsel' THEN 1 END) as co_counsel_cases,
  COUNT(CASE WHEN a.role_on_case = 'Assisting Officer' THEN 1 END) as assisting_cases
FROM case_assignments a
JOIN users u ON u.id = a.assigned_to
WHERE a.is_active = TRUE
GROUP BY u.id, u.full_name
ORDER BY active_cases DESC;
```

### 4. Cases with Multiple Lawyers
```sql
SELECT
  c.case_number,
  c.title,
  COUNT(a.id) as lawyer_count,
  string_agg(u.full_name || ' (' || a.role_on_case || ')', ', ') as team
FROM cases c
JOIN case_assignments a ON a.case_id = c.id
JOIN users u ON u.id = a.assigned_to
WHERE a.is_active = TRUE
GROUP BY c.id
HAVING COUNT(a.id) > 1
ORDER BY lawyer_count DESC;
```

### 5. Reassignment Report
```sql
SELECT
  c.case_number,
  c.title,
  u.full_name as reassigned_to,
  a.assigned_date as reassignment_date,
  a.reassignment_explanation,
  assigner.full_name as reassigned_by
FROM case_assignments a
JOIN cases c ON c.id = a.case_id
JOIN users u ON u.id = a.assigned_to
JOIN users assigner ON assigner.id = a.assigned_by
WHERE a.assignment_type = 'reassignment'
ORDER BY a.assigned_date DESC
LIMIT 50;
```

---

## ✅ VALIDATION RULES

### 1. Reassignment Explanation Required
```sql
-- Application-level validation:
IF assignment_type = 'reassignment' AND reassignment_explanation IS NULL THEN
  RAISE ERROR 'Reassignment explanation is required';
END IF;
```

### 2. New Case File Creation
```sql
-- If is_new_case = TRUE, must create case_files entry
IF is_new_case = TRUE THEN
  -- Check case_files table has entry for this case
  IF NOT EXISTS (SELECT 1 FROM case_files WHERE case_id = [case_id]) THEN
    RAISE NOTICE 'Remember to create court file for new case (Step 3a)';
  END IF;
END IF;
```

### 3. Role Uniqueness (Optional)
```sql
-- Only one Lead Counsel active at a time (optional business rule)
SELECT COUNT(*)
FROM case_assignments
WHERE case_id = [case_id]
  AND is_active = TRUE
  AND role_on_case = 'Lead Counsel';

-- If > 1, show warning or prevent
```

---

## 🎯 WORKFLOW SUMMARY

### Step 3: Assignment Process

**3a: New Case**
1. Manager selects: "New Case"
2. Assigns lawyer(s)
3. System prompts to create court file
4. Officer creates:
   - Court file number
   - Land file request
   - Titles file request
5. Work begins

**3b: Existing Case**
1. Manager selects: "Existing Case"
2. Assigns lawyer(s)
3. Work resumes immediately (no file creation)

**Multiple Lawyers**
1. Assign first lawyer (Lead Counsel)
2. Add additional lawyers as needed
3. Specify role for each
4. All work together on same case

**Reassignment**
1. End current assignment
2. Create new assignment with type='reassignment'
3. **Mandatory**: Provide detailed explanation
4. New lawyer takes over

---

## 📋 EXAMPLE DATA

```sql
-- Case with multiple lawyers (active team)
case_id: abc123
Lawyer 1: Senior Officer (Lead Counsel) - active
Lawyer 2: Mid-level Officer (Co-Counsel) - active
Lawyer 3: Junior Officer (Assisting Officer) - active

-- Assignment history shows:
2025-01-15: Senior Officer assigned (initial)
2025-01-20: Mid-level added (additional) - complex case needs support
2025-01-25: Junior Officer added (additional) - research assistance needed

-- All 3 currently active, working together
```

```sql
-- Reassignment example
case_id: def456

2025-01-10: Officer A assigned (initial) - active
2025-02-15: Officer A ended (reassigned)
            Reason: "Workload rebalancing"
2025-02-15: Officer B assigned (reassignment) - active
            Explanation: "Officer A has 15 active cases, Officer B has 5. Officer B has experience in similar land disputes. Transfer approved by Manager Legal Services."
```

---

## 🚀 KEY TAKEAWAYS

✅ **Multiple lawyers per case** - Supported via multiple active `case_assignments` rows
✅ **New vs Existing** - Tracked via `is_new_case` field
✅ **Reassignments** - Full audit trail with mandatory explanations
✅ **Roles** - Lead Counsel, Co-Counsel, Assisting Officer, etc.
✅ **Complete history** - Who had case when, why it changed

**This design allows for complete flexibility in lawyer assignment while maintaining full audit trail!**

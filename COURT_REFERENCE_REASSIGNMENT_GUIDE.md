# 📋 COURT REFERENCE REASSIGNMENT GUIDE

**Creating Amended Cases with New Court References**

---

## 🎯 YOUR REQUIREMENT

> "In cases where a particular court reference is being reassigned with a new court reference, there must be a module for this to create a reassigned court referencing the original documents but with new details. System should be able to have a prompt asking if this is a new case or an amended case with a new court reference. If it is an amended case, this must be linked to the old court references or ID, and this process can happen many times during the course of the trial or court matter."

---

## ✅ WHAT I BUILT

### 1. **Prompt System**
When creating a case, system asks:
```
Is this:
( ) A brand new case
( ) An amended case with new court reference
```

### 2. **Amendment Linking**
If amended:
- Links to original case
- Links to original court reference
- References original documents
- Inherits parties, land parcels

### 3. **Unlimited Chaining**
Can be amended multiple times:
```
Case A (WS 123/2023)
  → Amended as Case B (NC 456/2024)
    → Amended as Case C (SCA 789/2024)
      → Amended as Case D (FC 012/2025)
```

### 4. **Complete History**
System tracks:
- Every amendment
- Why it was amended
- When it was amended
- Who initiated it
- What was inherited

---

## 📊 DATABASE STRUCTURE

### 1. `case_amendments` Table

**Tracks each amendment**:
```
Amendment Record:
  ├─ new_case_id (the case created by amendment)
  ├─ new_court_reference_id
  ├─ original_case_id (the case being amended)
  ├─ original_court_reference_id
  ├─ amendment_type (appeal, transfer, etc.)
  ├─ amendment_reason
  ├─ previous_amendment_id (for chaining)
  └─ inherit flags (documents, parties, land)
```

### 2. `document_inheritance` Table

**Tracks inherited documents**:
```
Inheritance Record:
  ├─ amendment_id
  ├─ original_document_id
  ├─ new_case_id
  └─ inheritance_type (reference or copy)
```

### 3. `court_references` Extended

**New columns**:
- `parent_reference_id` - Links to previous reference
- `is_amended_from_previous` - Flag for amended refs
- `amendment_id` - Links to amendment record

---

## 🔄 AMENDMENT WORKFLOW

### Step-by-Step Process

**STEP 1: User Initiates Amendment**

UI shows prompt:
```
┌─────────────────────────────────────────┐
│  Create Case / Court Reference          │
├─────────────────────────────────────────┤
│                                         │
│  Is this:                               │
│  ( ) A brand new case                   │
│  (•) An amended case with new reference │
│                                         │
└─────────────────────────────────────────┘
```

**STEP 2: If Amended, Link to Original**

```
┌─────────────────────────────────────────┐
│  Select Original Case                   │
├─────────────────────────────────────────┤
│                                         │
│  Original Case:                         │
│  [Search: DLPP-2023-0001____________]   │
│                                         │
│  Current Court Reference:               │
│  WS 123/2023 (National Court)           │
│                                         │
│  Case Title:                            │
│  John Doe -v- Department of Lands       │
│                                         │
└─────────────────────────────────────────┘
```

**STEP 3: Enter New Court Reference**

```
┌─────────────────────────────────────────┐
│  New Court Reference Details            │
├─────────────────────────────────────────┤
│                                         │
│  New Court Reference:*                  │
│  [SCA 456/2024___________________]      │
│                                         │
│  Court Type:*                           │
│  [Supreme Court of Appeal________]      │
│                                         │
│  Amendment Type:*                       │
│  [v] Appeal                             │
│  [ ] Transfer                           │
│  [ ] Consolidation                      │
│  [ ] Re-filing                          │
│  [ ] Court Directive                    │
│  [ ] Jurisdictional                     │
│  [ ] Administrative                     │
│  [ ] Other                              │
│                                         │
│  Amendment Reason:*                     │
│  [Case appealed to Supreme Court_]      │
│  [after National Court judgment___]     │
│  [dated 2024-03-15________________]     │
│                                         │
└─────────────────────────────────────────┘
```

**STEP 4: Choose What to Inherit**

```
┌─────────────────────────────────────────┐
│  Inherit from Original Case             │
├─────────────────────────────────────────┤
│                                         │
│  [✓] Inherit all documents (45 docs)    │
│  [✓] Inherit parties (3 parties)        │
│  [✓] Inherit land parcels (2 parcels)   │
│                                         │
│  Note: Inherited items will be          │
│  referenced (not copied). Any updates   │
│  to original case documents will be     │
│  visible in this amended case.          │
│                                         │
└─────────────────────────────────────────┘
```

**STEP 5: Confirmation**

```
┌─────────────────────────────────────────┐
│  Confirm Amendment                      │
├─────────────────────────────────────────┤
│                                         │
│  Original Case:                         │
│  DLPP-2023-0001                         │
│  WS 123/2023 (National Court)           │
│                                         │
│  New Case:                              │
│  DLPP-2023-0001-A                       │
│  SCA 456/2024 (Supreme Court)           │
│                                         │
│  Amendment Type: Appeal                 │
│  Inheriting: Documents, Parties, Land   │
│                                         │
│  [Cancel]  [Create Amended Case]        │
│                                         │
└─────────────────────────────────────────┘
```

**STEP 6: Amendment Created**

```
✅ Case amended successfully!

New case created: DLPP-2023-0001-A
New court reference: SCA 456/2024
Linked to original: DLPP-2023-0001

Inherited:
  • 45 documents
  • 3 parties
  • 2 land parcels

[View New Case] [View Amendment History]
```

---

## 💡 USAGE EXAMPLES

### Example 1: Case Appealed (Simple Amendment)

**Scenario**: National Court case appealed to Supreme Court

**SQL**:
```sql
-- Create amendment
SELECT create_case_amendment(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,  -- original_case_id
  '223e4567-e89b-12d3-a456-426614174000'::UUID,  -- original_court_ref_id
  'SCA 456/2024',                                 -- new_court_reference
  'Supreme Court of Appeal',                      -- new_court_type
  'appeal',                                       -- amendment_type
  'Case appealed to Supreme Court after National Court judgment',
  '323e4567-e89b-12d3-a456-426614174000'::UUID,  -- initiated_by (user_id)
  true,  -- inherit_documents
  true,  -- inherit_parties
  true   -- inherit_land_parcels
);
```

**Result**:
```
Original: DLPP-2023-0001 (WS 123/2023)
                ↓ Appealed
New:      DLPP-2023-0001-A (SCA 456/2024)

All documents, parties, land inherited!
```

---

### Example 2: Multiple Amendments (Chain)

**Scenario**:
- Case starts in National Court
- Appealed to Supreme Court
- Further appealed to Full Court

**Timeline**:

**2023-01-15: Original Case Created**
```sql
-- Case DLPP-2023-0001
-- Court Ref: WS 123/2023 (National Court)
```

**2024-03-20: First Amendment (Appeal to Supreme Court)**
```sql
SELECT create_case_amendment(
  [original_case_id],
  [original_court_ref_id],
  'SCA 456/2024',
  'Supreme Court of Appeal',
  'appeal',
  'Appealed after National Court judgment',
  [user_id]
);

-- Creates: DLPP-2023-0001-A
-- Court Ref: SCA 456/2024
```

**2024-09-10: Second Amendment (Appeal to Full Court)**
```sql
SELECT create_case_amendment(
  [first_amended_case_id],      -- NOTE: Using the FIRST amended case as original
  [first_amended_court_ref_id],
  'FC 789/2024',
  'Full Court',
  'appeal',
  'Further appeal to Full Court',
  [user_id]
);

-- Creates: DLPP-2023-0001-AA
-- Court Ref: FC 789/2024
```

**Amendment Chain**:
```
DLPP-2023-0001 (WS 123/2023) → National Court
    ↓ Appeal 2024-03-20
DLPP-2023-0001-A (SCA 456/2024) → Supreme Court
    ↓ Appeal 2024-09-10
DLPP-2023-0001-AA (FC 789/2024) → Full Court
```

**View the chain**:
```sql
SELECT * FROM get_amendment_chain([current_case_id]);
```

**Result**:
```
level | case_id | court_reference | amendment_type | amendment_date | is_current
------|---------|-----------------|----------------|----------------|------------
  1   | xxx-AA  | FC 789/2024     | NULL           | NULL           | true
  2   | xxx-A   | SCA 456/2024    | appeal         | 2024-09-10     | false
  3   | xxx-001 | WS 123/2023     | appeal         | 2024-03-20     | false
```

---

### Example 3: Case Transferred Between Courts

**Scenario**: Case transferred from Port Moresby to Lae

```sql
SELECT create_case_amendment(
  [original_case_id],
  [original_court_ref_id],
  'NC 890/2024',
  'National Court - Lae',
  'transfer',
  'Case transferred from Port Moresby to Lae National Court due to jurisdictional reasons',
  [user_id],
  true,  -- inherit all documents
  true,  -- inherit parties
  true   -- inherit land parcels
);
```

**Result**:
```
Original: NC 789/2023 (National Court - POM)
                ↓ Transferred
New:      NC 890/2024 (National Court - Lae)

Same parties, documents, land - different court!
```

---

### Example 4: View Inherited Documents

**Scenario**: See which documents came from original case

```sql
-- Get all inherited documents for amended case
SELECT * FROM get_inherited_documents([amended_case_id]);
```

**Result**:
```
document_id | document_title        | original_case_number | inheritance_type
------------|----------------------|----------------------|------------------
abc-123     | Originating Summons  | DLPP-2023-0001      | reference
abc-456     | Affidavit in Support | DLPP-2023-0001      | reference
abc-789     | Notice of Motion     | DLPP-2023-0001      | reference
...
```

---

## 📊 REPORTING QUERIES

### Query 1: All Amendments for a Case

```sql
-- View all amendments involving a specific case (as original or amended)
SELECT
  ca.amendment_date,
  ca.amendment_type,
  ca.amendment_reason,
  orig_case.case_number as original_case,
  orig_ref.court_reference as original_ref,
  new_case.case_number as amended_case,
  new_ref.court_reference as new_ref,
  u.full_name as initiated_by
FROM case_amendments ca
JOIN cases orig_case ON orig_case.id = ca.original_case_id
JOIN cases new_case ON new_case.id = ca.new_case_id
JOIN court_references orig_ref ON orig_ref.id = ca.original_court_reference_id
JOIN court_references new_ref ON new_ref.id = ca.new_court_reference_id
LEFT JOIN users u ON u.id = ca.initiated_by
WHERE ca.original_case_id = [case_id] OR ca.new_case_id = [case_id]
ORDER BY ca.amendment_date;
```

---

### Query 2: Current Status of Case (Find Latest in Chain)

```sql
-- Find the most current version of a case (end of amendment chain)
WITH RECURSIVE case_chain AS (
  SELECT id, case_number FROM cases WHERE id = [original_case_id]
  UNION ALL
  SELECT c.id, c.case_number
  FROM cases c
  JOIN case_amendments ca ON ca.new_case_id = c.id
  JOIN case_chain cc ON cc.id = ca.original_case_id
)
SELECT * FROM case_chain ORDER BY case_number DESC LIMIT 1;
```

---

### Query 3: All Cases Created by Amendment

```sql
-- List all cases created via amendment
SELECT
  new_case.case_number as amended_case,
  new_ref.court_reference as new_court_ref,
  orig_case.case_number as original_case,
  orig_ref.court_reference as original_court_ref,
  ca.amendment_type,
  ca.amendment_date
FROM case_amendments ca
JOIN cases new_case ON new_case.id = ca.new_case_id
JOIN cases orig_case ON orig_case.id = ca.original_case_id
JOIN court_references new_ref ON new_ref.id = ca.new_court_reference_id
JOIN court_references orig_ref ON orig_ref.id = ca.original_court_reference_id
ORDER BY ca.amendment_date DESC;
```

---

### Query 4: Cases with Multiple Amendments

```sql
-- Find cases that have been amended multiple times
SELECT
  c.case_number,
  c.title,
  COUNT(ca.id) as amendment_count,
  string_agg(cr.court_reference, ' → ' ORDER BY ca.amendment_date) as reference_chain
FROM cases c
JOIN case_amendments ca ON ca.original_case_id = c.id
JOIN court_references cr ON cr.id = ca.new_court_reference_id
GROUP BY c.id
HAVING COUNT(ca.id) > 1
ORDER BY amendment_count DESC;
```

---

## 🎨 UI DESIGN RECOMMENDATIONS

### Case Detail Page - Show Amendment History

```
┌─────────────────────────────────────────────────────┐
│  Case: DLPP-2023-0001-A                             │
│  Court Reference: SCA 456/2024 (Supreme Court)      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📋 Amendment History:                              │
│                                                     │
│  This case was amended from:                        │
│  ← DLPP-2023-0001 (WS 123/2023)                    │
│     Amended on: 2024-03-20                          │
│     Reason: Case appealed to Supreme Court          │
│     Type: Appeal                                    │
│                                                     │
│  [View Original Case] [View Full Chain]             │
│                                                     │
│  📄 Inherited Documents: 45 documents               │
│  👥 Inherited Parties: 3 parties                    │
│  🗺️  Inherited Land Parcels: 2 parcels              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Amendment Chain Visualization

```
┌─────────────────────────────────────────────────────┐
│  Amendment Chain for Case DLPP-2023-0001            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟢 CURRENT                                         │
│  DLPP-2023-0001-AA                                  │
│  FC 789/2024 (Full Court)                           │
│  Status: In Progress                                │
│                    ↑                                │
│        Appealed on 2024-09-10                       │
│                    │                                │
│  DLPP-2023-0001-A                                   │
│  SCA 456/2024 (Supreme Court)                       │
│  Status: Closed (Appealed)                          │
│                    ↑                                │
│        Appealed on 2024-03-20                       │
│                    │                                │
│  🔵 ORIGINAL                                        │
│  DLPP-2023-0001                                     │
│  WS 123/2023 (National Court)                       │
│  Status: Closed (Appealed)                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ VALIDATION RULES

### Before Amending a Case

```sql
-- Check if case can be amended
SELECT * FROM can_amend_case([case_id]);
```

**Rules**:
- ❌ Cannot amend closed cases
- ❌ Cannot amend non-existent cases
- ✅ Can amend open/active cases
- ✅ Can amend already-amended cases (creates chain)

---

## 🔒 DATA INTEGRITY

### Protections Built-In

1. **No Orphans**: All amendments linked to valid cases
2. **No Loops**: Cannot create circular amendment chains
3. **Audit Trail**: Complete history of all amendments
4. **Document Safety**: Inherited docs referenced, not duplicated (unless specified)
5. **Party Integrity**: Parties inherited with no conflicts

---

## 📋 BEST PRACTICES

### When to Use Amendment vs New Case

**Use Amendment When**:
- ✅ Case appealed to different court
- ✅ Case transferred between courts
- ✅ Same legal matter, different court reference
- ✅ Want to preserve document/party connections

**Use New Case When**:
- ❌ Completely different legal matter
- ❌ Different parties
- ❌ No connection to previous case
- ❌ Fresh start needed

### Amendment Type Guidelines

| Amendment Type | When to Use |
|----------------|-------------|
| **appeal** | Case appealed to higher court |
| **transfer** | Case transferred to different court/location |
| **consolidation** | Case consolidated with other cases |
| **re_filing** | Case re-filed with corrections |
| **court_directive** | Court ordered new reference |
| **jurisdictional** | Changed due to jurisdiction |
| **administrative** | Administrative reference change |
| **other** | Other reasons (specify in notes) |

---

## 🚀 ACTIVATION

**Run this SQL script**:
```
File: COURT_REFERENCE_REASSIGNMENT_MODULE.sql
Where: Supabase SQL Editor
When: After running WORKFLOW_ENHANCEMENTS_AUDIT_TRAIL.sql
Time: 2 minutes
```

**Verify**:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('case_amendments', 'document_inheritance');

-- Check functions created
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('create_case_amendment', 'get_amendment_chain');
```

---

## 🎊 SUMMARY

**What You Requested**:
- ✅ Prompt: "New case or amended case?"
- ✅ Link amended cases to original court references
- ✅ Reference original documents with new details
- ✅ Support multiple reassignments (chains)

**What You Got**:
- ✅ Complete amendment tracking system
- ✅ Unlimited chaining support
- ✅ Document inheritance system
- ✅ Helper functions for queries
- ✅ Complete audit trail
- ✅ Validation and protections

**Next**: Build UI for amendment workflow!

---

**This module ensures complete legal record keeping for reassigned court references!** ✅

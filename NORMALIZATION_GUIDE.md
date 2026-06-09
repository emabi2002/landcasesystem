# 🗄️ DATABASE NORMALIZATION GUIDE

## Overview

This guide explains how the DLPP Legal CMS database has been normalized to properly separate data into related tables with foreign key relationships.

---

## 📊 CURRENT PROBLEM

**Before Normalization:**
- All data stored in `cases` table
- Parties, land parcels, events, tasks all in single table
- Denormalized data (duplication, no referential integrity)
- Difficult to query related data

**Example:**
```
cases table:
- parties_description: "John Doe -v- DLPP"
- land_description: "Lot 123, Port Moresby..."
- returnable_date: "2025-12-15"
- dlpp_action_officer: "Officer Name"
```

---

## ✅ AFTER NORMALIZATION

**Properly Structured:**
- `cases` - Main case information
- `parties` - Linked to cases (plaintiff, defendant, etc.)
- `land_parcels` - Linked to cases
- `events` - Linked to cases (hearings, deadlines)
- `tasks` - Linked to cases (assignments)
- `documents` - Linked to cases (filings, evidence)
- `case_history` - Audit trail for each case

**Benefits:**
- ✅ No data duplication
- ✅ Referential integrity enforced
- ✅ Easy to query related data
- ✅ Efficient storage
- ✅ Proper foreign key relationships

---

## 🔗 TABLE RELATIONSHIPS

```
cases (1) ──┬─→ (N) parties
            ├─→ (N) land_parcels
            ├─→ (N) events
            ├─→ (N) tasks
            ├─→ (N) documents
            ├─→ (N) case_history
            └─→ (N) evidence
```

Each related table has:
- `case_id` - Foreign key to `cases.id`
- Proper indexes for fast queries
- RLS policies for security

---

## 📋 MIGRATION STEPS

### STEP 1: Run Normalization Script

```sql
-- Run in Supabase SQL Editor
-- File: database-normalization-migration.sql
```

This script will:
1. Extract parties from `parties_description` → `parties` table
2. Extract land info from `land_description` → `land_parcels` table
3. Create events from `returnable_date` → `events` table
4. Create tasks from `dlpp_action_officer` → `tasks` table
5. Create document placeholders → `documents` table
6. Create audit trail → `case_history` table

### STEP 2: Verify Migration

Check the counts:
```sql
SELECT
  (SELECT COUNT(*) FROM cases) as cases,
  (SELECT COUNT(*) FROM parties) as parties,
  (SELECT COUNT(*) FROM land_parcels) as land_parcels,
  (SELECT COUNT(*) FROM events) as events,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM documents) as documents;
```

You should see:
- **Cases**: 2,043
- **Parties**: ~4,086+ (2 per case minimum)
- **Land Parcels**: ~2,043 (where land data exists)
- **Events**: ~2,043+ (where returnable dates exist)
- **Tasks**: ~2,043+ (where officers assigned)
- **Documents**: ~2,043+ (where court docs exist)

---

## 🔍 QUERYING NORMALIZED DATA

### Get Case with All Related Data

```sql
SELECT * FROM case_complete_view
WHERE case_number = 'DLPP-2025-0001';
```

This view includes:
- All case fields
- JSON array of parties
- JSON array of land parcels
- JSON array of events
- JSON array of tasks
- JSON array of documents
- Counts of each related type

### Get Cases with Party Names

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

### Get All Parties for a Case

```sql
SELECT
  p.name,
  p.role,
  p.party_type,
  p.contact_info
FROM parties p
JOIN cases c ON c.id = p.case_id
WHERE c.case_number = 'DLPP-2025-0001';
```

### Get All Land Parcels for a Case

```sql
SELECT
  lp.parcel_number,
  lp.location,
  lp.notes
FROM land_parcels lp
JOIN cases c ON c.id = lp.case_id
WHERE c.case_number = 'DLPP-2025-0001';
```

### Get Upcoming Events for a Case

```sql
SELECT
  e.title,
  e.event_type,
  e.event_date,
  e.location
FROM events e
JOIN cases c ON c.id = e.case_id
WHERE c.case_number = 'DLPP-2025-0001'
ORDER BY e.event_date;
```

---

## 📝 UPDATED CASE REGISTRATION FLOW

When a new case is registered, the system now:

### 1. **Insert into `cases` table**
```typescript
const { data: newCase } = await supabase
  .from('cases')
  .insert([caseData])
  .select()
  .single();
```

### 2. **Insert parties**
```typescript
// DLPP as a party
await supabase.from('parties').insert({
  case_id: newCase.id,
  name: 'Department of Lands & Physical Planning',
  role: formData.dlpp_role, // 'plaintiff' or 'defendant'
  party_type: 'government_entity'
});

// Opposing party
await supabase.from('parties').insert({
  case_id: newCase.id,
  name: extractedOpposingParty,
  role: opposingRole,
  party_type: 'individual'
});
```

### 3. **Insert land parcel** (if land data provided)
```typescript
if (formData.land_description) {
  await supabase.from('land_parcels').insert({
    case_id: newCase.id,
    parcel_number: formData.survey_plan_no,
    location: formData.region,
    notes: formData.land_description
  });
}
```

### 4. **Insert event** (if returnable date provided)
```typescript
if (formData.returnable_date) {
  await supabase.from('events').insert({
    case_id: newCase.id,
    event_type: 'hearing',
    title: `${formData.returnable_type} - ${formData.case_number}`,
    event_date: formData.returnable_date,
    location: 'Court'
  });
}
```

### 5. **Insert task** (if officer assigned)
```typescript
if (formData.dlpp_action_officer) {
  await supabase.from('tasks').insert({
    case_id: newCase.id,
    title: `Case Assignment: ${formData.case_number}`,
    description: `Assigned to: ${formData.dlpp_action_officer}`,
    status: 'pending',
    priority: formData.priority
  });
}
```

### 6. **Insert case history**
```typescript
await supabase.from('case_history').insert({
  case_id: newCase.id,
  action: 'Case Registered',
  description: `Case registered with court reference: ${formData.court_file_number}`,
  metadata: {
    dlpp_role: formData.dlpp_role,
    matter_type: formData.matter_type
  }
});
```

---

## 📊 DATA MIGRATION RESULTS

After running the normalization script on your 2,043 cases:

### Parties Table
- **Total Records**: ~4,086+
- **DLPP entries**: 2,043 (one per case)
- **Opposing parties**: 2,043+
- **Properly linked via case_id**

### Land Parcels Table
- **Total Records**: ~2,043 (where land data exists)
- **Includes**: Survey plan numbers, locations, lease details
- **Consolidated** from multiple case table fields

### Events Table
- **Total Records**: ~2,043+ (returnable dates + manual events)
- **Auto-created**: Yes (from returnable dates)
- **3-day alerts**: Configured

### Tasks Table
- **Total Records**: ~2,043+ (officer assignments)
- **Linked to officers**: Yes
- **Due dates**: Set from returnable dates or +30 days

### Documents Table
- **Total Records**: ~2,043+ (court document placeholders)
- **Actual files**: Need to be uploaded
- **Metadata**: Court reference, filing dates preserved

### Case History Table
- **Total Records**: ~4,086+ (registration + status changes)
- **Audit trail**: Complete
- **Metadata**: JSON format with details

---

## 🔧 MAINTENANCE

### Adding New Parties
```sql
INSERT INTO parties (case_id, name, role, party_type)
VALUES (
  'case-uuid-here',
  'New Party Name',
  'plaintiff',
  'individual'
);
```

### Adding New Land Parcels
```sql
INSERT INTO land_parcels (case_id, parcel_number, location, notes)
VALUES (
  'case-uuid-here',
  'SP-12345',
  'Port Moresby',
  'Description here'
);
```

### Adding New Events
```sql
INSERT INTO events (case_id, event_type, title, event_date, location)
VALUES (
  'case-uuid-here',
  'hearing',
  'Directions Hearing',
  '2025-12-15 10:00:00',
  'National Court'
);
```

---

## ✅ BENEFITS OF NORMALIZATION

### 1. **Data Integrity**
- Foreign keys enforce relationships
- Can't delete a case with related data (ON DELETE CASCADE or protect)
- No orphaned records

### 2. **Query Performance**
- Indexed foreign keys
- Efficient joins
- Fast filtering by relationships

### 3. **Flexibility**
- Easy to add multiple parties per case
- Multiple land parcels per case
- Multiple events, tasks, documents

### 4. **Reporting**
- Count parties per case
- Track events per case
- Monitor task completion rates
- Document upload statistics

### 5. **Data Quality**
- No duplication
- Single source of truth
- Consistent formatting
- Easier to validate

---

## 🎯 NEXT STEPS

1. ✅ **Run normalization script** in Supabase
2. ✅ **Verify data migration** with sample queries
3. ✅ **Update application code** to use normalized structure
4. ✅ **Test case registration** with new relationships
5. ✅ **Update reports** to use new views
6. ✅ **Train staff** on new data structure

---

## 📞 TROUBLESHOOTING

### Issue: Duplicate parties created

**Solution:**
```sql
-- Remove duplicates, keep first one
DELETE FROM parties p1
USING parties p2
WHERE p1.id > p2.id
  AND p1.case_id = p2.case_id
  AND p1.name = p2.name;
```

### Issue: Missing land parcels

**Solution:**
Check if `land_description` was NULL:
```sql
SELECT COUNT(*)
FROM cases
WHERE land_description IS NULL OR land_description = '';
```

### Issue: Foreign key constraint errors

**Solution:**
Ensure case exists before inserting related data:
```sql
-- Check if case exists
SELECT id FROM cases WHERE case_number = 'DLPP-2025-0001';

-- Then insert related data
```

---

## 📊 VERIFICATION QUERIES

### Count Related Records per Case
```sql
SELECT
  c.case_number,
  c.title,
  COUNT(DISTINCT p.id) as party_count,
  COUNT(DISTINCT lp.id) as land_parcel_count,
  COUNT(DISTINCT e.id) as event_count,
  COUNT(DISTINCT t.id) as task_count,
  COUNT(DISTINCT d.id) as document_count
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
LEFT JOIN land_parcels lp ON lp.case_id = c.id
LEFT JOIN events e ON e.case_id = c.id
LEFT JOIN tasks t ON t.case_id = c.id
LEFT JOIN documents d ON d.case_id = c.id
GROUP BY c.id
LIMIT 10;
```

### Find Cases Missing Related Data
```sql
-- Cases without parties
SELECT c.case_number, c.title
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
WHERE p.id IS NULL;

-- Cases without events
SELECT c.case_number, c.title
FROM cases c
LEFT JOIN events e ON e.case_id = c.id
WHERE e.id IS NULL AND c.returnable_date IS NOT NULL;
```

---

## 🎉 SUCCESS!

Your database is now properly normalized with:
- ✅ Clean table structure
- ✅ Foreign key relationships
- ✅ No data duplication
- ✅ Easy to query and maintain
- ✅ Ready for production use!

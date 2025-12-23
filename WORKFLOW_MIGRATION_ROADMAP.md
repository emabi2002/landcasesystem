# 🗺️ WORKFLOW MIGRATION ROADMAP

**From Current State → Workflow-Driven LCMS**

---

## 📊 CURRENT STATE vs TARGET STATE

### Current Database (Normalized)
```
cases (2,043)
  ├─→ parties (4,086+)
  ├─→ land_parcels (~2,043)
  ├─→ events (~2,043+)
  ├─→ tasks (~2,043+)
  ├─→ documents (~2,043+)
  └─→ case_history (~4,086+)
```

### Target Database (Workflow-Driven)
```
cases (master)
  ├─→ case_intake_records (Step 1)
  ├─→ directions (Step 2)
  ├─→ case_assignments (Step 3)
  ├─→ case_files (Step 3a)
  ├─→ case_documents (Steps 4-5)
  ├─→ case_filings (Steps 4-5)
  ├─→ solicitor_general_updates (Step 5)
  ├─→ manager_memos (Step 6)
  ├─→ division_compliance_updates (Step 6)
  ├─→ court_orders (Step 7)
  ├─→ case_closure (Step 7)
  ├─→ case_parties (Step 8)
  └─→ notifications (Step 8)

PLUS:
  - users
  - roles
  - user_roles
  - parties
```

---

## 🎯 MIGRATION STRATEGY

### Option 1: Fresh Start (Recommended for New Implementation)

**When to use:**
- Starting new workflow from scratch
- Current data is test data
- Want clean workflow-driven structure immediately

**Steps:**
1. Backup current database
2. Run `DATABASE_WORKFLOW_SCHEMA.sql`
3. Build new UI modules matching workflow
4. Train users on new workflow
5. Start fresh with workflow-driven data entry

**Pros:**
- Clean implementation of exact workflow
- No migration complexity
- Users learn correct workflow from start

**Cons:**
- Existing 2,043 cases need manual re-entry or migration

---

### Option 2: Parallel Migration (Recommended for Production)

**When to use:**
- Have valuable existing data (2,043 cases)
- Need to preserve historical records
- Want smooth transition

**Steps:**

#### Phase 1: Add Workflow Tables
```sql
-- Run DATABASE_WORKFLOW_SCHEMA.sql
-- This creates all new workflow tables
-- Existing tables remain untouched
```

#### Phase 2: Map Existing Data
```sql
-- Map current 'documents' → 'case_documents'
INSERT INTO case_documents (case_id, document_type, file_url, uploaded_at, uploaded_by)
SELECT case_id, document_type, file_url, created_at, created_by
FROM documents;

-- Map current 'events' → could become 'court_orders' or 'case_filings'
-- depending on event_type

-- Map current 'parties' → 'parties' (already exists)
-- Map current 'tasks' → 'case_assignments' or 'manager_memos'
-- depending on task type

-- etc.
```

#### Phase 3: Gradual UI Replacement
1. **Week 1-2**: Deploy new Case Reception module (Step 1)
2. **Week 3-4**: Deploy Directions module (Step 2)
3. **Week 5-6**: Deploy Assignment module (Step 3)
4. **Week 7-10**: Deploy Litigation modules (Steps 4-5)
5. **Week 11-12**: Deploy Compliance module (Step 6)
6. **Week 13-14**: Deploy Closure & Notifications (Steps 7-8)

#### Phase 4: Switch Over
- Old modules deprecated
- All new data goes through workflow modules
- Historical data viewable in read-only mode

**Pros:**
- Preserves existing 2,043 cases
- Smooth transition
- Users adapt gradually

**Cons:**
- More complex
- Dual system temporarily
- Requires data mapping

---

### Option 3: Hybrid (Current System + Workflow)

**When to use:**
- Want to keep current normalized structure
- Add workflow modules on top
- Incremental enhancement

**Steps:**
1. Keep existing tables
2. Add workflow tables
3. Use both systems:
   - Old cases use existing structure
   - New cases use workflow structure
4. Gradually migrate data

---

## 🚀 RECOMMENDED APPROACH

**For DLPP:**

### Phase 1: Immediate (Week 1)
1. ✅ **Review and approve schema**
   - Review `DATABASE_WORKFLOW_SCHEMA.sql`
   - Confirm it matches your workflow
   - Make any adjustments needed

2. ✅ **Run schema in TEST environment**
   - Create test Supabase project
   - Run schema
   - Create sample data through all 8 steps
   - Verify workflow works correctly

### Phase 2: Core Modules (Weeks 2-4)
Build essential UI modules:

1. **Case Reception Module** (Step 1)
   - Register incoming documents
   - Generate case numbers
   - Log intake records

2. **Directions Module** (Step 2)
   - Issue directions
   - Select authority (Secretary/Director/Manager)
   - Link to existing cases
   - View direction history per case

3. **Assignment Module** (Step 3)
   - Assign officers to cases
   - Create court files (new cases)
   - Track assignment history

### Phase 3: Litigation Modules (Weeks 5-8)

4. **Document Management** (Step 4)
   - Upload case documents
   - Categorize by type
   - Link to cases

5. **Filing Module** (Step 5)
   - Record court filings
   - Record SG filings
   - Track service
   - Log SG updates and advice

### Phase 4: Compliance & Closure (Weeks 9-12)

6. **Compliance Module** (Step 6)
   - Manager issues memos to divisions
   - Divisions respond with updates
   - Track compliance status

7. **Closure Module** (Step 7)
   - Record court orders
   - Close cases
   - Compile findings

8. **Notifications Module** (Step 8)
   - Send notifications to parties
   - Log outgoing correspondence
   - Track delivery

### Phase 5: Integration (Weeks 13-14)

9. **Case Timeline View**
   - Display complete case history
   - Show all module activities
   - Order chronologically

10. **Dashboard & Reports**
    - Case statistics by status
    - Officer workload
    - Division compliance tracking
    - Court order outcomes

---

## 📋 DETAILED MIGRATION PLAN

### Step 1: Database Setup

**File**: `DATABASE_WORKFLOW_SCHEMA.sql`

**Actions:**
```sql
-- 1. Backup current database
pg_dump > backup_before_workflow.sql

-- 2. Run workflow schema
-- Copy DATABASE_WORKFLOW_SCHEMA.sql
-- Paste in Supabase SQL Editor
-- Execute

-- 3. Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'case_%'
OR table_name IN ('directions', 'manager_memos', 'parties', 'notifications');

-- 4. Check foreign keys
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';
```

### Step 2: Data Migration (If Keeping Existing Data)

**File**: `MIGRATE_EXISTING_DATA.sql` (to be created)

**Maps:**
- `documents` → `case_documents`
- `events` → `case_filings` (where appropriate)
- `tasks` → `case_assignments` (officer assignments)
- `tasks` → `manager_memos` (compliance tasks)
- `case_history` → various workflow tables based on action type

### Step 3: Module Development

**For each workflow step, create:**
1. **Database API routes** (`/api/[module]/route.ts`)
2. **UI page** (`/app/[module]/page.tsx`)
3. **Forms/dialogs** for data entry
4. **List views** for viewing records
5. **Detail views** for individual records

**Module Structure:**
```
src/app/
  ├─ reception/          (Step 1)
  ├─ directions/         (Step 2)
  ├─ assignments/        (Step 3)
  ├─ litigation/         (Steps 4-5)
  ├─ compliance/         (Step 6)
  ├─ closure/            (Step 7)
  ├─ notifications/      (Step 8)
  └─ cases/[id]/
      └─ timeline/       (Combined view)
```

### Step 4: Testing

**Test Scenarios:**

**Scenario 1: Complete Case Journey**
1. Register case at reception
2. Secretary issues direction
3. Manager assigns officer
4. Officer prepares documents
5. Officer files with court
6. Receives SG update
7. Manager issues compliance memo
8. Division responds
9. Court issues order
10. Case closed
11. Parties notified

**Verify:**
- All records created
- All linked to same `case_id`
- Timeline shows complete history
- Status updates correctly
- Closure trigger works

**Scenario 2: Multiple Records**
1. Create case
2. Issue 3 different directions over time
3. Assign officer, then reassign
4. Upload 10 documents
5. Make 5 court filings
6. Receive 3 SG updates
7. Issue memos to 2 different divisions
8. Close case
9. Send 4 notifications

**Verify:**
- Multiple records per module work
- All correctly linked
- Timeline shows all activities
- Search/filter works

---

## 🎯 SUCCESS CRITERIA

### Database Level
- [ ] All tables created successfully
- [ ] Foreign keys enforced
- [ ] RLS policies active
- [ ] Triggers working (closure status update)
- [ ] Indexes performing well

### Application Level
- [ ] Each workflow step has working module
- [ ] All modules reference `case_id` correctly
- [ ] Case lookup works across modules
- [ ] Timeline view shows all activities
- [ ] Status progression works correctly

### User Experience
- [ ] Workflow matches actual legal process
- [ ] Easy to move between steps
- [ ] Case history visible throughout
- [ ] Multiple entries per module supported
- [ ] Search and filtering work

### Business Process
- [ ] Reception can register cases
- [ ] Authorities can issue directions
- [ ] Managers can assign officers
- [ ] Officers can work cases
- [ ] Divisions can respond to memos
- [ ] Cases can be closed properly
- [ ] Parties receive notifications

---

## 📅 TIMELINE

### Aggressive Schedule (3 months)
- **Month 1**: Schema + Core Modules (Steps 1-3)
- **Month 2**: Litigation Modules (Steps 4-5)
- **Month 3**: Compliance + Closure (Steps 6-8)

### Realistic Schedule (6 months)
- **Month 1-2**: Schema + testing + Core Modules
- **Month 3-4**: Litigation Modules + integration
- **Month 5-6**: Compliance + Closure + full testing

### Conservative Schedule (9 months)
- **Month 1-3**: Schema + Core Modules + extensive testing
- **Month 4-6**: Litigation Modules + integration + user training
- **Month 7-9**: Compliance + Closure + parallel running + final migration

---

## 🔄 ROLLBACK PLAN

If migration needs to be reversed:

1. **Keep backup** of original database
2. **Version control** all schema changes
3. **Document** all data migrations
4. **Test** rollback in staging first
5. **Have script** to revert to previous state

```sql
-- Rollback script
DROP TABLE IF EXISTS case_closure CASCADE;
DROP TABLE IF EXISTS court_orders CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS case_parties CASCADE;
-- etc...

-- Restore from backup
psql < backup_before_workflow.sql
```

---

## ✅ DECISION MATRIX

**Choose your path:**

| Criteria | Fresh Start | Parallel Migration | Hybrid |
|----------|-------------|-------------------|---------|
| **Have valuable existing data** | ❌ | ✅ | ✅ |
| **Time available** | Fast | Slow | Medium |
| **User training time** | Short | Medium | Long |
| **Technical complexity** | Low | High | Medium |
| **Best workflow compliance** | ✅✅✅ | ✅✅ | ✅ |
| **Risk** | Low | Medium | Medium |

**Recommendation for DLPP:**
- **Parallel Migration** if 2,043 cases are valuable
- **Fresh Start** if starting new workflow system
- **Hybrid** if need gradual adoption

---

## 📞 SUPPORT

**Files Available:**
1. `DATABASE_WORKFLOW_SCHEMA.sql` - Complete schema
2. `WORKFLOW_IMPLEMENTATION_GUIDE.md` - Detailed workflow docs
3. `WORKFLOW_MIGRATION_ROADMAP.md` - This file
4. Sample data scripts (to be created)
5. Module templates (to be created)

**Next Steps:**
1. Review workflow specification
2. Approve schema
3. Choose migration approach
4. Begin implementation

---

**The workflow-driven design is ready!**
**Decision: Which migration path to take?**

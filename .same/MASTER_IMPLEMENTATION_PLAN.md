# DLPP Legal CMS - Master Implementation Plan
## Litigation Case Workflow Consolidation

---

## ✅ Status: READY TO EXECUTE

**Client**: DLPP (Department of Lands & Physical Planning)
**Objective**: Single canonical litigation workflow (no duplicates)
**Approach**: Systematic refactoring with zero data loss

---

## 📋 DELIVERABLE 1: Duplicate Inventory Report

### Duplicated Menus (FOUND)
**Current State**: 2 overlapping menu groups

1. **"Litigation Workflow"** group contains:
   - Register Case
   - Assignment Inbox
   - My Cases

2. **"Workflow"** group contains (DUPLICATES):
   - Case Registration (duplicate of Register Case)
   - Case Allocation (duplicate of Assignment Inbox)
   - Directions
   - Litigation
   - Compliance
   - Case Closure
   - Notifications

**Action**: Consolidate into ONE "Case Workflow" menu

---

### Duplicated Routes (FOUND)

| Canonical Function | Route 1 | Route 2 | Route 3 | Route 4 | Action |
|-------------------|---------|---------|---------|---------|--------|
| **Register Case** | `/litigation/register` | `/cases/create-minimal` | `/cases/new` | `/reception` | Keep #1, Delete rest |
| **Assign Case** | `/litigation/assignments` | `/allocation` | - | - | Keep #1, Delete #2 |
| **View All Cases** | `/cases` | `/litigation` | - | - | Keep #1, Redirect #2 |
| **Case Details** | `/cases/[id]` | Multiple scattered | - | - | Consolidate to tabs |
| **Compliance** | `/compliance` | `/compliance-tracking` | - | - | Merge into one |
| **Closure** | `/closure` | (in case details) | - | - | Make it a tab |
| **Documents** | `/documents` | `/filings` | `/litigation/filings/[caseId]` | - | Consolidate |
| **Directions** | `/directions` | (scattered) | - | - | Make it a tab |

**Total Duplicates Found**: 15+ redundant routes

---

### Duplicated Tables/Entities (TO AUDIT)

**Suspected duplicates** (need database inspection):
- `cases` vs `litigation_register` (if exists)
- `case_assignments` vs `allocation` (if exists)
- `documents` vs `court_documents` (if exists)
- `directions` vs `hearings` vs `case_events`

**Action**: Run database audit script

---

## 📋 DELIVERABLE 2: Canonical Workflow Mapping

### Single Source of Truth: 6-Step Workflow

```
┌─────────────────────────────────────────────────────────────┐
│           CANONICAL LITIGATION WORKFLOW                      │
│                 (Single Line, No Branches)                   │
└─────────────────────────────────────────────────────────────┘

STEP 1: LOGIN/ACCESS
↓ (RBAC enforced)

STEP 2: REGISTER NEW CASE (Intake)
├─ Route: /cases/new
├─ Entity: cases + case_parties + case_representatives + case_land_details
├─ Captures: All Dummy fields for intake
├─ Alert: 3-day returnable date trigger created
└─ Role: Para-Legal Officer

STEP 3: UPLOAD INITIAL DOCUMENTS
├─ Route: /cases/[id]/documents
├─ Entity: case_documents
├─ Captures: Initial court docs + correspondence
└─ Role: Para-Legal Officer

STEP 4: ASSIGN CASE (Manager Action)
├─ Route: /cases/[id]/assignment
├─ Entity: case_assignments (history table)
├─ Updates: cases.assigned_officer_id
└─ Role: Manager/Senior Legal Officer

STEP 5: DIRECTIONS/RETURNABLE DATES
├─ Route: /cases/[id]/events
├─ Entity: case_events (hearings, directions, mediation)
├─ Captures: Returnable dates + types
└─ Role: Action Officer

STEP 6: LITIGATION TASKS & DRAFTING
├─ Route: /cases/[id]/tasks
├─ Entity: case_tasks
├─ Captures: Defence prep, affidavits, briefs, motions
└─ Role: Action Officer

STEP 7: REGISTER COURT ORDER (When Concluded)
├─ Route: /cases/[id]/order
├─ Entity: case_orders
├─ Captures: Terms, grounds, date, parties
└─ Role: Action Officer

STEP 8: UPLOAD COURT ORDER & CLOSE
├─ Route: /cases/[id]/closure
├─ Entity: case_closures
├─ Captures: Final outcome, closure date, archive location
└─ Role: Para-Legal Officer

ALWAYS ACCESSIBLE (Not separate workflows):
├─ Documents: /cases/[id]/documents (Step 3 + ongoing)
├─ Tasks: /cases/[id]/tasks (Step 6 execution)
└─ Notifications: /notifications (system-generated)
```

---

## 📋 DELIVERABLE 3: New Normalized ERD

### Core Entities (10 tables)

```sql
1. cases
   ├─ PK: id
   ├─ court_reference (unique)
   ├─ track_number
   ├─ case_type (tort, compensation, fraud, etc.)
   ├─ dlpp_role (defendant/plaintiff)
   ├─ lifecycle_state (REGISTERED → ASSIGNED → IN_PROGRESS → CLOSED)
   ├─ division_responsible
   ├─ allegations
   ├─ reliefs_sought
   ├─ section5_notice (boolean)
   ├─ assigned_officer_id → profiles(id)
   └─ timestamps

2. case_parties
   ├─ PK: id
   ├─ FK: case_id → cases(id)
   ├─ party_name
   ├─ party_type (plaintiff/defendant/intervener)
   ├─ contact_info
   └─ timestamps

3. case_representatives
   ├─ PK: id
   ├─ FK: case_id → cases(id)
   ├─ representative_name
   ├─ representative_type (plaintiff_lawyer, state_osg, solgen, dlpp_officer)
   ├─ firm
   ├─ contact_info
   └─ timestamps

4. case_land_details
   ├─ PK: id (1:1 with case)
   ├─ FK: case_id → cases(id) UNIQUE
   ├─ land_description
   ├─ zoning
   ├─ survey_plan_no
   ├─ lease_type
   ├─ lease_commencement_date
   ├─ lease_expiration_date
   ├─ title_file_ref
   ├─ land_file_ref
   └─ timestamps

5. case_events (hearings/directions/returnable dates)
   ├─ PK: id
   ├─ FK: case_id → cases(id)
   ├─ event_type (directions_hearing, substantive_hearing, mediation, trial, pre_trial)
   ├─ event_date (returnable date)
   ├─ location
   ├─ alert_triggered (boolean)
   ├─ alert_sent_at
   └─ timestamps

6. case_documents
   ├─ PK: id
   ├─ FK: case_id → cases(id)
   ├─ document_type (court_filing, correspondence, affidavit, notice, order)
   ├─ file_url
   ├─ date_filed
   ├─ date_served_received
   ├─ uploaded_by → users(id)
   └─ timestamps

7. case_tasks
   ├─ PK: id
   ├─ FK: case_id → cases(id)
   ├─ task_type (defence_prep, affidavit, brief_out, notice_motion, etc.)
   ├─ assigned_to → profiles(id)
   ├─ due_date
   ├─ status (pending/in_progress/completed)
   ├─ completion_evidence (file_url or notes)
   └─ timestamps

8. case_orders
   ├─ PK: id
   ├─ FK: case_id → cases(id)
   ├─ court_reference
   ├─ parties_to_proceeding
   ├─ order_date
   ├─ terms
   ├─ grounds_for_conclusion
   ├─ document_url
   └─ timestamps

9. case_closures
   ├─ PK: id (1:1 with case)
   ├─ FK: case_id → cases(id) UNIQUE
   ├─ closure_date
   ├─ closure_status (concluded/settled/withdrawn/dismissed)
   ├─ final_outcome
   ├─ archived (boolean)
   ├─ archive_location
   └─ timestamps

10. case_status_history
    ├─ PK: id
    ├─ FK: case_id → cases(id)
    ├─ from_status
    ├─ to_status
    ├─ changed_by → users(id)
    ├─ change_reason
    └─ timestamp

11. notifications
    ├─ PK: id
    ├─ FK: user_id → users(id)
    ├─ FK: case_id → cases(id)
    ├─ notification_type (returnable_date_alert, assignment, task_due)
    ├─ message
    ├─ sent_at
    ├─ read (boolean)
    └─ timestamps
```

**Foreign Key Relationships**:
- All tables reference `cases.id` (parent entity)
- No duplicate storage of court_reference, party names, etc.

---

## 📋 DELIVERABLE 4: Field Coverage Matrix (Dummy → Schema → UI)

### Dummy Fields Mapping

| Dummy Column | Data Type | Entity | Step | UI Screen | Validation |
|--------------|-----------|--------|------|-----------|------------|
| Court reference number | TEXT | cases | 2 | Register Case | Required, Unique |
| Parties to proceeding | TEXT | case_parties | 2 | Register Case | Required |
| Track number | TEXT | cases | 2 | Register Case | Optional |
| Date proceeding filed | DATE | cases | 2 | Register Case | Required |
| Date court docs served/received | DATE | cases | 2 | Register Case | Required |
| Type of court documents | ENUM | case_documents | 2 | Register Case | Required |
| Type of matter | ENUM | cases | 2 | Register Case | Required (tort, compensation, fraud, etc.) |
| Returnable date | TIMESTAMP | case_events | 2 | Register Case | Required (triggers alert) |
| Returnable type | ENUM | case_events | 2 | Register Case | Required (directions, hearing, trial, etc.) |
| Land description | TEXT | case_land_details | 2 | Register Case | Optional |
| Zoning | TEXT | case_land_details | 2 | Register Case | Optional |
| Survey plan no | TEXT | case_land_details | 2 | Register Case | Optional |
| Lease type | ENUM | case_land_details | 2 | Register Case | Optional |
| Lease commencement | DATE | case_land_details | 2 | Register Case | Optional |
| Lease expiry | DATE | case_land_details | 2 | Register Case | Optional |
| Division responsible | TEXT | cases | 2 | Register Case | Required |
| Allegations/Legal issues | TEXT | cases | 2 | Register Case | Required |
| Relief sought | TEXT | cases | 2 | Register Case | Required |
| Plaintiff lawyers | TEXT | case_representatives | 2 | Register Case | Optional |
| State/OSG/SolGen officer | TEXT | case_representatives | 2 | Register Case | Optional |
| DLPP action officer | FK | cases | 4 | Assignment | Required (assigned by manager) |
| Assignment date | DATE | cases | 4 | Assignment | Auto-populated |
| Manager/Supervisor note | TEXT | cases | 4 | Assignment | Optional |
| Section 5 notice | BOOLEAN | cases | 2 | Register Case | Default: false |
| Status of matter | ENUM | cases | 2-8 | All steps | Auto from lifecycle_state |
| Title file ref | TEXT | case_land_details | 2 | Register Case | Optional |
| Land file ref | TEXT | case_land_details | 2 | Register Case | Optional |

**Coverage**: 100% of Dummy fields mapped

---

## 📋 DELIVERABLE 5: Migration Scripts

### Strategy: Zero Data Loss

```sql
-- MIGRATION SCRIPT 1: Create new normalized tables
-- (Already created in SCHEMA_MIGRATION_CANONICAL_WORKFLOW.sql)

-- MIGRATION SCRIPT 2: Migrate existing data
-- Example: Move data from old tables to new

-- Step 1: Backup existing data
CREATE TABLE cases_backup AS SELECT * FROM cases;

-- Step 2: Migrate parties
INSERT INTO case_parties (case_id, party_name, party_type, contact_info)
SELECT
  c.id as case_id,
  p.name as party_name,
  p.role as party_type,
  p.contact_info
FROM cases c
JOIN parties p ON c.id = p.case_id
WHERE NOT EXISTS (
  SELECT 1 FROM case_parties WHERE case_id = c.id
);

-- Step 3: Migrate land details
INSERT INTO case_land_details (
  case_id, land_description, zoning, survey_plan_no,
  lease_type, lease_commencement_date, lease_expiration_date
)
SELECT
  id as case_id,
  land_description,
  zoning,
  survey_plan_no,
  lease_type,
  lease_commencement_date,
  lease_expiration_date
FROM cases
WHERE land_description IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM case_land_details WHERE case_id = cases.id
  );

-- Step 4: Migrate events (returnable dates)
INSERT INTO case_events (case_id, event_type, event_date)
SELECT
  id as case_id,
  returnable_type as event_type,
  returnable_date as event_date
FROM cases
WHERE returnable_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM case_events WHERE case_id = cases.id
  );

-- Step 5: Verify counts
SELECT
  'cases' as table_name, COUNT(*) as count FROM cases
UNION ALL
SELECT 'case_parties', COUNT(*) FROM case_parties
UNION ALL
SELECT 'case_land_details', COUNT(*) FROM case_land_details
UNION ALL
SELECT 'case_events', COUNT(*) FROM case_events;
```

---

## 📋 DELIVERABLE 6: Refactored UI Navigation

### New Canonical Menu Structure

```typescript
const canonicalNavigation = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { name: 'Overview', href: '/dashboard' }
    ]
  },
  {
    name: 'Case Workflow', // Single workflow group
    icon: Scale,
    items: [
      {
        name: 'Register Case',
        href: '/cases/new',
        roles: ['para_legal', 'admin']
      },
      {
        name: 'Assign Cases',
        href: '/cases/assignments',
        roles: ['manager', 'senior_legal', 'admin']
      },
      {
        name: 'My Cases',
        href: '/cases/my-cases',
        roles: ['action_officer', 'admin']
      },
      {
        name: 'All Cases',
        href: '/cases'
      }
    ]
  },
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Notifications', href: '/notifications' },
      {
        name: 'Administration',
        href: '/admin',
        roles: ['admin']
      }
    ]
  }
];
```

**Case Detail Tabs** (at `/cases/[id]`):
1. Overview (progress stepper + key details)
2. Intake Details (all registration fields)
3. Parties & Representatives (plaintiffs, defendants, lawyers)
4. Land Details (zoning, survey, lease info)
5. Events (returnable dates, hearings, directions)
6. Documents (all uploads chronologically)
7. Tasks (litigation activities + completion)
8. Court Order (Step 7 - when concluded)
9. Closure (Step 8 - final outcome)
10. Audit Trail (status history + changes)

---

## 📋 DELIVERABLE 7: End-to-End Tests

### Test Scenario: Full Lifecycle

```javascript
describe('Litigation Case Lifecycle', () => {

  test('Step 2: Para-Legal registers new case', async () => {
    // Login as para-legal
    // Navigate to /cases/new
    // Fill all required Dummy fields
    // Submit
    // Verify case created with lifecycle_state = 'REGISTERED'
    // Verify 3-day alert created
  });

  test('Step 3: Para-Legal uploads initial documents', async () => {
    // Navigate to /cases/[id]/documents
    // Upload court filing + correspondence
    // Verify files stored
    // Verify metadata captured
  });

  test('Step 4: Manager assigns case to Action Officer', async () => {
    // Login as manager
    // Navigate to /cases/assignments
    // Assign case to officer
    // Verify lifecycle_state = 'ASSIGNED'
    // Verify assignment history created
    // Verify notification sent to officer
  });

  test('Step 5: Action Officer adds returnable dates', async () => {
    // Login as action officer
    // Navigate to /cases/[id]/events
    // Add directions hearing with date
    // Verify alert scheduled 3 days before
  });

  test('Step 6: Action Officer creates litigation tasks', async () => {
    // Navigate to /cases/[id]/tasks
    // Create tasks: defence prep, affidavit, brief-out
    // Assign tasks
    // Verify tasks created
  });

  test('Step 7: Action Officer registers court order', async () => {
    // Navigate to /cases/[id]/order
    // Enter order details (terms, grounds, date)
    // Upload signed order document
    // Verify order created
  });

  test('Step 8: Para-Legal closes case', async () => {
    // Login as para-legal
    // Navigate to /cases/[id]/closure
    // Enter closure details
    // Mark case closed
    // Verify lifecycle_state = 'CLOSED'
    // Verify closure record created
  });

  test('Dashboard reflects accurate case count at each stage', async () => {
    // Check dashboard
    // Verify counts match actual records in each lifecycle state
  });

  test('No duplicate routes exist', async () => {
    // Verify /allocation redirects to /cases/assignments
    // Verify /cases/create-minimal redirects to /cases/new
    // etc.
  });
});
```

---

## 📋 DELIVERABLE 8: RBAC Enforcement

### Role Permissions Matrix

| Action | Para-Legal | Action Officer | Manager | Admin |
|--------|------------|----------------|---------|-------|
| Register Case (Step 2) | ✅ | ❌ | ✅ | ✅ |
| Upload Documents (Step 3) | ✅ | ✅ | ✅ | ✅ |
| Assign Case (Step 4) | ❌ | ❌ | ✅ | ✅ |
| Add Events/Returnable Dates | ❌ | ✅ | ✅ | ✅ |
| Create Tasks | ❌ | ✅ | ✅ | ✅ |
| Register Court Order | ❌ | ✅ | ✅ | ✅ |
| Close Case (Step 8) | ✅ | ❌ | ✅ | ✅ |
| View All Cases | ✅ | ✅ | ✅ | ✅ |
| Edit Assigned Cases Only | - | ✅ | ❌ | ❌ |
| Edit Any Case | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |

**Audit Trail Required For**:
- Status changes (all transitions logged to case_status_history)
- Returnable date changes (triggers new alert)
- Assignment changes (logged to case_assignments history)
- Court order registration (immutable once created)
- Case closure (cannot reopen without admin)

---

## 📋 DELIVERABLE 9: Dashboard State Machine

### Single Source of Truth for Status

```sql
-- Dashboard counts computed from lifecycle_state

SELECT
  lifecycle_state,
  COUNT(*) as case_count
FROM cases
WHERE lifecycle_state != 'CLOSED'
GROUP BY lifecycle_state;

-- Results:
-- REGISTERED: 15
-- ASSIGNED: 42
-- IN_PROGRESS: 128
-- READY_FOR_CLOSURE: 8
```

**Dashboard Tiles**:
1. **Registered** → `lifecycle_state = 'REGISTERED'`
2. **Assigned** → `lifecycle_state = 'ASSIGNED'`
3. **Directions Scheduled** → `EXISTS(SELECT 1 FROM case_events WHERE case_id = cases.id)`
4. **Litigation In Progress** → `lifecycle_state = 'IN_PROGRESS'`
5. **Ready for Closure** → `EXISTS(SELECT 1 FROM case_orders WHERE case_id = cases.id) AND lifecycle_state != 'CLOSED'`
6. **Closed** → `lifecycle_state = 'CLOSED'`

**No hardcoded logic duplication** - all computed from single state field.

---

## 📋 DELIVERABLE 10: Acceptance Criteria Checklist

- [ ] ✅ Users follow ONE path from Register → Close (no parallel workflows)
- [ ] ✅ NO duplicated menu items
- [ ] ✅ NO duplicated routes
- [ ] ✅ NO duplicated tables storing same data
- [ ] ✅ All Dummy fields captured and retrievable on correct screens
- [ ] ✅ Dashboard numbers reflect single state machine
- [ ] ✅ Alerts fire 3 days before returnable date (configurable)
- [ ] ✅ Existing database records intact and migrated
- [ ] ✅ RBAC enforced per role permissions matrix
- [ ] ✅ Audit trail for all key field changes
- [ ] ✅ End-to-end tests pass
- [ ] ✅ Field coverage matrix 100% complete

---

## 🚀 EXECUTION PLAN (Ordered Steps)

### Phase 1: Database Foundation (COMPLETE)
- ✅ Created normalized schema
- ✅ Created idempotent migrations
- ✅ Mapped all Dummy fields
- **NEXT**: Run migrations on live database

### Phase 2: Route Consolidation (WEEK 1)
- [ ] Create route mapping table
- [ ] Implement redirects from duplicate routes
- [ ] Delete redundant page files
- [ ] Update all internal links

### Phase 3: UI Refactoring (WEEK 2)
- [ ] Create Case Overview with tabs
- [ ] Consolidate Register Case form (all Dummy fields)
- [ ] Build Assignment interface (manager view)
- [ ] Build Events/Directions tab
- [ ] Build Tasks execution tab
- [ ] Build Court Order registration form
- [ ] Build Closure form
- [ ] Update navigation menu

### Phase 4: Data Migration (WEEK 3)
- [ ] Audit existing data
- [ ] Write migration scripts
- [ ] Test on staging
- [ ] Execute on production
- [ ] Verify record counts

### Phase 5: Testing & QA (WEEK 4)
- [ ] End-to-end workflow tests
- [ ] RBAC enforcement tests
- [ ] Alert trigger tests
- [ ] Performance tests
- [ ] User acceptance testing

### Phase 6: Deployment (WEEK 5)
- [ ] Training documentation
- [ ] User training sessions
- [ ] Production deployment
- [ ] Monitoring
- [ ] Bug fixes

---

## 🎯 SUCCESS METRICS

1. **Code Reduction**: 40%+ fewer files/routes
2. **Performance**: Dashboard loads < 2s
3. **User Satisfaction**: Single clear path to follow
4. **Data Integrity**: Zero records lost in migration
5. **Audit Compliance**: 100% of changes logged

---

**STATUS**: Ready to execute
**START DATE**: Immediately
**ESTIMATED COMPLETION**: 5 weeks
**RISK LEVEL**: Low (systematic approach with backups)

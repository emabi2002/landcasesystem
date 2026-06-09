# Canonical Litigation Workflow - Refactoring Plan

## Executive Summary

This document outlines the complete refactoring plan to align the Land Case Management System with the **canonical litigation workflow**, eliminating duplicates and implementing a single source of truth.

---

## Part 1: Current System Analysis

### Duplicate Routes Identified

#### GROUP A: Case Registration (3 duplicates)
1. `/litigation/register` - Litigation Workflow menu
2. `/cases/create-minimal` - Workflow menu ("Case Registration")
3. `/cases/new` - Direct route
4. `/reception` - Reception registration

**Decision**: Keep **`/litigation/register`** as canonical. Remove others.

#### GROUP B: Case Assignment (2 duplicates)
1. `/litigation/assignments` - Litigation Workflow menu
2. `/allocation` - Workflow menu ("Case Allocation")

**Decision**: Keep **`/litigation/assignments`** as canonical.

#### GROUP C: Case Management (3+ overlapping routes)
1. `/cases` - All cases list
2. `/cases/[id]` - Individual case view
3. `/litigation` - Litigation page
4. `/directions` - Directions workflow

**Decision**: Create **`/litigation/cases/[id]`** as canonical Case Workspace with tabs.

#### GROUP D: Compliance (2 duplicates)
1. `/compliance` - Workflow menu
2. `/compliance-tracking` - Legal menu

**Decision**: Merge into one route: **`/compliance`**

#### GROUP E: Case Closure (duplicate)
1. `/closure` - Workflow menu
2. Closure functionality in `/cases/[id]`

**Decision**: Keep closure as a **tab** in Case Workspace, accessible by para-legal role.

#### GROUP F: Document Management (overlapping)
1. `/documents` - Documents page
2. `/filings` - Filings page
3. `/litigation/filings/[caseId]` - Case-specific filings
4. Document tabs in various case views

**Decision**: Consolidate into **Documents tab** in Case Workspace.

### Duplicate Components

```
src/app/
├── allocation/page.tsx         ❌ DELETE (duplicate of assignments)
├── cases/create-minimal/       ❌ DELETE (duplicate registration)
├── cases/new/                  ❌ DELETE (duplicate registration)
├── closure/page.tsx            ❌ REFACTOR (move to Case Workspace tab)
├── compliance-tracking/        ❌ MERGE into compliance
├── directions/page.tsx         ❌ REFACTOR (move to Case Workspace)
├── filings/page.tsx            ❌ REFACTOR (move to Case Workspace)
├── litigation/page.tsx         ❌ REFACTOR (redirect to cases list)
├── reception/                  ❌ DELETE (duplicate of register)
```

---

## Part 2: Canonical Workflow Implementation

### State Machine (Single Source of Truth)

```
cases.lifecycle_state ENUM:
  - REGISTERED            (Para-Legal)
  - ASSIGNED              (Manager)
  - DETAILS_COMPLETED     (Action Officer)
  - DRAFTING              (Action Officer)
  - UNDER_REVIEW          (Manager reviews draft)
  - APPROVED_FOR_FILING   (Manager approved)
  - FILED                 (Action Officer filed documents)
  - IN_PROGRESS           (Active litigation)
  - JUDGMENT_ENTERED      (Court order received)
  - CLOSED                (Para-Legal closed)
```

### Workflow Steps

**Step 1: Register Case (Para-Legal)**
- Route: `/litigation/register`
- Actions:
  - Capture intake fields
  - Upload initial court documents
  - Set next returnable date
  - Auto-create alert (3 days before)
- Transition: REGISTERED

**Step 2: Assign Case (Manager)**
- Route: `/litigation/assignments`
- Actions:
  - View new registrations
  - Assign to Action Officer
  - Add assignment note
- Transition: REGISTERED → ASSIGNED

**Step 3: Complete Details (Action Officer)**
- Route: `/litigation/cases/[id]` (Details tab)
- Actions:
  - Add land/title/survey details
  - Add ILG information
  - Add parties and lawyers
  - Define legal issues and reliefs
- Transition: ASSIGNED → DETAILS_COMPLETED

**Step 4: Draft Documents (Action Officer)**
- Route: `/litigation/cases/[id]` (Documents tab)
- Actions:
  - Create/upload draft documents
  - Mark as "draft" status
- Transition: DETAILS_COMPLETED → DRAFTING

**Step 5: Review Loop (Manager ↔ Action Officer)**
- Route: `/litigation/cases/[id]` (Documents tab)
- Actions:
  - Manager reviews draft (DRAFTING → UNDER_REVIEW)
  - Manager requests revisions OR approves
  - If revisions: UNDER_REVIEW → DRAFTING (cycle)
  - If approved: UNDER_REVIEW → APPROVED_FOR_FILING
- Transition: DRAFTING ↔ UNDER_REVIEW → APPROVED_FOR_FILING

**Step 6: File Documents (Action Officer)**
- Route: `/litigation/cases/[id]` (Documents tab)
- Actions:
  - Upload signed/sealed final documents
  - Mark as "filed" with filing date
- Transition: APPROVED_FOR_FILING → FILED

**Step 7: Update Progress (Action Officer)**
- Route: `/litigation/cases/[id]` (Status/Tasks tab)
- Actions:
  - Add status updates
  - Create/complete tasks
  - Upload ongoing documents
  - Update events/hearings
- Transition: FILED → IN_PROGRESS

**Step 8: Judgment & Compliance (Action Officer)**
- Route: `/litigation/cases/[id]` (Court Orders tab)
- Actions:
  - Enter court order details
  - Upload judgment document
  - Create compliance memo
  - Send notifications
- Transition: IN_PROGRESS → JUDGMENT_ENTERED

**Step 9: Close Case (Para-Legal)**
- Route: `/litigation/cases/[id]` (Closure tab)
- Actions:
  - Enter closure date
  - Select closure status
  - Add closure notes
  - Archive documents
- Transition: JUDGMENT_ENTERED → CLOSED

---

## Part 3: Normalized Schema Design

### New Tables Required

```sql
-- A) Core with state machine
ALTER TABLE cases ADD COLUMN lifecycle_state VARCHAR(30)
  CHECK (lifecycle_state IN (
    'REGISTERED', 'ASSIGNED', 'DETAILS_COMPLETED', 'DRAFTING',
    'UNDER_REVIEW', 'APPROVED_FOR_FILING', 'FILED', 'IN_PROGRESS',
    'JUDGMENT_ENTERED', 'CLOSED'
  )) DEFAULT 'REGISTERED';

ALTER TABLE cases ADD COLUMN court_reference TEXT;
ALTER TABLE cases ADD COLUMN court_location TEXT;
ALTER TABLE cases ADD COLUMN mode_of_proceeding TEXT;
ALTER TABLE cases ADD COLUMN nature_of_matter TEXT;
ALTER TABLE cases ADD COLUMN opened_date DATE;
ALTER TABLE cases ADD COLUMN filed_date DATE;

-- B) Lawyers (normalize "in carriage")
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  firm TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  type VARCHAR(50) CHECK (type IN ('internal', 'external', 'solicitor_general', 'brief_out')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE case_lawyer_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES lawyers(id),
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'DLPP_IN_CARRIAGE',
    'SOLGEN_IN_CARRIAGE',
    'PLAINTIFF_LAWYER',
    'DEFENDANT_LAWYER',
    'BRIEF_OUT_FIRM'
  )),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C) Assignments with history
CREATE TABLE case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  reassigned_from_user_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  assignment_note TEXT,
  is_current BOOLEAN DEFAULT true
);

-- D) Land/Title/Survey/ILG details
CREATE TABLE case_land_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
  land_description TEXT,
  land_file_ref TEXT,
  nld_ref TEXT,
  title_file_ref TEXT,
  survey_file_ref TEXT,
  survey_plan_catalogue_no TEXT,
  purchase_doc_no TEXT,
  purchase_doc_file_ref TEXT,
  ilg_no TEXT,
  ilg_file_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E) Enhanced documents with workflow status
ALTER TABLE documents ADD COLUMN workflow_status VARCHAR(30)
  CHECK (workflow_status IN ('draft', 'under_review', 'approved', 'filed', 'sealed'));
ALTER TABLE documents ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN approved_by UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN filed_date DATE;
ALTER TABLE documents ADD COLUMN is_sealed BOOLEAN DEFAULT false;

-- F) Tasks (already exists, enhance)
ALTER TABLE tasks ADD COLUMN task_type VARCHAR(50)
  CHECK (task_type IN ('drafting', 'filing', 'research', 'follow_up', 'other'));

-- G) Court orders (already exists in consolidated schema)
-- No changes needed

-- H) Case closures
CREATE TABLE case_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  closed_by UUID NOT NULL REFERENCES auth.users(id),
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closure_status VARCHAR(50) NOT NULL CHECK (closure_status IN (
    'judgment_granted', 'judgment_dismissed', 'settled',
    'withdrawn', 'struck_out', 'consent_order', 'other'
  )),
  closure_notes TEXT,
  final_outcome TEXT
);

-- I) Instructions/Comments (from dummy register)
CREATE TABLE case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  note_type VARCHAR(30) CHECK (note_type IN ('INSTRUCTION', 'COMMENT', 'REMARK')),
  from_role VARCHAR(50) CHECK (from_role IN (
    'SECRETARY', 'ACTING_DEP_SEC', 'REGISTRAR_TITLES',
    'DIRECTOR', 'MANAGER_LEGAL', 'SENIOR_LEGAL_LIT',
    'ACTION_OFFICER', 'PARA_LEGAL'
  )),
  author_user_id UUID REFERENCES auth.users(id),
  note_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- J) Lifecycle history (state transitions)
CREATE TABLE case_lifecycle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  from_state VARCHAR(30),
  to_state VARCHAR(30) NOT NULL,
  transitioned_by UUID NOT NULL REFERENCES auth.users(id),
  transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);
```

---

## Part 4: Navigation Restructure

### Target Menu (Single Set)

```typescript
const canonicalNavigation: NavGroup[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    name: 'Litigation',
    icon: Scale,
    items: [
      {
        name: 'Register Case',
        href: '/litigation/register',
        icon: FileText,
        roles: ['para_legal', 'admin']
      },
      {
        name: 'Assignments',
        href: '/litigation/assignments',
        icon: UserCog,
        roles: ['manager_legal', 'senior_legal', 'admin']
      },
      {
        name: 'My Cases',
        href: '/litigation/my-cases',
        icon: Briefcase,
        roles: ['action_officer', 'admin']
      },
      {
        name: 'All Cases',
        href: '/litigation/cases',
        icon: FolderOpen
      },
      {
        name: 'Reports',
        href: '/litigation/reports',
        icon: BarChart3
      }
    ]
  },
  {
    name: 'Alerts & Notifications',
    icon: Bell,
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Calendar', href: '/calendar', icon: Calendar }
    ]
  },
  {
    name: 'Administration',
    icon: Settings,
    roles: ['admin'],
    items: [
      { name: 'User Management', href: '/admin/users', icon: UserCog },
      { name: 'Groups & Permissions', href: '/admin/groups', icon: Shield }
    ]
  }
];
```

---

## Part 5: Case Workspace Design

### Route Structure
```
/litigation/cases/[caseId]
```

### Tabs (Role-Based Visibility)

1. **Overview Tab** (All roles)
   - Case header with key details
   - Current lifecycle state
   - Timeline of state transitions
   - Quick actions based on current state

2. **Details Tab** (Action Officer, Manager, Admin)
   - Basic case information
   - Parties (plaintiff/defendant/witnesses)
   - Land/Title/Survey/ILG details
   - Legal framing (allegations, reliefs)

3. **Lawyers Tab** (Action Officer, Manager, Admin)
   - DLPP lawyer in carriage
   - SolGen lawyer in carriage
   - Plaintiff/Defendant lawyers
   - Brief-out firms
   - Historical assignments

4. **Documents Tab** (All roles - filtered by permission)
   - Upload documents
   - Document workflow status (draft/review/approved/filed/sealed)
   - Review/approve actions (Manager only)
   - Filing actions (Action Officer only)
   - Document version history

5. **Tasks Tab** (Action Officer, Manager)
   - Create tasks
   - Assign tasks
   - Track completion
   - Task types (drafting, filing, research, etc.)

6. **Status & Events Tab** (All roles)
   - Status updates
   - Court events/hearings
   - Returnable dates with alerts
   - Progress notes

7. **Court Orders Tab** (Action Officer, Manager, Admin)
   - Add court orders
   - Upload judgment documents
   - Compliance memos
   - Grounds for conclusion

8. **Notes & Instructions Tab** (All roles)
   - Instructions by role (Secretary, Director, Manager, etc.)
   - Comments
   - Remarks
   - Internal vs external visibility

9. **Closure Tab** (Para-Legal, Admin only)
   - Close case
   - Closure status selection
   - Final outcome
   - Closure notes
   - Archive options

---

## Part 6: Alert System Implementation

### Returnable Date Alerts

```sql
-- Function to create alerts 3 days before returnable date
CREATE OR REPLACE FUNCTION schedule_returnable_date_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing alerts for this case's returnable date
  DELETE FROM notifications
  WHERE case_id = NEW.id
    AND type = 'returnable_date_alert';

  -- Create new alerts if returnable date is set
  IF NEW.returnable_date IS NOT NULL AND NEW.returnable_date > NOW() THEN
    -- Alert for Action Officer
    INSERT INTO notifications (user_id, case_id, title, message, type, priority, created_at)
    SELECT
      ca.assigned_to_user_id,
      NEW.id,
      'Returnable Date Alert - ' || NEW.case_number,
      'Case ' || NEW.case_number || ' has a returnable date on ' ||
        TO_CHAR(NEW.returnable_date, 'DD Mon YYYY HH24:MI'),
      'returnable_date_alert',
      'high',
      NEW.returnable_date - INTERVAL '3 days'
    FROM case_assignments ca
    WHERE ca.case_id = NEW.id AND ca.is_current = true;

    -- Alert for Manager Legal Services
    INSERT INTO notifications (user_id, case_id, title, message, type, priority, created_at)
    SELECT
      u.id,
      NEW.id,
      'Returnable Date Alert - ' || NEW.case_number,
      'Case ' || NEW.case_number || ' assigned to ' ||
        p.full_name || ' has a returnable date on ' ||
        TO_CHAR(NEW.returnable_date, 'DD Mon YYYY HH24:MI'),
      'returnable_date_alert',
      'high',
      NEW.returnable_date - INTERVAL '3 days'
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE p.role = 'manager_legal_services' AND p.is_active = true;

    -- Alert for Para-Legal
    INSERT INTO notifications (user_id, case_id, title, message, type, priority, created_at)
    SELECT
      NEW.created_by,
      NEW.id,
      'Returnable Date Alert - ' || NEW.case_number,
      'Case ' || NEW.case_number || ' has a returnable date on ' ||
        TO_CHAR(NEW.returnable_date, 'DD Mon YYYY HH24:MI'),
      'returnable_date_alert',
      'medium',
      NEW.returnable_date - INTERVAL '3 days'
    FROM profiles p
    WHERE p.id = NEW.created_by AND p.is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for returnable date changes
CREATE TRIGGER trigger_returnable_date_alerts
AFTER INSERT OR UPDATE OF returnable_date ON cases
FOR EACH ROW
EXECUTE FUNCTION schedule_returnable_date_alerts();
```

---

## Part 7: Migration Execution Plan

### Phase 1: Schema Updates (Week 1)
1. Run schema migration SQL (all new tables and columns)
2. Create indexes on new tables
3. Add triggers for lifecycle state transitions
4. Add triggers for returnable date alerts
5. Verify all constraints

### Phase 2: UI Refactoring (Week 2)
1. Create Case Workspace component with tabs
2. Create canonical registration page
3. Create assignments inbox
4. Create my-cases filter view
5. Update navigation (Sidebar.tsx)

### Phase 3: Route Consolidation (Week 3)
1. Set up redirects from old routes to canonical routes
2. Delete duplicate page components
3. Test all navigation paths
4. Update internal links

### Phase 4: Data Migration (Week 4)
1. Migrate existing case data to new schema
2. Create lawyer records from existing data
3. Populate case_land_details from existing land_parcels
4. Create initial case_assignments from assigned_officer_id
5. Set initial lifecycle_state based on current status

### Phase 5: Testing & QA (Week 5)
1. Test complete workflow: Register → Assign → Complete → Draft → Review → File → Judgment → Close
2. Test role-based access controls
3. Test alerts (3-day returnable date)
4. Test document workflow (draft → review → approve → file)
5. Load testing with multiple users

### Phase 6: Training & Deployment (Week 6)
1. User training on new workflow
2. Document new processes
3. Deploy to production
4. Monitor for issues
5. Gather feedback

---

## Part 8: Dummy.pdf Field Mapping

### Mapping Sheet

| Dummy Column | Target Table | Field Name |
|--------------|--------------|------------|
| Date court docs received | cases | documents_served_date |
| Date file opened | cases | opened_date |
| Filed/created by | cases | created_by |
| Date matter assigned | case_assignments | assigned_at |
| DLPP lawyer in carriage | case_lawyer_roles | lawyer_id (role=DLPP_IN_CARRIAGE) |
| SolGen lawyer in carriage | case_lawyer_roles | lawyer_id (role=SOLGEN_IN_CARRIAGE) |
| Plaintiffs' lawyers | case_lawyer_roles | lawyer_id (role=PLAINTIFF_LAWYER) |
| Brief-out law firm | case_lawyer_roles | lawyer_id (role=BRIEF_OUT_FIRM) |
| Court reference | cases | court_reference |
| Parties | case_parties | name, role |
| ILG registration | case_land_details | ilg_no, ilg_file_ref |
| Land description | case_land_details | land_description |
| Land file ref/NLD | case_land_details | land_file_ref, nld_ref |
| Title file ref | case_land_details | title_file_ref |
| Legal issue/nature | cases | nature_of_matter |
| Status | cases | lifecycle_state |
| Closed matter | cases | lifecycle_state = 'CLOSED' |
| Court location | cases | court_location |
| Secretary instruction | case_notes | note (from_role=SECRETARY) |
| Acting Dep Sec comment | case_notes | note (from_role=ACTING_DEP_SEC) |
| Registrar instruction | case_notes | note (from_role=REGISTRAR_TITLES) |
| Director comment | case_notes | note (from_role=DIRECTOR) |
| Manager Legal instruction | case_notes | note (from_role=MANAGER_LEGAL) |
| Senior Legal Officer comment | case_notes | note (from_role=SENIOR_LEGAL_LIT) |
| Remarks | case_notes | note (note_type=REMARK) |

---

## Part 9: Implementation Checklist

### Database
- [ ] Run new schema migration (lawyers, case_lawyer_roles, case_assignments, etc.)
- [ ] Add lifecycle_state column to cases
- [ ] Create case_land_details table
- [ ] Create case_notes table
- [ ] Create case_lifecycle_history table
- [ ] Create case_closures table
- [ ] Add document workflow columns
- [ ] Create returnable date alert trigger
- [ ] Create lifecycle transition trigger
- [ ] Migrate existing data

### Backend API Routes
- [ ] `/api/litigation/register` - Case registration
- [ ] `/api/litigation/assign` - Assign case
- [ ] `/api/litigation/transition-state` - Lifecycle state transitions
- [ ] `/api/litigation/lawyers` - Manage lawyer roles
- [ ] `/api/litigation/documents/review` - Document review
- [ ] `/api/litigation/documents/approve` - Document approval
- [ ] `/api/litigation/close` - Case closure
- [ ] `/api/litigation/notes` - Case notes/instructions

### Frontend Components
- [ ] `CaseWorkspace.tsx` - Main workspace with tabs
- [ ] `OverviewTab.tsx` - Case overview
- [ ] `DetailsTab.tsx` - Case details form
- [ ] `LawyersTab.tsx` - Lawyer management
- [ ] `DocumentsTab.tsx` - Document workflow
- [ ] `TasksTab.tsx` - Task management
- [ ] `StatusEventsTab.tsx` - Status updates & events
- [ ] `CourtOrdersTab.tsx` - Court orders
- [ ] `NotesTab.tsx` - Instructions & comments
- [ ] `ClosureTab.tsx` - Case closure form
- [ ] `LifecycleStateIndicator.tsx` - Visual state indicator
- [ ] `StateTransitionButton.tsx` - Transition actions

### Pages
- [ ] `/litigation/register/page.tsx` - Registration form
- [ ] `/litigation/assignments/page.tsx` - Assignment inbox
- [ ] `/litigation/my-cases/page.tsx` - My cases view
- [ ] `/litigation/cases/page.tsx` - All cases list
- [ ] `/litigation/cases/[caseId]/page.tsx` - Case Workspace
- [ ] `/litigation/reports/page.tsx` - Litigation reports

### Redirects
- [ ] `/cases/create-minimal` → `/litigation/register`
- [ ] `/cases/new` → `/litigation/register`
- [ ] `/allocation` → `/litigation/assignments`
- [ ] `/reception` → `/litigation/register`
- [ ] `/cases/[id]` → `/litigation/cases/[id]`
- [ ] `/litigation` → `/litigation/cases`

### Cleanup (Delete)
- [ ] `/app/allocation/`
- [ ] `/app/cases/create-minimal/`
- [ ] `/app/cases/new/`
- [ ] `/app/reception/`
- [ ] `/app/closure/`
- [ ] `/app/directions/`
- [ ] `/app/filings/`
- [ ] `/app/compliance-tracking/`

### Navigation Update
- [ ] Update `Sidebar.tsx` with canonical navigation
- [ ] Remove "Workflow" group
- [ ] Keep only "Litigation" group
- [ ] Add role-based menu visibility
- [ ] Update mobile navigation

---

## Part 10: Success Criteria

### Functional Requirements
✅ Single workflow from Register to Closure
✅ State machine enforced (10 states)
✅ Role-based access (Para-Legal, Manager, Action Officer)
✅ Document workflow (draft → review → approve → file)
✅ Alerts 3 days before returnable date
✅ All dummy.pdf fields captured in normalized schema
✅ Complete audit trail (lifecycle history)

### Technical Requirements
✅ No duplicate routes
✅ No duplicate components
✅ Single Case Workspace with tabs
✅ Consolidated navigation (5 groups max)
✅ Performance: Page load < 2s
✅ Mobile responsive
✅ WCAG 2.1 AA accessible

### User Experience
✅ Clear workflow progression
✅ Visual state indicators
✅ Context-sensitive actions
✅ Easy document upload/review
✅ Quick case search/filter
✅ Actionable notifications

---

## Timeline

**Total Duration: 6 weeks**

- Week 1: Schema updates & migrations
- Week 2: UI components (Case Workspace)
- Week 3: Route consolidation & redirects
- Week 4: Data migration & testing
- Week 5: QA & bug fixes
- Week 6: Training & deployment

---

## Risk Mitigation

### Risk 1: Data Loss During Migration
**Mitigation**:
- Full database backup before migration
- Test migration on staging environment
- Rollback plan documented

### Risk 2: User Confusion After UI Changes
**Mitigation**:
- User training sessions
- Video tutorials
- In-app help tooltips
- Phased rollout

### Risk 3: Performance Degradation
**Mitigation**:
- Index all foreign keys
- Optimize queries
- Load testing before production
- Caching strategy

---

**End of Refactoring Plan**

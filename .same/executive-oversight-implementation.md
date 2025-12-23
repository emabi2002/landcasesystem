# Executive Legal Oversight & Assignment Workflow - Implementation Plan

## Analysis of Current System

### ✅ Existing Components
1. **Notification System** - `notifications` table exists
2. **Case Comments** - `case_comments` table exists
3. **Case Registration** - `/api/cases/register` endpoint
4. **User Roles** - Profiles table with role field
5. **Audit Trail** - `case_history` table exists

### ⚠️ Gaps to Address
1. No automatic notification on case registration to executive officers
2. No structured workflow tracking (Secretary → Director → Manager → Litigation Officer)
3. No attachment support in comments
4. No differentiation between new and existing cases in notifications
5. No formal assignment mechanism to litigation officers
6. Comments system needs enhancement for executive advice tracking

---

## Implementation Requirements

### 1. Database Schema Enhancements

#### A. Update Profiles Table - Add New Roles
```sql
-- Add new executive roles
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN (
  'admin',
  'secretary_lands',          -- NEW
  'director_legal',           -- NEW
  'manager_legal',            -- NEW
  'litigation_officer',       -- NEW
  'legal_officer',
  'registrar',
  'survey_officer',
  'auditor'
));
```

#### B. Create Executive Workflow Tracking Table
```sql
CREATE TABLE IF NOT EXISTS public.executive_workflow (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  stage TEXT CHECK (stage IN (
    'case_registered',
    'secretary_review',
    'director_guidance',
    'manager_instruction',
    'officer_assigned',
    'completed'
  )) NOT NULL,
  officer_role TEXT NOT NULL,
  officer_id UUID REFERENCES public.profiles(id),
  action_taken TEXT,
  commentary TEXT,
  advice TEXT,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

#### C. Enhance Case Comments for Attachments
```sql
ALTER TABLE public.case_comments
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS workflow_stage TEXT,
ADD COLUMN IF NOT EXISTS requires_response BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS responded_to BOOLEAN DEFAULT FALSE;
```

#### D. Create Case Assignments Table
```sql
CREATE TABLE IF NOT EXISTS public.case_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assignment_type TEXT CHECK (assignment_type IN (
    'primary_officer',
    'supporting_officer',
    'review'
  )) DEFAULT 'primary_officer',
  instructions TEXT,
  executive_commentary TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN (
    'pending',
    'acknowledged',
    'in_progress',
    'completed'
  )) DEFAULT 'pending'
);
```

### 2. API Enhancement - Case Registration Hook

Update `/api/cases/register/route.ts` to trigger executive workflow:

```typescript
// After successful case creation, trigger executive notifications
await triggerExecutiveWorkflow(caseId, caseData, userId);
```

### 3. New API Endpoints

#### A. POST `/api/executive/notify`
- Sends notifications to Secretary, Director, Manager
- Differentiates new vs existing cases
- Creates workflow tracking entry

#### B. POST `/api/executive/advice`
- Allows executive officers to submit advice/commentary
- Supports attachments
- Updates workflow stage
- Notifies next officer in chain

#### C. POST `/api/cases/assign`
- Manager assigns case to litigation officer
- Includes all executive commentary
- Sends comprehensive notification to officer

### 4. UI Components

#### A. Executive Review Dashboard
- View all pending case reviews
- Submit advice/commentary
- Attach documents
- Track workflow progress

#### B. Enhanced Case Detail Page
- Executive Advice tab
- Workflow timeline visualization
- Assignment section

#### C. Notification Enhancement
- Rich notifications with case context
- Direct action buttons
- Attachment previews

---

## Implementation Steps

### Phase 1: Database Updates (15 min)
1. ✅ Run schema migration SQL
2. ✅ Create new tables
3. ✅ Update existing tables
4. ✅ Test database changes

### Phase 2: API Development (30 min)
1. ✅ Create executive notification utility
2. ✅ Update case registration endpoint
3. ✅ Create advice submission endpoint
4. ✅ Create assignment endpoint
5. ✅ Add workflow tracking

### Phase 3: UI Updates (45 min)
1. ✅ Create Executive Review page
2. ✅ Update Case Detail page
3. ✅ Enhance notification display
4. ✅ Add workflow timeline component
5. ✅ Create assignment interface

### Phase 4: Testing & Documentation (20 min)
1. ✅ Test complete workflow
2. ✅ Create user guide
3. ✅ Update documentation
4. ✅ Create version

---

## Workflow Sequence

### Trigger: Case Registration
```
1. User registers new case
   ↓
2. System creates case record
   ↓
3. AUTOMATIC: Notify 3 officers simultaneously
   - Secretary for Lands
   - Director, Legal Services
   - Manager, Legal Services
   ↓
4. Each officer receives notification with:
   - Case ID
   - Court Reference Number
   - Case Type (New/Existing)
   - Date of Registration
   - Case Summary
   - Current Status
   - Direct link to case
```

### Review Flow
```
Secretary for Lands
   ↓ (discusses with)
Director, Legal Services
   ↓ (provides guidance to)
Manager, Legal Services
   ↓ (assigns to)
Litigation Officer
```

### Each Step Includes:
- Commentary entry
- Advice provision
- Document attachment
- Workflow stage update
- Next officer notification
- Audit trail entry

---

## Audit Trail Requirements

Every action must be logged in:
1. `executive_workflow` - Workflow stage progression
2. `case_comments` - Commentary and advice
3. `case_history` - Major events
4. `notifications` - All communications
5. `case_assignments` - Assignment records

---

## Security & Access Control

### Role Permissions
- **Secretary for Lands**: View all cases, provide commentary
- **Director Legal**: View all cases, provide advice, discuss with Secretary
- **Manager Legal**: View all cases, provide instructions, assign officers
- **Litigation Officer**: View assigned cases, submit updates
- **Admin**: Full system access

### RLS Policies
All new tables must have Row Level Security enabled with appropriate policies.

---

## Success Criteria

✅ Case registration automatically notifies 3 executive officers
✅ New vs Existing case clearly identified
✅ Complete workflow chain tracked
✅ All commentary and advice captured
✅ Document attachments supported
✅ Assignment to litigation officer formalized
✅ Full audit trail maintained
✅ No informal decision-making possible
✅ Single source of legal truth established

---

## Next Steps

1. Review and approve this implementation plan
2. Execute Phase 1 (Database)
3. Execute Phase 2 (API)
4. Execute Phase 3 (UI)
5. Execute Phase 4 (Testing)
6. Deploy to production

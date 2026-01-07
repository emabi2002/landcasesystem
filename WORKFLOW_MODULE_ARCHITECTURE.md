# 🏗️ Modular Workflow Architecture - Land Case Management System

## 📋 Overview

Based on the workflow flowchart, the system is restructured into **8 independent workflow modules**, each handled by different officers at different stages of the case lifecycle.

---

## 🎯 Core Principle

**Case ID First** → Everything else follows

1. **Create minimal case record** → Generate Case ID
2. **Case ID becomes the reference** for all subsequent workflow steps
3. **Each workflow module** is a separate screen accessible only with existing Case ID
4. **Different officers** handle different modules
5. **No re-entry to creation screen** once case is created

---

## 📊 Workflow Modules

### **STEP 0: Minimal Case Creation**
**Screen**: `/cases/create-minimal`
**Officer**: Reception / Registry Clerk
**Purpose**: Create Case ID only

**Fields** (All Optional):
- DLPP Role (Defendant/Plaintiff) - default: Defendant
- Brief Description (optional)

**Output**:
- ✅ Case ID created (e.g., DLPP-2025-123456)
- ✅ Auto-generated title
- ✅ Case registered in system
- ✅ Redirect to case dashboard

**After Creation**:
- ❌ Cannot access creation screen again
- ✅ Access workflow modules via Case ID

---

### **STEP 1: Document Reception @ Legal Section**
**Screen**: `/cases/[id]/reception`
**Officer**: Legal Section Staff
**Access**: Existing Case ID required

**Purpose**: Register incoming court documents

**Fields**:
- Document Type:
  - Section 5 Notice
  - Search Warrant
  - Court Orders
  - Summons from Ombudsman Commission
  - Other court documents
- Date Received
- Document Source
- Physical File Location
- Scanned Document Upload
- Notes

**Actions**:
- Upload scanned documents
- Assign physical file number
- Flag for directions (Step 2)

---

### **STEP 2: Directions Module**
**Screen**: `/cases/[id]/directions`
**Officer**: Secretary Lands / Director Legal Services / Manager Legal Services
**Access**: Existing Case ID required

**Purpose**: Issue directions from management

**Fields**:
- Issued By:
  - Secretary Lands
  - Director Legal Services
  - Manager Legal Services
- Direction Type
- Direction Content
- Action Required
- Deadline
- Assign To (for Step 3)

**Actions**:
- Issue directions
- Assign to litigation officer
- Set deadlines
- Track compliance

---

### **STEP 3: Case Registration & Assignment**
**Screen**: `/cases/[id]/register-correspondence`
**Officer**: Litigation Officer
**Access**: Existing Case ID required

**Purpose**: Register incoming correspondence and create case files

#### **Step 3a: Create Court & Land Files**
**Sub-screen**: `/cases/[id]/create-files`

**Fields**:
- Court File Number
- Land File Request
- Land Title Request
- Registration Details

**Actions**:
- Create physical court file
- Request land file from divisions
- Request land title
- Complete case registration

#### **Step 3b: Delegation to Legal Officer**
**Sub-screen**: `/cases/[id]/delegate`
**Officer**: Manager Legal Services
**For**: Existing cases

**Fields**:
- Assign To Legal Officer
- Assignment Date
- Assignment Reason
- Instructions
- Priority

---

### **STEP 4: Case Handling by Legal Officers**
**Screen**: `/cases/[id]/officer-actions`
**Officer**: Legal Officers / Litigation Officers
**Access**: Assigned cases only

**Purpose**: Handle case progression and communications

**Sub-modules**:

#### 4a. Office Actions
- Create letters
- Draft memos
- Prepare instructions for filing
- Update case status

#### 4b. Status Updates
- Update case status
- Record case progress
- Log court appearances
- Track deadlines

#### 4c. Filing Instructions
- Prepare filing instructions
- Draft court documents
- Coordinate with Solicitor General
- Coordinate with Private Lawyers

**Fields**:
- Action Type
- Action Date
- Action Details
- Status Update
- Next Steps
- Attachments

---

### **STEP 5: Filings from Solicitor General / Private Lawyers**
**Screen**: `/cases/[id]/external-filings`
**Officer**: Legal Officers (receiving filings)
**Access**: Existing Case ID required

**Purpose**: Record filings received from external lawyers

**Fields**:
- Filing Source:
  - Solicitor General
  - Private Lawyer (name)
- Filing Type
- Filing Date
- Court Response Date
- Filing Content/Summary
- Status Update
- Document Upload
- Prepare Instructions (response required?)

**Actions**:
- Log external filings
- Update case status
- Prepare response instructions
- Track lawyer communications

---

### **STEP 6: Manager Compliance Module**
**Screen**: `/cases/[id]/compliance`
**Officer**: Manager Legal Services
**Access**: Existing Case ID required

**Purpose**: Ensure compliance with court orders via division memos

**Sub-modules**:

#### 6a. Court Order Compliance
**Fields**:
- Court Order Details
- Order Date
- Compliance Required
- Division Responsible:
  - Survey Division
  - Registrar for Titles
  - Alienated Land Division
  - Valuation Division
  - Physical Planning Division
  - ILG Division
  - Customary Leases Division

#### 6b. Memo to Divisions
**Fields**:
- Memo To (Division)
- Memo Subject
- Compliance Instructions
- Deadline
- Attached Court Order
- Tracking Number

#### 6c. Division Response Tracking
- Response Received
- Response Date
- Compliance Status
- Follow-up Required

**Actions**:
- Issue compliance memos
- Track division responses
- Monitor deadlines
- Escalate if needed

---

### **STEP 7: Case Closure Module**
**Screen**: `/cases/[id]/closure`
**Officer**: Manager Legal Services / Legal Officer
**Access**: Existing Case ID required

**Purpose**: Close case based on court orders

**Court Order Types**:
- Default Judgement
- Summary Determined
- Dismissed want of Prosecution
- Dismissed for want of process
- Incompetent
- Appeal Granted
- Judicial Review
- Court Order granted in favour of the Plaintiff

**Fields**:
- Closure Type
- Court Order Date
- Court Order Details
- Final Status
- Outcome Summary
- Lessons Learned
- Archive Instructions

**Actions**:
- Close case
- Archive files
- Update parties
- Generate closure report

---

### **STEP 8: Parties & Lawyers Module**
**Screen**: `/cases/[id]/parties-lawyers`
**Officer**: Legal Officers
**Access**: Existing Case ID required

**Purpose**: Manage parties and lawyers (ongoing throughout case)

**Sub-modules**:

#### 8a. Parties to Proceedings
**Fields**:
- Party Name
- Party Role (Plaintiff/Defendant)
- Contact Details
- Representative
- Last Updated

**Actions**:
- Add/update parties
- Update contact information
- Track party communications

#### 8b. Solicitor General / Court Room Lawyers
**Fields**:
- Lawyer Name
- Lawyer Type (Solicitor General / Private)
- Firm Name
- Contact Details
- Cases Assigned
- Last Communication

**Actions**:
- Add/update lawyers
- Track lawyer communications
- Monitor multiple case relationships

**Note**: Unlimited communication allowed between lands lawyers and Solicitor General/Private Lawyers regarding a case or multiple different cases.

---

## 🔄 Workflow Navigation

### From Case Dashboard (`/cases/[id]`)

```
Case Dashboard
├─ 📥 Step 1: Document Reception
├─ 📋 Step 2: Directions
├─ 📝 Step 3: Registration & Assignment
│   ├─ 3a: Create Files
│   └─ 3b: Delegate Officer
├─ ⚖️ Step 4: Officer Actions
├─ 📨 Step 5: External Filings
├─ ✅ Step 6: Compliance
├─ 🔒 Step 7: Closure
└─ 👥 Step 8: Parties & Lawyers
```

### Access Control

Each module checks:
- ✅ Case ID exists
- ✅ User has permission for this workflow step
- ✅ Previous required steps completed (optional enforcement)
- ✅ Case not closed (except closure module)

---

## 📁 File Structure

```
landcasesystem/
└─ src/
   └─ app/
      ├─ cases/
      │  ├─ create-minimal/
      │  │  └─ page.tsx          ← Minimal case creation
      │  │
      │  ├─ [id]/
      │  │  ├─ page.tsx          ← Case dashboard (main hub)
      │  │  ├─ reception/
      │  │  │  └─ page.tsx       ← Step 1: Document reception
      │  │  ├─ directions/
      │  │  │  └─ page.tsx       ← Step 2: Directions
      │  │  ├─ register-correspondence/
      │  │  │  └─ page.tsx       ← Step 3: Registration
      │  │  ├─ create-files/
      │  │  │  └─ page.tsx       ← Step 3a: Create files
      │  │  ├─ delegate/
      │  │  │  └─ page.tsx       ← Step 3b: Delegation
      │  │  ├─ officer-actions/
      │  │  │  └─ page.tsx       ← Step 4: Officer actions
      │  │  ├─ external-filings/
      │  │  │  └─ page.tsx       ← Step 5: External filings
      │  │  ├─ compliance/
      │  │  │  └─ page.tsx       ← Step 6: Compliance
      │  │  ├─ closure/
      │  │  │  └─ page.tsx       ← Step 7: Closure
      │  │  └─ parties-lawyers/
      │  │     └─ page.tsx       ← Step 8: Parties & lawyers
      │  │
      │  └─ page.tsx             ← Case list (redirect to create-minimal)
```

---

## 🎨 UI/UX Design

### Case Dashboard (Hub)

```
┌─────────────────────────────────────────────┐
│  Case: DLPP-2025-123456                     │
│  Status: In Progress                        │
│  Officer: John Smith                        │
│  Created: 2025-12-09                        │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Workflow Progress                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│  ✅ Step 1: Document Reception    Complete  │
│  ✅ Step 2: Directions            Complete  │
│  🔄 Step 3: Registration          In Progress│
│  ⏸️ Step 4: Officer Actions       Pending   │
│  ⏸️ Step 5: External Filings      Pending   │
│  ⏸️ Step 6: Compliance            Pending   │
│  ⏸️ Step 7: Closure               Pending   │
│  📝 Step 8: Parties & Lawyers     Ongoing   │
│                                             │
├─────────────────────────────────────────────┤
│  🔗 Quick Actions                           │
│  [ View All Documents ]                     │
│  [ Update Status ]                          │
│  [ Add Note ]                               │
│  [ Generate Report ]                        │
└─────────────────────────────────────────────┘
```

### Module Access Pattern

```
User tries to access: /cases/DLPP-2025-123456/reception

System checks:
1. ✅ Does case exist?
2. ✅ Is user authorized for reception module?
3. ✅ Is case not closed?

If all checks pass → Show module
If any check fails → Redirect to dashboard with error
```

---

## 🔐 Permission Matrix

| Module | Reception Staff | Legal Officer | Manager | Secretary |
|--------|----------------|---------------|---------|-----------|
| Create Case | ✅ | ✅ | ✅ | ✅ |
| Step 1: Reception | ✅ | ✅ | ✅ | ✅ |
| Step 2: Directions | ❌ | ❌ | ✅ | ✅ |
| Step 3: Registration | ❌ | ✅ | ✅ | ✅ |
| Step 3b: Delegation | ❌ | ❌ | ✅ | ✅ |
| Step 4: Officer Actions | ❌ | ✅ | ✅ | ❌ |
| Step 5: Ext. Filings | ❌ | ✅ | ✅ | ❌ |
| Step 6: Compliance | ❌ | ❌ | ✅ | ✅ |
| Step 7: Closure | ❌ | ✅ | ✅ | ✅ |
| Step 8: Parties | ❌ | ✅ | ✅ | ✅ |

---

## 📝 Implementation Steps

### Phase 1: Core Structure (Week 1)
1. ✅ Create minimal case creation screen
2. ✅ Create case dashboard (hub)
3. ✅ Set up routing structure
4. ✅ Implement access control

### Phase 2: Workflow Modules (Week 2-3)
1. ✅ Step 1: Document Reception
2. ✅ Step 2: Directions
3. ✅ Step 3: Registration & Assignment
4. ✅ Step 4: Officer Actions

### Phase 3: External & Closure (Week 4)
1. ✅ Step 5: External Filings
2. ✅ Step 6: Compliance
3. ✅ Step 7: Closure
4. ✅ Step 8: Parties & Lawyers

### Phase 4: Integration (Week 5)
1. ✅ Link all modules
2. ✅ Test workflow progression
3. ✅ Add notifications
4. ✅ Generate reports

---

## 🎯 Key Features

### 1. Case ID as Central Reference
- Every module requires Case ID
- No module works without existing case
- Case ID immutable once created

### 2. Module Independence
- Each module is self-contained
- Modules can be accessed in any order (with permissions)
- No forced linear progression (flexible workflow)

### 3. Multi-Officer Support
- Different officers handle different modules
- Permission-based access control
- Audit trail of who did what

### 4. Progressive Data Entry
- Start with minimal case
- Add data as it becomes available
- Update continuously until closure

### 5. Unlimited Communication Tracking
- Between Lands Lawyers and Solicitor General
- Between Lands Lawyers and Private Lawyers
- Regarding single or multiple cases
- Full history maintained

---

## 📊 Database Schema Updates

### New Tables Required

```sql
-- Workflow tracking
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  step_number INT,
  step_name TEXT,
  status TEXT, -- pending, in_progress, complete
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id)
);

-- Document reception (Step 1)
CREATE TABLE document_receptions (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  document_type TEXT,
  received_date DATE,
  received_by UUID REFERENCES users(id),
  file_location TEXT,
  document_url TEXT
);

-- Directions (Step 2)
-- Already exists: directions table

-- File creation (Step 3a)
-- Already exists: case_files table

-- Delegation (Step 3b)
-- Already exists: case_assignments table

-- Officer actions (Step 4)
CREATE TABLE officer_actions (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  action_type TEXT,
  action_date DATE,
  action_details TEXT,
  performed_by UUID REFERENCES users(id),
  attachments JSONB
);

-- External filings (Step 5)
-- Already exists: case_filings table
-- Extend with lawyer_source field

-- Compliance (Step 6)
-- Already exists: manager_memos, division_compliance_updates

-- Closure (Step 7)
-- Already exists: case_closure, court_orders

-- Parties & Lawyers (Step 8)
-- Already exists: parties, case_parties
-- Extend with lawyers table
```

---

## 🚀 Summary

This modular architecture:
- ✅ Creates minimal case (Case ID) first
- ✅ Prevents re-opening creation screen
- ✅ Separates workflow into independent modules
- ✅ Assigns different modules to different officers
- ✅ Uses Case ID as universal reference
- ✅ Supports flexible, non-linear workflow
- ✅ Maintains complete audit trail
- ✅ Enables progressive data entry
- ✅ Tracks unlimited communications

**Next**: Implement each module one by one, starting with minimal case creation.

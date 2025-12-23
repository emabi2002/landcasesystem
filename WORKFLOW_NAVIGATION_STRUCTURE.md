# 📋 Legal Case Management - Workflow Navigation Structure

## ✅ Navigation Based on Legal Workflow Process

### **Navigation Structure** (Reflects Case Progression Order)

```
1. Case Registration (Entry Screen)
2. Directions
3. Case Allocation
4. Litigation Officer Work
5. Compliance
6. Case Closure
7. Notifications
8. Admin (User Management)
```

---

## 🔄 Detailed Workflow Modules

### **1. Case Registration (Entry Screen)**
**URL**: `/cases/new` (full registration) or `/cases/create-minimal` (minimal)

**Purpose**: First step - Create case and generate Case ID

**Functions**:
- Create new case
- Generate unique Case ID (e.g., DLPP-2025-123456)
- Record originating documents:
  - Section 5 Notice
  - Search Warrant
  - Court Orders
  - Summons from Ombudsman Commission
- Capture parties involved (Plaintiff/Defendant)
- Upload supporting attachments
- Set DLPP role (Defendant/Plaintiff)

**Key Output**: Case ID (used throughout entire workflow)

**Access**: All authenticated users can register cases

---

### **2. Directions**
**URL**: `/directions` (list) and `/cases/[id]/directions` (case-specific)

**Purpose**: Capture formal instructions and commentaries

**Sections** (3 Dedicated Areas):
- **Secretary Lands** - Issue high-level directives
- **Director Legal Services** - Provide legal direction
- **Manager Legal Services** - Operational instructions

**Functions**:
- Issue new direction
- Comment on existing directions
- Reference Case ID
- Attach supporting documents
- Track direction history
- **Repeatable**: Can issue multiple directions throughout case lifecycle

**Access**:
- **View**: All users (read-only for most)
- **Create/Edit**: Executive Management, Managers

---

### **3. Case Allocation**
**URL**: `/allocation` (list) or `/cases/[id]/allocation` (case-specific)

**Purpose**: Manager Legal Services assigns case to Litigation Officer

**Functions**:
- Assign case to specific Litigation Officer
- Reference Case ID
- Link to directive that triggered allocation
- Track assignment date
- Record assignment reason
- **Reassignment**: Support multiple reassignments
- Track reassignment chain

**Key Transition**: From high-level direction → operational case management

**Access**: Manager Legal Services only

---

### **4. Litigation Officer Work**
**URL**: `/litigation` (dashboard) and `/cases/[id]/litigation` (case-specific)

**Purpose**: Litigation Officer workspace for ALL case work

**This module combines**:
- ✅ Registration of new cases
- ✅ Work on existing/ongoing cases
- ✅ **ALL FILING** (NO separate external filing module)
- ✅ Document uploads
- ✅ Status updates

**Functions**:
- View assigned cases (new and existing)
- Update case status
- Upload documents:
  - Court filings
  - Letters
  - Memos
  - Evidence
  - Correspondence
  - Solicitor General filings
  - Private Lawyer filings
  - Internal documents
- Date-stamp all documents
- Categorize documents by type
- Link all documents to Case ID
- Draft instructions for filing
- Prepare letters/memos
- Track actions taken
- Record communications with:
  - Solicitor General
  - Private Lawyers
  - Opposing counsel
  - Internal departments

**Key Point**: **NO external filing module** - all filing happens here!

**Access**: Legal Officers, Lawyers, Managers

---

### **5. Compliance**
**URL**: `/compliance` (dashboard) and `/cases/[id]/compliance` (case-specific)

**Purpose**: Solicitor General and legal officers continue work on case

**Functions**:
- Track compliance requirements
- Monitor court order compliance
- Request internal documents from departments:
  - Survey Division
  - Registrar for Titles
  - Alienated Land Division
  - Valuation Division
  - Physical Planning Division
  - ILG Division
  - Customary Leases Division
- Issue compliance memos
- Track responses from divisions
- Document substantiation

**Iterative Process**:
```
Compliance → Back to Step 2 (Directions) for updated instructions
          → Back to Step 4 (Litigation Work) for officer updates/filings
          → Request internal documents
          → Repeat cycle until complete
```

**Access**: Solicitor General, Legal Officers, Manager Legal Services

---

### **6. Case Closure**
**URL**: `/closure` (list) and `/cases/[id]/closure` (case-specific)

**Purpose**: Formally close case after court judgment

**Functions**:
- Record court judgment
- Upload judgment documents
- Select closure type:
  - Default Judgement
  - Summary Determined
  - Dismissed want of Prosecution
  - Dismissed for want of process
  - Incompetent
  - Appeal Granted
  - Judicial Review
  - Court Order granted in favour of Plaintiff
- File all related documents
- Mark case as closed
- Store all documents under Case ID
- Preserve complete case history

**Access**: Manager Legal Services, Legal Officers (assigned)

---

### **7. Notifications to Parties**
**URL**: `/notifications` (dashboard) and `/cases/[id]/notifications` (case-specific)

**Purpose**: Advise parties of court decision after closure

**Parties to Notify**:
- Plaintiff (via their lawyers)
- Defendant(s)
- Solicitor General / State Legal Office
- Other involved parties

**Functions**:
- Create notification
- Select recipient
- Draft message/letter
- Attach judgment documents
- Send notification
- Record proof of communication:
  - Date sent
  - Method (email, mail, hand delivery)
  - Acknowledgment received
  - Follow-up tracking

**Access**: Legal Officers, Managers

---

### **8. Admin**
**URL**: `/admin`

**Purpose**: User management and system configuration

**Functions**:
- Create users
- Assign roles:
  - Executive Management
  - Manager
  - Lawyer / Legal Officer
  - Officer / Registry Clerk
  - System Administrator
- Manage permissions
- View audit trail

**Access**: System Administrator only

---

## 🔄 Iterative Workflow Visualization

```
Step 1: Case Registration
   ↓
Step 2: Directions (Secretary/Director/Manager)
   ↓
Step 3: Case Allocation (Manager → Officer)
   ↓
Step 4: Litigation Officer Work ←──────┐
   ↓                                   │
Step 5: Compliance ───→ Back to Step 2 │
   ↓                 └→ Back to Step 4 ┘
   │                    (Repeat as needed)
   ↓
Step 6: Case Closure (Judgment filed)
   ↓
Step 7: Notifications (Parties advised)
   ↓
   CASE CLOSED
```

---

## 📊 Navigation Menu (Top)

```

 DLPP Legal CMS                                  │

 [Case Registration] [Directions] [Allocation]   │
 [Litigation Work] [Compliance] [Closure]        │
 [Notifications] [Admin]                         │

```

**OR Dropdown Style**:
```
[Workflow ▼] [Admin]
   ├─ 1. Case Registration
   ├─ 2. Directions
   ├─ 3. Case Allocation
   ├─ 4. Litigation Officer Work
   ├─ 5. Compliance
   ├─ 6. Case Closure
   └─ 7. Notifications
```

---

## 🔑 Key Design Principles

### 1. **Single Case ID Throughout**
- Generated in Step 1
- Referenced in all subsequent steps
- All documents linked to same Case ID
- Maintains normalized, unified case record

### 2. **NO External Filing Module**
- All filing happens in Step 4 (Litigation Officer Work)
- Section 5 documents: Attached in Step 1
- Working documents: Filed in Step 4
- NO separate filing menu item

### 3. **Iterative Workflow**
- Can move back and forth between steps
- Directions → Litigation → Compliance → Directions (repeat)
- Support for continuous updates
- Workflow reflects real legal process

### 4. **Continuous Document Filing**
- Upload at any relevant stage
- Date-stamped automatically
- Categorized by type
- All linked to Case ID
- Track document history

### 5. **Proof of Communication**
- Record all notifications
- Track acknowledgments
- Maintain communication log
- Linked to Case ID

---

## 📝 Document Types by Stage

### Step 1 (Case Registration):
- Section 5 Notice ✅
- Court summons
- Originating documents
- Party information

### Step 4 (Litigation Officer Work):
- ALL working documents ✅
- Court filings
- Letters/memos
- Evidence
- Solicitor General filings
- Private Lawyer filings
- Correspondence
- Internal documents

### Step 5 (Compliance):
- Compliance memos
- Department responses
- Supporting documents
- Court orders

### Step 6 (Closure):
- Judgment documents
- Final court orders
- Closure summary

### Step 7 (Notifications):
- Notification letters
- Proof of delivery
- Acknowledgments

---

## 🎯 Implementation Priority

1. ✅ Update navigation to reflect workflow order
2. ⏸️ Ensure Step 1 generates Case ID
3. ⏸️ Build Directions module (3 sections)
4. ⏸️ Build Case Allocation module
5. ⏸️ Build Litigation Officer Work module (NO external filing)
6. ⏸️ Build Compliance module (with back-navigation)
7. ⏸️ Build Case Closure module
8. ⏸️ Build Notifications module
9. ⏸️ Test iterative workflow
10. ⏸️ Deploy

---

**Status**: Architecture Defined  
**Next**: Implement workflow navigation  
**Repository**: https://github.com/emabi2002/landcasesystem

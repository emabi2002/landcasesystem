# DLPP Litigation Workflow - System Analysis & Implementation Plan

## Current System Capabilities ✅

### Already Implemented:
1. **Case Management**
   - Case registration with case numbers
   - Status tracking (under_review, in_court, mediation, tribunal, judgment, closed, settled)
   - Case types (dispute, court_matter, title_claim, administrative_review, other)
   - Priority levels (low, medium, high, urgent)

2. **Party Management**
   - Parties table (plaintiff, defendant, witness, other)
   - Contact information storage (JSONB)
   - Multiple parties per case

3. **Document Management**
   - Document uploads with file URLs
   - Document types (filing, affidavit, correspondence, survey_report, contract, evidence, other)
   - Version tracking
   - Uploaded by tracking

4. **Task Management**
   - Task assignment to officers
   - Due dates and status tracking
   - Priority levels

5. **Event Management**
   - Events/hearings scheduling
   - Event types (hearing, filing_deadline, response_deadline, meeting, other)
   - Location tracking

6. **User Roles**
   - admin, legal_officer, registrar, survey_officer, director, auditor

---

## Gap Analysis - What's Missing ❌

### 1. **Incoming Correspondence Registration** (Step 1 & 3)
**Missing:**
- Correspondence/Incoming Documents table
- Document source tracking (Plaintiff, Defendant, Solicitor General, Ombudsman)
- Acknowledgement tracking and generation
- Document receipt date
- Specific document types:
  - Section 5 Notice
  - Search Warrant
  - Court Orders (received)
  - Summons from Ombudsman Commission

**Solution:** Create `incoming_correspondence` table

### 2. **Directions/Instructions Tracking** (Step 2)
**Missing:**
- Directions table
- Source of direction (Secretary Lands, Director Legal, Manager Legal)
- Direction status and compliance tracking
- Link to resulting actions/cases

**Solution:** Create `directions` table

### 3. **File Management System** (Step 3a)
**Missing:**
- Court File creation tracking
- Land File request/linking
- Title File request/linking
- File status (requested, received, in-use, returned)
- File location tracking

**Solution:** Create `file_requests` and `court_files` tables

### 4. **Case Types - More Specific** (Step 3a)
**Missing:**
- Section 160 by Registrar for Titles
- Summons
- Cases instituted by DLPP & Litigation lawyers

**Solution:** Expand case_type enum

### 5. **Case Delegation** (Step 3b)
**Missing:**
- Delegation tracking (who delegated to whom)
- Delegation date and status
- Manager approval workflow

**Solution:** Create `case_delegations` table

### 6. **Instructions/Affidavit Preparation** (Step 4)
**Missing:**
- Instruction letter tracking
- Affidavit preparation status
- Template management
- Officer preparation tracking

**Solution:** Extend documents table or create `instructions` table

### 7. **External Legal Representatives** (Step 5)
**Missing:**
- Solicitor General tracking
- Private Lawyers tracking
- Filing submission tracking
- Status updates from external lawyers
- Communication log

**Solution:** Create `external_lawyers` and `filings` tables

### 8. **Compliance Tracking** (Step 6)
**Missing:**
- Court Order compliance tracking
- Memo to divisions tracking
- Division-specific compliance status
- Compliance deadlines
- Divisions: Survey, Registrar for Titles, Alienated Lands, Valuation, Physical Planning, ILG, Customary Leases

**Solution:** Create `compliance_tracking` and `division_memos` tables

### 9. **Case Closure Types** (Step 7)
**Missing:**
- Specific closure reasons:
  - Default Judgement
  - Summarily Determined
  - Dismissed want of Prosecution
  - Dismissed for abuse of process
  - Incompetent
  - Appeal Granted
  - Judicial Review
  - Court Order Granted in favor of plaintiff

**Solution:** Add `closure_type` field to cases table

### 10. **Party Communication Tracking** (Step 8)
**Missing:**
- Communication/correspondence log with parties
- Update notification system
- Communication type (email, letter, phone, in-person)
- Communication history per case

**Solution:** Create `communications` table

---

## Implementation Plan 🚀

### Phase 1: Database Schema Extensions (High Priority)

#### 1.1 Incoming Correspondence Table
```sql
CREATE TABLE incoming_correspondence (
  id UUID PRIMARY KEY,
  reference_number TEXT UNIQUE,
  document_type TEXT, -- Section 5 notice, Search warrant, etc.
  source TEXT, -- Plaintiff, Defendant, Solicitor General, Ombudsman
  received_date TIMESTAMP,
  received_by UUID REFERENCES profiles(id),
  subject TEXT,
  description TEXT,
  file_url TEXT,
  acknowledgement_sent BOOLEAN DEFAULT false,
  acknowledgement_date TIMESTAMP,
  case_id UUID REFERENCES cases(id), -- Link to case if applicable
  status TEXT, -- received, acknowledged, processed, filed
  created_at TIMESTAMP
);
```

#### 1.2 Directions Table
```sql
CREATE TABLE directions (
  id UUID PRIMARY KEY,
  direction_number TEXT UNIQUE,
  source TEXT, -- Secretary Lands, Director Legal, Manager Legal
  issued_by UUID REFERENCES profiles(id),
  issued_date TIMESTAMP,
  subject TEXT,
  content TEXT,
  priority TEXT,
  due_date TIMESTAMP,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT, -- pending, in_progress, completed
  case_id UUID REFERENCES cases(id),
  created_at TIMESTAMP
);
```

#### 1.3 File Requests Table
```sql
CREATE TABLE file_requests (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  file_type TEXT, -- court_file, land_file, title_file
  file_number TEXT,
  requested_by UUID REFERENCES profiles(id),
  requested_date TIMESTAMP,
  status TEXT, -- requested, received, in_use, returned
  received_date TIMESTAMP,
  current_location TEXT,
  notes TEXT,
  created_at TIMESTAMP
);
```

#### 1.4 Case Delegations Table
```sql
CREATE TABLE case_delegations (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  delegated_by UUID REFERENCES profiles(id), -- Manager
  delegated_to UUID REFERENCES profiles(id), -- Legal Officer
  delegation_date TIMESTAMP,
  instructions TEXT,
  status TEXT, -- active, completed, reassigned
  completed_date TIMESTAMP,
  created_at TIMESTAMP
);
```

#### 1.5 External Lawyers Table
```sql
CREATE TABLE external_lawyers (
  id UUID PRIMARY KEY,
  name TEXT,
  organization TEXT, -- Solicitor General, Private Law Firm
  lawyer_type TEXT, -- solicitor_general, private_lawyer
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

#### 1.6 Filings Table
```sql
CREATE TABLE filings (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  filing_type TEXT, -- instruction_letter, affidavit, motion, response
  prepared_by UUID REFERENCES profiles(id),
  submitted_to UUID REFERENCES external_lawyers(id),
  submission_date TIMESTAMP,
  filing_number TEXT,
  status TEXT, -- draft, submitted, filed, rejected
  status_update_date TIMESTAMP,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP
);
```

#### 1.7 Compliance Tracking Table
```sql
CREATE TABLE compliance_tracking (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  court_order_date TIMESTAMP,
  court_order_description TEXT,
  compliance_deadline TIMESTAMP,
  responsible_division TEXT, -- Survey, Registrar for Titles, etc.
  memo_sent_date TIMESTAMP,
  compliance_status TEXT, -- pending, in_progress, completed, overdue
  completion_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP
);
```

#### 1.8 Communications Log Table
```sql
CREATE TABLE communications (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  communication_type TEXT, -- email, letter, phone, in_person
  direction TEXT, -- incoming, outgoing
  party_type TEXT, -- plaintiff, defendant, solicitor_general, lawyer
  party_id UUID, -- Could reference parties or external_lawyers
  subject TEXT,
  content TEXT,
  communication_date TIMESTAMP,
  handled_by UUID REFERENCES profiles(id),
  attachments JSONB,
  created_at TIMESTAMP
);
```

#### 1.9 Update Cases Table
```sql
ALTER TABLE cases ADD COLUMN closure_type TEXT;
ALTER TABLE cases ADD COLUMN case_origin TEXT; -- section_160, summons, dlpp_initiated
```

### Phase 2: UI Components (Medium Priority)

#### 2.1 Incoming Correspondence Module
- Correspondence registration form
- Acknowledgement letter generation
- Document type selection
- Source tracking
- Case linking

#### 2.2 Directions Management
- Create direction form
- Assign to officers
- Track compliance
- Status updates

#### 2.3 File Request System
- Request court/land/title files
- Track file status
- Location management
- Return tracking

#### 2.4 Delegation Workflow
- Delegation assignment by managers
- View assigned cases
- Instructions and notes
- Completion tracking

#### 2.5 External Lawyers Portal
- Lawyer directory
- Filing submissions
- Status updates
- Communication log

#### 2.6 Compliance Dashboard
- Court order tracking
- Division assignments
- Deadline monitoring
- Compliance reporting

#### 2.7 Enhanced Case Closure
- Closure type selection
- Closure documentation
- Final reports

### Phase 3: Reports & Analytics (Low Priority)

1. **Incoming Correspondence Report**
   - By type, source, date range
   - Acknowledgement status

2. **Case Workload Report**
   - By officer, status, type
   - Delegation tracking

3. **Filing Status Report**
   - Pending filings
   - Submitted filings
   - By lawyer/case

4. **Compliance Report**
   - By division
   - Overdue compliance
   - Completion rates

5. **Communication Log Report**
   - By case, party, date
   - Communication frequency

---

## Recommendation 💡

**Phased Implementation Approach:**

1. **Week 1-2:** Implement Phase 1 database schema extensions
2. **Week 3-4:** Build core UI components (correspondence, directions, files)
3. **Week 5-6:** External lawyers and filing system
4. **Week 7-8:** Compliance tracking and enhanced closure
5. **Week 9-10:** Reports and analytics
6. **Week 11:** Testing and refinement
7. **Week 12:** Training and deployment

**Immediate Actions:**
1. Extend database schema with new tables
2. Update case types to match workflow
3. Add closure types
4. Build incoming correspondence module
5. Create directions tracking system

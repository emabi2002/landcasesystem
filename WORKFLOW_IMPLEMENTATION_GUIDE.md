# 📋 WORKFLOW IMPLEMENTATION GUIDE

**Land Case Management System (LCMS)**
**Workflow-Driven Design**
**Version**: 1.0

---

## 🎯 CORE PRINCIPLE

**ONE MASTER CASE → MANY SPECIALIZED MODULES**

Every module stores its data in **separate tables**, all linked by `case_id` (foreign key to `cases.id`).

```
cases (master table)
  │
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
```

---

## 📊 THE 8-STEP WORKFLOW

### STEP 1: Case Reception & Registration

**What Happens:**
- Court documents served to DLPP
- Reception staff acknowledge receipt
- System generates unique `case_number` and `case_id`
- Document type recorded (Section 5 Notice, Search Warrant, Court Order, Summons, etc.)

**Tables:**
- `cases` - Master case record created
- `case_intake_records` - Document receipt logged
- `case_intake_documents` - Uploaded files stored

**Flow:**
```
Documents arrive → Reception logs in system →
System generates case_number (e.g., LCMS-2025-0001) →
case_id becomes the anchor for all future activities
```

---

### STEP 2: Directions Module

**What Happens:**
- One of three authorities issues directions:
  - Secretary Lands
  - Director Legal Services
  - Manager Legal Services
- Directions can be issued **multiple times** during case life
- Each direction references the `case_id`

**Tables:**
- `directions` - Multiple rows per case allowed

**Flow:**
```
Case exists → Authority reviews → Issues direction →
Recorded in directions table (case_id link) →
Can be repeated over time
```

**Example:**
- Direction #1: "Open court file and request land files" (Week 1)
- Direction #2: "Seek advice from Solicitor-General" (Week 3)
- Direction #3: "Prepare defense affidavit" (Week 6)

All linked to same `case_id`.

---

### STEP 3: Case Assignment

**What Happens:**
- Manager Legal assigns litigation officer to case
- For **new cases** (3a): Officer creates court file, requests land/titles files
- For **existing cases** (3b): Officer resumes work

**Tables:**
- `case_assignments` - Officer assignment tracked (can have multiple over time)
- `case_files` - Court file, land file, titles file numbers

**Flow:**
```
Direction received → Manager assigns officer →
Record in case_assignments (case_id link) →

If new case (3a):
  - Create court file
  - Request land file
  - Request titles file
  - Register civil matter type
  - Record in case_files table

If existing case (3b):
  - Resume work on existing case_id
```

---

### STEPS 4-5: Litigation Handling & Filing

**What Happens:**
- Officer prepares instruments
- Communicates with Solicitor-General and private lawyers
- Files documents
- Receives updates and advice
- **Unlimited communication** back and forth until case progresses

**Tables:**
- `case_documents` - All documents (instruments, correspondence, filings)
- `case_filings` - Formal filings (court, SG, service)
- `solicitor_general_updates` - Advice and updates from SG/lawyers

**Flow:**
```
Officer works on case → Prepares documents →
Files with court/SG → Receives feedback →
All recorded in respective tables (case_id link) →
Process repeats as needed
```

**Example Timeline:**
- Week 1: Prepare originating summons (`case_documents`)
- Week 2: File with court (`case_filings`)
- Week 3: Serve on defendant (`case_filings`)
- Week 4: Receive SG advice (`solicitor_general_updates`)
- Week 5: Prepare affidavit based on advice (`case_documents`)
- Week 6: File affidavit (`case_filings`)
- And so on...

All linked to same `case_id`.

---

### STEP 6: Manager Compliance & Internal Divisions

**What Happens:**
- After court order/outcome, Manager Legal issues memos to internal divisions
- Divisions responsible:
  - Survey Division
  - Registrar of Titles
  - Alienated Land Division
  - Valuation Division
  - Physical Planning Division
  - ILG Division
  - Customary Leases Division
- Divisions respond with compliance updates

**Tables:**
- `manager_memos` - Memos to divisions (can be multiple per case)
- `division_compliance_updates` - Division responses

**Flow:**
```
Court order received → Manager Legal reviews →
Issues memo to division(s) (case_id link) →
Attaches court order →
Sets compliance deadline →

Division receives → Works on compliance →
Submits update (memo_id link) →
Manager reviews compliance
```

**Example:**
- Memo #1 to Survey Division: "Conduct survey as per court order"
- Memo #2 to Titles: "Correct title based on court decision"
- Memo #3 to Valuation: "Assess compensation amount"

All linked to same `case_id`, each can have multiple compliance updates.

---

### STEP 7: Case Closure & Court Orders

**What Happens:**
- Case reviewed with all orders, filings, memos, responses
- Court orders compiled and recorded
- Summary findings documented
- Case status set to `closed`

**Tables:**
- `court_orders` - Final court orders and judgments
- `case_closure` - Closure record

**Flow:**
```
Case complete → Compile all information →
Record court orders (case_id link) →
Create closure record (case_id link) →
**TRIGGER**: Case status automatically set to 'closed'
```

**Court Order Types:**
- Default Judgment
- Summary Determination
- Dismissed for want of prosecution
- Dismissed for abuse of process
- Incompetent
- Appeal granted
- Judicial Review
- Order in favour of Plaintiff/Defendant

---

### STEP 8: Notifications to Parties

**What Happens:**
- Final communication sent to:
  - Plaintiff(s)
  - Defendant(s)
  - Office of Solicitor-General
  - Private Lawyers
- All outgoing correspondence logged

**Tables:**
- `parties` - Party database
- `case_parties` - Links parties to cases with roles
- `notifications` - Outgoing notifications logged

**Flow:**
```
Case closed → Prepare notifications →
Send to plaintiffs (notification record created) →
Send to defendants (notification record created) →
Send to SG/lawyers (notification record created) →
All linked to case_id
```

---

## 🔗 WORKFLOW INTEGRATION

### How Modules Work Together

1. **Case-Centric Lookup**
   - Every module starts by looking up a `case_number`
   - System finds `case_id`
   - All data loaded/saved using `case_id`

2. **Timeline View**
   - Query all module records by `case_id`
   - Order by date
   - Display complete case history

3. **Status Progression**
   ```
   registered → awaiting_directions → assigned_to_officer →
   in_progress → awaiting_court_order → awaiting_internal_compliance →
   closed
   ```

4. **Multiple Records Per Module**
   - One case can have:
     - Multiple intake records (new docs received over time)
     - Multiple directions (issued repeatedly)
     - Multiple assignments (officer changes)
     - Multiple documents, filings, SG updates
     - Multiple memos to different divisions
     - Multiple notifications to different parties

---

## 👥 USER ROLES & PERMISSIONS

**System supports these roles:**

1. **Secretary Lands**
   - Issue directions
   - Review high-level status
   - Approve major decisions

2. **Director Legal Services**
   - Issue directions
   - Oversight of all cases
   - Policy decisions

3. **Manager Legal Services**
   - Issue directions
   - Assign officers
   - Issue compliance memos
   - Close cases

4. **Litigation Officer**
   - Work assigned cases
   - Prepare documents
   - File with court/SG
   - Update case progress

5. **Reception Staff**
   - Register incoming documents
   - Acknowledge receipt
   - Create case records

6. **Division Officers**
   - Receive compliance memos
   - Respond with updates
   - Implement court orders

---

## 📈 DATA FLOW EXAMPLE

### Complete Case Journey

**Week 1: Registration**
```sql
-- Reception creates case
INSERT INTO cases (case_number, title, received_date, status)
VALUES ('LCMS-2025-0001', 'X v DLPP', '2025-01-15', 'registered');

-- Log document receipt
INSERT INTO case_intake_records (case_id, document_type, source)
VALUES ([case_id], 'Section 5 Notice', 'National Court');
```

**Week 2: Direction Issued**
```sql
-- Secretary issues direction
INSERT INTO directions (case_id, issued_by, authority_role, content)
VALUES ([case_id], [user_id], 'Secretary Lands', 'Open court file and assign litigation officer');

-- Update case status
UPDATE cases SET status = 'awaiting_directions' WHERE id = [case_id];
```

**Week 3: Officer Assigned**
```sql
-- Manager assigns officer
INSERT INTO case_assignments (case_id, assigned_to, assigned_by)
VALUES ([case_id], [officer_id], [manager_id]);

-- Officer creates court file
INSERT INTO case_files (case_id, court_file_number, civil_matter_type)
VALUES ([case_id], 'NC 123/2025', 'Section 160');

-- Update case status
UPDATE cases SET status = 'assigned_to_officer' WHERE id = [case_id];
```

**Weeks 4-12: Active Litigation**
```sql
-- Multiple documents prepared
INSERT INTO case_documents (case_id, document_type, file_url) VALUES ...;

-- Multiple filings
INSERT INTO case_filings (case_id, filing_type, reference_number) VALUES ...;

-- SG updates received
INSERT INTO solicitor_general_updates (case_id, summary_of_advice) VALUES ...;

-- Status updates
UPDATE cases SET status = 'in_progress' WHERE id = [case_id];
```

**Week 13: Court Order**
```sql
-- Court order recorded
INSERT INTO court_orders (case_id, order_date, order_type, order_text)
VALUES ([case_id], '2025-04-15', 'Order in favour of Plaintiff', 'Court orders survey...');

-- Update case status
UPDATE cases SET status = 'awaiting_internal_compliance' WHERE id = [case_id];
```

**Week 14: Compliance Memo**
```sql
-- Manager issues memo to Survey
INSERT INTO manager_memos (case_id, issued_to_division, subject, content)
VALUES ([case_id], 'Survey Division', 'Conduct survey per court order', '...');

-- Survey responds
INSERT INTO division_compliance_updates (memo_id, status, details)
VALUES ([memo_id], 'completed', 'Survey completed on 2025-04-20');
```

**Week 15: Case Closure**
```sql
-- Record case closure
INSERT INTO case_closure (case_id, closure_date, closure_reason)
VALUES ([case_id], '2025-04-25', 'Court order implemented, case resolved');

-- Trigger automatically sets cases.status = 'closed'

-- Notify parties
INSERT INTO notifications (case_id, recipient_party_id, subject, content)
VALUES ([case_id], [plaintiff_id], 'Case Outcome', 'Please find attached...');
```

**All records linked via the same `case_id`!**

---

## 🎯 IMPLEMENTATION CHECKLIST

### Database Setup
- [ ] Run `DATABASE_WORKFLOW_SCHEMA.sql` in Supabase
- [ ] Verify all tables created
- [ ] Check foreign key constraints
- [ ] Verify RLS policies enabled
- [ ] Create test case to verify linkages

### Module Development
- [ ] Build Case Registration UI (Step 1)
- [ ] Build Directions Module (Step 2)
- [ ] Build Assignment Module (Step 3)
- [ ] Build Litigation Work UI (Steps 4-5)
- [ ] Build Compliance Module (Step 6)
- [ ] Build Closure Module (Step 7)
- [ ] Build Notifications Module (Step 8)
- [ ] Build Case Timeline View (all steps)

### Testing
- [ ] Test complete workflow from registration to closure
- [ ] Verify all foreign keys work
- [ ] Test multiple records per module
- [ ] Verify case status updates
- [ ] Test closure trigger
- [ ] Check timeline view accuracy

---

## 📚 BENEFITS OF THIS DESIGN

### 1. **True Normalization**
- No data duplication
- Each module stores its own data
- Central case record is lightweight

### 2. **Flexible Workflow**
- Modules can be used repeatedly
- No limit on directions, filings, memos, etc.
- Case progresses naturally through steps

### 3. **Complete Audit Trail**
- Every action recorded with timestamps
- User tracking on all tables
- Full case history visible in timeline

### 4. **Scalability**
- Easy to add new modules
- Just create new table with `case_id` foreign key
- Existing modules unaffected

### 5. **Reporting**
- Query any module by `case_id`
- Cross-module reports easy (JOIN via `case_id`)
- Timeline aggregation straightforward

---

## 🚀 NEXT STEPS

1. **Review the schema**: `DATABASE_WORKFLOW_SCHEMA.sql`
2. **Run migration**: Apply to Supabase
3. **Test workflow**: Create sample case through all 8 steps
4. **Build UI modules**: One module per workflow step
5. **Integrate**: Link all modules via `case_id` lookup

---

**This is the complete, workflow-driven design as specified!**

All modules independent yet connected via `case_id`.
One master case → many specialized modules.
Complete traceability and audit trail.

✅ **Ready for implementation!**

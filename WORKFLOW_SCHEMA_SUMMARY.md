# 📋 WORKFLOW SCHEMA - COMPLETE SUMMARY

**Your 8-Step Legal Workflow → Database Schema**
**Status**: ✅ Complete and Ready
**Decision Needed**: Which implementation path to take

---

## 🎯 WHAT YOU ASKED FOR

You provided a **detailed 8-step workflow** with a hand-drawn flowchart showing how cases move through your legal process, from document receipt to final notifications.

You requested:
> "This is the case workflow, I want this to be written as an instruction explicitly and strictly for Same.New to adhere and follow, design the schema and database according to this workflow"

---

## ✅ WHAT I CREATED

### 1. **Complete Database Schema** (`DATABASE_WORKFLOW_SCHEMA.sql`)

**19 tables** implementing your exact 8-step workflow:

```
cases (master table - the anchor)
  │
  ├─→ Step 1: Reception & Registration
  │   ├─ case_intake_records
  │   └─ case_intake_documents
  │
  ├─→ Step 2: Directions from Authorities
  │   └─ directions (repeatable!)
  │
  ├─→ Step 3: Officer Assignment
  │   ├─ case_assignments (repeatable!)
  │   └─ case_files
  │
  ├─→ Steps 4-5: Litigation Work
  │   ├─ case_documents
  │   ├─ case_filings
  │   └─ solicitor_general_updates (all repeatable!)
  │
  ├─→ Step 6: Compliance to Divisions
  │   ├─ manager_memos (repeatable!)
  │   └─ division_compliance_updates
  │
  ├─→ Step 7: Closure
  │   ├─ court_orders
  │   └─ case_closure (auto-updates case status)
  │
  └─→ Step 8: Notifications
      ├─ parties
      ├─ case_parties
      └─ notifications (repeatable!)

PLUS User Management:
  ├─ users
  ├─ roles
  └─ user_roles
```

**ALL tables link to `cases.id` via `case_id` foreign key!**

### 2. **Implementation Guide** (`WORKFLOW_IMPLEMENTATION_GUIDE.md`)

- Complete explanation of all 8 workflow steps
- How each module works
- Data flow examples
- User roles and permissions
- Example SQL queries for each step
- Timeline view implementation

### 3. **Migration Roadmap** (`WORKFLOW_MIGRATION_ROADMAP.md`)

**3 implementation options:**
1. **Fresh Start** - Clean implementation (3-6 months)
2. **Parallel Migration** - Keep existing data (6-9 months)
3. **Hybrid** - Gradual adoption (9-12 months)

---

## 🔑 KEY DESIGN PRINCIPLES (As You Specified)

### ✅ "One Master Case → Many Modules"

Every table references `cases.id`:
- ONE case can have MANY intake records
- ONE case can have MANY directions (over time)
- ONE case can have MANY assignments (officer changes)
- ONE case can have MANY documents, filings, SG updates
- ONE case can have MANY memos to different divisions
- ONE case can have MANY notifications to different parties

### ✅ "Modules Run Independently"

Each module has its own table(s):
- Reception module uses `case_intake_records`
- Directions module uses `directions`
- Assignment module uses `case_assignments` + `case_files`
- Litigation module uses `case_documents` + `case_filings` + `solicitor_general_updates`
- Compliance module uses `manager_memos` + `division_compliance_updates`
- Closure module uses `court_orders` + `case_closure`
- Notifications module uses `notifications` + `case_parties` + `parties`

### ✅ "Reference the Same Case Over and Over"

All modules can be used **repeatedly** for the same case:
- Same case referenced in Step 2 multiple times (multiple directions)
- Same case referenced in Step 5 unlimited times (back-and-forth with SG)
- Same case referenced in Step 6 multiple times (memos to different divisions)
- Same case referenced in Step 8 multiple times (notify different parties)

### ✅ "Fields Opened and Not Mandatory"

Case registration is **flexible**:
- Only `case_number` and `title` required
- All workflow fields optional
- Data added progressively as case moves through steps

---

## 📊 YOUR WORKFLOW MAPPED TO DATABASE

### Step 1: Papers Received at Reception

**What you said:**
> "Papers are submitted at the reception and gets entered into the main case system. The system should generate a reference number or key."

**What I built:**
```sql
-- Master case created
INSERT INTO cases (case_number, title, received_date, status)
VALUES ('LCMS-2025-0001', 'Land Dispute Case', '2025-01-15', 'registered');

-- Document receipt logged
INSERT INTO case_intake_records (case_id, document_type, source, received_by)
VALUES ([case_id], 'Section 5 Notice', 'National Court', [user_id]);

-- Files uploaded
INSERT INTO case_intake_documents (intake_record_id, file_url)
VALUES ([intake_id], 'https://storage/...pdf');
```

✅ **System generates `case_id` - this becomes the reference for everything!**

---

### Step 2: Directions Issued

**What you said:**
> "Directions for Secretary is entered separately... The user must identify who is actually making the instruction... three people issue directions and they are not the same for each case, they will from time to time, reference the same case over and over again."

**What I built:**
```sql
-- Direction #1 (Week 1)
INSERT INTO directions (case_id, issued_by, authority_role, content, direction_date)
VALUES ([case_id], [secretary_id], 'Secretary Lands', 'Open court file', '2025-01-20');

-- Direction #2 (Week 3) - SAME case_id!
INSERT INTO directions (case_id, issued_by, authority_role, content, direction_date)
VALUES ([case_id], [director_id], 'Director Legal Services', 'Seek SG advice', '2025-02-05');

-- Direction #3 (Week 6) - SAME case_id!
INSERT INTO directions (case_id, issued_by, authority_role, content, direction_date)
VALUES ([case_id], [manager_id], 'Manager Legal Services', 'Prepare defense', '2025-02-25');
```

✅ **Unlimited directions per case, each records who issued it!**

---

### Step 3: Officer Assignment

**What you said:**
> "A litigation officer is allocated to a case. This officer then looks at the case at hand if it is new, they create... If it is an existing case, it is attended to."

**What I built:**
```sql
-- Officer assigned
INSERT INTO case_assignments (case_id, assigned_to, assigned_by, assignment_reason)
VALUES ([case_id], [officer_id], [manager_id], 'Initial allocation');

-- For NEW cases (3a): Create court file
INSERT INTO case_files (case_id, court_file_number, land_file_number, titles_file_number)
VALUES ([case_id], 'NC 123/2025', 'LF-456', 'TF-789');

-- For EXISTING cases (3b): Just use existing case_id and continue work
```

✅ **New vs existing is a UI flow distinction - both use same `case_id`!**

---

### Steps 4-5: Litigation Work & Filing

**What you said:**
> "This module must be running independently referencing the case at hand and doing all forms of filing and document attachments. They deal with Solicitor general... still referencing the same case, until the office of the solicitor general is satisfied."

**What I built:**
```sql
-- Prepare document
INSERT INTO case_documents (case_id, document_type, file_url, uploaded_by)
VALUES ([case_id], 'Originating Summons', 'https://...', [officer_id]);

-- File with court
INSERT INTO case_filings (case_id, filing_type, reference_number, filed_by)
VALUES ([case_id], 'Filed in Court', 'CR-123', [officer_id]);

-- Receive SG advice
INSERT INTO solicitor_general_updates (case_id, received_from, summary_of_advice)
VALUES ([case_id], 'Solicitor-General', 'Recommend amending pleadings...');

-- Prepare amended document - SAME case_id!
INSERT INTO case_documents (case_id, document_type, file_url)
VALUES ([case_id], 'Amended Affidavit', 'https://...');

-- File again - SAME case_id!
INSERT INTO case_filings (case_id, filing_type, reference_number)
VALUES ([case_id], 'Filed with SG', 'SG-456');

-- And so on, unlimited times...
```

✅ **Unlimited back-and-forth, all referencing same `case_id`!**

---

### Step 6: Manager Compliance to Divisions

**What you said:**
> "Manager legal in compliance with the court order reference the case provides memo or advise to the division responsible... this is a separate section or module where she enters the memo, attached the file and then advises the internal department."

**What I built:**
```sql
-- Manager issues memo to Survey Division
INSERT INTO manager_memos (case_id, issued_to_division, subject, content, attached_order_id)
VALUES ([case_id], 'Survey Division', 'Conduct survey per court order', '...', [order_doc_id]);

-- Manager issues memo to Titles - SAME case_id!
INSERT INTO manager_memos (case_id, issued_to_division, subject, content)
VALUES ([case_id], 'Registrar of Titles', 'Correct title entry', '...');

-- Division responds
INSERT INTO division_compliance_updates (memo_id, updated_by, status, details)
VALUES ([memo_id], [division_officer_id], 'completed', 'Survey completed on...');
```

✅ **Multiple memos per case, each can have multiple responses!**

---

### Step 7: Case Closure & Court Orders

**What you said:**
> "The case is reviewed and calls up every relevant information including the court orders, that gives the summary decisions and finding... and then the status is closed."

**What I built:**
```sql
-- Record court order
INSERT INTO court_orders (case_id, order_date, order_type, order_text, document_id)
VALUES ([case_id], '2025-04-15', 'Order in favour of Plaintiff', 'Court orders...', [doc_id]);

-- Close case
INSERT INTO case_closure (case_id, closure_date, closure_reason, summary_of_findings)
VALUES ([case_id], '2025-04-20', 'Court order implemented', 'Case resolved favorably...');

-- Trigger automatically updates: cases.status = 'closed'
```

✅ **Case closure auto-updates status, maintains full audit trail!**

---

### Step 8: Notify Parties

**What you said:**
> "The final section will advise the Plaintiff, the Defendants and the office of the solicitor general, providing all relevant update and correspondences to the parties."

**What I built:**
```sql
-- Notify plaintiff
INSERT INTO notifications (case_id, recipient_party_id, subject, content, channel)
VALUES ([case_id], [plaintiff_id], 'Case Outcome', 'Please find attached...', 'letter');

-- Notify defendant - SAME case_id!
INSERT INTO notifications (case_id, recipient_party_id, subject, content, channel)
VALUES ([case_id], [defendant_id], 'Case Outcome', 'Please find attached...', 'letter');

-- Notify SG - SAME case_id!
INSERT INTO notifications (case_id, recipient_description, subject, content)
VALUES ([case_id], 'Office of Solicitor-General', 'Case Completed', '...');
```

✅ **Multiple notifications per case, all logged!**

---

## 🎯 DESIGN HIGHLIGHTS

### 1. **Case Timeline View Possible**

Query all activity for a case:
```sql
SELECT * FROM (
  SELECT 'Reception' as module, received_date as date, document_type as action
  FROM case_intake_records WHERE case_id = [case_id]

  UNION ALL

  SELECT 'Direction', direction_date, content
  FROM directions WHERE case_id = [case_id]

  UNION ALL

  SELECT 'Assignment', assigned_date, 'Officer assigned'
  FROM case_assignments WHERE case_id = [case_id]

  UNION ALL

  SELECT 'Document', uploaded_at, document_type
  FROM case_documents WHERE case_id = [case_id]

  -- etc for all modules...
) AS timeline
ORDER BY date;
```

### 2. **Status Progression**

Cases move through defined statuses:
```
registered →
awaiting_directions →
assigned_to_officer →
in_progress →
awaiting_court_order →
awaiting_internal_compliance →
closed
```

### 3. **User Roles Enforced**

- Secretary Lands → Issue directions
- Director Legal Services → Issue directions
- Manager Legal Services → Issue directions, assign officers, issue memos
- Litigation Officer → Work cases, file documents
- Reception Staff → Register cases
- Division Officers → Respond to compliance memos

### 4. **Complete Audit Trail**

Every table has:
- `created_at` - when recorded
- `created_by` / `uploaded_by` / `issued_by` - who did it
- `updated_at` - when modified (where applicable)

---

## 📋 YOUR DECISION NEEDED

### Choose Implementation Path:

**Option 1: Fresh Start**
- ✅ Perfect workflow implementation
- ✅ Clean start, no migration complexity
- ❌ Lose existing 2,043 cases (or manual re-entry)
- **Time**: 3-6 months

**Option 2: Parallel Migration**
- ✅ Keep all existing data
- ✅ Smooth transition
- ❌ More complex, dual system temporarily
- **Time**: 6-9 months

**Option 3: Hybrid**
- ✅ Gradual adoption
- ✅ Both systems available
- ❌ Most complex, longest timeline
- **Time**: 9-12 months

---

## 📚 FILES TO REVIEW

1. **`DATABASE_WORKFLOW_SCHEMA.sql`** - The complete schema
   - 600+ lines of SQL
   - All 19 tables
   - Foreign keys, indexes, RLS policies
   - Triggers for status updates

2. **`WORKFLOW_IMPLEMENTATION_GUIDE.md`** - Detailed guide
   - Each step explained
   - Example data flow
   - User roles
   - Timeline view implementation

3. **`WORKFLOW_MIGRATION_ROADMAP.md`** - Migration options
   - 3 paths compared
   - Timelines
   - Pros/cons
   - Decision matrix

---

## ✅ WHAT'S READY

- [x] Complete database schema designed
- [x] All 8 workflow steps implemented as modules
- [x] Foreign key relationships defined
- [x] User/role system included
- [x] Audit trail on all tables
- [x] RLS policies set up
- [x] Status progression logic
- [x] Closure triggers
- [x] Comprehensive documentation
- [x] Migration paths outlined

---

## ⏳ WHAT'S NEXT (Awaiting Your Decision)

**Step 1: Review**
- Read `WORKFLOW_IMPLEMENTATION_GUIDE.md`
- Read `WORKFLOW_MIGRATION_ROADMAP.md`
- Review `DATABASE_WORKFLOW_SCHEMA.sql`

**Step 2: Decide**
- Which path? (Fresh Start / Parallel / Hybrid)
- Timeline? (3 / 6 / 9 months)
- Keep existing data? (Yes / No)

**Step 3: Implement**
- Run appropriate schema
- Build UI modules (one per workflow step)
- Train users
- Go live

---

## 🎊 SUMMARY

**You asked for**: Database schema based on your exact 8-step workflow

**You got**:
- ✅ 19-table schema implementing every workflow step
- ✅ One master case → many specialized modules
- ✅ All modules reference same `case_id`
- ✅ Repeatable module usage (unlimited directions, filings, memos, etc.)
- ✅ Complete audit trail
- ✅ User roles system
- ✅ Status progression logic
- ✅ Comprehensive documentation
- ✅ 3 implementation paths to choose from

**Next**: **Your decision on implementation path!**

---

**Status**: ✅ Schema Complete, Ready for Implementation
**Decision Needed**: Which path to take (Option 1, 2, or 3)?
**Timeline**: Depends on chosen path (3-9 months)
**Files Ready**: All documentation and schemas complete

🚀 **The workflow-driven system is ready when you are!** 🚀

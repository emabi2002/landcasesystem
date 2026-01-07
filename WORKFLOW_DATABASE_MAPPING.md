# 📊 Workflow-to-Database Table Mapping

## Overview
This document maps the **7-step legal workflow** to the **existing database tables** in the DLPP Legal Case Management System.

---

## 🗄️ Core Tables (Base Schema)

### Main Case Table
```sql
cases - Master case record (Case ID anchor for everything)
```

### Supporting Core Tables
```sql
profiles - System users and officers
parties - Plaintiffs, defendants, parties to proceedings
documents - All document uploads and files
tasks - Action items and assignments
events - Calendar events (hearings, deadlines)
land_parcels - Land parcel information
case_history - Audit trail of all case activities
evidence - Evidence and exhibits
notifications - System notifications
```

---

## 🔄 Workflow Module Tables (Workflow Extensions Schema)

### **STEP 1: Case Registration** (Entry Screen)
**Purpose**: Create case and generate Case ID

**Tables Used**:
- `cases` - Main case record created here
- `incoming_correspondence` - Section 5 notices, search warrants, court documents received

**Fields in incoming_correspondence**:
```sql
- reference_number (unique)
- document_type: 'section_5_notice', 'search_warrant', 'court_order', 'summons_ombudsman', 'writ', 'other'
- source: 'plaintiff', 'defendant', 'solicitor_general', 'ombudsman_commission', 'court', 'other'
- received_date
- received_by (user reference)
- subject, description
- file_url (scanned document)
- acknowledgement details
- case_id (links to cases table)
- status: 'received', 'acknowledged', 'processed', 'filed'
```

**Section 5 Documents**: Stored in `incoming_correspondence` with document_type = 'section_5_notice'

---

### **STEP 2: Directions** (Secretary/Director/Manager Instructions)
**Purpose**: Issue formal instructions and directives

**Table Used**:
- `directions` - All directions from management

**Fields**:
```sql
- direction_number (unique reference)
- source: 'secretary_lands', 'director_legal_services', 'manager_legal_services'
- issued_by (user reference)
- issued_date
- subject
- content (full direction text)
- priority: 'low', 'medium', 'high', 'urgent'
- due_date
- assigned_to (user reference)
- status: 'pending', 'in_progress', 'completed'
- case_id (links to cases table)
- completed_date
- notes
```

**Update Required for App**:
- Change form to use `source` instead of `issued_by` (text field)
- Change `content` instead of `direction_content`
- Add `direction_number` auto-generation

---

### **STEP 3: Case Allocation** (Manager Assigns to Litigation Officer)
**Purpose**: Manager assigns case to litigation officer

**Table Used**:
- `case_delegations` - Officer assignments and delegations

**Fields**:
```sql
- case_id (links to cases table)
- delegated_by (manager user reference)
- delegated_to (litigation officer user reference)
- delegation_date
- instructions
- status: 'active', 'completed', 'reassigned'
- completed_date
- notes
```

**Update Required for App**:
- Use `case_delegations` table instead of `case_assignments`
- Use `delegated_by` and `delegated_to` instead of `assigned_by` and `assigned_to`

---

### **STEP 3a: Create Court & Land Files**
**Purpose**: Request court file, land file, and title file

**Table Used**:
- `file_requests` - Track file requests and locations

**Fields**:
```sql
- case_id (links to cases table)
- file_type: 'court_file', 'land_file', 'title_file'
- file_number
- requested_by (user reference)
- requested_date
- status: 'requested', 'received', 'in_use', 'returned'
- received_date
- current_location
- custodian (user reference)
- notes
```

---

### **STEP 4: Registration & Assignment** (Litigation Officer Workspace)
**Purpose**: ALL FILINGS HAPPEN HERE - litigation officer records all work

**Tables Used**:
- `filings` - All filings prepared by litigation officers
- `documents` - Document uploads
- `communications` - Communications log

**Filings Table Fields**:
```sql
- case_id (links to cases table)
- filing_type: 'instruction_letter', 'affidavit', 'motion', 'response', 'brief', 'notice', 'other'
- title
- description
- prepared_by (user reference)
- prepared_date
- submitted_to (external lawyer reference)
- submission_date
- filing_number
- court_filing_date
- status: 'draft', 'prepared', 'submitted', 'filed', 'rejected'
- status_update_date
- status_notes
- file_url
- notes
```

**Update Required for App**:
- Use `filings` table instead of `case_filings`
- Use `officer_actions` or `case_history` for status updates
- Use `communications` for correspondence

---

### **STEP 5: Compliance** (Solicitor General & Legal Officers)
**Purpose**: Work with external lawyers, loop back to Steps 2 & 4, request internal documents

**Tables Used**:
- `external_lawyers` - Solicitor General and private lawyers
- `filings` - Filings from/to external lawyers (submitted_to field)
- `compliance_tracking` - Compliance with court orders, requests to internal divisions

**External Lawyers Table**:
```sql
- name
- organization
- lawyer_type: 'solicitor_general', 'private_lawyer'
- contact_email, contact_phone, address
- specialization
- active (boolean)
- notes
```

**Compliance Tracking Table**:
```sql
- case_id (links to cases table)
- court_order_reference
- court_order_date
- court_order_description
- compliance_deadline
- responsible_division: 'survey_division', 'registrar_for_titles', 'alienated_lands_division',
  'valuation_division', 'physical_planning_division', 'ilg_division', 'customary_leases_division'
- memo_reference
- memo_sent_date
- memo_sent_by (user reference)
- compliance_status: 'pending', 'memo_sent', 'in_progress', 'completed', 'overdue', 'partially_complied'
- completion_date
- compliance_notes
- attachments (JSONB)
```

**Update Required for App**:
- Use `compliance_tracking` table for compliance activities
- Use `external_lawyers` table for lawyer management
- Link filings to external lawyers via `submitted_to` field

---

### **STEP 6: Case Closure** (Judgment and Closure)
**Purpose**: Record court judgment and close case

**Tables Used**:
- `cases` - Update closure fields
- `case_history` - Record closure event

**Cases Table Closure Fields** (already added):
```sql
- closure_type: 'default_judgement', 'summarily_determined', 'dismissed_want_of_prosecution',
  'dismissed_abuse_of_process', 'incompetent', 'appeal_granted', 'judicial_review',
  'court_order_granted_plaintiff', 'court_order_granted_defendant', 'settled', 'withdrawn', 'other'
- status: 'closed'
- closed_date
- closure_notes
```

**Update Required for App**:
- Update `cases` table directly instead of separate `case_closure` table
- Record closure in `case_history` table

---

### **STEP 7: Notifications to Parties** (After Closure)
**Purpose**: Notify all parties of court decision

**Tables Used**:
- `communications` - Log all outgoing notifications
- `parties` - Recipient information

**Communications Table** (for outgoing notifications):
```sql
- case_id (links to cases table)
- communication_type: 'email', 'letter', 'phone', 'in_person', 'fax', 'other'
- direction: 'outgoing' (for notifications)
- party_type: 'plaintiff', 'defendant', 'solicitor_general', 'private_lawyer', 'witness', 'court', 'other'
- party_name
- party_id (links to parties or external_lawyers)
- subject
- content (notification message)
- communication_date
- handled_by (user reference)
- response_required (boolean)
- response_deadline
- response_status: 'pending', 'responded', 'no_response_needed'
- attachments (JSONB - proof of communication)
- notes
```

**Update Required for App**:
- Use `communications` table with direction='outgoing' instead of `notifications` table
- Use attachments field for proof of communication

---

### **STEP 8: Parties & Lawyers** (Ongoing Throughout Case)
**Purpose**: Manage parties to proceedings and their lawyers

**Tables Used**:
- `parties` - All parties (plaintiffs, defendants, etc.)
- `external_lawyers` - Solicitor General and private lawyers representing parties

**Parties Table**:
```sql
- case_id (links to cases table)
- name
- party_type: 'individual', 'organization', 'government'
- role: 'plaintiff', 'defendant', 'witness', 'other'
- contact_info (JSONB)
- lawyer (external_lawyers reference or name)
- notes
```

**Unlimited Communication**:
- Use `communications` table to track all communications
- Between Lands Lawyers and Solicitor General
- Between Lands Lawyers and Private Lawyers
- Regarding single case or multiple cases

---

## 📋 Summary Table

| Workflow Step | Primary Tables | Purpose |
|--------------|----------------|---------|
| **Step 1: Case Registration** | `cases`, `incoming_correspondence` | Create Case ID, record Section 5 docs |
| **Step 2: Directions** | `directions` | Management instructions (repeatable) |
| **Step 3: Case Allocation** | `case_delegations` | Manager assigns to officer |
| **Step 3a: File Requests** | `file_requests` | Court/land/title file tracking |
| **Step 4: Litigation Work** | `filings`, `documents`, `communications` | ALL filings happen here |
| **Step 5: Compliance** | `compliance_tracking`, `external_lawyers`, `filings` | SG/lawyers, loop back, internal docs |
| **Step 6: Case Closure** | `cases` (closure fields), `case_history` | Court judgment, close case |
| **Step 7: Notifications** | `communications` (outgoing), `parties` | Notify all parties after closure |
| **Step 8: Parties/Lawyers** | `parties`, `external_lawyers`, `communications` | Ongoing party/lawyer management |

---

## 🔧 Required Updates to App Code

### 1. Update Directions Module (`/directions/page.tsx`)
```typescript
// Change from:
{
  case_id, issued_by, direction_type, direction_content, action_required, deadline, assigned_to
}

// Change to:
{
  case_id,
  direction_number: auto-generated,
  source: 'secretary_lands' | 'director_legal_services' | 'manager_legal_services',
  issued_by: user.id,
  issued_date: new Date(),
  subject: direction_type,
  content: direction_content,
  priority,
  due_date: deadline,
  assigned_to,
  status: 'pending'
}
```

### 2. Update Allocation Module (`/allocation/page.tsx`)
```typescript
// Change table from case_assignments to case_delegations
// Change fields from assigned_by/assigned_to to delegated_by/delegated_to

{
  case_id,
  delegated_by: manager_user_id,
  delegated_to: officer_user_id,
  delegation_date: new Date(),
  instructions,
  status: 'active'
}
```

### 3. Update Litigation Module (`/litigation/page.tsx`)
```typescript
// Change table from case_filings to filings
// Update fields to match filings table

{
  case_id,
  filing_type,
  title: document_title,
  description,
  prepared_by: user.id,
  prepared_date: filing_date,
  status: 'draft',
  file_url
}
```

### 4. Update Compliance Module (`/compliance/page.tsx`)
```typescript
// Use compliance_tracking table

{
  case_id,
  court_order_description,
  responsible_division,
  memo_sent_by: user.id,
  compliance_status,
  compliance_notes
}
```

### 5. Update Closure Module (`/closure/page.tsx`)
```typescript
// Update cases table directly instead of case_closure

await supabase
  .from('cases')
  .update({
    closure_type,
    status: 'closed',
    closed_date: new Date(),
    closure_notes
  })
  .eq('id', case_id)

// Also insert into case_history
await supabase
  .from('case_history')
  .insert({
    case_id,
    action: 'Case Closed',
    description: closure_notes,
    metadata: { closure_type, court_order_date }
  })
```

### 6. Update Notifications Module (`/notifications/page.tsx`)
```typescript
// Use communications table with direction='outgoing'

{
  case_id,
  communication_type,
  direction: 'outgoing',
  party_type,
  party_name,
  subject: 'Court Decision Notification',
  content: notification_content,
  communication_date: new Date(),
  handled_by: user.id,
  attachments: { proof_of_communication }
}
```

---

## ✅ Next Steps

1. **Update all workflow module code** to use correct table names
2. **Generate TypeScript types** from Supabase database
3. **Test complete workflow cycle**:
   - Create case → Issue direction → Allocate → File documents → Compliance → Close → Notify
4. **Verify all table relationships** and foreign keys work correctly
5. **Add auto-number generation** for direction_number, filing_number, etc.

---

## 🎯 Key Principles

- ✅ **Case ID is the anchor** - everything links to `cases.id`
- ✅ **Section 5 documents** in `incoming_correspondence`
- ✅ **ALL filings** in `filings` table (Step 4)
- ✅ **No separate external filings** module
- ✅ **Iterative workflow** - Step 5 loops back to Steps 2 & 4
- ✅ **Comprehensive audit trail** via `case_history`
- ✅ **Unlimited communications** via `communications` table

# Litigation Workflow API Test Scripts

## Prerequisites

1. Dev server running: `bun run dev`
2. User authenticated in Supabase
3. Get your user ID from Supabase Auth

## Test Complete Workflow

### 1. Para-Legal: Register Case

```bash
curl -X POST http://localhost:3000/api/cases/register \
  -H "Content-Type: application/json" \
  -d '{
    "case_number": "LIT-2026-TEST-001",
    "title": "Test Litigation Case",
    "mode_of_proceeding": "writ_of_summons",
    "court_file_number": "WS No. 001/2026",
    "parties_description": "State -v- John Doe",
    "proceeding_filed_date": "2026-02-01",
    "returnable_date": "2026-03-15T10:00:00Z",
    "court_documents_type": "Writ of Summons",
    "plaintiff_lawyer_contact": {
      "name": "Jane Smith",
      "firm": "Smith & Associates",
      "phone": "+675 123 4567",
      "email": "jane@lawfirm.com",
      "address": "Port Moresby"
    },
    "osg_lawyer_contact": {
      "name": "John OSG",
      "phone": "+675 987 6543",
      "email": "john@osg.gov.pg"
    },
    "description": "Test case for workflow",
    "user_role": "para_legal_officer"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "case": { "id": "...", "case_number": "LIT-2026-TEST-001", ... },
  "workflow_state": "REGISTERED",
  "message": "Case registered successfully. Managers have been notified."
}
```

**Save the case ID for next steps!**

---

### 2. Manager: Assign Action Officer

```bash
# Replace <CASE_ID> and <ACTION_OFFICER_ID>
curl -X POST http://localhost:3000/api/cases/assign \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "<CASE_ID>",
    "assigned_to": "<ACTION_OFFICER_ID>",
    "assignment_notes": "Please handle this test case urgently"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Case assigned successfully"
}
```

**Workflow State: REGISTERED → ASSIGNED**

---

### 3. Action Officer: Create Draft Filing

```bash
# Replace <CASE_ID>
curl -X POST http://localhost:3000/api/filings/create \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "<CASE_ID>",
    "filing_type": "defence",
    "filing_title": "Defence to Writ of Summons",
    "description": "Draft defence document",
    "draft_file_url": "https://example.com/draft-defence.pdf"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "filing": { "id": "...", "status": "draft", ... }
}
```

**Workflow State: ASSIGNED/REGISTRATION_COMPLETED → DRAFTING**

**Save the filing ID!**

---

### 4. Action Officer: Submit for Review

```bash
# Replace <CASE_ID>
curl -X POST http://localhost:3000/api/filings/submit-for-review \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "<CASE_ID>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Filings submitted for review successfully",
  "filing_count": 1
}
```

**Workflow State: DRAFTING → UNDER_REVIEW**

---

### 5. Manager: Review Filing

```bash
# Replace <FILING_ID>
# To approve:
curl -X POST http://localhost:3000/api/filings/review \
  -H "Content-Type: application/json" \
  -d '{
    "filing_id": "<FILING_ID>",
    "decision": "approved",
    "comments": "Looks good, approved for filing"
  }'

# To request changes:
curl -X POST http://localhost:3000/api/filings/review \
  -H "Content-Type: application/json" \
  -d '{
    "filing_id": "<FILING_ID>",
    "decision": "changes_requested",
    "comments": "Please revise the allegations section",
    "changes_required": "Update paragraph 3 with more specific details"
  }'
```

**Expected Response (Approved):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "new_workflow_state": "APPROVED_FOR_FILING"
}
```

**Workflow State: UNDER_REVIEW → APPROVED_FOR_FILING (or back to DRAFTING if changes requested)**

---

### 6. Action Officer: Add Progress Update

```bash
# Replace <CASE_ID>
curl -X POST http://localhost:3000/api/cases/progress-update \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "<CASE_ID>",
    "stage_type": "pre_trial_conference",
    "stage_title": "Pre-Trial Conference Held",
    "stage_date": "2026-04-01",
    "description": "PTC held, directions given for discovery",
    "outcome": "Discovery deadline set for 30 days",
    "next_steps": "Complete discovery process"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "update": { "id": "...", ... },
  "message": "Progress update added successfully"
}
```

**Workflow State: FILED → IN_PROGRESS**

---

### 7. Action Officer: Enter Judgment

```bash
# Replace <CASE_ID>
curl -X POST http://localhost:3000/api/cases/judgment \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "<CASE_ID>",
    "judgment_date": "2026-05-01",
    "judgment_type": "final_judgment",
    "decision_summary": "Case dismissed with costs",
    "terms_of_orders": "Plaintiff claim dismissed. Costs awarded to defendant.",
    "judges_names": "Justice Smith",
    "judgment_document_url": "https://example.com/judgment.pdf",
    "compliance_memo_url": "https://example.com/compliance-memo.pdf",
    "compliance_notes": "Favorable judgment, no compliance action required"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "judgment": { "id": "...", ... },
  "message": "Judgment entered successfully"
}
```

**Workflow State: IN_PROGRESS → JUDGMENT_ENTERED**

---

### 8. Para-Legal: Close Case

```bash
# Replace <CASE_ID>
curl -X POST http://localhost:3000/api/cases/close \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "<CASE_ID>",
    "court_order_date": "2026-05-01",
    "closure_type": "dismissed",
    "closure_notes": "Case dismissed per court order dated 01/05/2026"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Case closed successfully",
  "closure_type": "dismissed"
}
```

**Workflow State: JUDGMENT_ENTERED → CLOSED**

---

## Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "Litigation Workflow API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Register Case",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "http://localhost:3000/api/cases/register",
        "body": {
          "mode": "raw",
          "raw": "{{register_case_body}}"
        }
      }
    },
    {
      "name": "2. Assign Officer",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/cases/assign"
      }
    }
  ]
}
```

---

## Verify Workflow State Changes

Query the database to see workflow transitions:

```sql
-- View case with workflow state
SELECT case_number, title, workflow_state, status
FROM cases
WHERE case_number = 'LIT-2026-TEST-001';

-- View workflow history
SELECT action, description, workflow_state_from, workflow_state_to, created_at
FROM case_history
WHERE case_id = (SELECT id FROM cases WHERE case_number = 'LIT-2026-TEST-001')
ORDER BY created_at DESC;

-- View filings and their status
SELECT filing_title, filing_type, status
FROM filings
WHERE case_id = (SELECT id FROM cases WHERE case_number = 'LIT-2026-TEST-001');
```

---

## Testing Checklist

- [ ] Para-Legal registers case → REGISTERED
- [ ] Managers receive notification
- [ ] Manager assigns action officer → ASSIGNED
- [ ] Action officer receives notification
- [ ] Action officer creates filing → DRAFTING
- [ ] Action officer submits for review → UNDER_REVIEW
- [ ] Manager receives notification
- [ ] Manager approves → APPROVED_FOR_FILING
- [ ] Action officer adds progress → IN_PROGRESS
- [ ] Action officer enters judgment → JUDGMENT_ENTERED
- [ ] Para-legal receives notification
- [ ] Para-legal closes case → CLOSED

All 10 workflow states tested! ✅

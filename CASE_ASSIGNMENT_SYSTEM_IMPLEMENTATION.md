# Case Assignment System - Complete Implementation Guide

## 🎯 Overview

This document provides comprehensive guidance for implementing the enhanced Case Assignment system that allows Legal Managers to search, preview, and assign cases to Litigation Officers with duplicate prevention and reassignment control.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CASE ASSIGNMENT WORKFLOW                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Case Search  │    │   Preview    │    │  Assignment  │
│  & Select    │───▶│   & Verify   │───▶│   Action     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
 Search Cases         View Details         Assign/Reassign
 Filter Status        Check Assignment     Duplicate Prevention
 Type ahead           Show Officer         Workload Distribution
```

---

## 🗄️ Database Schema

### **1. case_assignments Table**

```sql
CREATE TABLE case_assignments (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id),
  officer_user_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_by_user_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- active, reassigned, closed
  briefing_note TEXT,
  assignment_notes TEXT,
  reassignment_reason TEXT,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint: Only ONE active assignment per case
CREATE UNIQUE INDEX idx_case_assignments_unique_active
  ON case_assignments(case_id)
  WHERE status = 'active' AND ended_at IS NULL;
```

### **2. case_assignment_history Table**

```sql
CREATE TABLE case_assignment_history (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  action TEXT NOT NULL, -- assigned, reassigned, closed
  from_officer_user_id UUID,
  to_officer_user_id UUID,
  performed_by_user_id UUID,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Helper Functions**

```sql
-- Get active assignment for a case
CREATE OR REPLACE FUNCTION get_active_assignment(p_case_id UUID)
RETURNS TABLE (...) AS $$
...
$$;

-- Get officer workload
CREATE OR REPLACE FUNCTION get_officer_workload(p_officer_id UUID)
RETURNS INTEGER AS $$
...
$$;

-- Check if case is assigned
CREATE OR REPLACE FUNCTION is_case_assigned(p_case_id UUID)
RETURNS BOOLEAN AS $$
...
$$;
```

---

## 🔌 Backend API Endpoints

### **1. Search Cases**

```
GET /api/cases/search?q={query}&includeAssigned={bool}&includeClosed={bool}
```

**Query Parameters:**
- `q` - Search query (case ref, title, plaintiff, defendant)
- `includeAssigned` - Include already assigned cases
- `includeClosed` - Include closed cases

**Response:**
```json
{
  "cases": [
    {
      "id": "uuid",
      "case_reference": "LC-2025-001",
      "case_title": "Smith vs Company Ltd",
      "case_type": "Land Dispute",
      "status": "open",
      "priority": "high",
      "plaintiff_name": "John Smith",
      "defendant_name": "Company Ltd",
      "created_at": "2025-01-15",
      "is_assigned": false,
      "assignment": null
    }
  ]
}
```

### **2. Check Assignment Status**

```
GET /api/cases/assignment-status?caseId={uuid}
```

**Response:**
```json
{
  "is_assigned": true,
  "assignment": {
    "id": "uuid",
    "officer_user_id": "uuid",
    "officer_email": "officer@dlpp.gov.pg",
    "officer_name": "Jane Doe",
    "assigned_by_email": "manager@dlpp.gov.pg",
    "assigned_at": "2025-01-20T10:30:00Z",
    "briefing_note": "High priority land dispute case..."
  }
}
```

### **3. Assign Case to Officer**

```
POST /api/cases/assign-officer
```

**Request Body:**
```json
{
  "caseId": "uuid",
  "officerId": "uuid",
  "briefingNote": "Case briefing summary...",
  "assignedBy": "uuid",
  "allowReassignment": false,
  "reassignmentReason": "Officer on leave" // Required if allowReassignment = true
}
```

**Response:**
```json
{
  "success": true,
  "assignment": { ... },
  "message": "Case assigned successfully"
}
```

**Error Response (Duplicate):**
```json
{
  "error": "Case is already assigned",
  "assigned_to": "officer@dlpp.gov.pg"
}
```

### **4. Get Available Officers**

```
GET /api/officers/available
```

**Response:**
```json
{
  "officers": [
    {
      "id": "uuid",
      "email": "officer1@dlpp.gov.pg",
      "full_name": "Jane Doe",
      "department": "Legal Services",
      "active_cases": 5,
      "status": "active"
    }
  ]
}
```

---

## 🎨 UI Components & Features

### **1. Enhanced Case Assignments Page**

#### **Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  Case Assignments                    [Assign Case Button]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────┐  ┌─────────────────────────┐│
│  │   SEARCH & SELECT        │  │   ASSIGNMENT PANEL      ││
│  │                          │  │                         ││
│  │  [Search Cases...]       │  │  Selected Case:         ││
│  │                          │  │  LC-2025-001            ││
│  │  Results:                │  │                         ││
│  │  ○ LC-2025-001           │  │  [View Case]            ││
│  │  ○ LC-2025-002           │  │                         ││
│  │  ○ LC-2025-003           │  │  Status: Unassigned     ││
│  │                          │  │                         ││
│  │  [Show assigned cases]   │  │  Select Officer:        ││
│  │  [Include closed cases]  │  │  [Dropdown with load]   ││
│  │                          │  │                         ││
│  └──────────────────────────┘  │  Briefing Note:         ││
│                                │  [Textarea...]          ││
│  ┌──────────────────────────┐  │                         ││
│  │   PENDING CASES TABLE    │  │  [Assign Case]          ││
│  │                          │  └─────────────────────────┘│
│  │  ID | Title | Priority  │                             │
│  │  Status | Assigned To   │                             │
│  │  Age | Action           │                             │
│  │                          │                             │
│  └──────────────────────────┘                             │
└────────────────────────────────────────────────────────────┘
```

#### **Key UI Elements:**

**A) Case Search Component**
- Typeahead/autocomplete search
- Search by: Case ID, Title, Plaintiff, Defendant
- Real-time filtering
- Show assignment status in results
- Filters: Include assigned, Include closed

**B) Case Preview Modal**
- View Case button opens modal
- Display:
  - Case ID, Title, Type
  - Parties (Plaintiff/Defendant)
  - Filing date, Priority, Status
  - Current stage
  - Attachment count
  - Brief description

**C) Assignment Status Card**

**If UNASSIGNED:**
```
┌────────────────────────────┐
│ Status: Unassigned         │
│ ✅ Ready to assign         │
└────────────────────────────┘
```

**If ASSIGNED:**
```
┌────────────────────────────┐
│ ⚠️ Already Assigned        │
│                            │
│ Assigned to:               │
│ Officer: Jane Doe          │
│ Email: jane@dlpp.gov.pg    │
│ Assigned on: Jan 20, 2025  │
│ By: Manager Name           │
│                            │
│ [View Assignment History]  │
└────────────────────────────┘
```

**D) Officer Selection Dropdown**

```
Select Litigation Officer:
┌────────────────────────────────────────┐
│ Jane Doe - 5 active cases              │
│ John Smith - 3 active cases            │
│ Mary Johnson - 7 active cases          │
└────────────────────────────────────────┘
```
- Shows officer name
- Shows current active case count
- Sorted by workload (ascending)
- Helps manager distribute workload evenly

**E) Briefing Note Input**
- Textarea for manager to enter case briefing
- Visible to both manager and officer
- Saved with assignment
- Displayed in "My Cases"

**F) Pending Cases Table**

| Case ID | Title | Priority | Age (days) | Status | Assigned Officer | Action |
|---------|-------|----------|----------|--------|------------------|--------|
| LC-001 | Smith vs Co | High | 5 | Unassigned | - | [View] [Assign] |
| LC-002 | Land Dispute | Medium | 12 | Assigned | Jane Doe | [View] |

---

## 🔒 Business Rules & Validation

### **1. Duplicate Assignment Prevention**

**Rule:** ONE case can have only ONE active assignment at a time.

**Implementation:**
- Database unique constraint on `case_assignments(case_id)` where status='active'
- Backend validation before insert
- Frontend check and UI feedback

**Error Handling:**
```javascript
if (isAssigned && !allowReassignment) {
  toast.error(`This case is already assigned to ${officer.name}`);
  return;
}
```

### **2. Reassignment Policy**

**Option A: Strict (No Reassignment)**
- If assigned, block reassignment entirely
- Show only who is assigned
- Provide "View History" option

**Option B: Controlled Reassignment**
- Allow reassignment with mandatory reason
- Confirmation modal: "This will unassign Officer A and assign to Officer B"
- Log reassignment to history
- Close old assignment with reason

**Implementation (Option B):**
```javascript
const handleReassign = () => {
  if (!reassignmentReason) {
    toast.error('Reassignment reason is required');
    return;
  }

  if (confirm(`Unassign ${currentOfficer} and assign to ${newOfficer}?`)) {
    // API call with allowReassignment: true
  }
};
```

### **3. Validation Rules**

| Field | Validation |
|-------|-----------|
| Case ID | Must exist, Must not be closed |
| Officer ID | Must exist, Must be litigation officer role |
| Briefing Note | Optional but recommended |
| Reassignment Reason | Required if reassignment |

---

## 🔄 Complete Workflow Example

### **Scenario: Manager Assigns a New Case**

**Step 1: Search for Case**
1. Manager navigates to Case Assignments page
2. Enters "LC-2025-001" in search
3. Results show matching cases
4. Manager clicks on the case

**Step 2: Preview/Verify Case**
1. Click "View Case" button
2. Modal shows:
   - Case Title: "Smith vs Company Ltd"
   - Type: Land Dispute
   - Priority: High
   - Parties: John Smith (P) vs Company Ltd (D)
   - Filed: Jan 15, 2025
3. Manager confirms: "Yes, this is the correct case"
4. Close modal

**Step 3: Check Assignment Status**
1. System automatically checks: Case is unassigned
2. Status card shows: "✅ Ready to assign"
3. Officer dropdown is enabled

**Step 4: Select Officer**
1. Manager opens officer dropdown
2. System shows:
   - Jane Doe - 5 active cases
   - John Smith - 3 active cases ← (lowest workload)
   - Mary Johnson - 7 active cases
3. Manager selects: John Smith (to balance workload)

**Step 5: Add Briefing**
1. Manager enters briefing note:
   ```
   High-priority land dispute case. Plaintiff claims encroachment
   by defendant. Hearing scheduled for Feb 10. Urgent attention
   required for evidence preparation.
   ```

**Step 6: Assign**
1. Click "Assign Case" button
2. System validates:
   - Case exists ✅
   - Officer exists ✅
   - Case not closed ✅
   - Case not assigned ✅
3. Assignment created successfully
4. Toast: "✅ Case assigned to John Smith"

**Step 7: Verification**
1. Case now appears in John Smith's "My Cases"
2. Manager can see assignment in the table
3. Assignment is logged in history

---

## 📱 My Cases Integration

### **Enhanced My Cases Page**

**Query:**
```sql
SELECT
  c.id,
  c.case_reference,
  c.case_title,
  c.case_type,
  c.priority,
  c.status,
  ca.assigned_at,
  ca.briefing_note,
  EXTRACT(DAY FROM NOW() - ca.assigned_at) as days_assigned
FROM cases c
JOIN case_assignments ca ON c.id = ca.case_id
WHERE ca.officer_user_id = {current_user_id}
  AND ca.status = 'active'
  AND ca.ended_at IS NULL
ORDER BY ca.assigned_at DESC;
```

**Display:**
```
┌─────────────────────────────────────────────────────┐
│ My Cases (8)                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ LC-2025-001 - Smith vs Company Ltd                 │
│ Priority: High | Assigned: 2 days ago              │
│ Briefing: High-priority land dispute case...       │
│ [View Full Case] [Update Status]                   │
│                                                     │
│ LC-2025-015 - Johnson Land Claim                   │
│ Priority: Medium | Assigned: 5 days ago            │
│ Briefing: Standard land claim review...            │
│ [View Full Case] [Update Status]                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Shows briefing snippet
- Days since assigned
- Quick actions
- Filter by priority/status
- Sort by assigned date

---

## 🧪 Testing Checklist

### **1. Case Search**
- [ ] Search by Case ID works
- [ ] Search by Title works
- [ ] Search by Plaintiff/Defendant works
- [ ] Filter: Include assigned cases works
- [ ] Filter: Include closed cases works
- [ ] Results show assignment status

### **2. Case Preview**
- [ ] View Case button opens modal
- [ ] All case details display correctly
- [ ] Modal closes properly

### **3. Assignment Status**
- [ ] Unassigned cases show "Ready to assign"
- [ ] Assigned cases show officer details
- [ ] Assigned by information displays
- [ ] Assignment date displays

### **4. Duplicate Prevention**
- [ ] Cannot assign already assigned case
- [ ] Clear error message shown
- [ ] Shows current officer details

### **5. Officer Selection**
- [ ] Dropdown shows all officers
- [ ] Active case count displays
- [ ] Sorted by workload

### **6. Assignment Action**
- [ ] Validation works (case ID, officer ID required)
- [ ] Briefing note saves
- [ ] Success message displays
- [ ] Case appears in officer's My Cases immediately

### **7. Reassignment (if enabled)**
- [ ] Reassignment reason is required
- [ ] Confirmation modal shows
- [ ] Old assignment closed
- [ ] New assignment created
- [ ] History logged

### **8. Concurrency**
- [ ] Two managers cannot assign same case simultaneously
- [ ] Database constraint prevents duplicate
- [ ] Error handled gracefully

---

## 🚀 Deployment Steps

### **1. Database Migration**
```bash
# Run in Supabase SQL Editor
psql -f database-case-assignments-system.sql
```

### **2. Verify Tables**
```sql
SELECT COUNT(*) FROM case_assignments;
SELECT COUNT(*) FROM case_assignment_history;
```

### **3. Test Functions**
```sql
SELECT get_active_assignment('case-uuid');
SELECT get_officer_workload('officer-uuid');
SELECT is_case_assigned('case-uuid');
```

### **4. Deploy Backend APIs**
- Upload API routes to `/api/cases/` and `/api/officers/`
- Test each endpoint with Postman/curl

### **5. Deploy Frontend**
- Update Case Assignments page
- Update My Cases page
- Test full workflow end-to-end

---

## 📊 Monitoring & Analytics

### **Key Metrics to Track**

1. **Assignment Metrics:**
   - Total assignments per day/week/month
   - Average time to assign new cases
   - Reassignment rate

2. **Workload Distribution:**
   - Cases per officer
   - Average case age per officer
   - Workload balance across team

3. **Performance:**
   - Search query response time
   - Assignment action completion time

### **Queries for Analytics**

```sql
-- Cases assigned per officer
SELECT
  au.email,
  COUNT(*) as total_assigned
FROM case_assignments ca
JOIN auth.users au ON ca.officer_user_id = au.id
WHERE ca.status = 'active'
GROUP BY au.email
ORDER BY total_assigned DESC;

-- Assignment trends
SELECT
  DATE_TRUNC('day', assigned_at) as date,
  COUNT(*) as assignments
FROM case_assignments
WHERE assigned_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;

-- Reassignment rate
SELECT
  COUNT(CASE WHEN status = 'reassigned' THEN 1 END) * 100.0 / COUNT(*) as reassignment_rate
FROM case_assignments;
```

---

## 🔐 Security Considerations

1. **Authorization:**
   - Only Legal Managers can assign cases
   - Officers can only view their own cases
   - Admin can view all assignments

2. **Data Validation:**
   - Validate all inputs
   - Sanitize briefing notes
   - Prevent SQL injection

3. **Audit Trail:**
   - Log all assignments
   - Log all reassignments
   - Track who performed each action

4. **Concurrency Control:**
   - Database unique constraints
   - Transaction-based operations
   - Optimistic locking

---

## 📝 Best Practices

1. **Always provide briefing notes** - Helps officers understand case context
2. **Balance workload** - Use workload indicators when assigning
3. **Document reassignments** - Always provide clear reasons
4. **Regular audits** - Review assignment history periodically
5. **Monitor metrics** - Track assignment patterns and workload

---

## 🆘 Troubleshooting

### **Problem: Duplicate assignment error**
**Solution:** Check `case_assignments` table for active assignment, use reassignment flow if needed

### **Problem: Officer not appearing in My Cases**
**Solution:** Verify assignment status is 'active' and ended_at is NULL

### **Problem: Workload count incorrect**
**Solution:** Refresh `get_officer_workload()` function, check for orphaned assignments

### **Problem: Search returns no results**
**Solution:** Check case status filters, verify search query format

---

## ✅ Summary

This Case Assignment System provides:

✅ **Searchable case selection** with typeahead
✅ **Case preview/authentication** before assignment
✅ **Duplicate prevention** with database constraints
✅ **Assignment status visibility** showing current officer
✅ **Briefing notes** for context
✅ **Workload distribution** indicators
✅ **My Cases integration** with instant updates
✅ **Assignment history** tracking
✅ **Reassignment control** (optional)
✅ **Concurrency protection**

**Status:** Ready for implementation and testing!

---

**Last Updated:** March 2026
**Version:** 1.0
**Status:** 🟢 Production Ready

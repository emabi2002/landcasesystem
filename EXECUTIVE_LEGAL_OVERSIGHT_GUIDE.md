# Executive Legal Oversight & Assignment Workflow - Complete Guide

## Overview

The DLPP Legal Case Management System now features a fully automated Executive Legal Oversight and Assignment Workflow that ensures every case receives proper executive review and guidance before being assigned to litigation officers.

This system implements **mandatory accountability** and creates a **single source of legal truth** by enforcing a structured decision-making process.

---

## 🎯 Key Features

### ✅ Automatic Executive Notifications
- **Triggers**: Upon any case registration (new or existing)
- **Recipients**:
  - Secretary for Lands
  - Director, Legal Services
  - Manager, Legal Services
- **Content**: Complete case details, court reference, case summary
- **Priority**: High (action required)

### ✅ New vs Existing Case Differentiation
- System automatically identifies if a case is new or existing
- Notifications clearly marked with "NEW CASE" or "EXISTING CASE"
- Historical status presented for existing cases

### ✅ Structured Review Workflow
```
Case Registered
    ↓
Secretary for Lands (Reviews & Discusses)
    ↓
Director, Legal Services (Provides Guidance)
    ↓
Manager, Legal Services (Issues Instructions)
    ↓
Litigation Officer (Receives Formal Assignment)
```

### ✅ Comprehensive Record-Keeping
- All commentary, advice, and instructions permanently recorded
- Document attachments supported
- Complete audit trail maintained
- Version history tracked

### ✅ Full Case Visibility
- Executive officers have access to all case documents
- Historical advice and directives visible
- Complete activity timeline available
- Role-based access control enforced

---

## 👥 User Roles

### 1. Secretary for Lands (`secretary_lands`)
**Responsibilities:**
- Review newly registered cases
- Provide high-level commentary
- Discuss legal implications with Director Legal
- Offer strategic guidance

**Access:**
- View all cases
- Submit commentary and advice
- View all executive communications
- Access complete case history

### 2. Director, Legal Services (`director_legal`)
**Responsibilities:**
- Review cases and Secretary's commentary
- Discuss with Secretary for Lands
- Provide detailed legal guidance to Manager Legal
- Ensure legal compliance and strategy

**Access:**
- View all cases
- View Secretary's commentary
- Submit legal guidance and recommendations
- Access full case documentation

### 3. Manager, Legal Services (`manager_legal`)
**Responsibilities:**
- Review cases and all executive commentary
- Act on instructions from Secretary and Director
- Issue specific handling instructions
- Formally assign cases to Litigation Officers
- Monitor case progress

**Access:**
- View all cases and executive commentary
- Submit handling instructions
- Assign cases to litigation officers
- Attach documents to assignments
- Track assignment status

### 4. Litigation Officer (`litigation_officer`)
**Responsibilities:**
- Receive formal case assignments
- Review all executive commentary and instructions
- Handle case litigation activities
- Provide case updates
- Request additional guidance if needed

**Access:**
- View assigned cases
- Access all executive commentary for assigned cases
- View attached instructions and documents
- Submit case updates and reports

---

## 📋 Workflow Process

### Step 1: Case Registration

**When**: Any user registers a new case

**What Happens Automatically**:
1. Case record created in database
2. Case receives unique case number
3. System determines if case is new or existing:
   - **New Case**: No court reference OR status is "under_review"
   - **Existing Case**: Has court reference AND status indicates ongoing matter
4. **Automatic Notification** sent to all 3 executive officers simultaneously
5. Workflow tracking initiated
6. Audit trail entry created

**Notification Content**:
```
Title: New Case Registered - Executive Review Required

A [NEW CASE / EXISTING CASE] has been registered and requires your review.

Case Number: DLPP-2024-XXXXXX
Title: [Case Title]
Court Reference: [Reference Number or "Not provided"]
Registered by: [User Name]

Please review the case details and provide your commentary, advice, or instructions.

[View Case Button]
```

### Step 2: Secretary Review

**Who**: Secretary for Lands

**Actions**:
1. Receives notification
2. Reviews case details and documents
3. Discusses with Director Legal (offline or via system)
4. Submits commentary via Executive Review Dashboard

**To Submit Commentary**:
1. Navigate to **Executive Review Dashboard** (`/executive/review`)
2. Find case in "Pending Reviews" tab
3. Click **"Provide Advice"**
4. Fill in:
   - **Commentary**: General observations and strategic input
   - **Legal Advice**: Specific legal considerations
   - **Recommendations**: Suggested course of action
5. Click **"Submit Advice"**

**What Happens Next**:
- Secretary's input permanently recorded
- Director Legal automatically notified
- Workflow stage updated to "Secretary Review Complete"
- Case creator notified of Secretary's input

### Step 3: Director Guidance

**Who**: Director, Legal Services

**Actions**:
1. Receives notification that Secretary has provided input
2. Reviews case and Secretary's commentary
3. Provides legal guidance and recommendations
4. Submits via Executive Review Dashboard

**Submission Process**: Same as Secretary (Step 2)

**What Happens Next**:
- Director's guidance permanently recorded
- Manager Legal automatically notified
- Workflow stage updated to "Director Guidance Complete"
- Both Secretary and case creator notified

### Step 4: Manager Instructions & Assignment

**Who**: Manager, Legal Services

**Actions**:
1. Receives notification that both Secretary and Director have provided input
2. Reviews case and all executive commentary
3. Provides final handling instructions
4. **Assigns case to Litigation Officer**

**To Assign Case**:
1. Navigate to case detail page
2. Click **"Assign Case"** button
3. Fill in assignment form:
   - **Litigation Officer**: Select from dropdown
   - **Assignment Type**: Primary Officer / Supporting Officer / Review
   - **Instructions**: Specific handling instructions
   - **Attach Documents**: Optional supporting documents
4. Click **"Assign Case"**

**What's Included in Assignment**:
- Secretary's commentary
- Director's legal guidance
- Manager's handling instructions
- All executive discussions and advice
- Attached documents
- Complete case context

**What Happens Next**:
- Formal assignment record created
- Litigation Officer receives comprehensive notification
- Task automatically created for officer
- Workflow marked as "Officer Assigned"
- Complete audit trail updated

### Step 5: Officer Acknowledgment & Handling

**Who**: Assigned Litigation Officer

**Actions**:
1. Receives notification with full case context
2. Reviews all executive commentary
3. Acknowledges assignment
4. Proceeds with case handling per instructions
5. Provides updates and seeks guidance as needed

---

## 🖥️ User Interface Guide

### Executive Review Dashboard

**Access**: `/executive/review`

**Who Can Access**: Secretary for Lands, Director Legal, Manager Legal (and Admin)

**Features**:

#### Statistics Dashboard
- **Pending Reviews**: Number of cases awaiting your input
- **Completed**: Cases you've reviewed
- **Urgent**: Cases pending over 3 days

#### Pending Reviews Tab
Shows all cases requiring your review:
- Case number and title
- "NEW CASE" or "EXISTING CASE" badge
- Urgency indicator (days pending)
- Court reference
- Case summary
- **Actions**:
  - "View Case" - See full case details
  - "Provide Advice" - Submit your input

#### Completed Tab
Shows cases you've already reviewed:
- Case details
- Completion date
- Link to view case

#### Advice Submission Dialog
When you click "Provide Advice":
- **Commentary**: General observations (optional)
- **Legal Advice**: Specific legal guidance (optional)
- **Recommendations**: Suggested actions (optional)
- At least one field must be filled
- All submissions are permanently recorded
- Next officer automatically notified

### Case Detail Page Enhancements

**New Sections**:

#### Executive Workflow Tab
- Visual timeline of workflow progression
- All executive commentary displayed
- Officer names and roles shown
- Timestamps for each action
- Visibility: Secretary → Director → Manager → Officer

#### Assignment Section
- Current assignment status
- Assigned officer information
- Assignment instructions
- Executive commentary summary
- Attached documents

---

## 📊 Reporting & Audit

### Available Reports

#### 1. Executive Workflow Summary
**Query**: `SELECT * FROM executive_workflow_summary;`

Shows for each case:
- Case details
- Workflow entries count
- Pending reviews
- Completed reviews
- Latest activity
- Assignment status

#### 2. Pending Executive Reviews by Officer
**Query**: `SELECT * FROM pending_executive_reviews;`

Shows:
- Cases pending review by each officer
- Days pending
- Case details
- Priority indicators

#### 3. Case Assignment Status
**Query**: `SELECT * FROM case_assignment_status;`

Shows:
- All assignments
- Assigned officer details
- Assignment status
- Days since assignment
- Acknowledgment status

### Audit Trail

Every action is logged in multiple tables:

1. **executive_workflow**: Workflow stage progression
2. **case_comments**: All commentary and advice
3. **case_history**: Major events (registration, advice, assignment)
4. **notifications**: All communications
5. **case_assignments**: Formal assignment records

---

## 🔐 Security & Access Control

### Row Level Security (RLS)
All tables have RLS policies ensuring:
- Users only see cases they're authorized to view
- Executive officers can view all cases
- Litigation officers only see assigned cases
- Complete audit trail maintained

### Role-Based Permissions
- **Secretary for Lands**: View all, comment, no assignment
- **Director Legal**: View all, comment, no assignment
- **Manager Legal**: View all, comment, **assign cases**
- **Litigation Officer**: View assigned only, no executive workflow access
- **Admin**: Full system access

---

## 📚 Database Schema

### Key Tables

#### executive_workflow
Tracks workflow progression for each case:
```sql
- case_id: UUID
- stage: case_registered | secretary_review | director_guidance | manager_instruction | officer_assigned
- officer_role: secretary_lands | director_legal | manager_legal
- commentary, advice, recommendations: TEXT
- status: pending | in_progress | completed
- timestamps
```

#### case_assignments
Formal case assignments to officers:
```sql
- case_id, assigned_to, assigned_by: UUID
- assignment_type: primary_officer | supporting_officer | review
- instructions: TEXT
- executive_commentary: TEXT (compiled from all officers)
- secretary_advice, director_guidance, manager_instructions: TEXT
- attached_documents: JSONB
- status: pending | acknowledged | in_progress | completed
```

#### Enhanced case_comments
```sql
- attachments: JSONB (file URLs, names, types)
- workflow_stage: TEXT
- officer_role: TEXT
- visibility: public | executive_only | internal
- requires_response: BOOLEAN
```

#### Enhanced notifications
```sql
- case_type, is_new_case: Identification
- court_reference, case_summary: Context
- workflow_stage, officer_role: Tracking
```

---

## 🚀 Getting Started

### For Executive Officers

1. **Login** to the system
2. Navigate to **Executive Review Dashboard** (link in main menu)
3. View **Pending Reviews**
4. For each case:
   - Click "View Case" to review details
   - Click "Provide Advice" to submit your input
5. Track your completed reviews in the "Completed" tab

### For Litigation Officers

1. **Login** to the system
2. Check **Notifications** for new assignments
3. Navigate to **My Assignments** (dashboard widget or dedicated page)
4. For each assignment:
   - Read all executive commentary
   - Review attached instructions
   - Acknowledge assignment
   - Proceed with handling

### For Administrators

1. **Create User Accounts** for executive officers with appropriate roles:
   - `secretary_lands`
   - `director_legal`
   - `manager_legal`
   - `litigation_officer`
2. **Monitor Workflow** using reporting views
3. **Manage Permissions** as needed

---

## ❓ FAQ

### Q: What happens if an officer doesn't provide input?
**A:** The case remains in "Pending Reviews" and is marked as urgent after 3 days. Administrators can send reminders or escalate as per organizational policy.

### Q: Can officers skip steps in the workflow?
**A:** No. The system enforces the Secretary → Director → Manager sequence. Each must provide input before the next is notified.

### Q: Can a litigation officer request additional guidance?
**A:** Yes. Officers can add comments requesting clarification. The system can notify relevant executive officers.

### Q: What if there are multiple Secretaries/Directors/Managers?
**A:** All users with a specific role (e.g., `director_legal`) receive notifications. Any of them can provide input. The first to respond moves the workflow forward.

### Q: Can executive commentary be edited after submission?
**A:** Yes, but all edits are tracked with timestamps and marked as "edited" in the audit trail.

### Q: How do attachments work?
**A:** Attachments are stored in the Supabase storage bucket and referenced via URLs in the JSONB `attachments` field. They're linked to comments and assignments.

---

## 🎯 Best Practices

### For Executive Officers

1. **Respond Promptly**: Review and respond within 3 days
2. **Be Specific**: Provide clear, actionable advice
3. **Reference Documents**: Cite relevant legal authorities or case documents
4. **Communicate**: Discuss complex cases with fellow executives before submitting
5. **Use Attachments**: Include supporting documents when needed

### For Manager Legal (Assignment)

1. **Review All Commentary**: Ensure you've read Secretary and Director input
2. **Clear Instructions**: Provide specific, actionable instructions to litigation officers
3. **Include Context**: Compile and summarize executive discussions
4. **Appropriate Officer**: Assign to officer with relevant expertise
5. **Set Expectations**: Include timeline and priority guidance

### For Litigation Officers

1. **Read Everything**: Review all executive commentary before proceeding
2. **Acknowledge Promptly**: Acknowledge assignments within 24 hours
3. **Follow Instructions**: Adhere to executive guidance
4. **Seek Clarification**: Don't hesitate to request additional guidance
5. **Provide Updates**: Keep executives informed of progress

---

## 📞 Support

### Technical Issues
- Contact IT Support
- Check system logs for errors
- Review database audit trail

### Workflow Questions
- Refer to this guide
- Contact Manager, Legal Services
- Escalate to Secretary for Lands if needed

### Training
- New user orientation available
- Role-specific training sessions
- Online documentation at `/docs`

---

## ✅ Implementation Checklist

### Database Setup
- [x] Run `database-executive-oversight-migration.sql`
- [ ] Verify tables created successfully
- [ ] Test database functions
- [ ] Confirm RLS policies active

### User Management
- [ ] Create Secretary for Lands account(s)
- [ ] Create Director Legal account(s)
- [ ] Create Manager Legal account(s)
- [ ] Create Litigation Officer accounts
- [ ] Assign correct roles to each user

### Testing
- [ ] Test case registration triggers notifications
- [ ] Verify Secretary can submit advice
- [ ] Confirm Director receives notification after Secretary
- [ ] Test Manager can assign cases
- [ ] Verify Litigation Officer receives comprehensive assignment
- [ ] Confirm all audit trails working

### Training
- [ ] Train executive officers on review dashboard
- [ ] Train Manager Legal on assignment process
- [ ] Train litigation officers on receiving assignments
- [ ] Distribute this user guide

### Go Live
- [ ] Announce new workflow to all users
- [ ] Monitor first few cases closely
- [ ] Gather feedback
- [ ] Refine process as needed

---

## 🎉 Benefits

### Accountability
- Every case has executive oversight
- All decisions documented
- Clear chain of command
- Audit trail for compliance

### Efficiency
- Automatic notifications
- Structured workflow
- Reduced informal communication
- Faster case handling

### Quality
- Expert review at multiple levels
- Comprehensive guidance to officers
- Reduced errors and oversights
- Better case outcomes

### Compliance
- Complete documentation
- Transparent decision-making
- Regulatory compliance
- Risk mitigation

---

**Version**: 1.0
**Date**: December 2024
**System**: DLPP Legal Case Management System
**Contact**: support@dlpp.gov.pg

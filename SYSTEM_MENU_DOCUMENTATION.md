# 📋 DLPP Legal Case Management System
## Complete Menu System Documentation

**Version:** 1.0
**Last Updated:** June 2026
**System:** Department of Lands & Physical Planning - Legal CMS

---

## 📊 Menu Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DLPP Legal CMS Menu System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Dashboard                                                   │
│     └── Overview                                                │
│                                                                 │
│  ⚖️ Case Workflow                                               │
│     ├── Register Case                                           │
│     ├── Assignment Inbox                                        │
│     ├── My Cases                                                │
│     ├── All Cases                                               │
│     ├── Directions & Hearings                                   │
│     ├── Compliance                                              │
│     └── Notifications                                           │
│                                                                 │
│  💼 Case Management                                             │
│     ├── Calendar                                                │
│     ├── Tasks                                                   │
│     ├── Documents                                               │
│     └── Land Parcels                                            │
│                                                                 │
│  💬 Communications                                              │
│     ├── Correspondence                                          │
│     ├── Communications                                          │
│     └── File Requests                                           │
│                                                                 │
│  ⚖️ Legal                                                       │
│     ├── Lawyers                                                 │
│     └── Filings                                                 │
│                                                                 │
│  💰 Finance                                                     │
│     └── Litigation Costs                                        │
│                                                                 │
│  📈 Reports                                                     │
│     └── Reports                                                 │
│                                                                 │
│  ⚙️ Administration                                              │
│     ├── Admin Panel                                             │
│     ├── Master Files                                            │
│     ├── Internal Officers                                       │
│     ├── User Management                                         │
│     ├── Groups                                                  │
│     └── Modules                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ DASHBOARD

### Overview (`/dashboard`)

**Purpose:** Central hub displaying system-wide analytics and key performance indicators.

**Features:**
| Feature | Description |
|---------|-------------|
| **Key Metrics Cards** | Total cases, active cases, pending assignments, closed cases |
| **Case Status Distribution** | Pie chart showing cases by status (Under Review, In Court, Closed, etc.) |
| **Monthly Trend Chart** | Line graph of case registrations over time |
| **Regional Distribution** | Bar chart of cases by region/province |
| **Case Age Analysis** | Chart showing aging of active cases |
| **Year Comparison** | Compare current year vs previous year statistics |
| **Alerts & Notifications** | Upcoming deadlines, overdue items, urgent matters |
| **Litigation Costs Summary** | Total costs, pending payments, cost trends |
| **Workflow Progress** | Visual stepper showing cases at each workflow stage |

**Access:** Super Admin, Manager, Case Officer (limited view)

**Actions Available:**
- View statistics and analytics
- Click cards to navigate to detailed views
- Filter by date range
- Export dashboard data

---

## 2️⃣ CASE WORKFLOW

### 2.1 Register Case (`/cases/new`)

**Purpose:** Create new legal case records in the system.

**Features:**
| Section | Fields |
|---------|--------|
| **Case Identification** | Internal Case No., Court File Number, Track Number, Region |
| **Parties & Matter** | Parties to Proceedings, Matter Type, Case Category |
| **Key Dates** | Date Filed, Documents Served, Returnable Date, Hearing Type |
| **Land Details** | Land Description, Zoning, Survey Plan No., Lease Type, Dates |
| **Legal Issues** | Allegations/Cause of Action, Reliefs Sought |
| **Legal Representatives** | Plaintiff's/Defendant's Lawyer, Sol Gen Officer, DLPP Action Officer |
| **Status & Priority** | Status, Priority, Case Title, Notes, Section 5 Notice |

**DLPP Role Toggle:**
- **Defendant/Respondent** - DLPP is being sued
- **Plaintiff/Applicant** - DLPP is suing

**Actions:**
- Save Case → Creates case and redirects to case detail
- Cancel → Returns to case list

---

### 2.2 Assignment Inbox (`/cases/assignments`)

**Purpose:** Manage case assignments to officers. Queue for managers to assign cases and for officers to view their assignments.

**Features:**
| Feature | Description |
|---------|-------------|
| **Pending Cases Queue** | Cases waiting to be assigned |
| **Officer Workload View** | See how many cases each officer has |
| **Assignment History** | Track who was assigned and when |
| **Priority Indicators** | Urgent cases highlighted |

**Actions:**
| Action | Who Can Do It | Description |
|--------|---------------|-------------|
| Assign Case | Manager, Super Admin | Select case → Choose officer → Assign |
| Reassign Case | Manager, Super Admin | Change assigned officer |
| Accept Assignment | Case Officer | Confirm assignment received |
| View Details | All | Click to see case details |

**Workflow:**
```
Case Registered → Pending Assignment → Manager Assigns → Officer Accepts → In Progress
```

---

### 2.3 My Cases (`/cases?my_cases=true`)

**Purpose:** Filtered view showing only cases assigned to the logged-in user.

**Features:**
- Personal case queue
- Quick access to assigned work
- Status tracking for owned cases
- Priority sorting

**Columns Displayed:**
| Column | Description |
|--------|-------------|
| Case Number | Internal reference number |
| Title | Brief case description |
| Status | Current workflow status |
| Priority | Low, Medium, High, Urgent |
| Created | Registration date |

---

### 2.4 All Cases (`/cases`)

**Purpose:** Complete searchable list of all cases in the system.

**Features:**
| Feature | Description |
|---------|-------------|
| **Search** | Search by title, case number, party name |
| **Status Filter** | Filter by: All, Under Review, In Court, Mediation, Tribunal, Judgment, Closed, Settled |
| **Type Filter** | Filter by case category/type |
| **Sorting** | Sort by date, status, priority |
| **Pagination** | Navigate through large case lists |

**Actions:**
| Action | Description |
|--------|-------------|
| + Create New Case | Opens registration form |
| Click Row | Opens case detail view |
| Search | Real-time filtering |

**Case Statuses:**
| Status | Description | Color |
|--------|-------------|-------|
| `under_review` | Initial review stage | Yellow |
| `in_court` | Active court proceedings | Blue |
| `mediation` | In mediation process | Purple |
| `tribunal` | Before tribunal | Orange |
| `judgment` | Awaiting/received judgment | Green |
| `closed` | Case completed | Gray |
| `settled` | Settled out of court | Green |

---

### 2.5 Directions & Hearings (`/directions`)

**Purpose:** Manage court directions, hearing schedules, and court appearances.

**Features:**
| Feature | Description |
|---------|-------------|
| **Calendar View** | Visual calendar of all hearings |
| **List View** | Table of upcoming hearings |
| **Case Link** | Each hearing linked to parent case |
| **Notifications** | Auto-alerts before hearing dates |

**Data Fields:**
| Field | Description |
|-------|-------------|
| Hearing Date | Date and time of hearing |
| Hearing Type | Directions, Pre-trial, Trial, Mention, etc. |
| Venue | Court location |
| Judge | Presiding judge/officer |
| Case Reference | Linked case number |
| Outcome | Record of what happened |
| Next Steps | Actions required after hearing |

**Actions:**
| Action | Description |
|--------|-------------|
| Add Direction | Schedule new hearing |
| Edit | Modify hearing details |
| Record Outcome | Add hearing results |
| Reschedule | Change date/time |
| Cancel | Mark hearing as cancelled |

---

### 2.6 Compliance (`/compliance`)

**Purpose:** Track compliance requirements, deadlines, and regulatory obligations.

**Features:**
| Feature | Description |
|---------|-------------|
| **Compliance Dashboard** | Overview of compliance status |
| **Deadline Tracking** | Upcoming deadlines highlighted |
| **Overdue Items** | Red-flagged overdue requirements |
| **Evidence Upload** | Attach compliance documentation |

**Status Indicators:**
| Status | Color | Description |
|--------|-------|-------------|
| Compliant | Green | Requirement met |
| Pending | Yellow | In progress |
| Overdue | Red | Past deadline |
| Not Applicable | Gray | N/A for this case |

**Actions:**
- Add compliance requirement
- Mark as compliant
- Upload evidence
- Request extension
- Escalate non-compliance

---

### 2.7 Notifications (`/notifications`)

**Purpose:** System-wide notification center for alerts, reminders, and messages.

**Features:**
| Feature | Description |
|---------|-------------|
| **Notification Bell** | Header icon with unread count |
| **Full List** | All notifications with timestamps |
| **Filters** | All / Unread toggle |
| **Categories** | Case, Hearing, Task, System |

**Notification Types:**
| Type | Trigger |
|------|---------|
| Case Assigned | When case assigned to you |
| Hearing Reminder | 3 days before hearing |
| Task Due | Task deadline approaching |
| Document Added | New document uploaded |
| Status Change | Case status updated |
| Comment Added | New comment on your case |

**Actions:**
- Mark as read
- Mark all as read
- Click to navigate to source
- Dismiss notification

---

## 3️⃣ CASE MANAGEMENT

### 3.1 Calendar (`/calendar`)

**Purpose:** Visual calendar for all case-related events, deadlines, and hearings.

**Features:**
| View | Description |
|------|-------------|
| **Month View** | Full month calendar grid |
| **Week View** | Weekly detailed view |
| **Day View** | Single day schedule |
| **Agenda View** | List of upcoming events |

**Event Types:**
| Type | Icon | Description |
|------|------|-------------|
| Hearing | Gavel | Court appearances |
| Deadline | Clock | Filing/submission deadlines |
| Meeting | Users | Internal meetings |
| Reminder | Bell | Custom reminders |
| Task Due | CheckSquare | Task deadlines |

**Actions:**
- Add Event → Create new calendar entry
- Click Event → View/edit details
- Drag & Drop → Reschedule (week/day view)
- Filter by Case → Show events for specific case

**Color Coding:**
- Red: Urgent/Overdue
- Yellow: Upcoming (within 3 days)
- Blue: Standard events
- Green: Completed
- Gray: Cancelled

---

### 3.2 Tasks (`/tasks`)

**Purpose:** Task management system for case-related work items.

**Views:**
| View | Description |
|------|-------------|
| **Kanban Board** | Drag-drop cards between columns |
| **List View** | Table with sorting/filtering |

**Task Statuses:**
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   TO DO     │ → │ IN PROGRESS │ → │   REVIEW    │ → │  COMPLETED  │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

**Task Fields:**
| Field | Description |
|-------|-------------|
| Title | Task name |
| Description | Detailed instructions |
| Assignee | Person responsible |
| Due Date | Deadline |
| Priority | Low, Medium, High, Urgent |
| Case Link | Related case (optional) |
| Checklist | Sub-tasks |
| Attachments | Related files |

**Actions:**
- Create Task
- Assign/Reassign
- Update Status (drag in Kanban)
- Add Comments
- Mark Complete
- Delete Task

---

### 3.3 Documents (`/documents`)

**Purpose:** Document management system for all case-related files.

**Features:**
| Feature | Description |
|---------|-------------|
| **Upload** | Drag-drop or click to upload |
| **Categories** | Court Filing, Evidence, Correspondence, etc. |
| **Preview** | In-browser document preview |
| **Search** | Search by name, type, content |
| **Versioning** | Track document versions |

**Document Types:**
| Type | Description |
|------|-------------|
| Court Filing | Pleadings, motions, briefs |
| Evidence | Exhibits, photos, records |
| Correspondence | Letters, emails |
| Contract | Agreements, leases |
| Legal Opinion | Internal legal advice |
| Court Order | Orders, judgments |
| Other | Miscellaneous |

**Actions:**
| Action | Description |
|--------|-------------|
| Upload | Add new document |
| Download | Save to local computer |
| Preview | View in browser |
| Edit Metadata | Change title, category |
| Link to Case | Associate with case |
| Delete | Remove (soft delete) |
| Share | Generate shareable link |

---

### 3.4 Land Parcels (`/land-parcels`)

**Purpose:** Geographic information system for land parcels involved in cases.

**Features:**
| Feature | Description |
|---------|-------------|
| **Map View** | Interactive map with parcel markers |
| **List View** | Table of all parcels |
| **Parcel Details** | Full parcel information |
| **Case Link** | Link parcels to related cases |

**Parcel Data Fields:**
| Field | Description |
|-------|-------------|
| Parcel ID / Lot No. | Unique identifier |
| Title Reference | Land title number |
| Location | Address / Description |
| Province | Geographic province |
| District | District name |
| Area | Size in hectares/sqm |
| GPS Coordinates | Latitude/Longitude |
| Zoning | Land use classification |
| Current Status | Active, Disputed, Resolved |

**Map Features:**
- Zoom in/out
- Satellite/Street view toggle
- Click marker for parcel info
- Filter by case
- Cluster nearby parcels

---

## 4️⃣ COMMUNICATIONS

### 4.1 Correspondence (`/correspondence`)

**Purpose:** Track external communications - letters, emails, and faxes.

**Features:**
| Feature | Description |
|---------|-------------|
| **Log All Communications** | Record incoming/outgoing |
| **Link to Cases** | Associate with specific cases |
| **Attachments** | Store communication copies |
| **Search** | Find by sender, subject, date |

**Fields:**
| Field | Description |
|-------|-------------|
| Type | Letter, Email, Fax, Phone |
| Direction | Incoming / Outgoing |
| Date | When sent/received |
| From/To | Sender/Recipient |
| Subject | Communication subject |
| Content | Body text or summary |
| Case Reference | Linked case |
| Attachments | Scanned copies |
| Follow-up Required | Yes/No flag |

**Actions:**
- Add Correspondence
- View Details
- Edit
- Link to Case
- Add Follow-up Notes

---

### 4.2 Communications Log (`/communications`)

**Purpose:** Internal communications log - meetings, phone calls, internal memos.

**Features:**
- Meeting notes
- Phone call records
- Internal memo tracking
- Team communication log

**Fields:**
| Field | Description |
|-------|-------------|
| Type | Meeting, Phone Call, Memo, Other |
| Date/Time | When occurred |
| Participants | Who was involved |
| Subject | Topic |
| Notes | Detailed notes |
| Action Items | Follow-up tasks |
| Case Reference | Related case |

---

### 4.3 File Requests (`/file-requests`)

**Purpose:** Track requests for physical files and documents from registry/archives.

**Features:**
| Feature | Description |
|---------|-------------|
| **Request Queue** | Pending file requests |
| **Status Tracking** | Request → In Progress → Fulfilled |
| **Urgency Levels** | Low, Medium, High |
| **History** | Completed request log |

**Request Workflow:**
```
Request Submitted → Assigned to Clerk → File Retrieved → Delivered → Returned
```

**Fields:**
| Field | Description |
|-------|-------------|
| File Requested | What file is needed |
| Requestor | Who needs it |
| Purpose | Why needed |
| Case Reference | Related case |
| Urgency | Low, Medium, High |
| Needed By | Deadline |
| Status | Pending, In Progress, Fulfilled, Rejected |

---

## 5️⃣ LEGAL

### 5.1 Lawyers (`/lawyers`)

**Purpose:** Directory of external lawyers and law firms involved in cases.

**Features:**
| Feature | Description |
|---------|-------------|
| **Lawyer Directory** | Searchable list of lawyers |
| **Firm Information** | Law firm details |
| **Contact Details** | Phone, email, address |
| **Case History** | Cases involving this lawyer |

**Lawyer Record Fields:**
| Field | Description |
|-------|-------------|
| Name | Full name |
| Firm | Law firm name |
| Position | Partner, Associate, etc. |
| Bar Number | Professional registration |
| Specialization | Areas of practice |
| Phone | Contact number |
| Email | Email address |
| Address | Office address |
| Status | Active / Inactive |
| Notes | Additional information |

**Actions:**
- Add Lawyer
- Edit Details
- View Case History
- Deactivate

---

### 5.2 Court Filings (`/filings`)

**Purpose:** Track court filings, submissions, and their statuses.

**Features:**
| Feature | Description |
|---------|-------------|
| **Filing Register** | All court submissions |
| **Status Tracking** | Draft → Filed → Served → Accepted |
| **Deadline Alerts** | Filing deadline warnings |
| **Document Links** | Link to filed documents |

**Filing Record Fields:**
| Field | Description |
|-------|-------------|
| Filing Type | Writ, Statement, Motion, etc. |
| Case Reference | Related case |
| Court | Which court |
| Filing Date | When filed |
| Filed By | Who submitted |
| Status | Draft, Filed, Served, Accepted, Rejected |
| Response Due | Deadline for response |
| Outcome | Court's response |

**Filing Types:**
- Writ of Summons
- Statement of Claim
- Defence
- Reply
- Motion/Application
- Affidavit
- Notice of Appeal
- Written Submissions

---

## 6️⃣ FINANCE

### 6.1 Litigation Costs (`/litigation-costs`)

**Purpose:** Track all costs associated with litigation.

**Features:**
| Feature | Description |
|---------|-------------|
| **Cost Register** | All case-related expenses |
| **Cost Summary** | Total by case, category |
| **Invoice Tracking** | Link invoices to costs |
| **Budget Monitoring** | Track against estimates |
| **Cost Reports** | Generate cost analyses |

**Cost Categories:**
| Category | Description |
|----------|-------------|
| Legal Fees | Lawyer charges |
| Filing Fees | Court filing costs |
| Expert Fees | Expert witness costs |
| Travel | Travel expenses |
| Disbursements | Miscellaneous costs |
| Printing | Document printing |
| Service Fees | Process server |
| Settlement | Settlement payments |

**Cost Record Fields:**
| Field | Description |
|-------|-------------|
| Cost Type | Category |
| Amount | Cost value |
| Date Incurred | When expense occurred |
| Case Reference | Related case |
| Vendor/Payee | Who was paid |
| Invoice Number | Invoice reference |
| Status | Pending, Approved, Paid, Disputed |
| Supporting Docs | Receipts, invoices |

**Cost Workflow:**
```
Recorded → Pending Approval → Approved → Payment Requested → Paid
```

**Reports Available:**
- Cost by Case
- Cost by Category
- Monthly/Yearly Summary
- Outstanding Payments
- Cost Trends

---

## 7️⃣ REPORTS

### Reports (`/reports`)

**Purpose:** Generate and export analytical reports.

**Available Reports:**
| Report | Description |
|--------|-------------|
| **Case Summary** | Overview of all cases |
| **Case Status Distribution** | Cases by status |
| **Officer Workload** | Cases per officer |
| **Compliance Report** | Compliance status summary |
| **Cost Analysis** | Litigation cost breakdown |
| **Monthly Activity** | Activities this month |
| **Regional Distribution** | Cases by region |
| **Aging Cases** | Cases by age |
| **Hearing Schedule** | Upcoming hearings |
| **Closed Cases** | Recently closed cases |

**Export Formats:**
- PDF (formatted report)
- Excel (XLSX)
- CSV (raw data)

**Features:**
- Date range selection
- Filter by status/type/region
- Save report templates
- Schedule recurring reports
- Print directly

---

## 8️⃣ ADMINISTRATION

### 8.1 Admin Panel (`/admin`)

**Purpose:** System administration overview and quick access.

**Features:**
- System health status
- Quick links to admin functions
- Recent admin activity log
- System statistics

---

### 8.2 Master Files (`/admin/master-files`)

**Purpose:** Manage lookup tables and dropdown values.

**Master Data Tables:**
| Table | Description |
|-------|-------------|
| Regions | Geographic regions |
| Case Statuses | Status options |
| Case Categories | Case type options |
| Priority Levels | Priority options |
| Matter Types | Legal matter types |
| Hearing Types | Types of hearings |
| Lease Types | Land lease types |
| Divisions | Organizational divisions |
| Courts | Court names |
| Document Types | Document categories |

**Actions:**
- Add new item
- Edit existing
- Deactivate (soft delete)
- Reorder items

---

### 8.3 Internal Officers (`/admin/internal-officers`)

**Purpose:** Manage DLPP staff who work on cases.

**Features:**
| Feature | Description |
|---------|-------------|
| **Officer List** | All internal officers |
| **Assignment Tracking** | Current case load |
| **Availability** | Active/On Leave/Inactive |
| **Role Assignment** | Job roles |

**Officer Fields:**
| Field | Description |
|-------|-------------|
| Name | Full name |
| Employee ID | Staff number |
| Position | Job title |
| Division | Department |
| Email | Work email |
| Phone | Work phone |
| Status | Active, On Leave, Inactive |
| Current Cases | Number assigned |

---

### 8.4 User Management (`/admin/users`)

**Purpose:** Manage system user accounts.

**Features:**
| Feature | Description |
|---------|-------------|
| **User List** | All system users |
| **Create User** | Add new user account |
| **Edit User** | Modify user details |
| **Group Assignment** | Assign to permission groups |
| **Password Reset** | Reset user passwords |
| **Deactivate** | Disable user access |

**User Fields:**
| Field | Description |
|-------|-------------|
| Email | Login email (unique) |
| Full Name | Display name |
| Role/Title | Job title |
| Department | Organizational unit |
| Phone | Contact number |
| Status | Active/Inactive |
| Groups | Permission groups |
| Last Login | Last access time |

**Actions:**
| Action | Description |
|--------|-------------|
| Add User | Create new account |
| Edit | Update details |
| Manage Groups | Assign to groups |
| Reset Password | Send reset email |
| Deactivate | Disable access |

---

### 8.5 Groups (`/admin/groups`)

**Purpose:** Manage permission groups (roles).

**Default Groups:**
| Group | Description | Access Level |
|-------|-------------|--------------|
| Super Admin | Full system access | Everything |
| Manager | Oversight and approval | Most modules, no admin |
| Case Officer | Case processing | Case-related modules |
| Legal Clerk | Support role | Limited case access |
| Document Clerk | Document management | Documents, file requests |
| Viewer | Read-only access | View only |

**Group Permissions:**
| Permission | Description |
|------------|-------------|
| can_read | View records |
| can_create | Create new records |
| can_update | Edit existing records |
| can_delete | Remove records |
| can_print | Print documents |
| can_approve | Approve workflows |
| can_export | Export data |

**Actions:**
- Create Group
- Edit Group
- Configure Permissions (per module)
- Delete Group (reassign users first)

---

### 8.6 Modules (`/admin/modules`)

**Purpose:** View and manage system modules.

**Features:**
| Feature | Description |
|---------|-------------|
| **Module List** | All system modules |
| **Module Status** | Enabled/Disabled |
| **Permission Overview** | Which groups access which modules |

**Module Information:**
| Field | Description |
|-------|-------------|
| Module Name | Display name |
| Module Key | System identifier |
| Description | What it does |
| Category | Grouping category |
| Route | URL path |
| Icon | Menu icon |

---

## 📱 Permission Matrix Summary

| Module | Super Admin | Manager | Case Officer | Doc Clerk | Viewer |
|--------|:-----------:|:-------:|:------------:|:---------:|:------:|
| Dashboard | ✅ Full | ✅ Full | ✅ Read | ❌ | ✅ Read |
| Register Case | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| Assignment Inbox | ✅ Full | ✅ Full | ✅ Read | ❌ | ❌ |
| My Cases | ✅ Full | ✅ Full | ✅ Full | ❌ | ✅ Read |
| All Cases | ✅ Full | ✅ Full | ✅ Full | ✅ Read | ✅ Read |
| Directions | ✅ Full | ✅ Full | ✅ CRUD | ✅ Read | ✅ Read |
| Compliance | ✅ Full | ✅ Full | ✅ CRUD | ❌ | ✅ Read |
| Notifications | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Read |
| Calendar | ✅ Full | ✅ Full | ✅ CRUD | ✅ Read | ✅ Read |
| Tasks | ✅ Full | ✅ Full | ✅ CRUD | ✅ CRUD | ✅ Read |
| Documents | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Read |
| Land Parcels | ✅ Full | ✅ Full | ✅ CRUD | ❌ | ✅ Read |
| Correspondence | ✅ Full | ✅ Full | ✅ CRUD | ✅ Read | ✅ Read |
| Communications | ✅ Full | ✅ Full | ✅ CRUD | ✅ Read | ✅ Read |
| File Requests | ✅ Full | ✅ Full | ✅ CRUD | ✅ Full | ❌ |
| Lawyers | ✅ Full | ✅ Full | ✅ Read | ❌ | ✅ Read |
| Filings | ✅ Full | ✅ Full | ✅ CRU | ❌ | ✅ Read |
| Litigation Costs | ✅ Full | ✅ Full | ✅ CRU | ❌ | ✅ Read |
| Reports | ✅ Full | ✅ Full | ✅ Read | ✅ Read | ✅ Read |
| Administration | ✅ Full | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full = All permissions (CRUD + Print + Export + Approve)
- ✅ CRUD = Create, Read, Update (no Delete)
- ✅ CRU = Create, Read, Update
- ✅ Read = Read only
- ❌ = No access

---

## 🔄 Typical Workflow

```
1. REGISTRATION
   └── Case Officer/Reception registers new case at /cases/new

2. ASSIGNMENT
   └── Manager assigns case to officer via /cases/assignments

3. CASE PROCESSING
   ├── Officer works on case via /cases (My Cases)
   ├── Schedules hearings via /directions
   ├── Uploads documents via /documents
   ├── Creates tasks via /tasks
   └── Tracks deadlines via /calendar

4. COMMUNICATIONS
   ├── Logs correspondence via /correspondence
   ├── Records meetings via /communications
   └── Requests files via /file-requests

5. LITIGATION
   ├── Files court documents via /filings
   ├── Tracks costs via /litigation-costs
   └── Monitors compliance via /compliance

6. CLOSURE
   ├── Records judgment/outcome
   ├── Closes case
   └── Archives documents
```

---

## 📞 Quick Reference

| I Need To... | Go To |
|-------------|-------|
| Register a new case | Case Workflow → Register Case |
| See my assigned cases | Case Workflow → My Cases |
| Assign a case to someone | Case Workflow → Assignment Inbox |
| Schedule a hearing | Case Workflow → Directions & Hearings |
| Upload a document | Case Management → Documents |
| Create a task | Case Management → Tasks |
| View the calendar | Case Management → Calendar |
| Log a letter received | Communications → Correspondence |
| Request a physical file | Communications → File Requests |
| Record a legal cost | Finance → Litigation Costs |
| Generate a report | Reports → Reports |
| Add a new user | Administration → User Management |
| Configure permissions | Administration → Groups |

---

**End of Documentation**

*DLPP Legal Case Management System v1.0*

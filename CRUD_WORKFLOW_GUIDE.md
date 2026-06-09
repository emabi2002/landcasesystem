# 📚 CRUD WORKFLOW GUIDE - DLPP Legal Case Management System

**Version:** 1.0 | **Updated:** June 5, 2026

---

## 🔄 System Workflow Overview

```
START                    UPDATE CYCLE                         END
  │                          │                                 │
  ▼                          ▼                                 ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│REGISTER │─▶│ ASSIGN  │─▶│ PROCESS │─▶│LITIGATE │─▶│  CLOSE  │
│  CASE   │  │  CASE   │  │  CASE   │  │  CASE   │  │  CASE   │
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
     │            │            │            │            │
     ▼            ▼            ▼            ▼            ▼
 pending_    assigned    in_progress  in_litigation   closed
 assignment
```

---

## 📦 MODULE CRUD OPERATIONS

### Legend
- **C** = Create | **R** = Read | **U** = Update | **D** = Delete
- **P** = Print | **E** = Export | **A** = Approve

---

## 1️⃣ CASES MODULE (`/cases`)

| Operation | Location | Process |
|-----------|----------|---------|
| **CREATE** | `/cases/new` | Fill form → Submit → Status: `pending_assignment` |
| **READ** | `/cases` | List/filter/search cases → Click to view details |
| **UPDATE** | `/cases/[id]` | Edit button → Modify → Save → Audit logged |
| **DELETE** | `/cases/[id]` | Admin only → Confirm → Soft delete |

**Lifecycle:**
```
Register → Assign → Process → Directions → Hearings → Litigation → Close
```

---

## 2️⃣ ALLOCATION MODULE (`/cases/assignments`)

| Operation | Location | Process |
|-----------|----------|---------|
| **CREATE** | `/cases/assignments` | Select case → Choose officer → Assign |
| **READ** | `/cases/assignments` | View pending/assigned cases |
| **UPDATE** | Reassign button | Select new officer → Enter reason → Confirm |
| **DELETE** | Remove assignment | Case returns to pending pool |

---

## 3️⃣ DIRECTIONS & HEARINGS (`/directions`)

| Operation | Location | Process |
|-----------|----------|---------|
| **CREATE** | `/directions` | Add Direction → Link case → Set date/venue |
| **READ** | `/directions` | Calendar/list view of hearings |
| **UPDATE** | Edit hearing | Reschedule, record outcome, add notes |
| **DELETE** | Cancel hearing | Mark cancelled → Record reason |

---

## 4️⃣ DOCUMENTS MODULE (`/documents`)

| Operation | Location | Process |
|-----------|----------|---------|
| **CREATE** | `/documents` | Upload file → Add metadata → Link to case |
| **READ** | `/documents` | Grid/list view → Preview/download |
| **UPDATE** | Edit metadata | Change title, tags, case link |
| **DELETE** | Remove document | Soft delete → File archived |

---

## 5️⃣ CALENDAR MODULE (`/calendar`)

| Operation | Location | Process |
|-----------|----------|---------|
| **CREATE** | `/calendar` | Add event → Set date/time → Add attendees |
| **READ** | `/calendar` | Month/week/day views |
| **UPDATE** | Click event | Reschedule, edit details |
| **DELETE** | Remove event | Cannot delete past events |

---

## 6️⃣ TASKS MODULE (`/tasks`)

| Operation | Location | Process |
|-----------|----------|---------|
| **CREATE** | `/tasks` | Add task → Assign → Set priority/due date |
| **READ** | `/tasks` | Kanban board or list view |
| **UPDATE** | Drag card | Change status: To Do → In Progress → Complete |
| **DELETE** | Remove task | Soft delete → History preserved |

**Task Flow:**
```
To Do → In Progress → Under Review → Completed
                          ↓
                    (if rejected)
                          ↓
                    Back to In Progress
```

---

## 7️⃣ COMPLIANCE MODULE (`/compliance`)

| Operation | Location | Process |
|-----------|----------|---------|
| **CREATE** | `/compliance` | Add requirement → Set deadline → Assign |
| **READ** | Dashboard | Overdue (red) / Upcoming (yellow) / Complete (green) |
| **UPDATE** | Mark compliant | Upload evidence → Add notes |

---

## 8️⃣ NOTIFICATIONS (`/notifications`)

| Operation | Process |
|-----------|---------|
| **CREATE** | System auto-creates (case assigned, hearing scheduled, etc.) |
| **READ** | Bell icon → View all notifications |
| **UPDATE** | Mark as read / Dismiss |

---

## 9️⃣ CORRESPONDENCE & COMMUNICATIONS

| Module | Route | Operations |
|--------|-------|------------|
| Correspondence | `/correspondence` | CRUD for external letters, emails, faxes |
| Communications | `/communications` | CRUD for internal memos, meeting notes |
| File Requests | `/file-requests` | Request → Assign → Fulfill → Complete |

---

## 🔟 LEGAL MODULES

### Lawyers (`/lawyers`)
| Operation | Process |
|-----------|---------|
| **CREATE** | Add lawyer → Name, firm, contact, bar number |
| **READ** | Directory listing, search, filter |
| **UPDATE** | Edit contact info, change status |
| **DELETE** | Deactivate (soft delete) |

### Filings (`/filings`)
| Operation | Process |
|-----------|---------|
| **CREATE** | Add filing → Court, type, documents |
| **READ** | View filing history by case |
| **UPDATE** | Record court response, update status |

---

## 1️⃣1️⃣ LITIGATION COSTS (`/litigation-costs`)

| Operation | Process |
|-----------|---------|
| **CREATE** | Record cost → Type, amount, vendor, invoice |
| **READ** | Cost summary by case, monthly reports |
| **UPDATE** | Update status: Pending → Approved → Paid |
| **DELETE** | Admin only, requires justification |

**Cost Flow:**
```
Recorded → Pending → Approved → Paid
              ↓
          Disputed → Resolved
```

---

## 1️⃣2️⃣ REPORTS (`/reports`)

| Operation | Process |
|-----------|---------|
| **READ** | Generate report by type |
| **EXPORT** | Download as PDF, Excel, CSV |

**Report Types:**
- Case Summary Report
- Case Status Distribution
- Officer Workload Report
- Compliance Report
- Cost Analysis Report
- Monthly Activity Report

---

## 1️⃣3️⃣ LAND PARCELS (`/land-parcels`)

| Operation | Process |
|-----------|---------|
| **CREATE** | Add parcel → ID, location, coordinates, area |
| **READ** | Map view with markers, list view |
| **UPDATE** | Edit parcel info, link to case |
| **DELETE** | Soft delete |

---

## 🔐 ADMINISTRATION MODULES

### User Management (`/admin/users`)

| Operation | Process |
|-----------|---------|
| **CREATE** | Add User → Email, name, assign groups |
| **READ** | User list with search/filter |
| **UPDATE** | Edit profile, change groups, reset password |
| **DELETE** | Deactivate user (soft delete) |

### Groups (`/admin/groups`)

| Operation | Process |
|-----------|---------|
| **CREATE** | Add group → Name, description |
| **READ** | View groups and their permissions |
| **UPDATE** | Toggle permissions per module |
| **DELETE** | Remove group (reassign users first) |

### Modules (`/admin/modules`)

| Operation | Process |
|-----------|---------|
| **READ** | View all system modules |
| **UPDATE** | Enable/disable modules (Super Admin only) |

---

## 📊 PERMISSION MATRIX

| Module | Super Admin | Manager | Case Officer | Document Clerk | Viewer |
|--------|-------------|---------|--------------|----------------|--------|
| Cases | CRUPDAE | RUPAE | CRUPAE | R | R |
| Allocation | CRUPDAE | CRUPDAE | R | - | - |
| Directions | CRUPDAE | CRUPDAE | CRUP | R | R |
| Documents | CRUPDAE | CRUPDAE | CRUPDAE | CRUPDAE | R |
| Calendar | CRUPDAE | CRUPDAE | CRUP | R | R |
| Tasks | CRUPDAE | CRUPDAE | CRUP | CRUP | R |
| Compliance | CRUPDAE | CRUPDAE | CRUP | - | R |
| Costs | CRUPDAE | RUPAE | CRU | - | R |
| Reports | RPAE | RPAE | RPE | R | R |
| Admin | CRUPDAE | - | - | - | - |

---

## 🔄 WORKFLOW CYCLE SUMMARY

### WHERE OPERATIONS START

| Operation | Starting Point |
|-----------|---------------|
| Register Case | `/cases/new` |
| Assign Case | `/cases/assignments` |
| Schedule Hearing | `/directions` |
| Upload Document | `/documents` |
| Create Task | `/tasks` |
| Record Cost | `/litigation-costs` |

### WHERE OPERATIONS CYCLE (UPDATE)

| Operation | Update Location | Cycles Until |
|-----------|-----------------|--------------|
| Case Processing | `/cases/[id]` | Case closed |
| Hearings | `/directions` | Final judgment |
| Tasks | `/tasks` | All completed |
| Costs | `/litigation-costs` | All paid |

### WHERE OPERATIONS END

| Operation | End Point | Final Status |
|-----------|-----------|--------------|
| Case | `/closure` | `closed` |
| Task | `/tasks` | `completed` |
| Hearing | `/directions` | Outcome recorded |
| Cost | `/litigation-costs` | `paid` |

---

## 🔑 PASSWORD RECOVERY

### Option A: Supabase Dashboard (Recommended)
1. Go to Supabase → Authentication → Users
2. Find user by email
3. Click user row to open details
4. Scroll down to "Reset password"
5. Click "Send password recovery email"

### Option B: Direct SQL (Admin Only)
```sql
-- Run in Supabase SQL Editor:
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'admin@lands.gov.pg';
```

---

## ✅ Quick Reference Commands

### Check User Permissions
```sql
SELECT m.module_name, gmp.can_read, gmp.can_create, gmp.can_update, gmp.can_delete
FROM groups g
JOIN group_module_permissions gmp ON g.id = gmp.group_id
JOIN modules m ON gmp.module_id = m.id
JOIN user_groups ug ON g.id = ug.group_id
JOIN auth.users u ON ug.user_id = u.id
WHERE u.email = 'user@example.com';
```

### Add User to Group
```sql
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM auth.users u, groups g
WHERE u.email = 'user@example.com' AND g.group_name = 'Case Officer';
```

---

**End of Document**

*DLPP Legal Case Management System - Version 1.0*

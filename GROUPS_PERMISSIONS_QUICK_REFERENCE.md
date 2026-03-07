# Groups & Permissions - Quick Reference Card

## 🎯 At-a-Glance Comparison

| Feature | Super Admin | Manager | Case Officer | Legal Clerk | Doc Clerk | Viewer |
|---------|-------------|---------|--------------|-------------|-----------|--------|
| **Purpose** | System Admin | Supervisor | Case Handler | Support Staff | File Management | Read-Only |
| **Modules Access** | 20 | 14 | 15 | 12 | 6 | 7 |
| **Can Create Cases** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Can Update Cases** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Can Delete Cases** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Can Upload Docs** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Can Approve** | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ |
| **Can Manage Users** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Case Officers can approve documents and filings only

---

## 📊 Complete Permission Matrix

### Legend
- ✅ = Full permission
- 📖 = Read only
- ❌ = No access
- C = Create | R = Read | U = Update | D = Delete | P = Print | A = Approve | E = Export

---

### SUPER ADMIN

| Module | C | R | U | D | P | A | E |
|--------|---|---|---|---|---|---|---|
| **ALL 20 MODULES** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Summary:** Unrestricted access to everything

---

### MANAGER

| Module | C | R | U | D | P | A | E |
|--------|---|---|---|---|---|---|---|
| Dashboard | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Case Management | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Documents | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Calendar | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Correspondence | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Lawyers | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Land Parcels | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Court Filings | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Directions & Hearings | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Compliance | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Litigation Costs | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Reports | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Groups Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Summary:** View all, approve all, selective modification

---

### CASE OFFICER

| Module | C | R | U | D | P | A | E |
|--------|---|---|---|---|---|---|---|
| Dashboard | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Case Management | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Documents | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Calendar | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Correspondence | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lawyers | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Land Parcels | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Court Filings | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Directions & Hearings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Compliance | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Litigation Costs | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reports | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Notifications | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| File Requests | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Internal Officers | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Summary:** Full case lifecycle management, can approve documents

---

### LEGAL CLERK

| Module | C | R | U | D | P | A | E |
|--------|---|---|---|---|---|---|---|
| Dashboard | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Case Management | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Documents | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Calendar | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Correspondence | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lawyers | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Land Parcels | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Directions & Hearings | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Notifications | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| File Requests | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Internal Officers | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Summary:** Document & task support, can view cases

---

### DOCUMENT CLERK

| Module | C | R | U | D | P | A | E |
|--------|---|---|---|---|---|---|---|
| Dashboard | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Case Management | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Documents | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Tasks | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| File Requests | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Notifications | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Summary:** Document-focused, minimal access

---

### VIEWER

| Module | C | R | U | D | P | A | E |
|--------|---|---|---|---|---|---|---|
| Dashboard | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Case Management | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Documents | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Calendar | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reports | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Land Parcels | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Notifications | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Summary:** Read-only, can export reports

---

## 🎨 Visual Permission Heatmap

```
                        SA  MG  CO  LC  DC  VW
Dashboard               ██  ██  ▓▓  ▓▓  ▓▓  ▓▓
Case Management         ██  ██  ██  ▓▓  ▓▓  ▓▓
Documents               ██  ██  ██  ██  ██  ▓▓
Tasks                   ██  ██  ██  ██  ▓▓  ░░
Calendar                ██  ██  ██  ██  ░░  ▓▓
Correspondence          ██  ██  ██  ██  ░░  ░░
Lawyers                 ██  ██  ▓▓  ▓▓  ░░  ░░
Land Parcels            ██  ██  ▓▓  ▓▓  ░░  ▓▓
Court Filings           ██  ██  ██  ░░  ░░  ░░
Directions & Hearings   ██  ██  ██  ▓▓  ░░  ░░
Compliance              ██  ██  ██  ░░  ░░  ░░
Litigation Costs        ██  ██  ▓▓  ░░  ░░  ░░
Reports                 ██  ██  ██  ░░  ░░  ██
Notifications           ██  ██  ██  ▓▓  ▓▓  ▓▓
File Requests           ██  ░░  ██  ██  ██  ░░
Communications          ██  ░░  ░░  ░░  ░░  ░░
User Management         ██  ░░  ░░  ░░  ░░  ░░
Groups Management       ██  ░░  ░░  ░░  ░░  ░░
Master Files            ██  ░░  ░░  ░░  ░░  ░░
Internal Officers       ██  ░░  ▓▓  ▓▓  ░░  ░░

Legend:
██ = Full Access (Create, Update, Delete, etc.)
▓▓ = Read + Some Actions (Print, Export)
░░ = No Access
```

SA = Super Admin | MG = Manager | CO = Case Officer
LC = Legal Clerk | DC = Document Clerk | VW = Viewer

---

## 🔍 Quick Decision Guide

### "Which group should I assign?"

```
┌─────────────────────────────────────────────────┐
│ Does user need to manage other users?           │
│ └─ YES → Super Admin                            │
│ └─ NO  → Continue ↓                             │
├─────────────────────────────────────────────────┤
│ Is user a department head/supervisor?           │
│ └─ YES → Manager                                │
│ └─ NO  → Continue ↓                             │
├─────────────────────────────────────────────────┤
│ Does user handle cases day-to-day?              │
│ └─ YES → Case Officer                           │
│ └─ NO  → Continue ↓                             │
├─────────────────────────────────────────────────┤
│ Does user support case officers?                │
│ └─ YES → Legal Clerk                            │
│ └─ NO  → Continue ↓                             │
├─────────────────────────────────────────────────┤
│ Does user only manage documents/files?          │
│ └─ YES → Document Clerk                         │
│ └─ NO  → Continue ↓                             │
├─────────────────────────────────────────────────┤
│ Does user only need to view/read data?          │
│ └─ YES → Viewer                                 │
│ └─ NO  → Create custom group                    │
└─────────────────────────────────────────────────┘
```

---

## 📱 Mobile Quick Reference

### Group Capabilities

**Super Admin** 🔑
- Everything ✅

**Manager** 👔
- View: All cases, all data
- Update: Cases, compliance
- Approve: Everything
- Create: Tasks, correspondence

**Case Officer** ⚖️
- Create & manage cases
- Upload & approve documents
- Manage tasks & calendar
- Handle court filings

**Legal Clerk** 📋
- Manage documents & tasks
- View cases (read-only)
- Handle correspondence
- Track files

**Document Clerk** 📁
- Upload & organize documents
- Track physical files
- View cases (read-only)
- Limited scope

**Viewer** 👁️
- Read-only everything
- Print & export reports
- No modifications

---

## 🎯 Common Permission Questions

**Q: Can Case Officers delete cases?**
A: No - safety measure to prevent accidental data loss

**Q: Can Managers create new cases?**
A: No - oversight role, not case handling

**Q: Who can manage users?**
A: Only Super Admins

**Q: Can Legal Clerks approve documents?**
A: No - only Case Officers and above

**Q: What's the difference between Legal Clerk and Document Clerk?**
A: Legal Clerk has broader access (12 modules) including tasks and correspondence. Document Clerk is focused only on documents (6 modules).

**Q: Can Viewers export data?**
A: Yes, but only from Reports module

---

## 📊 Permission Statistics

| Group | Modules | Create | Read | Update | Delete | Approve |
|-------|---------|--------|------|--------|--------|---------|
| Super Admin | 20 | 20 | 20 | 20 | 20 | 20 |
| Manager | 14 | 3 | 14 | 5 | 0 | 14 |
| Case Officer | 15 | 9 | 15 | 9 | 4 | 3 |
| Legal Clerk | 12 | 5 | 12 | 5 | 2 | 0 |
| Document Clerk | 6 | 2 | 6 | 2 | 0 | 0 |
| Viewer | 7 | 0 | 7 | 0 | 0 | 0 |

---

## 🔒 Security Levels

```
Highest Security  ↑
                  │  Super Admin (Full Control)
                  │
                  │  Manager (Oversight)
                  │
                  │  Case Officer (Operational)
                  │
                  │  Legal Clerk (Support)
                  │
                  │  Document Clerk (Limited)
                  │
Lowest Security   ↓  Viewer (Read-Only)
```

---

**Print this page for quick desk reference!**

**Last Updated:** Version 36

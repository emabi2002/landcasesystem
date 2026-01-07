# Screenshot Requirements for DLPP Legal CMS User Manual

## Overview
This document outlines all required screenshots for the comprehensive user manual. Each screenshot should be captured at 1920x1080 resolution in light mode using Chrome browser.

---

## 📊 Module: Dashboard

### Screenshot 1: Dashboard Overview
**File:** `dashboard-overview.png`
**Path:** Navigate to `/` or `/dashboard`
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Navigation Bar                                      │
├─────────────────────────────────────────────────────┤
│ [Statistics Cards Row]                              │
│ Total Cases | Active Tasks | Upcoming Events | Docs │
├─────────────────────────────────────────────────────┤
│ Cases by Status Chart    │  Recent Cases Table     │
│ (Pie Chart)              │  - Case Number          │
│                          │  - Title                │
│                          │  - Status               │
├─────────────────────────────────────────────────────┤
│ Upcoming Deadlines       │  Recent Activity        │
│ - Task names             │  - Timeline view        │
│ - Due dates              │  - Actions              │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- All 4 statistics cards at top
- Pie chart with hover tooltip
- At least 3 recent cases
- Upcoming deadlines with color coding
- Recent activity timeline

---

## 📁 Module: Cases

### Screenshot 2: Cases List
**File:** `cases-list.png`
**Path:** Navigate to `/cases`
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Search bar              [Register New Case] Button  │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ Case    │ │ Case    │ │ Case    │ │ Case    │  │
│ │ Card 1  │ │ Card 2  │ │ Card 3  │ │ Card 4  │  │
│ │ [Badge] │ │ [Badge] │ │ [Badge] │ │ [Badge] │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ Case    │ │ Case    │ │ Case    │ │ Case    │  │
│ │ Card 5  │ │ Card 6  │ │ Card 7  │ │ Card 8  │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Search bar with placeholder text
- Register New Case button (red/prominent)
- At least 8 case cards in grid
- Various status badges (Open, In Progress, Closed, etc.)
- Different priority levels

### Screenshot 3: Case Detail - Overview Tab
**File:** `case-detail-overview.png`
**Path:** Click on any case, ensure Overview tab is active
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Cases                         [Edit] ✏️   │
│ Case Title                              [Status]     │
│ CAS-2025-001                                         │
├─────────────────────────────────────────────────────┤
│ Type    │ Priority │ Region  │ Created              │
├─────────────────────────────────────────────────────┤
│ Parties Involved (3)  │  Upcoming Events (3)        │
│ • Party 1 [hover]     │  • Event 1                  │
│ • Party 2             │  • Event 2                  │
│ • Party 3             │  • Event 3                  │
├─────────────────────────────────────────────────────┤
│ Active Tasks (3)      │  Recent Documents (3)       │
│ • Task 1 [badge]      │  • Document 1               │
│ • Task 2 [badge]      │  • Document 2               │
│ • Task 3 [badge]      │  • Document 3               │
├─────────────────────────────────────────────────────┤
│ [+ Add Party] [📤 Upload] [+ Task] [+ Event] [🗺️]  │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Case header with Edit button
- All 4 info cards
- All 4 quick view sections
- Action buttons at bottom
- **IMPORTANT:** Hover over one party card to show purple border and edit icon

### Screenshot 4: Case Detail - Parties Tab
**File:** `case-detail-parties.png`
**Path:** Click Parties tab
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Parties Involved              [Add Party] Button    │
│ Individuals and entities involved in this case      │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐       │
│ │ John Doe                        [Edit]   │       │
│ │ Type: Individual  Role: Plaintiff        │       │
│ │ Contact: +675 123 4567                   │       │
│ └──────────────────────────────────────────┘       │
│ ┌──────────────────────────────────────────┐       │
│ │ ABC Company                     [Edit]   │       │
│ │ Type: Organization  Role: Defendant      │       │
│ └──────────────────────────────────────────┘       │
│ ┌──────────────────────────────────────────┐       │
│ │ DLPP                            [Edit]   │       │
│ │ Type: Government Entity  Role: 3rd Party │       │
│ └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Tab navigation with Parties tab active
- At least 3 different party types
- Different roles shown
- Edit buttons on each party
- Add Party button

### Screenshot 5: Case Detail - Documents Tab
**File:** `case-detail-documents.png`
**Path:** Click Documents tab

### Screenshot 6: Case Detail - Tasks Tab
**File:** `case-detail-tasks.png`
**Path:** Click Tasks tab

### Screenshot 7: Case Detail - Events Tab
**File:** `case-detail-events.png`
**Path:** Click Events tab

### Screenshot 8: Case Detail - Land Tab
**File:** `case-detail-land.png`
**Path:** Click Land tab (should show map if GPS coordinates exist)

### Screenshot 9: Case Detail - History Tab
**File:** `case-detail-history.png`
**Path:** Click History tab

---

## 🗓️ Module: Calendar

### Screenshot 10: Calendar Month View
**File:** `calendar-month-view.png`
**Path:** Navigate to `/calendar`
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Calendar                        [< October 2025 >]  │
├─────────────────────────────────────────────────────┤
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat                  │
├─────────────────────────────────────────────────────┤
│      1    2    3    4    5    6                    │
│      [Event]                                        │
│ 7    8    9    10   11   12   13                   │
│           [Event]    [Event]                        │
│ 14   15   16   17   18   19   20                   │
│ [Event]           [Event]                           │
│ 21   22   23   24   25   26   27                   │
│           [Event]                                   │
│ 28   29   30   31                                   │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Month navigation controls
- Calendar grid with events
- Different colored events (if possible)
- At least 5-7 events visible

---

## 📄 Module: Documents

### Screenshot 11: Documents Library
**File:** `documents-library.png`
**Path:** Navigate to `/documents`
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Total Documents | By Type | Recent Uploads          │
│ 156             | 5 types | 12 this week           │
├─────────────────────────────────────────────────────┤
│ Search documents...                    [Filters]    │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ 📄 Doc  │ │ 📄 Doc  │ │ 📄 Doc  │ │ 📄 Doc  │  │
│ │ Title 1 │ │ Title 2 │ │ Title 3 │ │ Title 4 │  │
│ │ Case #  │ │ Case #  │ │ Case #  │ │ Case #  │  │
│ │ PDF     │ │ DOCX    │ │ JPG     │ │ PDF     │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ 📄 Doc  │ │ 📄 Doc  │ │ 📄 Doc  │ │ 📄 Doc  │  │
│ │ Title 5 │ │ Title 6 │ │ Title 7 │ │ Title 8 │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Statistics cards at top
- Search bar
- Document cards with file type icons
- Various document types (PDF, DOCX, JPG, etc.)
- Case associations

---

## ✅ Module: Tasks

### Screenshot 12: Tasks Dashboard
**File:** `tasks-dashboard.png`
**Path:** Navigate to `/tasks`
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Pending | In Progress | Completed | Overdue         │
│ 23      | 15          | 142       | 4               │
├─────────────────────────────────────────────────────┤
│ Search tasks...                       [Filters]     │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐       │
│ │ Review survey report      [In Progress]  │       │
│ │ CAS-2025-001  Due: Oct 25, 2025          │       │
│ └──────────────────────────────────────────┘       │
│ ┌──────────────────────────────────────────┐       │
│ │ Schedule site inspection  [Pending]      │       │
│ │ CAS-2025-002  Due: Nov 5, 2025           │       │
│ └──────────────────────────────────────────┘       │
│ ┌──────────────────────────────────────────┐       │
│ │ Contact parties           [Overdue] ⚠️   │       │
│ │ CAS-2025-003  Due: Oct 20, 2025          │       │
│ └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Statistics cards including overdue count (in red)
- Search bar and filters
- Tasks with different status badges
- At least one overdue task
- Case associations
- Due dates

---

## 🗺️ Module: Land Parcels

### Screenshot 13: Land Parcels List
**File:** `land-parcels-list.png`
**Path:** Navigate to `/land-parcels`
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Total Parcels | By Region | With GPS                │
│ 45            | 8 regions | 32 mapped              │
├─────────────────────────────────────────────────────┤
│ Search parcels...                     [Filters]     │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ 🗺️     │ │ 🗺️     │ │ 🗺️     │ │ 🗺️     │  │
│ │ SEC123  │ │ ALL456  │ │ POR789  │ │ MOR321  │  │
│ │ [Map]   │ │ [Map]   │ │ [Map]   │ │ [Map]   │  │
│ │ Madang  │ │ NCD     │ │ Eastern │ │ Western │  │
│ │ 2.5 ha  │ │ 1.8 ha  │ │ 3.2 ha  │ │ 0.9 ha  │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Statistics cards
- Search bar
- Parcel cards with map previews (if GPS available)
- Different regions
- Area measurements

### Screenshot 14: Land Parcel Map View
**File:** `land-parcel-map-view.png`
**Path:** Click on a parcel that has GPS coordinates
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Parcel SEC123-ALL456                    [Edit]      │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ Layers │
│ │                                         │ ┌─────┐│
│ │         [Satellite View]                │ │ ☰   ││
│ │                                         │ │     ││
│ │              📍                         │ │Street││
│ │           (  Red  )                     │ │Satell││
│ │          ( Circle )                     │ │Terra ││
│ │                                         │ │Hybr  ││
│ │    [Zoom controls: + -]                 │ └─────┘│
│ │                                         │        │
│ └─────────────────────────────────────────┘        │
│ Location: Madang Province                          │
│ Area: 2.5 hectares                                 │
│ GPS: -5.2245, 145.7966                             │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- **SATELLITE VIEW** with imagery visible
- GPS marker (red pin)
- Approximate boundary circle
- Layer control (top-right)
- Zoom controls
- Parcel information below map

---

## 📊 Module: Reports

### Screenshot 15: Reports Generation
**File:** `reports-generation.png`
**Path:** Navigate to `/reports`
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Reports                                              │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ Case    │ │ Case    │ │ Task    │ │Document │  │
│ │ Summary │ │Statistics│ │ Status  │ │Register │  │
│ │ Report  │ │ Report  │ │ Report  │ │ Report  │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│ ┌─────────┐                                        │
│ │  Land   │  [Case Summary Selected - Purple]     │
│ │ Parcels │                                        │
│ │ Report  │                                        │
│ └─────────┘                                        │
├─────────────────────────────────────────────────────┤
│ Filters:                                            │
│ Date From: [____] Date To: [____]                  │
│ Status: [All Statuses ▼]                           │
│ Region: [All Regions ▼]                            │
├─────────────────────────────────────────────────────┤
│ Export Options:                                     │
│ [Export to Excel] [Export to PDF] [Print Report]   │
│  (Green button)    (Red button)    (Outline)       │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- All 5 report type cards
- One report selected (highlighted in purple)
- Filter options
- All 3 export buttons with different colors
- Clear labeling

---

## 💬 Dialog Screenshots

### Screenshot 16: Add Party Dialog
**File:** `dialog-add-party.png`
**Path:** From case detail, click "Add Party"
**What to capture:**
- Full dialog with all form fields
- Party Type dropdown expanded (if possible)
- All field labels visible
- Add Party button

### Screenshot 17: Edit Party Dialog
**File:** `dialog-edit-party.png`
**Path:** Click on a party card
**What to capture:**
- Pre-filled form fields
- Delete button (red, left side)
- Save Changes button (right side)
- Cancel button

### Screenshot 18: Upload Document Dialog
**File:** `dialog-upload-document.png`
**Path:** From case detail, click "Upload Document"
**What to capture:**
- File upload field
- Document type dropdown
- All form fields
- Upload Document button

### Screenshot 19: Add Task Dialog
**File:** `dialog-add-task.png`
**Path:** From case detail, click "Add Task"
**What to capture:**
- Task form fields
- Priority dropdown
- Status dropdown
- Date picker
- Create Task button

### Screenshot 20: Add Event Dialog
**File:** `dialog-add-event.png`
**Path:** From case detail, click "Add Event"
**What to capture:**
- Event form fields
- Event type dropdown
- Datetime picker
- Schedule Event button

### Screenshot 21: Add Land Parcel Dialog
**File:** `dialog-add-parcel.png`
**Path:** From case detail, click "Add Land Parcel"
**What to capture:**
- Parcel number field
- GPS coordinate fields (Latitude, Longitude)
- Location and area fields
- Notes textarea
- Add Parcel button

---

## 🎯 Feature Screenshots

### Screenshot 22: Tooltip on Hover
**File:** `feature-tooltip-hover.png`
**Path:** Case detail overview, hover over a party card
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ Parties Involved                                    │
│ ┌────────────────────────────────┐  ┌───────────┐ │
│ │ John Doe              ✏️       │  │ Click to  │ │
│ │ Individual  [Plaintiff]        │◄─│ edit or   │ │
│ │                                │  │ update    │ │
│ └────────────────────────────────┘  │ details   │ │
│ ↑ Purple border showing            └───────────┘ │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- **Purple border** around hovered card
- **Tooltip** visible with help text
- **Edit icon** (✏️) visible
- Mouse cursor (hand pointer)

### Screenshot 23: Global Search
**File:** `feature-global-search.png`
**Path:** Click on global search bar in navigation
**What to capture:**
```
┌─────────────────────────────────────────────────────┐
│ DLPP [🔍 Search cases, documents...]   [Bell] [User]│
│           ↓                                          │
│      ┌────────────────────────┐                     │
│      │ Search Results:        │                     │
│      ├────────────────────────┤                     │
│      │ 📁 CAS-2025-001       │                     │
│      │ Land Dispute - Madang  │                     │
│      ├────────────────────────┤                     │
│      │ 📄 Survey Report       │                     │
│      │ Case: CAS-2025-001     │                     │
│      ├────────────────────────┤                     │
│      │ 📅 Site Inspection     │                     │
│      │ Nov 5, 2025            │                     │
│      └────────────────────────┘                     │
└─────────────────────────────────────────────────────┘
```

**Key elements to show:**
- Search bar active
- Dropdown results showing
- Different result types (cases, documents, events)
- Icons for each type

---

## 📝 Additional Notes

### Screenshot Capture Tips:

1. **Prepare test data** before capturing:
   - Create at least 3 cases with different statuses
   - Add parties, documents, tasks, events to cases
   - Add at least one land parcel with GPS coordinates
   - Ensure varied data for realistic screenshots

2. **Browser settings**:
   - Use Chrome browser
   - Set zoom to 100%
   - Window size: 1920x1080 or larger
   - Light mode (default theme)

3. **Capture quality**:
   - Use full-page screenshots where appropriate
   - Ensure text is crisp and readable
   - No browser extensions visible
   - Clean, professional appearance

4. **Privacy**:
   - Use fictional names and data
   - No real phone numbers or emails
   - No sensitive information

5. **Consistency**:
   - Same test data across related screenshots
   - Consistent UI state (logged in as same user)
   - Similar time of day (for consistency)

### Tools for Screenshots:

- **Windows**: Snipping Tool, Windows + Shift + S
- **Mac**: Command + Shift + 4
- **Chrome Extension**: Full Page Screen Capture
- **Third-party**: ShareX, Greenshot, Snagit

---

## 📂 File Organization

Save all screenshots to:
```
dlpp-legal-cms/docs/screenshots/
```

Naming convention:
```
module-name-feature.png

Examples:
- dashboard-overview.png
- case-detail-parties.png
- dialog-add-party.png
- feature-tooltip-hover.png
```

---

## ✅ Checklist

- [ ] Dashboard overview (1 screenshot)
- [ ] Cases module (9 screenshots)
- [ ] Calendar module (1 screenshot)
- [ ] Documents module (1 screenshot)
- [ ] Tasks module (1 screenshot)
- [ ] Land Parcels module (2 screenshots)
- [ ] Reports module (1 screenshot)
- [ ] Dialogs (6 screenshots)
- [ ] Features (2 screenshots)

**Total: 24 screenshots required**

---

**Once all screenshots are captured, they will be integrated into the USER_MANUAL_WITH_SCREENSHOTS.md file using markdown image syntax.**

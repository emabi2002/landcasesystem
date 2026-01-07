# Screenshot Guide for User Manual

## Required Screenshots

### 1. Dashboard Module
**Path:** `/` or `/dashboard`
**Screenshot should show:**
- Statistics cards (Total Cases, Active Tasks, Upcoming Events, Documents)
- Cases by Status pie chart
- Recent Cases table
- Upcoming Deadlines section
- Recent Activity timeline

**Filename:** `dashboard-overview.png`

---

### 2. Cases Module

#### Cases List Page
**Path:** `/cases`
**Screenshot should show:**
- Search bar at top
- Filter options
- Grid of case cards with status badges
- "Register New Case" button

**Filename:** `cases-list.png`

#### Case Detail - Overview Tab
**Path:** `/cases/[id]` (Overview tab)
**Screenshot should show:**
- Case header with title, status, and Edit button
- Case info cards (Type, Priority, Region, Created)
- Parties Involved section (with hover effect on a card)
- Upcoming Events section
- Active Tasks section
- Recent Documents section

**Filename:** `case-detail-overview.png`

#### Case Detail - Parties Tab
**Path:** `/cases/[id]` (Parties tab)
**Screenshot should show:**
- Full list of parties
- Party cards with edit buttons
- "Add Party" button

**Filename:** `case-detail-parties.png`

#### Case Detail - Documents Tab
**Path:** `/cases/[id]` (Documents tab)
**Screenshot should show:**
- Document list with file icons
- Document metadata
- "Upload Document" button

**Filename:** `case-detail-documents.png`

#### Case Detail - Tasks Tab
**Path:** `/cases/[id]` (Tasks tab)
**Screenshot should show:**
- Task list with status badges
- Due dates
- "Add Task" button

**Filename:** `case-detail-tasks.png`

#### Case Detail - Events Tab
**Path:** `/cases/[id]` (Events tab)
**Screenshot should show:**
- Event list with dates and times
- Event types
- "Add Event" button

**Filename:** `case-detail-events.png`

#### Case Detail - Land Parcels Tab
**Path:** `/cases/[id]` (Land tab)
**Screenshot should show:**
- Parcel list
- Map preview (if GPS coordinates available)
- "Add Land Parcel" button

**Filename:** `case-detail-land.png`

#### Case Detail - History Tab
**Path:** `/cases/[id]` (History tab)
**Screenshot should show:**
- Timeline of case actions
- Timestamps
- Activity descriptions

**Filename:** `case-detail-history.png`

---

### 3. Calendar Module
**Path:** `/calendar`
**Screenshot should show:**
- Month view calendar
- Events displayed on dates
- Navigation controls
- Color-coded event types

**Filename:** `calendar-month-view.png`

---

### 4. Documents Module
**Path:** `/documents`
**Screenshot should show:**
- Statistics cards (Total Documents, By Type, Recent Uploads)
- Search and filter options
- Document grid with cards
- File type icons

**Filename:** `documents-library.png`

---

### 5. Tasks Module
**Path:** `/tasks`
**Screenshot should show:**
- Statistics cards (Pending, In Progress, Completed, Overdue)
- Search bar
- Filter options
- Task list with status badges

**Filename:** `tasks-dashboard.png`

---

### 6. Land Parcels Module
**Path:** `/land-parcels`
**Screenshot should show:**
- Statistics cards (Total Parcels, By Region, With GPS)
- Search bar
- Parcel grid
- Map previews on cards

**Filename:** `land-parcels-list.png`

#### Land Parcel Detail with Map
**Screenshot should show:**
- Interactive map with satellite view
- GPS marker
- Layer control
- Parcel information

**Filename:** `land-parcel-map-view.png`

---

### 7. Reports Module
**Path:** `/reports`
**Screenshot should show:**
- Report type cards (Case Summary, Statistics, Task Status, etc.)
- Filter options (Date Range, Status, Region)
- Export buttons (Excel, PDF, Print)
- Selected report type highlighted

**Filename:** `reports-generation.png`

---

### 8. Dialog Screenshots

#### Add Party Dialog
**Screenshot should show:**
- Form fields for adding a party
- Party type dropdown
- Role selection
- Save button

**Filename:** `dialog-add-party.png`

#### Edit Party Dialog
**Screenshot should show:**
- Pre-filled form
- Edit options
- Delete button
- Save Changes button

**Filename:** `dialog-edit-party.png`

#### Upload Document Dialog
**Screenshot should show:**
- File upload field
- Document title input
- Document type selection
- Upload button

**Filename:** `dialog-upload-document.png`

#### Add Task Dialog
**Screenshot should show:**
- Task title input
- Due date picker
- Priority selection
- Status dropdown

**Filename:** `dialog-add-task.png`

#### Add Event Dialog
**Screenshot should show:**
- Event title input
- Event type selection
- Date & time picker
- Location field

**Filename:** `dialog-add-event.png`

#### Add Land Parcel Dialog
**Screenshot should show:**
- Parcel number input
- GPS coordinates fields
- Location input
- Notes textarea

**Filename:** `dialog-add-parcel.png`

---

### 9. Interactive Features

#### Tooltip Example
**Screenshot should show:**
- A card with hover effect (purple border)
- Tooltip visible with guidance text
- Edit icon showing

**Filename:** `feature-tooltip-hover.png`

#### Search Functionality
**Screenshot should show:**
- Global search bar in navigation
- Search results dropdown
- Highlighted search term

**Filename:** `feature-global-search.png`

---

## Screenshot Specifications

- **Resolution:** Minimum 1920x1080 (Full HD)
- **Format:** PNG with transparency where applicable
- **Quality:** High quality, clear text
- **Browser:** Chrome (recommended for consistency)
- **Zoom Level:** 100% (default)
- **Theme:** Light mode (default)

## Naming Convention

Use descriptive names with hyphens:
- `module-name-feature.png`
- Example: `case-detail-parties.png`

## Storage Location

Store all screenshots in:
```
dlpp-legal-cms/docs/screenshots/
```

## Integration with User Manual

Screenshots will be inserted into USER_MANUAL.md using markdown syntax:
```markdown
![Alt Text](./screenshots/filename.png)
```

## Notes

- Ensure no sensitive data is visible in screenshots
- Use demo/test data only
- Capture tooltips and hover states where relevant
- Show realistic example data
- Include navigation elements for context

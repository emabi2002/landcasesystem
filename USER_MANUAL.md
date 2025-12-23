# DLPP Legal Case Management System
## Complete User Manual

**Version 1.0**  
**Department of Lands & Physical Planning**  
**Papua New Guinea**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Cases Module](#cases-module)
5. [Calendar Module](#calendar-module)
6. [Documents Module](#documents-module)
7. [Tasks Module](#tasks-module)
8. [Land Parcels Module](#land-parcels-module)
9. [Reports Module](#reports-module)
10. [Search Functionality](#search-functionality)
11. [User Guide Quick Tips](#user-guide-quick-tips)
12. [Troubleshooting](#troubleshooting)
13. [Glossary](#glossary)

---

## Introduction

### About the System

The DLPP Legal Case Management System (Legal CMS) is a comprehensive web-based application designed specifically for the Department of Lands & Physical Planning in Papua New Guinea. It streamlines the management of land-related legal cases, documents, tasks, and related information.

### Key Features

- **Complete Case Management**: Track all aspects of legal cases from creation to resolution
- **Document Management**: Upload, organize, and access case-related documents
- **Task Tracking**: Assign and monitor tasks with deadlines
- **Calendar Integration**: Schedule hearings, consultations, and important events
- **Land Parcel Mapping**: View land parcels with GPS coordinates and satellite imagery
- **Comprehensive Reporting**: Generate reports in Excel, PDF, or print directly
- **Advanced Search**: Find cases, documents, and events quickly
- **Role-Based Access**: Secure access with user authentication

### System Requirements

**Hardware**:
- Modern computer (2015 or newer)
- Minimum 4GB RAM
- Internet connection (broadband recommended)

**Software**:
- Modern web browser:
  - Google Chrome (recommended)
  - Mozilla Firefox
  - Microsoft Edge
  - Safari
- PDF reader (for viewing reports)
- Excel or compatible software (for Excel reports)

### Who Should Use This Manual

This manual is designed for:
- Legal officers and case managers
- Administrative staff
- Document management staff
- Department managers and supervisors
- System administrators

---

## Getting Started

### Accessing the System

1. **Open your web browser**
2. **Navigate to**: [Your System URL]
3. **Login Screen**: You'll see the DLPP Legal CMS login page

### Logging In

1. **Enter Username**: Your assigned username
2. **Enter Password**: Your secure password
3. **Click "Sign In"**

**First Time Login**:
- Use the temporary password provided by your administrator
- You'll be prompted to change your password
- Choose a strong password with:
  - At least 8 characters
  - Mix of uppercase and lowercase letters
  - At least one number
  - At least one special character

### Understanding the Interface

#### Navigation Bar
Located at the top of every page:
- **DLPP Logo**: Click to return to Dashboard
- **Dashboard**: System overview
- **Cases**: Case management
- **Calendar**: Events and hearings
- **Documents**: Document library
- **Tasks**: Task management
- **Land Parcels**: Parcel information
- **Reports**: Generate reports
- **Search Bar**: Global search
- **Notifications**: System alerts (bell icon)
- **User Menu**: Profile and logout (top right)

#### Color Scheme
- **Purple (#4A4284)**: Primary navigation and headers
- **Red (#EF5A5A)**: Action buttons and alerts
- **Gold (#D4A574)**: Accents and highlights
- **Green**: Success messages
- **Blue**: Information and links

---

## Dashboard

### Overview

The Dashboard is your home page, providing a quick overview of system activity and key statistics.

### Dashboard Sections

#### 1. Statistics Cards (Top Row)

**Total Cases**
- Shows total number of cases in the system
- Click to view all cases

**Active Tasks**
- Number of tasks that are not completed
- Click to view task list

**Upcoming Events**
- Events scheduled in the near future
- Click to view calendar

**Documents**
- Total documents in the system
- Click to view document library

#### 2. Cases by Status Chart

**Pie Chart** showing case distribution:
- **Open**: New cases, initial review
- **In Progress**: Active investigation
- **Pending**: Awaiting action or information
- **Closed**: Resolved or concluded
- **Settled**: Reached settlement

**How to Use**:
- Hover over sections to see exact numbers
- Visual representation of caseload
- Helps identify bottlenecks

#### 3. Recent Cases Table

Shows the 5 most recently created cases:
- **Case Number**: Unique identifier
- **Title**: Brief description
- **Status**: Current status badge
- **Priority**: Low, Medium, High, Urgent
- **Created**: Date case was added

**Actions**:
- Click "View All" to see complete case list
- Click on any case number to view details

#### 4. Upcoming Deadlines

Lists next 5 upcoming task deadlines:
- **Task Name**: What needs to be done
- **Case**: Related case number
- **Due Date**: Deadline
- **Status**: Current progress

**Color Coding**:
- Red: Overdue tasks
- Orange: Due within 3 days
- Normal: Future deadlines

#### 5. Recent Activity

Timeline of recent system actions:
- Case status changes
- Document uploads
- Task completions
- New case registrations

**Benefits**:
- Stay informed of team activity
- Track progress at a glance
- Identify recent updates

### Dashboard Best Practices

1. **Start Your Day Here**: Review statistics and deadlines
2. **Check Upcoming Events**: Prepare for hearings
3. **Monitor Recent Activity**: Stay coordinated with team
4. **Quick Navigation**: Use dashboard cards to jump to modules

---

## Cases Module

### Overview

The Cases module is the heart of the system, managing all legal case information and related data.

### Viewing Cases

#### Cases List Page

Access: Click "Cases" in navigation bar

**What You See**:
- Grid of case cards showing:
  - Case number
  - Title
  - Status badge
  - Priority level
  - Region
  - Creation date
  - Brief description

**Features**:
- Search cases by number, title, or keywords
- Filter by status, priority, or region
- Sort by date, status, or priority
- Pagination for large case lists

**Actions**:
- Click any case card to view full details
- Click "Register New Case" to create a case

### Creating a New Case

#### Step 1: Click "Register New Case"

Located at top-right of Cases page

#### Step 2: Fill in Case Information

**Required Fields** (marked with *):
- **Case Number**: Unique identifier (e.g., "CAS-2025-001")
- **Case Title**: Brief description (e.g., "Land Dispute - Madang")
- **Case Type**: Select from dropdown
  - Title Claim
  - Boundary Dispute
  - Lease Agreement
  - Customary Land
  - State Land
  - Other
- **Status**: Select current status
  - Open
  - In Progress
  - Pending
  - Closed
  - Settled
- **Priority**: Select priority level
  - Low
  - Medium
  - High
  - Urgent

**Optional Fields**:
- **Description**: Detailed case information
- **Region**: Geographic location
  - NCD
  - Madang Province
  - Eastern Highlands
  - Western Province
  - [Other regions]

#### Step 3: Save

- Click "Register Case" button
- Success message appears
- You're redirected to the new case detail page

### Case Detail Page

#### Overview Tab

**Case Header**:
- Case number and title
- Status badge
- Priority indicator
- Edit button (pencil icon)

**Case Information Cards**:
- **Case Type**: Type of case
- **Priority**: Priority level
- **Region**: Geographic area
- **Created**: Creation date

**Quick View Sections**:

1. **Parties Involved** (up to 3 shown)
   - Name and party type
   - Role in case
   - Click to edit

2. **Upcoming Events** (next 3 events)
   - Event title
   - Date and time
   - Click to edit

3. **Active Tasks** (next 3 tasks)
   - Task title
   - Due date
   - Status badge
   - Click to edit

4. **Recent Documents** (last 3 uploaded)
   - Document title
   - Upload date
   - Click to edit

**Action Buttons** (Bottom of page):
- ➕ Add Party
- 📤 Upload Document
- ➕ Add Task
- ➕ Add Event
- 🗺️ Add Land Parcel

#### Parties Tab

**Purpose**: Manage all parties involved in the case

**Who to Add**:
- Plaintiffs/Claimants
- Defendants/Respondents
- Witnesses
- Legal representatives
- Third parties
- Government entities
- Customary landowners

**Adding a Party**:

1. Click "Add Party" button
2. Fill in details:
   - **Name**: Full name or organization name *
   - **Party Type**: *
     - Individual
     - Organization
     - Government Entity
     - Clan/Community
     - Other
   - **Role in Case**: *
     - Plaintiff/Claimant
     - Defendant/Respondent
     - Witness
     - Legal Representative
     - Third Party
     - Other
   - **Contact Information**: Phone, email, address (optional)
3. Click "Add Party"

**Editing a Party**:
- Click on any party card
- Edit dialog opens
- Update information
- Click "Save Changes"
- Or click "Delete" to remove party

**Party List Shows**:
- Name
- Party type
- Role badge
- Contact information (if available)

#### Documents Tab

**Purpose**: Store and manage all case-related documents

**Document Types**:
- Legal documents
- Court orders
- Evidence
- Correspondence
- Survey plans
- Photos/images
- Other supporting documents

**Uploading a Document**:

1. Click "Upload Document" button
2. Fill in details:
   - **Title**: Document name *
   - **Description**: Brief explanation (optional)
   - **Document Type**: *
     - Legal Document
     - Court Order
     - Evidence
     - Correspondence
     - Survey Plan
     - Photo
     - Other
   - **File**: Click "Browse" and select file *
3. Click "Upload Document"

**Supported File Types**:
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- Images (`.jpg`, `.png`, `.gif`)
- Text (`.txt`)

**File Size Limit**: 10MB per file

**Editing a Document**:
- Click on document card
- Update title, description, or type
- Download file
- Or delete document

**Document Cards Show**:
- Document title
- Description
- File type
- Upload date
- File icon

#### Tasks Tab

**Purpose**: Track work items and deadlines

**When to Create Tasks**:
- Prepare for hearings
- Collect evidence
- Contact parties
- File documents
- Conduct surveys
- Schedule meetings
- Review cases
- Any action item with a deadline

**Creating a Task**:

1. Click "Add Task" button
2. Fill in details:
   - **Task Title**: What needs to be done *
   - **Description**: Details and instructions (optional)
   - **Due Date**: Deadline *
   - **Priority**: 
     - Low
     - Medium
     - High
     - Urgent
   - **Status**: 
     - Pending
     - In Progress
     - Completed
     - Cancelled
   - **Assigned To**: Person responsible (optional)
3. Click "Create Task"

**Editing a Task**:
- Click on task card
- Update any field
- Common updates:
  - Change status as work progresses
  - Adjust due date if needed
  - Add description with notes
- Click "Save Changes"

**Task Cards Show**:
- Task title
- Description
- Due date
- Status badge
- Priority
- Assigned person

**Status Badges**:
- **Pending**: Yellow badge
- **In Progress**: Blue badge
- **Completed**: Green badge
- **Overdue**: Red badge (auto-calculated)

#### Events Tab

**Purpose**: Schedule hearings, meetings, and important dates

**Event Types**:
- Court hearings
- Community consultations
- Site inspections
- Meetings
- Deadlines
- Other important dates

**Scheduling an Event**:

1. Click "Add Event" button
2. Fill in details:
   - **Event Title**: Name of event *
   - **Event Type**: *
     - Court Hearing
     - Community Consultation
     - Site Inspection
     - Meeting
     - Deadline
     - Other
   - **Date & Time**: When event occurs *
   - **Location**: Where event takes place (optional)
   - **Description**: Additional details (optional)
3. Click "Schedule Event"

**Editing an Event**:
- Click on event card
- Update any field
- Common updates:
  - Add location when confirmed
  - Update time if rescheduled
  - Add notes in description
- Click "Save Changes"

**Event Cards Show**:
- Event title
- Event type
- Date and time
- Location
- Description

#### Land Tab

**Purpose**: Link land parcels to the case

**What to Include**:
- All land parcels involved in the case
- Disputed parcels
- Adjacent parcels (for boundary cases)
- Survey information
- GPS coordinates

**Adding a Land Parcel**:

1. Click "Add Land Parcel" button
2. Fill in details:
   - **Parcel Number**: Official identifier *
   - **Location**: Area/province (optional)
   - **Area**: Size in hectares (optional)
   - **Latitude**: GPS coordinate (optional)
   - **Longitude**: GPS coordinate (optional)
   - **Notes**: Additional information (optional)
3. Click "Add Parcel"

**GPS Coordinates**:
- Get from Google Maps, GPS device, or survey
- Format: Decimal degrees (e.g., -9.4438, 147.1803)
- Latitude: -1 to -12 for PNG (negative = South)
- Longitude: 140 to 160 for PNG (positive = East)

**Editing a Land Parcel**:
- Click on parcel card
- Update information
- Add GPS coordinates if available
- Click "Save Changes"

**Parcel Cards Show**:
- Parcel number
- Location
- Area (if available)
- Notes
- Map preview (if GPS coordinates provided)

**Map View**:
If GPS coordinates are provided:
- Interactive map displays
- Satellite imagery available
- 4 map views:
  - Street Map
  - Satellite View
  - Terrain Map
  - Satellite + Labels
- Red circle shows approximate parcel boundary
- Click marker for parcel details

#### History Tab

**Purpose**: Audit trail of all case changes

**What's Recorded**:
- Case creation
- Status changes
- Party additions/removals
- Document uploads
- Task updates
- Event scheduling
- Any modifications

**History Entries Show**:
- Action description
- Date and time
- User who made change
- Additional details

**Benefits**:
- Track case progress
- Accountability
- Audit compliance
- Identify when changes occurred

### Editing Case Information

**To Edit Main Case Details**:
1. Click "Edit" button (pencil icon) in case header
2. Update any field
3. Click "Save Changes"

**Fields You Can Edit**:
- Case title
- Description
- Status
- Priority
- Case type
- Region

### Case Workflows

#### New Case Workflow

1. **Register Case**: Create with basic information
2. **Add Parties**: All involved parties
3. **Upload Documents**: Initial documents
4. **Create Tasks**: Work items and deadlines
5. **Schedule Events**: Upcoming hearings/meetings
6. **Link Land Parcels**: Add parcel information
7. **Update Status**: As case progresses
8. **Monitor Progress**: Check tasks and events regularly
9. **Add More Info**: Update as new information arrives
10. **Close Case**: When resolved

#### Progressive Data Entry

**Don't Have All Information?**
- Add case with what you know
- Add parties with names only
- Upload documents, add descriptions later
- Create land parcels, add GPS later
- Click any card to update information

**Benefits**:
- Get cases in system quickly
- Refine details over time
- Team can collaborate on data entry
- Nothing is permanent - everything editable

---

## Calendar Module

### Overview

The Calendar module displays all scheduled events across all cases in a visual calendar format.

### Calendar Views

Access: Click "Calendar" in navigation

**Month View**:
- Default view
- Shows all events for the month
- Click on any date to see events
- Navigate months with arrow buttons

**Event Display**:
- Event title
- Time
- Case number
- Color-coded by event type

### Viewing Event Details

**Click on any event** to see:
- Full event information
- Related case
- Location
- Description
- Option to edit

### Creating Events from Calendar

1. Click on any date
2. "Add Event" dialog opens
3. Date is pre-filled
4. Select case
5. Fill in event details
6. Click "Schedule Event"

### Calendar Best Practices

1. **Check Daily**: Review today's events each morning
2. **Plan Ahead**: Look at upcoming week
3. **Color Coding**: Learn event type colors
4. **Update Times**: Keep event times current
5. **Add Locations**: Specify venues when known

---

## Documents Module

### Overview

The Documents module provides a centralized library of all documents across all cases.

### Documents Library

Access: Click "Documents" in navigation

**Statistics Cards**:
- Total Documents count
- By Type breakdown
- Recent Uploads count

**Document Grid**:
Shows all documents with:
- Document title
- Case number (link to case)
- File type
- Upload date
- Description (if available)

### Searching Documents

**Search Bar** (top of page):
- Type keywords
- Searches titles, descriptions, file names
- Real-time results

**Filters**:
- By document type
- By case
- By date range
- By uploader

### Document Cards

Each card shows:
- Document title
- Case association
- File type icon
- Upload date
- Quick actions

**Actions**:
- Click card to view details
- Edit button to update metadata
- Download button to get file

### Viewing Document Details

Click on any document card:
- Full metadata
- Description
- Case link
- Upload information
- Download option
- Edit or delete options

### Document Management Tips

1. **Use Descriptive Titles**: "Land Survey Report - Madang" not "Document1"
2. **Add Descriptions**: Briefly explain document content
3. **Choose Correct Type**: Helps with filtering
4. **Upload Regularly**: Don't wait to batch upload
5. **Review Periodically**: Ensure all case documents uploaded

---

## Tasks Module

### Overview

The Tasks module shows all tasks across all cases, helping you manage workload and deadlines.

### Tasks Dashboard

Access: Click "Tasks" in navigation

**Statistics Cards**:
- Pending Tasks
- In Progress Tasks
- Completed Tasks
- Overdue Tasks (red if any)

**Task List**:
Shows all tasks with:
- Task title
- Case number
- Due date
- Status badge
- Priority
- Assigned person

### Filtering Tasks

**Filter Options**:
- **By Status**:
  - All Tasks
  - Pending
  - In Progress
  - Completed
  - Overdue
- **By Priority**:
  - All
  - Urgent
  - High
  - Medium
  - Low
- **By Case**: Select specific case

**Search Bar**:
- Search task titles
- Search descriptions
- Real-time filtering

### Task Management

**Updating Task Status**:
1. Click on task card
2. Change status dropdown
3. Click "Save Changes"

**Common Status Changes**:
- Pending → In Progress (when you start)
- In Progress → Completed (when finished)
- Any → Cancelled (if no longer needed)

**Adding Notes**:
- Click task
- Add information in description
- Save changes
- Notes help team understand progress

### Task Best Practices

1. **Review Daily**: Check your assigned tasks
2. **Update Status**: Keep status current
3. **Set Realistic Deadlines**: Don't over-promise
4. **Prioritize**: Use priority levels effectively
5. **Complete Tasks**: Mark done when finished
6. **Overdue Tasks**: Address immediately

---

## Land Parcels Module

### Overview

The Land Parcels module manages all land parcel information with interactive maps and satellite imagery.

### Land Parcels Dashboard

Access: Click "Land Parcels" in navigation

**Statistics Cards**:
- Total Parcels count
- By Region breakdown
- With GPS Coordinates count

**Parcel Grid**:
Shows all parcels with:
- Parcel number
- Location
- Area (if available)
- Associated case
- Map preview (if GPS available)

### Searching Parcels

**Search Bar**:
- Search by parcel number
- Search by location
- Real-time results

**Filters**:
- By region
- By case
- With/without GPS coordinates

### Viewing Parcel Details

Click on any parcel card to see:
- Full parcel information
- Associated case
- GPS coordinates
- Interactive map

### Interactive Maps

**Map Features**:
- **4 Map Views**:
  - Street Map (default)
  - Satellite View (aerial imagery)
  - Terrain Map (elevation)
  - Satellite + Labels (hybrid)
- **Layer Control**: Top-right corner to switch views
- **GPS Marker**: Shows exact parcel location
- **Boundary Circle**: Red circle showing approximate area
- **Popup**: Click marker for parcel details

**Map Controls**:
- **Zoom**: Scroll wheel or +/- buttons
- **Pan**: Click and drag
- **Switch Views**: Layer control (top-right)

**Satellite Imagery**:
- FREE high-resolution imagery from ESRI
- No API key needed
- Global coverage including PNG
- Updated regularly

### Adding GPS Coordinates

**How to Get Coordinates**:

1. **Google Maps Method** (Recommended):
   - Go to maps.google.com
   - Find location
   - Right-click on exact spot
   - Click "What's here?"
   - Coordinates appear at bottom
   - Copy both numbers

2. **GPS Device**:
   - Go to physical location
   - Use GPS device or smartphone
   - Record coordinates

3. **Survey Documents**:
   - Check official survey plans
   - GPS coordinates usually included

**Adding to System**:
1. Click on parcel
2. Enter Latitude (e.g., -9.4438)
3. Enter Longitude (e.g., 147.1803)
4. Click "Save Changes"
5. Map now shows location!

**Coordinate Format**:
- Use decimal degrees
- Latitude: negative for South (-9.4438)
- Longitude: positive for East (147.1803)
- PNG ranges: Lat -1 to -12, Lng 140 to 160

### Land Parcel Best Practices

1. **Add GPS When Available**: Enables mapping
2. **Accurate Parcel Numbers**: Use official identifiers
3. **Include Area**: Helps with analysis
4. **Add Notes**: Record important details
5. **Link to Cases**: Associate with relevant cases
6. **Use Satellite View**: Verify location accuracy

---

## Reports Module

### Overview

The Reports module generates professional reports in multiple formats: Excel, PDF, and direct printing.

### Available Reports

Access: Click "Reports" in navigation

**5 Report Types**:

1. **Case Summary Report**
   - Complete list of all cases
   - Case details and status
   - Filter by date, status, region

2. **Case Statistics**
   - Statistical analysis
   - Breakdown by status, type, region
   - Percentages and counts
   - Multi-sheet Excel or formatted PDF

3. **Task Status Report**
   - All tasks across all cases
   - Sorted by due date
   - Shows status, priority, assignment

4. **Document Register**
   - Complete document catalog
   - All uploaded documents
   - Sorted by upload date

5. **Land Parcels Report**
   - All land parcels with details
   - Locations and areas
   - Sorted by parcel number

### Generating a Report

#### Step 1: Select Report Type

Click on the report type card:
- Card highlights in purple when selected

#### Step 2: Apply Filters (Optional)

**Date Range**:
- **Date From**: Start date
- **Date To**: End date
- Leave empty for all dates

**Status Filter** (Case Summary only):
- All Statuses
- Open
- In Progress
- Pending
- Closed
- Settled

**Region Filter** (Case Summary only):
- All Regions
- NCD
- Madang Province
- Eastern Highlands
- Western Province
- [Other regions]

#### Step 3: Choose Export Format

**Export to Excel** (Green Button):
- Downloads `.xlsx` file
- Fully formatted spreadsheet
- Auto-sized columns
- Multiple sheets (for statistics)
- Ready for analysis

**Export to PDF** (Red Button):
- Downloads `.pdf` file
- Professional formatting
- DLPP branding
- Print-ready
- Landscape for wide tables

**Print Report** (Outline Button):
- Opens browser print dialog
- Direct printing
- Optimized layout
- Print preview available

#### Step 4: Wait for Generation

- Button shows "Generating..."
- Success message appears
- File downloads automatically (Excel/PDF)
- Print dialog opens (Print option)

### Report File Naming

Files are automatically named:
- Format: `{report-type}-{YYYY-MM-DD}.{extension}`
- Examples:
  - `case-summary-2025-10-30.xlsx`
  - `task-report-2025-10-30.pdf`
  - `land-parcels-2025-10-30.xlsx`

### Using Excel Reports

**Features**:
- Sortable columns
- Filterable data
- Create pivot tables
- Add charts
- Further analysis in Excel

**Statistics Report**:
- Multiple sheets:
  - Summary
  - By Status
  - By Type
  - By Region
- Check all tabs!

### Using PDF Reports

**Features**:
- Professional layout
- DLPP header with logo
- Date of generation
- Department name
- Grid-style tables
- Page numbers

**Best For**:
- Official records
- Sharing with stakeholders
- Printing for files
- Archiving

### Report Best Practices

1. **Regular Reports**: Generate monthly statistics
2. **Filter Appropriately**: Use date ranges for specific periods
3. **Choose Right Format**:
   - Excel: Analysis and manipulation
   - PDF: Sharing and archiving
   - Print: Quick hard copies
4. **Save Reports**: Keep historical records
5. **Review Before Printing**: Use print preview

---

## Search Functionality

### Global Search

**Location**: Search bar in top navigation (all pages)

**What It Searches**:
- Cases (number, title, description)
- Documents (title, description)
- Events (title, description, location)

**How to Use**:
1. Click in search bar
2. Type keywords
3. Results appear as you type
4. Click on result to view details

**Search Tips**:
- Use specific terms
- Try case numbers
- Search partial words
- Use quotes for exact phrases

### Module-Specific Search

**Tasks Page**:
- Search bar filters task list
- Searches titles and descriptions

**Documents Page**:
- Search bar filters document list
- Searches titles, descriptions, file names

**Land Parcels Page**:
- Search bar filters parcel list
- Searches parcel numbers and locations

**Cases Page**:
- Search bar filters case list
- Searches case numbers, titles, descriptions

---

## User Guide Quick Tips

### Partial Information Entry

**You Can**:
- Add records with minimal information
- Leave optional fields empty
- Come back later to complete

**How to Update Later**:
- Click on any card
- Edit dialog opens
- Add missing information
- Save changes

### Visual Cues

**Look For**:
- **Purple border** on hover = clickable
- **Edit icon** (✏️) appears = can edit
- **Tooltip** appears = guidance provided
- **Hand cursor** = clickable element

### Keyboard Shortcuts

- **Ctrl+S** or **Cmd+S**: Save forms (some dialogs)
- **Esc**: Close dialogs
- **Tab**: Navigate form fields
- **Enter**: Submit forms (single-field searches)

### Common Workflows

#### Morning Routine
1. Check Dashboard for overview
2. Review today's events in Calendar
3. Check assigned tasks
4. Address any overdue items

#### Case Update Routine
1. Go to case detail page
2. Update task statuses
3. Upload new documents
4. Add new information
5. Update case status if changed

#### Weekly Review
1. Generate statistics report
2. Review all active tasks
3. Check upcoming events
4. Ensure all documents uploaded

---

## Troubleshooting

### Login Issues

**Problem**: Can't log in  
**Solutions**:
- Check username is correct (case-sensitive)
- Verify password (check Caps Lock)
- Clear browser cache
- Try different browser
- Contact administrator for password reset

### Slow Performance

**Problem**: System is slow  
**Solutions**:
- Check internet connection
- Close unnecessary browser tabs
- Clear browser cache
- Use recommended browser (Chrome)
- Check with administrator if persists

### Can't Upload Documents

**Problem**: Document upload fails  
**Solutions**:
- Check file size (max 10MB)
- Verify file type is supported
- Try different file
- Check internet connection
- Rename file (remove special characters)

### Can't See Changes

**Problem**: Updates don't appear  
**Solutions**:
- Refresh page (F5 or Ctrl+R)
- Check if you clicked "Save Changes"
- Look for error messages
- Verify required fields were filled
- Try logging out and back in

### Map Not Showing

**Problem**: Map doesn't display  
**Solutions**:
- Check internet connection (needed for maps)
- Verify GPS coordinates are valid
- Refresh page
- Try different browser
- Check coordinates are in correct format

### Report Won't Generate

**Problem**: Report export fails  
**Solutions**:
- Ensure report type is selected
- Check for filter conflicts
- Try simpler date range
- Use different export format
- Refresh page and try again

### Can't Edit Record

**Problem**: Edit dialog won't open  
**Solutions**:
- Ensure you're clicking the card itself
- Refresh page
- Check if record still exists
- Try from dedicated tab instead of overview
- Clear browser cache

### Search Not Working

**Problem**: Search returns no results  
**Solutions**:
- Check spelling
- Try fewer keywords
- Remove special characters
- Clear search and try again
- Check you're searching correct module

### General Issues

**When Something Doesn't Work**:
1. Refresh the page
2. Try logging out and back in
3. Clear browser cache
4. Try different browser
5. Check internet connection
6. Take screenshot of error
7. Contact system administrator
8. Refer to this manual

---

## Glossary

**Case**: A legal matter being tracked in the system

**Case Number**: Unique identifier for each case

**Case Type**: Category of legal matter (Title Claim, Boundary Dispute, etc.)

**Case Status**: Current state (Open, In Progress, Pending, Closed, Settled)

**Party**: Individual or organization involved in a case

**Party Type**: Classification (Individual, Organization, Government Entity, Clan)

**Party Role**: Position in case (Plaintiff, Defendant, Witness, etc.)

**Document**: File uploaded and associated with a case

**Task**: Work item with a deadline

**Event**: Scheduled occurrence (hearing, meeting, deadline)

**Land Parcel**: Piece of land associated with a case

**GPS Coordinates**: Geographic location (latitude and longitude)

**Priority**: Urgency level (Low, Medium, High, Urgent)

**Region**: Geographic area (NCD, Madang Province, etc.)

**Dashboard**: Home page showing system overview

**Module**: Major section of the system (Cases, Documents, etc.)

**Navigation Bar**: Menu at top of every page

**Card**: Visual container showing summary information

**Dialog**: Popup window for forms and details

**Filter**: Tool to narrow down lists

**Search**: Tool to find specific records

**Export**: Generate report in Excel, PDF, or print format

**Tooltip**: Small popup providing guidance

**Badge**: Colored label showing status or role

**Satellite Imagery**: Aerial photographs from satellites

**Map Layer**: Different map view (Street, Satellite, Terrain)

**Audit Trail**: Record of all changes (History tab)

**Required Field**: Information that must be provided (marked with *)

**Optional Field**: Information that can be provided later

---

## Appendix A: Sample Workflows

### Complete Case Entry Workflow

**Scenario**: New land dispute case received

**Steps**:

1. **Register Case**
   - Case Number: CAS-2025-015
   - Title: Land Boundary Dispute - Madang
   - Type: Boundary Dispute
   - Status: Open
   - Priority: Medium
   - Region: Madang Province

2. **Add Parties**
   - Claimant: John Doe (Individual, Plaintiff)
   - Respondent: ABC Company (Organization, Defendant)
   - Department: DLPP (Government Entity, Third Party)

3. **Upload Documents**
   - Land Survey Report (PDF)
   - Claim Letter (PDF)
   - Photos of disputed area (JPG)

4. **Create Tasks**
   - "Review survey report" - Due next week
   - "Schedule site inspection" - Due in 2 weeks
   - "Contact both parties" - Due in 3 days

5. **Schedule Events**
   - Initial consultation - Next Monday, 10 AM
   - Site inspection - In 2 weeks, 9 AM, Madang

6. **Add Land Parcels**
   - Parcel SEC123-ALL456
   - Location: Madang Province
   - Area: 2.5 hectares
   - GPS: -5.2245, 145.7966 (from survey)

7. **Monitor Progress**
   - Check Dashboard daily
   - Update task statuses
   - Upload new documents as received
   - Update case status as progresses

### Monthly Reporting Workflow

**Scenario**: Generate monthly report for management

**Steps**:

1. **Go to Reports Module**

2. **Generate Case Summary**
   - Select "Case Summary Report"
   - Filter: Last month (date range)
   - Status: All
   - Export to Excel
   - Save as: Monthly-Cases-October-2025.xlsx

3. **Generate Statistics**
   - Select "Case Statistics"
   - No filters (all data)
   - Export to PDF
   - Save as: Case-Statistics-October-2025.pdf

4. **Review Reports**
   - Open Excel report
   - Review case counts
   - Check status distribution
   - Identify trends

5. **Share with Management**
   - Email PDF report
   - Include key insights
   - Highlight important cases

---

## Appendix B: Best Practices Summary

### Data Entry
- Use descriptive titles
- Fill required fields first
- Add optional info when available
- Use consistent formats
- Review before saving

### Case Management
- Update status promptly
- Keep tasks current
- Upload documents regularly
- Schedule events in advance
- Monitor deadlines

### Document Management
- Use clear file names
- Add descriptions
- Choose correct type
- Organize by case
- Keep files under 10MB

### Task Management
- Set realistic deadlines
- Assign appropriately
- Update status regularly
- Mark completed when done
- Don't let tasks go overdue

### Calendar Management
- Add events promptly
- Include locations
- Set correct times
- Check calendar daily
- Update if rescheduled

### System Usage
- Start day with Dashboard
- Use search effectively
- Take advantage of filters
- Generate regular reports
- Keep data current

---

## Appendix C: Support & Resources

### Getting Help

**Within System**:
- This User Manual
- Staff Quick Reference Guide
- Tooltips (hover over elements)
- In-app guidance

**Training Resources**:
- Initial training sessions
- Refresher courses
- One-on-one support
- Team training sessions

**Technical Support**:
- System Administrator
- IT Help Desk
- Email: [support email]
- Phone: [support phone]

### Reporting Issues

**When reporting problems, include**:
1. What you were trying to do
2. What happened instead
3. Screenshot of error (if any)
4. Your username
5. Date and time
6. Browser being used

### Providing Feedback

We welcome your feedback to improve the system:
- Suggest new features
- Report bugs
- Share workflow ideas
- Recommend improvements

Contact: [feedback email]

---

## Document Information

**Document Version**: 1.0  
**Last Updated**: October 30, 2025  
**Prepared For**: DLPP Legal CMS Users  
**Prepared By**: DLPP IT Department  

**System Version**: 1.0  
**Platform**: Web-based Application  
**Supported Browsers**: Chrome, Firefox, Edge, Safari  

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Oct 30, 2025 | Initial release | DLPP IT |

---

**END OF USER MANUAL**

For additional support or questions not covered in this manual, please contact your system administrator.

**Department of Lands & Physical Planning**  
**Papua New Guinea**

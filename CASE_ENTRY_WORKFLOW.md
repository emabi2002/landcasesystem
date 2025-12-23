# Case Entry Workflow Guide

This guide walks you through the complete process of entering a new legal case into the DLPP Legal Case Management System, from registration to adding all relevant details.

## Overview

The case entry workflow follows these steps:
1. **Register New Case** - Create the basic case record
2. **Add Parties** - Add all individuals and entities involved
3. **Upload Documents** - Attach case files and evidence
4. **Create Tasks** - Assign work items and deadlines
5. **Schedule Events** - Add hearings, meetings, and deadlines
6. **Link Land Parcels** - Connect land/property information
7. **Edit Case Details** - Update case information as needed

---

## Step 1: Register a New Case

### From the Dashboard:
1. Click **"Register New Case"** button on the dashboard
2. Fill in the case registration form:
   - **Case Number** (required) - Format: DLPP-YYYY-### (e.g., DLPP-2025-001)
   - **Case Title** (required) - Brief descriptive title
   - **Description** - Detailed case information
   - **Case Type** - Select from: Dispute, Acquisition, Lease, Survey, Title, Boundary, Other
   - **Priority** - Low, Medium, High, or Urgent
   - **Status** - Under Review, In Court, Mediation, Tribunal, Judgment, Settled, or Closed
   - **Region** - Select the Papua New Guinea province
3. Click **"Register Case"**

**Result:** You'll be redirected to the new case's detail page.

---

## Step 2: Add Parties Involved

**Parties are individuals or entities involved in the case (plaintiffs, defendants, witnesses, legal representatives, etc.)**

### Where to Add Parties:

#### Option A: From the Parties Tab
1. Open the case detail page
2. Click the **"Parties (0)"** tab
3. Click the **"Add Party"** button (top right, red button)
4. Fill in the party form:
   - **Name** (required) - Full name or organization name
   - **Party Type** - Select:
     - Individual
     - Organization
     - Government Agency
     - Clan/Community
     - Other
   - **Role in Case** - Select:
     - Plaintiff/Claimant
     - Defendant/Respondent
     - Witness
     - Legal Representative
     - Third Party
     - Other
   - **Contact Information** - Phone, email, address, or notes
5. Click **"Add Party"**

#### Option B: From the Overview Tab
1. On the case detail page, stay on the **"Overview"** tab
2. In the "Parties Involved" card, click **"Add First Party"** (if no parties exist)
3. This opens the same dialog as above
4. Fill in and submit the form

**You can add multiple parties** - Repeat the process for each person or entity involved in the case.

### Party Examples:
- **Land Dispute Case:**
  - Plaintiff: John Kila (Individual, Plaintiff)
  - Defendant: Michael Tau (Individual, Defendant)
  - Legal Rep: Smith & Associates (Organization, Legal Representative)
  - Witness: Mary Poi (Individual, Witness)

- **Land Acquisition Case:**
  - Claimant: PNG Power Ltd (Organization, Plaintiff)
  - Respondent: Hiri Clan (Clan/Community, Defendant)
  - Government: Dept of Lands (Government Agency, Third Party)

---

## Step 3: Upload Documents

### Where to Upload Documents:

#### Option A: From the Documents Tab
1. Click the **"Documents (0)"** tab
2. Click **"Upload Document"** button
3. Fill in the document form:
   - **File** (required) - Select file from your computer
   - **Document Title** - Auto-filled from filename, can edit
   - **Document Type** - Pleading, Evidence, Survey Report, Title Document, Correspondence, Court Order, Photo, Other
   - **Description** - Additional details about the document
4. Click **"Upload Document"**

#### Option B: From the Overview Tab
1. In the "Recent Documents" card, click **"Upload First Document"**
2. Fill in and submit the form

**Supported file types:** PDF, Word docs, images, videos, etc.

**Storage:** Files are stored securely in Supabase Storage and linked to the case.

---

## Step 4: Create Tasks

Tasks are action items, assignments, or things that need to be done for the case.

### Where to Create Tasks:

#### Option A: From the Tasks Tab
1. Click the **"Tasks (0)"** tab
2. Click **"Add Task"** button
3. Fill in the task form:
   - **Task Title** (required) - e.g., "Draft Affidavit", "Review Survey Report"
   - **Description** - Additional details
   - **Due Date & Time** (required) - When the task should be completed
   - **Priority** - Low, Medium, High
   - **Status** - Pending, In Progress, Completed
4. Click **"Create Task"**

#### Option B: From the Overview Tab
1. In the "Active Tasks" card, click **"Create First Task"**
2. Fill in and submit the form

**Task Examples:**
- Draft Response to Claim - Due: 2025-02-15, Priority: High
- Conduct Site Inspection - Due: 2025-02-10, Priority: Medium
- File Court Documents - Due: 2025-02-20, Priority: Urgent

---

## Step 5: Schedule Events

Events are hearings, meetings, deadlines, or important dates related to the case.

### Where to Schedule Events:

#### Option A: From the Events Tab
1. Click the **"Events (0)"** tab
2. Click **"Add Event"** button
3. Fill in the event form:
   - **Event Type** - Court Hearing, Filing Deadline, Response Deadline, Meeting, Other
   - **Event Title** (required) - e.g., "Court Hearing", "Filing Deadline"
   - **Date & Time** (required) - When the event occurs
   - **Location** - e.g., "Supreme Court, Room 123"
   - **Description** - Additional details
4. Click **"Create Event"**

#### Option B: From the Overview Tab
1. In the "Upcoming Events" card, click **"Schedule First Event"**
2. Fill in and submit the form

**Event Examples:**
- Court Hearing - Feb 25, 2025 10:00 AM at Supreme Court
- Filing Deadline - Feb 15, 2025 5:00 PM
- Mediation Session - Feb 20, 2025 2:00 PM at DLPP Office

---

## Step 6: Link Land Parcels

Land parcels are the specific land/property involved in the case.

### Where to Add Land Parcels:

#### Option A: From the Land Tab
1. Click the **"Land (0)"** tab
2. Click **"Add Land Parcel"** button
3. Fill in the land parcel form:
   - **Parcel Number** (required) - e.g., "SEC 123 ALL 45, NCD"
   - **Location/Description** - e.g., "Hohola, Port Moresby"
   - **Area (sq meters)** - Land size
   - **GPS Coordinates** - Format: Latitude, Longitude (e.g., -9.4438, 147.1803)
   - **Title Details** - e.g., "State Lease 123-456"
   - **Additional Notes** - Any other relevant information
4. Click **"Add Parcel"**

#### Option B: From the Overview Tab
1. In the future, there may be a land parcels preview card
2. Currently, use the Land tab

**You can link multiple parcels** if the case involves more than one property.

---

## Step 7: Edit Case Details

You can update case information at any time.

### How to Edit a Case:
1. Open the case detail page
2. Click **"Edit Case"** button (top right, red button)
3. Update any fields:
   - Case Title
   - Description
   - Case Type
   - Priority
   - Status
   - Region
4. Click **"Save Changes"**

**What gets recorded:**
- All changes are automatically logged in the Case History tab
- You can see who made changes and when

---

## Complete Workflow Example

### Example: New Land Boundary Dispute Case

**Step 1: Register Case**
- Case Number: DLPP-2025-001
- Title: "Land Boundary Dispute - Hohola, Port Moresby"
- Case Type: Boundary Dispute
- Priority: High
- Status: Under Review
- Region: National Capital District

**Step 2: Add Parties**
1. John Kila - Individual, Plaintiff
2. Michael Tau - Individual, Defendant
3. Smith & Associates - Organization, Legal Representative
4. Mary Poi - Individual, Witness

**Step 3: Upload Documents**
1. Complaint.pdf - Pleading - "Initial complaint filed by plaintiff"
2. Survey_1985.pdf - Survey Report - "Original survey from 1985"
3. Site_Photo.jpg - Photo - "Photo of disputed boundary"

**Step 4: Create Tasks**
1. Review Survey Documents - Due: Feb 10, 2025 - Priority: High
2. Schedule Site Inspection - Due: Feb 12, 2025 - Priority: Medium
3. Draft Response - Due: Feb 15, 2025 - Priority: High

**Step 5: Schedule Events**
1. Initial Hearing - Feb 25, 2025 10:00 AM - Supreme Court Room 3
2. Filing Deadline - Feb 15, 2025 5:00 PM
3. Mediation Session - Feb 20, 2025 2:00 PM - DLPP Conference Room

**Step 6: Link Land Parcels**
1. Parcel Number: SEC 123 ALL 45, NCD
   - Location: Hohola, Port Moresby
   - Area: 1200.50 sq m
   - Coordinates: -9.4438, 147.1803
   - Title: State Lease SL-12345

---

## Tips for Efficient Data Entry

### 1. **Register Case First**
Always create the case record before adding any details. You need a case ID to link parties, documents, etc.

### 2. **Add Parties Early**
Add all known parties as soon as possible. This helps track who's involved from the start.

### 3. **Use Consistent Naming**
- Use full legal names for individuals
- Use official organization names
- Be consistent with formats

### 4. **Add Context in Descriptions**
Don't just enter titles - add meaningful descriptions that help others understand the context.

### 5. **Set Realistic Due Dates**
When creating tasks and events, set dates you can actually meet. You can always adjust later.

### 6. **Upload Documents Promptly**
Upload key documents as soon as they're available. Don't wait until everything is ready.

### 7. **Use the Overview Tab**
The Overview tab shows a summary of everything. It's a quick way to see what's been added and what's missing.

### 8. **Check the History Tab**
Review the History tab to see all changes made to the case. This helps with audit trails.

---

## Where Everything Is Located

### Main Navigation (Top Bar)
- **Dashboard** - Overview of all cases, quick actions
- **Cases** - Browse and search all cases
- **Calendar** - View all events across all cases
- **Documents** - Browse all documents
- **Tasks** - View and manage all tasks
- **Land Parcels** - Browse all land parcels
- **Reports** - Generate reports and analytics

### Case Detail Page Tabs
- **Overview** - Summary of case with cards for parties, events, tasks, documents
- **Parties** - Full list of all parties with add/edit capabilities
- **Documents** - All documents with upload and download
- **Tasks** - All tasks with create and update capabilities
- **Events** - All events with scheduling
- **Land** - All linked land parcels
- **History** - Complete audit trail of all changes

### Action Buttons
- **Red buttons** - Primary actions (Add, Create, Upload, Edit)
- **Outlined buttons** - Secondary actions (Cancel, Back, Download)
- **Empty state buttons** - Trigger the same dialogs as the main buttons

---

## Quick Reference: Where to Add Parties

### ✅ **Primary Method** (Recommended)
**Location:** Case Detail Page → **Parties Tab** → **Add Party Button** (top right)

### ✅ **Alternative Method**
**Location:** Case Detail Page → **Overview Tab** → **Parties Involved Card** → **Add First Party Button**

### ✅ **What You Need**
- Party name (required)
- Party type: Individual, Organization, Government Agency, Clan/Community, Other
- Role: Plaintiff, Defendant, Witness, Legal Representative, Third Party, Other
- Contact info (optional but recommended)

### ✅ **How Many Parties?**
Add as many as needed! Common cases have 2-10 parties, complex cases may have more.

---

## Need Help?

If you encounter any issues or have questions:
1. Check this workflow guide
2. Review the [MANUAL_DATA_ENTRY_GUIDE.md](MANUAL_DATA_ENTRY_GUIDE.md)
3. Check the [QUICK_ENTRY_REFERENCE.md](QUICK_ENTRY_REFERENCE.md)
4. Contact your system administrator
5. Email Same support: support@same.new

---

**Last Updated:** October 30, 2025
**System Version:** 2.0.0

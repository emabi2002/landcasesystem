# 📊 Sample Data Guide

## Overview

The `sample-data.sql` file contains realistic test data for the DLPP Legal Case Management System. This data is **NOT hardcoded** - it comes directly from database INSERT statements that populate your tables.

---

## ✅ What's Included

### 5 User Profiles
- **John Kila** - Legal Officer (legal_officer)
- **Mary Tau** - Legal Officer (legal_officer)
- **Peter Wari** - Registrar (registrar)
- **Sarah Baki** - Survey Officer (survey_officer)
- **David Pato** - Director (director)

### 7 Legal Cases
1. **DLPP-2025-001** - Land Boundary Dispute (Hohola, Port Moresby) - In Court
2. **DLPP-2025-002** - Customary Land Title Claim (Madang) - Under Review
3. **DLPP-2025-003** - Illegal Occupation (Mount Hagen) - In Court
4. **DLPP-2025-004** - State Lease Rental Review (Lae) - Mediation
5. **DLPP-2025-005** - Inheritance Dispute (Rabaul) - Settled
6. **DLPP-2025-006** - Fraudulent Land Sale (Port Moresby) - Judgment
7. **DLPP-2025-007** - Mining Lease Application (Southern Highlands) - Tribunal

### 24 Parties
- Individuals (plaintiffs, defendants, witnesses)
- Companies (contractors, developers)
- Government entities (DLPP, other departments)
- Clan groups and associations

### 19 Documents
- Survey plans and reports
- Court filings and writs
- Affidavits
- Correspondence
- Contracts and agreements
- Evidence photos

### 17 Tasks
- Pending tasks
- In-progress tasks
- Completed tasks
- Overdue tasks (for testing alerts)

### 19 Events
- Court hearings
- Filing deadlines
- Response deadlines
- Meetings
- Community consultations

### 8 Land Parcels
- With GPS coordinates (GeoJSON format)
- Area measurements
- Survey plan references
- Location details

### Case History Entries
- Automatic audit trail of changes
- Status changes
- Document uploads
- Party additions

### 8 Evidence Items
- Photos (boundary markers, settlements)
- Videos (drone footage)
- Audio (witness interviews)
- GPS locations captured

### 9 Notifications
- Event reminders
- Deadline alerts
- Task notifications
- Case updates

---

## 🚀 How to Load Sample Data

### Prerequisites
1. ✅ Database schema must be created first (`database-schema.sql`)
2. ✅ Admin user must be created in Supabase Auth
3. ✅ Admin profile must be linked to profiles table

### Loading Steps

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Click "SQL Editor" in sidebar
   - Click "New query"

2. **Copy Sample Data**
   - Open `sample-data.sql`
   - Select ALL content (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)

3. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" or press Ctrl/Cmd + Enter
   - Wait 10-20 seconds for completion

4. **Verify Success**
   - Check Table Editor
   - You should see data in all tables
   - Success message will appear

---

## 📋 Sample Case Details

### Case 1: DLPP-2025-001 (Land Boundary Dispute)
- **Location**: Hohola, Port Moresby
- **Parties**: Joseph Kome (plaintiff), Margaret Toea (defendant)
- **Land Parcels**: Lot 45 and Lot 46
- **Documents**: 5 (survey plans, affidavits, photos)
- **Tasks**: 3 (survey review, affidavit, surveyor engagement)
- **Events**: 3 (hearing, filing deadline, site inspection)
- **Status**: In Court

### Case 2: DLPP-2025-002 (Customary Land Title)
- **Location**: Madang Province
- **Parties**: Bougainville Clan Group, DLPP, Agricultural Company
- **Land**: 250,000 sqm customary land
- **Documents**: 4 (ILG cert, genealogy, proposal)
- **Tasks**: 3 (ILG verification, consultation, brief)
- **Events**: 3 (2 consultations, objection deadline)
- **Status**: Under Review

### Case 3: DLPP-2025-003 (Illegal Occupation)
- **Location**: Mount Hagen
- **Parties**: State of PNG, Settlers Association
- **Land**: 5,000 sqm state lease
- **Documents**: 3 (eviction notice, police report, court docs)
- **Tasks**: 2 (court docs, police coordination)
- **Events**: 2 (hearing, response deadline)
- **Evidence**: 3 (photos, drone video with GPS)
- **Status**: In Court (Urgent)

### Case 5: DLPP-2025-005 (Inheritance - SETTLED)
- **Location**: Rabaul
- **Parties**: 3 siblings + estate
- **Land**: 1,200 sqm freehold
- **Documents**: 4 (death cert, will, title, settlement)
- **Tasks**: 2 completed
- **Events**: 2 (negotiation, signing)
- **Status**: Settled ✅

---

## 🔄 Realistic Data Features

### Geographic Coverage
Cases span across Papua New Guinea:
- National Capital District (Port Moresby)
- Madang Province
- Western Highlands (Mount Hagen)
- Morobe Province (Lae)
- East New Britain (Rabaul)
- Southern Highlands (Tari)

### Realistic Scenarios
- Boundary disputes with conflicting surveys
- Customary land conversion for development
- Government land enforcement
- Commercial lease negotiations
- Family inheritance settlements
- Fraud investigations
- Mining lease approvals

### Proper Relationships
- All foreign keys properly linked
- Cases have multiple parties
- Documents linked to correct cases
- Tasks assigned to specific officers
- Events scheduled realistically
- Land parcels with GPS coordinates

### Various Statuses
- Under Review
- In Court
- Mediation
- Tribunal
- Judgment
- Settled
- Multiple priorities (Low, Medium, High, Urgent)

---

## 📝 Using Sample Data

### Explore Cases
1. Login to system
2. Go to Cases page
3. See 7 different cases
4. Click any case to view full details

### Test Features
1. **Search**: Try searching "Hohola" or "mining"
2. **Filter**: Filter by status (In Court, Settled, etc.)
3. **Calendar**: View all events scheduled
4. **Tasks**: See pending, overdue, completed tasks
5. **Documents**: Browse uploaded files
6. **Land Parcels**: View parcel details with coordinates

### Add More Data
Use the sample data as templates:
1. Copy the INSERT statement format
2. Change the UUIDs (use new ones)
3. Modify details to your needs
4. Run in SQL Editor

---

## ⚠️ Important Notes

### UUIDs
The sample data uses placeholder UUIDs (00000000-0000-0000-0000-000000000001, etc.)
- These work fine for testing
- For production, use actual user UUIDs from Supabase Auth
- Link real auth users to profiles table

### File Placeholders
Document and evidence URLs use `/placeholder/` paths
- These are for demonstration only
- In production, upload real files via the system
- Files will be stored in Supabase Storage

### Conflicts
The sample data uses `ON CONFLICT (id) DO NOTHING` for profiles
- Safe to run multiple times
- Won't create duplicate entries
- Other tables will create new records each time

---

## 🎯 Next Steps After Loading

1. **Login and Explore**
   - See 7 cases immediately
   - Browse different case types
   - View documents and tasks

2. **Test Workflows**
   - Add parties to cases
   - Upload documents
   - Create new tasks
   - Schedule events

3. **Customize Data**
   - Edit case details
   - Add your own cases
   - Upload real documents
   - Assign to actual users

4. **Create Production Data**
   - Use sample format
   - Replace with real cases
   - Link to actual officers
   - Upload legitimate documents

---

## 🔍 Sample Data Statistics

| Table | Count | Details |
|-------|-------|---------|
| Profiles | 5 | Different roles and departments |
| Cases | 7 | Various types and statuses |
| Parties | 24 | Average 3-4 per case |
| Documents | 19 | Mixed types (PDFs, images) |
| Tasks | 17 | Various priorities |
| Events | 19 | Upcoming and past |
| Land Parcels | 8 | With GPS coordinates |
| Case History | 6+ | Plus automatic entries |
| Evidence | 8 | Photos, videos, audio |
| Notifications | 9 | For different users |

**Total Records**: 100+ across all tables!

---

## ✅ Benefits of Sample Data

1. **Immediate Testing** - See how system works with real data
2. **Demo Ready** - Show stakeholders actual functionality
3. **Training** - Train users on realistic scenarios
4. **Development** - Test features with proper data
5. **Documentation** - Examples for data structure
6. **Quality Assurance** - Verify all relationships work

---

## 🚫 What Sample Data IS NOT

- ❌ **Not hardcoded** - It's database-driven via SQL
- ❌ **Not static** - You can modify, delete, add to it
- ❌ **Not required** - Optional for quick start
- ❌ **Not production data** - For testing/demo only

---

## 🔄 Reloading Sample Data

To start fresh:

1. **Delete existing data** (optional):
```sql
TRUNCATE public.case_history CASCADE;
TRUNCATE public.notifications CASCADE;
TRUNCATE public.evidence CASCADE;
TRUNCATE public.land_parcels CASCADE;
TRUNCATE public.events CASCADE;
TRUNCATE public.tasks CASCADE;
TRUNCATE public.documents CASCADE;
TRUNCATE public.parties CASCADE;
TRUNCATE public.cases CASCADE;
-- Don't truncate profiles if you have real users!
```

2. **Reload sample data**:
   - Run `sample-data.sql` again
   - Fresh data will be inserted

---

## 📞 Support

Questions about sample data?
- Check `DATABASE_SETUP_GUIDE.md`
- Review `README.md`
- Contact: support@same.new

---

**Version**: 1.0
**Last Updated**: October 29, 2025
**Records**: 100+ across 10 tables
**Coverage**: All major PNG provinces
**Scenarios**: 7 realistic legal cases

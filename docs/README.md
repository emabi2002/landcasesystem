# DLPP Legal CMS Documentation

## Overview

This directory contains comprehensive documentation for the DLPP Legal Case Management System, including user manuals, screenshot requirements, and training materials.

## Documentation Files

### 📘 User Manuals

1. **USER_MANUAL.md** (Parent directory)
   - Comprehensive text-based manual
   - 80+ pages covering all modules
   - Complete workflows and best practices
   - Troubleshooting guide
   - Glossary of terms

2. **USER_MANUAL_WITH_SCREENSHOTS.md** (Parent directory)
   - Enhanced version with screenshot placeholders
   - Ready for screenshot integration
   - More visual and user-friendly
   - Perfect for training new staff

### 📸 Screenshot Documentation

3. **SCREENSHOT_REQUIREMENTS.md** (This directory)
   - Detailed requirements for each screenshot
   - 24 total screenshots needed
   - Visual mockups showing what to capture
   - File naming conventions
   - Capture tips and best practices

4. **screenshots/** (Directory)
   - Storage location for all screenshot images
   - Organized by module
   - PNG format, high resolution

### 📋 Additional Guides

5. **STAFF_QUICK_REFERENCE.md** (Parent directory)
   - Quick reference for daily operations
   - Common tasks and shortcuts
   - Visual cues guide

6. **REPORTS_GUIDE.md** (Parent directory)
   - Comprehensive reporting documentation
   - Excel, PDF, and print instructions

7. **MAP_SATELLITE_GUIDE.md** (Parent directory)
   - Satellite map integration guide
   - GPS coordinate instructions

## How to Create Screenshots for the Manual

### Prerequisites

1. **Development server running**
   ```bash
   cd dlpp-legal-cms
   bun run dev
   ```
   Server is accessible at: http://localhost:3000

2. **Test data prepared**
   - At least 3 cases with different statuses
   - Parties, documents, tasks, events added to cases
   - At least one land parcel with GPS coordinates
   - Various test data for realistic screenshots

3. **Browser setup**
   - Use Google Chrome (recommended)
   - Set zoom to 100%
   - Window size: 1920x1080 or larger
   - Light mode (default)

### Screenshot Capture Process

#### Step 1: Navigate Through Application

Open the live preview (right side of Same IDE) and navigate to:

1. **Dashboard** (`/`)
2. **Cases** (`/cases`)
3. **Case Detail** (`/cases/[id]`) - All tabs
4. **Calendar** (`/calendar`)
5. **Documents** (`/documents`)
6. **Tasks** (`/tasks`)
7. **Land Parcels** (`/land-parcels`)
8. **Reports** (`/reports`)

#### Step 2: Capture Screenshots

For each module, capture screenshots as specified in `SCREENSHOT_REQUIREMENTS.md`.

**24 Total Screenshots Needed:**

| Module | Count | Screenshots |
|--------|-------|-------------|
| Dashboard | 1 | Overview |
| Cases | 9 | List, Detail (all tabs), Dialogs |
| Calendar | 1 | Month view |
| Documents | 1 | Library |
| Tasks | 1 | Dashboard |
| Land Parcels | 2 | List, Map view |
| Reports | 1 | Generation interface |
| Dialogs | 6 | Add/Edit forms |
| Features | 2 | Tooltips, Search |

#### Step 3: Save Screenshots

Save all screenshots to:
```
dlpp-legal-cms/docs/screenshots/
```

Use the naming convention:
```
module-name-feature.png
```

Examples:
- `dashboard-overview.png`
- `case-detail-parties.png`
- `dialog-add-party.png`

#### Step 4: Verify Quality

Ensure each screenshot:
- ✅ Is clear and readable
- ✅ Shows all required elements
- ✅ Has no sensitive data
- ✅ Is properly named
- ✅ Is in PNG format
- ✅ Is high resolution

### Screenshot Capture Tools

**Windows:**
- Built-in: Windows + Shift + S
- Snipping Tool
- ShareX (free)

**Mac:**
- Built-in: Command + Shift + 4
- Screenshot app

**Browser Extensions:**
- Full Page Screen Capture
- Awesome Screenshot

## Using the Documentation

### For Training

1. **Print USER_MANUAL_WITH_SCREENSHOTS.md** after adding screenshots
2. Distribute to all staff
3. Use screenshots for visual reference
4. Reference during training sessions

### For Reference

1. Keep digital copy accessible to all users
2. Link from application (future enhancement)
3. Update as features are added
4. Maintain version history

### For Onboarding

1. Provide manual to new staff
2. Walk through each module with screenshots
3. Reference workflows for common tasks
4. Use troubleshooting section for issues

## Document Versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Oct 31, 2025 | Initial documentation created |
| 1.1 | TBD | Screenshots added |

## Future Enhancements

- [ ] Video tutorials for each module
- [ ] Interactive HTML version of manual
- [ ] In-app help system
- [ ] FAQ section based on user questions
- [ ] Advanced workflows guide
- [ ] Administrator guide
- [ ] API documentation (if applicable)

## Contributing

To update documentation:

1. Edit the relevant markdown file
2. Follow existing formatting
3. Update version history
4. Test all links and references
5. Commit with descriptive message

## Support

For questions about the documentation:
- Contact: DLPP IT Department
- Email: [support email]
- Phone: [support phone]

---

**Department of Lands & Physical Planning**
**Papua New Guinea**

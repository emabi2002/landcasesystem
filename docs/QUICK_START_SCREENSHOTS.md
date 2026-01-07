# Quick Start Guide: Capturing Screenshots

## 🎯 Goal
Capture 24 screenshots of the DLPP Legal CMS to complete the user manual with visual guides.

## ⚡ Quick Setup (5 minutes)

### 1. Ensure Development Server is Running
The server should already be running. Check the right panel in Same IDE - you should see the application.

If not running:
```bash
cd dlpp-legal-cms
bun run dev
```

### 2. Prepare Your Screen
- Set browser zoom to 100%
- Use full screen or maximize window
- Clear any browser extensions or bookmarks bar
- Use Chrome for best results

### 3. Create Test Data (If Not Already Done)

Navigate through the app and create:
- **3 cases** with different statuses (Open, In Progress, Closed)
- **At least 3 parties** per case
- **2-3 documents** per case
- **2-3 tasks** per case
- **1-2 events** per case
- **1 land parcel with GPS coordinates**

Example GPS for PNG:
- Latitude: `-9.4438` (Port Moresby)
- Longitude: `147.1803`

## 📸 Screenshot Capture Order

### PART 1: Main Modules (7 screenshots - 10 minutes)

1. **Dashboard** → Capture overview
   - Path: `/` or `/dashboard`
   - File: `dashboard-overview.png`
   - Show: Stats cards, chart, recent items

2. **Cases List** → Capture grid
   - Path: `/cases`
   - File: `cases-list.png`
   - Show: Multiple case cards

3. **Calendar** → Capture month view
   - Path: `/calendar`
   - File: `calendar-month-view.png`
   - Show: Events on calendar

4. **Documents** → Capture library
   - Path: `/documents`
   - File: `documents-library.png`
   - Show: Document cards

5. **Tasks** → Capture dashboard
   - Path: `/tasks`
   - File: `tasks-dashboard.png`
   - Show: Task list with badges

6. **Land Parcels** → Capture list
   - Path: `/land-parcels`
   - File: `land-parcels-list.png`
   - Show: Parcel cards

7. **Reports** → Capture interface
   - Path: `/reports`
   - File: `reports-generation.png`
   - Show: Report types, one selected, export buttons

### PART 2: Case Detail Tabs (7 screenshots - 15 minutes)

8. **Case Overview Tab** → **IMPORTANT: Hover over a party card**
   - Path: Click any case → Overview tab
   - File: `case-detail-overview.png`
   - Show: Purple border on hovered party card, tooltip visible

9. **Parties Tab**
   - File: `case-detail-parties.png`
   - Show: Full party list

10. **Documents Tab**
    - File: `case-detail-documents.png`
    - Show: Document list

11. **Tasks Tab**
    - File: `case-detail-tasks.png`
    - Show: Task list with status badges

12. **Events Tab**
    - File: `case-detail-events.png`
    - Show: Event list

13. **Land Tab**
    - File: `case-detail-land.png`
    - Show: Parcel with map (if GPS coordinates available)

14. **History Tab**
    - File: `case-detail-history.png`
    - Show: Timeline of actions

### PART 3: Dialogs (6 screenshots - 10 minutes)

From any case detail page, open each dialog:

15. **Add Party Dialog**
    - Click "Add Party" button
    - File: `dialog-add-party.png`
    - Show: Empty form, all fields

16. **Edit Party Dialog**
    - Click on any party card
    - File: `dialog-edit-party.png`
    - Show: Filled form, Delete button visible

17. **Upload Document Dialog**
    - Click "Upload Document"
    - File: `dialog-upload-document.png`
    - Show: Form with file picker

18. **Add Task Dialog**
    - Click "Add Task"
    - File: `dialog-add-task.png`
    - Show: Form with priority/status dropdowns

19. **Add Event Dialog**
    - Click "Add Event"
    - File: `dialog-add-event.png`
    - Show: Form with date/time picker

20. **Add Land Parcel Dialog**
    - Click "Add Land Parcel"
    - File: `dialog-add-parcel.png`
    - Show: Form with GPS fields

### PART 4: Special Features (4 screenshots - 10 minutes)

21. **Tooltip on Hover** ⭐ IMPORTANT
    - Go to case detail → Overview tab
    - Hover over a party card (don't click)
    - File: `feature-tooltip-hover.png`
    - Show: Purple border, edit icon, tooltip text

22. **Global Search**
    - Click search bar in navigation
    - Type something (e.g., "land")
    - File: `feature-global-search.png`
    - Show: Search results dropdown

23. **Land Parcel Map View** ⭐ IMPORTANT
    - Go to land parcels with GPS coordinates
    - File: `land-parcel-map-view.png`
    - Show: **Satellite imagery**, GPS marker, layer control

24. **Case List Grid** (if not captured well in #2)
    - Alternative angle of cases page
    - File: `cases-list.png`
    - Show: Search bar, cards, "Register New Case" button

## 💾 Saving Screenshots

### Where to Save
```
dlpp-legal-cms/docs/screenshots/
```

### Naming Convention
Use exact names from the list above:
- `dashboard-overview.png`
- `case-detail-parties.png`
- `dialog-add-party.png`
- etc.

### File Format
- Format: PNG
- Quality: High (no compression)
- Color: Full color (not grayscale)

## ✅ Quality Checklist

Before considering a screenshot complete:

- [ ] Text is clear and readable
- [ ] All UI elements are visible
- [ ] No personal/sensitive data shown
- [ ] Proper lighting (not too dark)
- [ ] Full element/section visible (not cut off)
- [ ] Correct zoom level (100%)
- [ ] File is saved with correct name
- [ ] File is in PNG format

## 🎨 Pro Tips

### For Best Results:

1. **Consistency**: Use the same test case for related screenshots
2. **Clean UI**: Close any unnecessary dialogs before capturing
3. **Highlight Actions**: For hover screenshots, ensure hover state is visible
4. **Complete Data**: Show realistic, complete information
5. **Professional Look**: Ensure UI looks polished

### Common Mistakes to Avoid:

❌ Capturing while dialog is animating
❌ Including browser tabs/address bar unnecessarily
❌ Using real personal information
❌ Blurry or low-resolution images
❌ Inconsistent zoom levels
❌ Wrong file names

## 🚀 Quick Keyboard Shortcuts

**Windows:**
- `Windows + Shift + S` → Screenshot tool
- `Windows + V` → Clipboard history

**Mac:**
- `Command + Shift + 4` → Screenshot selector
- `Command + Shift + 5` → Screenshot options

## ⏱️ Estimated Time

| Part | Screenshots | Time |
|------|-------------|------|
| Main Modules | 7 | 10 min |
| Case Detail Tabs | 7 | 15 min |
| Dialogs | 6 | 10 min |
| Special Features | 4 | 10 min |
| **TOTAL** | **24** | **~45 min** |

## 📝 After Completion

Once all screenshots are captured:

1. **Verify** all 24 files are in `docs/screenshots/`
2. **Check** file names match exactly
3. **Review** each screenshot for quality
4. **Update** USER_MANUAL_WITH_SCREENSHOTS.md if needed
5. **Commit** to git with message: "Add user manual screenshots"

## 🆘 Need Help?

If you encounter issues:

1. **Can't see the app**: Check dev server is running
2. **Hover not working**: Try different browser
3. **Map not showing**: Ensure GPS coordinates are added
4. **Dialog won't open**: Refresh page and try again

---

## 📋 Screenshot Checklist

Copy this to track progress:

```
Main Modules:
□ dashboard-overview.png
□ cases-list.png
□ calendar-month-view.png
□ documents-library.png
□ tasks-dashboard.png
□ land-parcels-list.png
□ reports-generation.png

Case Detail Tabs:
□ case-detail-overview.png (with hover!)
□ case-detail-parties.png
□ case-detail-documents.png
□ case-detail-tasks.png
□ case-detail-events.png
□ case-detail-land.png
□ case-detail-history.png

Dialogs:
□ dialog-add-party.png
□ dialog-edit-party.png
□ dialog-upload-document.png
□ dialog-add-task.png
□ dialog-add-event.png
□ dialog-add-parcel.png

Features:
□ feature-tooltip-hover.png (purple border!)
□ feature-global-search.png
□ land-parcel-map-view.png (satellite!)
```

---

**Ready to start? Open the app in the right panel and begin with Part 1!**

Good luck! 🎉

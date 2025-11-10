# 🔍 Search Functionality Guide

## Overview

The DLPP Legal Case Management System now includes comprehensive search functionality across all modules. You can search for cases, documents, events, tasks, land parcels, and parties from anywhere in the system.

---

## 🌐 Global Search

### **Location:** Top Navigation Bar (center)

The global search bar appears in the top navigation and searches across ALL modules simultaneously.

### **How to Use:**
1. Click on the search bar in the top navigation
2. Type at least 2 characters
3. Results appear instantly as you type
4. Click on any result to jump directly to it

### **What You Can Search:**
- ✅ **Cases** - By case number or title
- ✅ **Documents** - By document title or description
- ✅ **Events** - By event title or location
- ✅ **Tasks** - By task title or description
- ✅ **Land Parcels** - By parcel number or location
- ✅ **Parties** - By party name

### **Search Results Show:**
- Type indicator (Case, Document, Event, etc.)
- Main title/identifier
- Subtitle with context
- Icon for visual identification

### **Click a Result:**
- Automatically navigates to the relevant page
- Opens the correct tab if needed
- Highlights the item you were searching for

---

## 📋 Module-Specific Search

Each module page also has its own search/filter functionality for focused searching.

### **1. Tasks Page**

**Location:** Below the statistics cards

**Search By:**
- Task title
- Task description
- Case number
- Case title

**Features:**
- Real-time filtering as you type
- Shows count of matching results
- Clear button (X) to reset search
- Works across all tabs (All, Pending, In Progress, Overdue, Completed)

**Example:**
```
Type: "affidavit" → Shows all tasks related to affidavits
Type: "DLPP-2025-001" → Shows tasks for that specific case
```

---

### **2. Cases Page** (Coming Soon)

**Will Include:**
- Search by case number
- Search by title
- Filter by status
- Filter by priority
- Filter by region
- Date range filtering

---

### **3. Documents Page** (Coming Soon)

**Will Include:**
- Search by document title
- Search by description
- Filter by document type
- Filter by case
- Date uploaded filtering

---

### **4. Calendar/Events Page** (Coming Soon)

**Will Include:**
- Search by event title
- Search by location
- Filter by event type
- Date range filtering
- Case filtering

---

### **5. Land Parcels Page** (Coming Soon)

**Will Include:**
- Search by parcel number
- Search by location
- Filter by area
- GPS coordinate search
- Case filtering

---

## 🎯 Search Tips & Best Practices

### **For Best Results:**

1. **Be Specific**
   - Instead of: "land"
   - Try: "SEC 123 ALL 45"

2. **Use Case Numbers**
   - Quickest way to find case-related items
   - Example: "DLPP-2025-001"

3. **Partial Matches Work**
   - You don't need to type the full text
   - "affid" will find "affidavit"

4. **Search is Case-Insensitive**
   - "hohola" = "Hohola" = "HOHOLA"

5. **Use the Global Search for Unknown Location**
   - If you don't know which module an item is in
   - Global search finds it across everything

6. **Use Module Search for Focused Results**
   - If you know you're looking for a task
   - Use the Tasks page search for faster results

---

## 🚀 Keyboard Shortcuts (Planned)

Future enhancements will include:

- **Ctrl/Cmd + K** - Open global search
- **Ctrl/Cmd + F** - Focus module search
- **Esc** - Close search results
- **Arrow Keys** - Navigate results
- **Enter** - Select result

---

## 📊 Search Performance

### **Response Time:**
- Global search: ~300ms delay (debounced for performance)
- Module search: Instant (client-side filtering)

### **Result Limits:**
- Global search: Up to 5 results per module (30 total max)
- Module search: No limit (shows all matches)

### **Optimization:**
- Search uses database indexes for fast queries
- Results are cached for 5 seconds
- Typing triggers debounced search (waits 300ms after you stop typing)

---

## 🔧 Technical Details

### **Database Tables Searched:**

Global Search queries:
```sql
- cases (case_number, title)
- documents (title, description)
- events (title, location)
- tasks (title, description)
- land_parcels (parcel_number, location)
- parties (name)
```

### **Search Method:**
- Uses PostgreSQL `ilike` for case-insensitive matching
- Wildcards added automatically: `%searchterm%`
- Searches multiple fields per table

### **Security:**
- Only shows results the logged-in user has access to
- Respects row-level security policies
- No sensitive data exposed in search

---

## 💡 Common Use Cases

### **Case 1: Find a specific case**
1. Type case number in global search
2. Click on the case result
3. Opens case detail page

### **Case 2: Find all tasks for a case**
1. Go to Tasks page
2. Type case number in search box
3. See all tasks filtered for that case

### **Case 3: Find a document across all cases**
1. Use global search
2. Type document name
3. See which cases have that document

### **Case 4: Find land parcels by location**
1. Use global search
2. Type location name
3. See all parcels in that area

### **Case 5: Find all items related to a party**
1. Use global search
2. Type party name
3. See all related items

---

## 🎨 Search UI Elements

### **Global Search:**
- Purple background to match navigation
- White text for visibility
- Dropdown shows results below
- Icons for each result type
- Badges showing item type

### **Module Search:**
- White card with search icon
- Clear button (X) on right
- Result count displayed
- Filters active tabs

---

## 📱 Mobile Responsive

- Global search: Hidden on mobile (use module search)
- Module search: Full width on mobile
- Touch-friendly buttons
- Easy to type on mobile keyboards

---

## 🔮 Future Enhancements

Planned improvements:

1. **Advanced Filters**
   - Date ranges
   - Multiple field filtering
   - Save filter presets

2. **Search History**
   - Recent searches
   - Quick re-search
   - Clear history option

3. **Autocomplete**
   - Suggested completions
   - Recent items
   - Popular searches

4. **Export Results**
   - Export search results to Excel
   - Generate reports from searches
   - Share search links

5. **Voice Search**
   - Speak your search query
   - Mobile-friendly
   - Multiple languages

---

## ❓ FAQ

**Q: Why does global search require 2 characters?**
A: To prevent performance issues with single-character searches and to give more relevant results.

**Q: Can I search multiple terms?**
A: Yes! Type multiple words and results will match any of them.

**Q: How do I clear my search?**
A: Click the X button in the search box or delete all text.

**Q: Does search work offline?**
A: Module search works offline (cached data). Global search requires internet connection.

**Q: Can I save my searches?**
A: Not yet, but this feature is planned for future updates.

---

## 📞 Support

Need help with search?

1. Check this guide first
2. Try the global search for quick results
3. Use module-specific search for detailed filtering
4. Contact support if issues persist

---

**Last Updated:** October 30, 2025
**Version:** 16
**Feature Status:** ✅ Active (Global Search + Tasks Module)

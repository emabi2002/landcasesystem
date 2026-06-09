# SelectWithAdd Enhancement - Directions Module Setup Guide

## ✅ What Was Done

The **Directions & Hearings** page now has **"+" buttons** next to dropdown fields that allow **administrators only** to add new lookup items without needing to access the database directly.

### Changes Made:

1. **Updated Directions Page** (`src/app/directions/page.tsx`)
   - ✅ Replaced regular `Select` component with `SelectWithAdd` for **Priority** dropdown
   - ✅ Replaced text `Input` with `SelectWithAdd` for **Assign To** dropdown
   - ✅ Added import for `SelectWithAdd` component

2. **Created Action Officers Lookup Table**
   - ✅ New SQL file: `ADD_ACTION_OFFICERS_TABLE.sql`
   - ✅ Contains default action officers (Senior Legal Officer, Action Officer, etc.)
   - ✅ Administrators can add more officers via the "+" button

3. **Updated SelectWithAdd Component**
   - ✅ Added `action_officers` to supported table types
   - ✅ Added proper label ("Action Officer") for the new table
   - ✅ Component already has admin-only restriction built-in

4. **Updated Master Files Admin Panel**
   - ✅ Added **Action Officers** tab to `/admin/master-files`
   - ✅ Admins can manage all action officers from admin panel
   - ✅ Full CRUD operations available

5. **Updated RLS Access Script**
   - ✅ Added `action_officers` table to `FIX_RLS_ACCESS.sql`
   - ✅ Ensures no permission issues during development

---

## 🚀 Installation Steps

### Step 1: Run the Database Migration

Open **Supabase SQL Editor** and run this script:

```sql
-- File: ADD_ACTION_OFFICERS_TABLE.sql
```

Copy and paste the contents of `ADD_ACTION_OFFICERS_TABLE.sql` into the SQL editor and click **Run**.

**Expected Result:**
```
SUCCESS: action_officers lookup table created!
```

---

### Step 2: Verify RLS is Disabled (Optional)

If you encounter access issues, run:

```sql
-- File: FIX_RLS_ACCESS.sql
```

This ensures all lookup tables are accessible during development.

---

### Step 3: Test the Feature

1. **Login as an Administrator** (or any user during development)

2. **Navigate to Directions & Hearings**
   - Click on "Case Workflow" → "Directions & Hearings" in sidebar
   - Or visit: `http://localhost:3000/directions`

3. **Click "Issue New Direction"** button

4. **Test Priority Dropdown:**
   - Look for the **"+" button** next to the "Priority" dropdown
   - Click it to open the "Add New Priority Level" dialog
   - Try adding a new priority (e.g., "Critical")
   - The new priority should appear in the dropdown immediately

5. **Test Assign To Dropdown:**
   - Look for the **"+" button** next to the "Assign To" dropdown
   - Click it to open the "Add New Action Officer" dialog
   - Try adding a new officer (e.g., "John Smith - Legal Officer")
   - The new officer should appear in the dropdown immediately

---

## 🎯 How It Works

### For Regular Users:
- See only the dropdown, no "+" button
- Can select from existing items in the lookup tables

### For Administrators:
- See the dropdown **AND** a "+" button
- Can click "+" to open a dialog to add new items
- New items are immediately available in the dropdown
- New items are saved to the database and available to all users

### Admin Detection:
The component automatically detects if the current user is an admin by:
1. Checking the `profiles.role` field in the database
2. Defaulting to `admin` access during development
3. Roles that can add items:
   - `admin`
   - `administrator`
   - `manager_legal_services`

---

## 📊 Lookup Tables Added

### Action Officers Table (`public.action_officers`)

**Default Officers Included:**
- Senior Legal Officer - Litigation
- Action Officer - Litigation Lawyer
- Legal Officer
- Para-Legal Officer
- Assistant Legal Officer
- Case Officer
- Other

**Fields:**
- `id` - UUID primary key
- `name` - Officer name (required, unique)
- `title` - Position title
- `department` - Department name
- `email` - Contact email (optional)
- `phone` - Contact phone (optional)
- `is_active` - Active status
- `display_order` - Sort order
- `created_at` - Timestamp
- `created_by` - User who created

---

## 🎨 Master Files Management

Administrators can also manage all lookup tables from the **Master Files** admin panel:

**URL:** `/admin/master-files`

**Available Tables:**
1. Matter Types
2. Case Categories
3. Hearing Types
4. Lease Types
5. DLPP Divisions
6. Regions
7. External Lawyers
8. Sol Gen Officers
9. Court Order Types
10. Case Statuses
11. Priority Levels
12. **Action Officers** ✨ (NEW!)

From this panel, admins can:
- ✅ Add new items
- ✅ Edit existing items
- ✅ Deactivate items (soft delete)
- ✅ Delete items permanently
- ✅ Reorder items
- ✅ View all items in table format

---

## 🔧 Customization

### Adding More Lookup Tables

To add the "+" button to other dropdowns:

1. **Create the lookup table SQL:**
   ```sql
   CREATE TABLE IF NOT EXISTS public.my_lookup_table (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL UNIQUE,
     description TEXT,
     is_active BOOLEAN DEFAULT true,
     display_order INT DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Update `SelectWithAdd` component type:**
   ```typescript
   tableName: '...' | 'my_lookup_table'
   ```

3. **Add to `getTableLabel()` function:**
   ```typescript
   case 'my_lookup_table':
     return 'My Lookup Item';
   ```

4. **Use in your form:**
   ```tsx
   <SelectWithAdd
     value={formData.field}
     onValueChange={(value) => setFormData({ ...formData, field: value })}
     tableName="my_lookup_table"
     label="My Field"
     placeholder="Select item"
   />
   ```

---

## ✅ Verification Checklist

After installation, verify:

- [ ] `action_officers` table exists in Supabase
- [ ] Default officers are populated
- [ ] "+" button appears next to Priority dropdown (if admin)
- [ ] "+" button appears next to Assign To dropdown (if admin)
- [ ] Clicking "+" opens a dialog with form
- [ ] Adding new item saves to database
- [ ] New item appears in dropdown immediately
- [ ] New item persists after page refresh
- [ ] Master Files page shows Action Officers tab
- [ ] Can manage action officers from admin panel

---

## 📝 Notes

- **Admin Access:** During development, all users have admin access by default
- **Production:** Ensure proper role assignment in `profiles` table
- **Performance:** Lookup tables are cached and loaded once per component mount
- **Real-time:** New items appear immediately without page refresh
- **Validation:** Duplicate names are prevented with unique constraint

---

## 🐛 Troubleshooting

### "+" Button Not Showing
- Check if user role is `admin`, `administrator`, or `manager_legal_services`
- Verify `profiles` table has correct role for user
- During development, component defaults to admin access

### "Failed to add new item"
- Check Supabase SQL Editor for table existence
- Run `FIX_RLS_ACCESS.sql` to disable RLS
- Check browser console for detailed error messages

### "Table does not exist"
- Run `ADD_ACTION_OFFICERS_TABLE.sql` in Supabase SQL Editor
- Refresh schema: `NOTIFY pgrst, 'reload schema';`

### Dropdown Empty
- Check if `is_active = true` for items in the table
- Verify items exist: `SELECT * FROM action_officers;`
- Check browser network tab for API errors

---

## 🎉 Success!

You now have a fully functional **SelectWithAdd** component on the Directions page that allows administrators to dynamically add:
- ✅ New priority levels
- ✅ New action officers

Without ever touching the database directly! 🚀

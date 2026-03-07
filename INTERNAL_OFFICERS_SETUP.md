# Internal Officers Management System - Setup Guide

## 🎯 Overview

A comprehensive admin panel for managing **internal DLPP officers and staff** with full CRUD operations. Administrators can add, edit, and manage officer information including names, titles, departments, contact details, and more.

---

## ✨ Features

### ✅ Full Officer Management
- **Add New Officers** with complete details
- **Edit Officer Information** - names, titles, departments can be amended anytime
- **Activate/Deactivate** officers without deleting
- **Delete Officers** permanently (with confirmation)
- **Search & Filter** by name, title, department, or employee ID

### ✅ Complete Officer Profile
Each officer record includes:
- **Name** - Full name (required)
- **Title** - Position/role (required)
- **Department** - Division/department (required)
- **Email** - Contact email (optional)
- **Phone** - Contact phone (optional)
- **Office Location** - Physical location (optional)
- **Employee ID** - Unique identifier (optional)
- **Notes** - Additional information (optional)
- **Display Order** - Sort order in dropdowns
- **Active Status** - Active/Inactive

### ✅ Integration
- Officers appear in **"Assign To"** dropdowns throughout the system
- Integrated with **Directions & Hearings** module
- Can be used in **Case Assignments**
- Available in **Task Management**

---

## 🚀 Installation

### Step 1: Run the Database Migration

**Open Supabase SQL Editor** and run:

```sql
-- File: ADD_ACTION_OFFICERS_TABLE.sql
-- Copy and paste the entire file contents
```

**Expected Result:**
```
SUCCESS: Enhanced action_officers table created with full officer management!
```

### What This Creates:
- ✅ `action_officers` table with all required fields
- ✅ Indexes for performance (active status, department, name)
- ✅ Auto-update trigger for `updated_at` timestamp
- ✅ Default officers pre-populated
- ✅ Unique constraint on employee_id

---

### Step 2: Verify Table Structure

Run this query to verify:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'action_officers'
ORDER BY ordinal_position;
```

**Expected Columns:**
```
id                 | uuid
name              | text          | NO
title             | text          | NO
department        | text          | NO
email             | text          | YES
phone             | text          | YES
office_location   | text          | YES
employee_id       | text          | YES
is_active         | boolean       | YES
display_order     | integer       | YES
notes             | text          | YES
created_at        | timestamp     | YES
created_by        | uuid          | YES
updated_at        | timestamp     | YES
updated_by        | uuid          | YES
```

---

## 📊 Default Officers

The migration automatically creates these default officers:

1. **Senior Legal Officer - Litigation** (Legal Services Division)
2. **Action Officer - Litigation** (Legal Services Division)
3. **Legal Officer** (Legal Services Division)
4. **Para-Legal Officer** (Legal Services Division)
5. **Assistant Legal Officer** (Legal Services Division)
6. **Case Officer** (Legal Services Division)
7. **Senior Legal Officer - Land** (Lands Division)
8. **Senior Legal Officer - Planning** (Physical Planning Division)
9. **Manager Legal Services** (Legal Services Division)
10. **Director Legal Services** (Legal Services Division)

You can edit or delete any of these and add your own.

---

## 🎨 Using the Internal Officers Page

### Access the Page

**URL:** `/admin/internal-officers`

**Navigation:**
1. Login as administrator
2. Click **Administration** in sidebar
3. Click **Internal Officers**

### Dashboard Overview

The page shows:
- **Total Officers** count
- **Active Officers** count
- **Search bar** for filtering
- **Add New Officer** button

---

## ✏️ Adding a New Officer

1. Click **"Add New Officer"** button
2. Fill in the form:

### Basic Information (Required)
- **Full Name** - e.g., "John Smith"
- **Title** - Select from dropdown (Director, Manager, Legal Officer, etc.)
- **Department** - Select from dropdown (Legal Services, Lands, etc.)

### Contact Information (Optional)
- **Email** - e.g., "john.smith@lands.gov.pg"
- **Phone** - e.g., "+675 320 1234"
- **Office Location** - e.g., "Building A, Room 201"

### Additional Details (Optional)
- **Employee ID** - e.g., "EMP-2024-001" (must be unique)
- **Display Order** - Number for sorting (lower = appears first)
- **Notes** - Any additional information

3. Click **"Add Officer"**

✅ Officer is now available in all "Assign To" dropdowns!

---

## 📝 Editing Officer Information

### To Edit an Officer:

1. Find the officer in the table
2. Click the **Edit (✏️)** button
3. Update any fields:
   - ✅ Change name
   - ✅ Change title
   - ✅ Change department
   - ✅ Update contact info
   - ✅ Modify notes
4. Click **"Update Officer"**

### Changes Take Effect Immediately
- Updated information appears instantly in all dropdowns
- All existing case assignments remain linked
- Edit history is tracked with `updated_at` timestamp

---

## 🔄 Managing Officer Status

### Deactivate an Officer

**When to use:** Officer is on leave, transferred, or no longer available

1. Click the **deactivate (❌)** button
2. Officer status changes to "Inactive"
3. Officer **will NOT appear** in new assignment dropdowns
4. Existing assignments remain intact

### Reactivate an Officer

1. Click the **activate (✓)** button
2. Officer status changes to "Active"
3. Officer appears in assignment dropdowns again

### Delete an Officer Permanently

⚠️ **Use with caution!**

1. Click the **delete (🗑️)** button
2. Confirm deletion in the dialog
3. Officer is **permanently removed** from the database

**Note:** Only delete if the officer was added by mistake. For temporary unavailability, use deactivate instead.

---

## 🔍 Search & Filter

The search bar filters officers by:
- ✅ Name
- ✅ Title
- ✅ Department
- ✅ Email
- ✅ Employee ID

**Example searches:**
- "Legal Officer" - finds all legal officers
- "Legal Services" - finds all in Legal Services Division
- "EMP-2024" - finds officers with this employee ID pattern

---

## 🏢 Departments Available

The system includes these departments:

1. Legal Services Division
2. Lands Division
3. Physical Planning Division
4. Survey and Mapping Division
5. Valuation Division
6. Land Registration Division
7. Customary Land Division
8. Corporate Services Division
9. Policy and Planning Division
10. Other

**To add more departments:** Edit the `DEPARTMENTS` array in the page code.

---

## 👔 Titles Available

Standard titles included:

1. Director
2. Manager
3. Senior Legal Officer
4. Legal Officer
5. Action Officer
6. Para-Legal Officer
7. Assistant Legal Officer
8. Case Officer
9. Administrative Officer
10. Other

**To add more titles:** Edit the `TITLES` array in the page code.

---

## 🔧 Integration with Other Modules

### Directions & Hearings
The **"Assign To"** dropdown uses the officers table:
```tsx
<SelectWithAdd
  tableName="action_officers"
  label="Assign To"
  placeholder="Officer name (triggers Step 3)"
/>
```

### Case Assignments
Officers can be selected when assigning cases.

### Task Management
Officers appear in task assignment dropdowns.

---

## 📋 Best Practices

### ✅ DO:
- **Keep officer information up-to-date**
- **Use meaningful employee IDs** (e.g., EMP-LS-001 for Legal Services)
- **Add email and phone** for better contact management
- **Use deactivate** instead of delete for temporarily unavailable officers
- **Assign proper display order** for logical sorting

### ❌ DON'T:
- Don't delete officers who have case assignments
- Don't create duplicate officers
- Don't use special characters in employee IDs
- Don't leave required fields empty

---

## 🎯 Common Tasks

### Add a New Legal Officer
```
Name: Sarah Johnson
Title: Legal Officer
Department: Legal Services Division
Email: sarah.johnson@lands.gov.pg
Phone: +675 320 5678
Office Location: Building B, Room 105
Employee ID: EMP-LS-015
```

### Promote an Officer
1. Edit the officer
2. Change **Title** to new position
3. Update **Department** if needed
4. Save

### Transfer an Officer to Another Division
1. Edit the officer
2. Change **Department** to new division
3. Update **Office Location** if applicable
4. Save

### Officer Going on Leave
1. Click **deactivate** button
2. Add note in **Notes** field: "On leave until [date]"
3. When they return, click **activate** button

---

## 🐛 Troubleshooting

### "Employee ID already exists"
- Each employee ID must be unique
- Check if another officer has the same ID
- Use a different ID or leave blank

### Officer not appearing in dropdowns
- Check if officer **is_active = true**
- Refresh the page
- Check browser console for errors

### Can't edit officer
- Verify you're logged in as administrator
- Check database permissions
- Run `FIX_RLS_ACCESS.sql` if needed

### Table doesn't exist
- Run `ADD_ACTION_OFFICERS_TABLE.sql` migration
- Refresh schema: `NOTIFY pgrst, 'reload schema';`

---

## 📊 Database Schema

### Table: `public.action_officers`

```sql
CREATE TABLE public.action_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  office_location TEXT,
  employee_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);
```

### Indexes:
- `idx_action_officers_active` - Fast filtering by active status
- `idx_action_officers_department` - Fast filtering by department
- `idx_action_officers_name` - Fast searching by name

### Triggers:
- `trigger_action_officers_updated_at` - Auto-updates `updated_at` on changes

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Table `action_officers` exists in Supabase
- [ ] Default officers are populated
- [ ] Page accessible at `/admin/internal-officers`
- [ ] "Internal Officers" link appears in Admin sidebar
- [ ] Can add new officer successfully
- [ ] Can edit existing officer
- [ ] Can search and filter officers
- [ ] Can activate/deactivate officers
- [ ] Can delete officers (with confirmation)
- [ ] Officers appear in "Assign To" dropdowns
- [ ] Employee ID uniqueness is enforced
- [ ] Required fields are validated
- [ ] Updated timestamp changes on edit

---

## 🎉 Success!

You now have a complete **Internal Officers Management System** where administrators can:

✅ Add new officers with full details
✅ Edit officer names, titles, and departments anytime
✅ Manage contact information
✅ Activate/deactivate officers
✅ Search and filter efficiently
✅ Track officer changes with timestamps

**Officers are now available throughout the system for case and task assignments!** 🚀

---

## 📞 Support

For issues or questions:
- Review this documentation
- Check the troubleshooting section
- Verify database migration ran successfully
- Contact system administrator

---

**Last Updated:** Today
**Version:** 1.0
**Module:** Internal Officers Management

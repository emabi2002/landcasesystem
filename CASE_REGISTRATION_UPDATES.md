# ✅ Case Registration Form - Updates Complete

## What's New

Your case registration form has been enhanced with all the requested features!

### 1️⃣ Extended Description Field
- **Before**: 200 characters maximum
- **Now**: 1000 characters maximum
- Perfect for detailed case descriptions

### 2️⃣ Optional Document Upload
- **Before**: Required to upload at least one document
- **Now**: Completely optional - can be added later
- More flexibility when registering cases

### 3️⃣ Add Parties During Registration
- **New Feature**: Add plaintiffs and defendants while creating the case
- Click "Add Party" button to add:
  - Name
  - Role (Plaintiff/Defendant/Witness/Other)
  - Type (Individual/Company/Government Entity/Other)
- Can add multiple parties
- Can also add parties later if preferred

### 4️⃣ Old Case vs New Case
- **New Toggle**: Choose between "New Case" or "Old Case"
- **For Old Cases**:
  - Select "Old Case (Needs New Court Reference)"
  - Enter the old case reference number
  - System generates a new DLPP-YYYY-XXXXXX number
  - Both old and new references are tracked

### 5️⃣ Case Type Selection
- **New Dropdown**: Select the type of case
- **Options**:
  - Court Matter
  - Dispute
  - Title Claim
  - Administrative Review
  - Judicial Review
  - Tort
  - Compensation Claim
  - Fraud
  - Other
- Helps categorize and identify cases properly

## How to Use

### Creating a New Case:
1. Keep "New Case" selected (default)
2. Select case type from dropdown
3. Choose DLPP role (Defendant/Plaintiff)
4. Add description (up to 1000 characters)
5. (Optional) Click "Add Party" to add plaintiffs/defendants
6. (Optional) Upload documents
7. Click "Create Case & Generate Case ID"

### Creating an Old Case with New Reference:
1. Click "Old Case (Needs New Court Reference)" toggle
2. Enter the old case reference number (required)
3. Select case type
4. Complete other fields as above
5. System will generate new ID and track old reference

## Visual Improvements

The form now shows a dynamic summary of what will be created:
- ✅ New case number (DLPP-YYYY-XXXXXX)
- ✅ Old reference (if applicable)
- ✅ Case type selected
- ✅ Number of parties added
- ✅ Status: Registered

## Next Steps

⚠️ **Before you can test the form**, you need to:

1. **Set up Supabase** (if not already done):
   - Go to https://supabase.com
   - Create a new project
   - Run the database schema from `database-schema.sql`

2. **Update Environment Variables**:
   - Edit `.env.local` file
   - Add your Supabase project URL
   - Add your Supabase anon key

3. **Test the Form**:
   - Navigate to `/cases/create-minimal`
   - Try creating both new and old cases
   - Test adding parties
   - Verify all features work as expected

## Technical Details

**Files Modified:**
- `src/app/cases/create-minimal/page.tsx`

**Database Tables Used:**
- `cases` - Stores case information
- `parties` - Stores party information
- `documents` - Stores uploaded documents (if any)

**Features:**
- All validations updated
- Error handling in place
- Graceful fallbacks if party/document save fails
- Success messages show old reference when applicable

---

**Status**: ✅ Complete - Ready for Testing
**All 5 requested features have been successfully implemented!**

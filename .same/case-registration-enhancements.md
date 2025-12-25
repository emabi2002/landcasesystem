# Case Registration Form Enhancements

## Summary of Changes

All requested features have been successfully implemented in the case registration form (`/cases/create-minimal`).

## ✅ Implemented Features

### 1. Extended Case Description (1000 characters)
- **Previous**: 200 character limit
- **New**: 1000 character limit
- **Location**: "Brief Description" field
- **Character counter** shows: `(0/1000)`

### 2. Optional Document Upload
- **Previous**: Required at least one document
- **New**: Completely optional
- **Changes**:
  - Removed validation that blocked submission without documents
  - Changed label from "Originating Document(s) *" to "Originating Document(s) (Optional)"
  - Updated help text to clarify documents can be attached later
- **Note**: Documents can always be added from the case details page after creation

### 3. Parties List (Plaintiff/Defendant)
- **New Feature**: Add parties during case registration
- **Features**:
  - "Add Party" button to add multiple parties
  - Each party has:
    - Full Name (required)
    - Role: Plaintiff, Defendant, Witness, Other
    - Type: Individual, Company, Government Entity, Other
  - Remove party button (X) for each entry
  - Parties are automatically saved to database when case is created
- **Note**: Parties can also be added later from the case details page

### 4. Old Case vs New Case Selection
- **New Feature**: Toggle between New Case and Old Case
- **Two Buttons**:
  - "New Case" (green) - Standard new case registration
  - "Old Case (Needs New Court Reference)" (amber) - For old cases needing new reference
- **Old Case Features**:
  - Shows special input field for "Old Case Reference Number"
  - Field is required when "Old Case" is selected
  - Old reference is stored in case description with prefix "OLD CASE REF:"
  - System still generates new DLPP-YYYY-XXXXXX number
  - Success message shows both new and old reference numbers

### 5. Case Type Selection
- **New Field**: "Case Type" dropdown (required)
- **Available Options**:
  - Court Matter (default)
  - Dispute
  - Title Claim
  - Administrative Review
  - Judicial Review
  - Tort
  - Compensation Claim
  - Fraud
  - Other
- **Purpose**: Properly categorize and identify cases by type
- **Display**: Selected case type shows in "What Will Be Generated" summary

## Visual Enhancements

### Auto-Generation Summary Box
The green summary box now shows:
- ✅ Case Number (DLPP-YYYY-XXXXXX)
- ✅ Old Reference (if old case selected)
- ✅ Case Title
- ✅ Case Type (displays selected type)
- ✅ Status
- ✅ Parties (count if any added)
- ✅ Creation Record

### Form Organization
Fields are now organized in this order:
1. Case Type Toggle (New/Old)
2. Old Case Reference (conditional)
3. Case Type Dropdown
4. DLPP Role
5. Brief Description (1000 chars)
6. Parties Section
7. Document Upload (optional)
8. Auto-Generation Summary

## Database Integration

All new features are fully integrated with the database:

- **Case Table**: Stores case_type and old reference in description
- **Parties Table**: Automatically creates party records with:
  - case_id (linked to new case)
  - name
  - role
  - party_type
  - contact_info (JSONB)
- **Documents Table**: Links uploaded documents (if any)

## User Experience Improvements

1. **Flexibility**: Users can create minimal cases quickly or add full details upfront
2. **Clear Labeling**: All optional fields clearly marked
3. **Helpful Text**: Descriptive help text under each field
4. **Visual Feedback**: Color-coded buttons (green for new, amber for old)
5. **Dynamic Summary**: Shows exactly what will be created before submission
6. **Error Handling**: Graceful error messages if parties or documents fail to save

## Testing the Enhancements

To test the new features:

1. Navigate to `/cases/create-minimal`
2. Try creating a **New Case**:
   - Select case type
   - Add description (test 1000 char limit)
   - Add one or more parties
   - Submit (with or without documents)
3. Try creating an **Old Case**:
   - Click "Old Case" toggle
   - Enter old reference number
   - Complete other fields
   - Verify old reference appears in success message

## Configuration Required

**Important**: To use this application, you need to configure Supabase:

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Run the database schema SQL files
4. Update `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Files Modified

- `src/app/cases/create-minimal/page.tsx` - Main form component
- `.env.local` - Environment configuration (created)
- `.same/case-registration-enhancements.md` - This documentation

---

**Status**: ✅ All requested features implemented and ready for testing
**Date**: December 14, 2024
**Version**: 3

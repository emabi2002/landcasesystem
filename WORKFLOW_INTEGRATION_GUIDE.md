# DLPP Litigation Case Registration Workflow Integration

## Overview

This guide explains how the DLPP Legal Case Management System has been enhanced to fully implement the workflow process for registering and managing DLPP litigation cases as documented in your workflow documents.

## What's New

### 1. Complete Workflow Implementation

The system now implements the full 6-step workflow process:

- **STEP 1**: Access system with username and password ✅
- **STEP 2**: Register new case with all required fields ✅
- **STEP 3**: Upload Court documents ✅ (existing feature)
- **STEP 4**: Create tasks and activities ✅ (existing feature)
- **STEP 5**: Register Court Orders ✅ (new feature)
- **STEP 6**: Upload Court Order documents ✅

### 2. Enhanced Case Registration Form

The case registration form has been completely redesigned to include:

#### Section A: DLPP as Defendant/Respondent
When registering cases where DLPP is the defendant, the form captures:

1. **Court reference number** - Official court file number
2. **Parties to the proceedings** - All parties involved
3. **Track number** - Court tracking reference
4. **Date when proceeding was filed** - Filing date
5. **Date when Court documents were served or received** - Service date
6. **Type of Court documents lodged** - Document types
7. **Type of matter** - Tort, compensation claim, fraud, judicial review, etc.
8. **Returnable date for hearings** - With automatic alerts 3 days before
9. **Land description** - Full details including zoning, survey plan, lease info
10. **Division responsible** - Which DLPP division handles the case
11. **Allegations and/or legal issues** - Legal basis of the claim
12. **Reliefs sought** - What the plaintiff is requesting
13. **Name of Plaintiff's Lawyers** - Opposing counsel
14. **Sol Gen action officer** - Solicitor General's officer
15. **DLPP action officer** - With assignment date and supervisor notes
16. **Status of matter** - Current case status
17. **Section 5 notice** - Applicable for defendant cases

#### Section B: DLPP as Plaintiff/Applicant
When registering cases where DLPP is the plaintiff, the form captures:

1. **Court reference number**
2. **Parties to the proceedings**
3. **Track number**
4. **Date when proceeding was filed**
5. **Date when Court documents were served**
6. **Type of Court documents lodged**
7. **Type of matter**
8. **Returnable date for hearings** - With automatic alerts
9. **Land description and further details**
10. **Division responsible**
11. **Cause of action** - Legal basis for DLPP's claim

### 3. Automatic Alert System

**Critical Feature**: The system automatically creates calendar events and sends alerts **3 days before the returnable date** as specified in the workflow.

When you enter a returnable date (for directions hearing, substantive hearing, pre-trial conference, trial, or mediation), the system will:
- Create a calendar event automatically
- Set up an alert system to notify 3 days in advance
- Link the event to the case for easy tracking

### 4. New Database Fields

The following fields have been added to the cases table:

| Field Name | Description | Required |
|------------|-------------|----------|
| `dlpp_role` | Whether DLPP is defendant or plaintiff | Yes |
| `track_number` | Court track number | No |
| `proceeding_filed_date` | Date proceeding was filed | Yes |
| `documents_served_date` | Date documents served/received | No |
| `court_documents_type` | Type of court documents | No |
| `matter_type` | Type of matter (tort, fraud, etc.) | Yes |
| `returnable_date` | Date for next hearing | No |
| `returnable_type` | Type of hearing | No |
| `land_description` | Full land description | Yes |
| `zoning` | Land zoning information | No |
| `survey_plan_no` | Survey plan number | No |
| `lease_type` | Type of lease | No |
| `lease_commencement_date` | Lease start date | No |
| `lease_expiration_date` | Lease end date | No |
| `division_responsible` | DLPP division handling case | Yes |
| `allegations` | Legal issues/cause of action | Yes |
| `reliefs_sought` | Reliefs being sought | Yes |
| `opposing_lawyer_name` | Plaintiff's/defendant's lawyer | No |
| `sol_gen_officer` | Sol Gen action officer | No |
| `dlpp_action_officer` | DLPP action officer | Yes |
| `officer_assigned_date` | Date officer assigned | No |
| `assignment_footnote` | Manager/supervisor notes | No |
| `section5_notice` | Section 5 notice applicable | No |

### 5. Court Orders Management (STEP 5 & 6)

A new `court_orders` table has been created to track concluded matters:

When a matter is concluded and a Court Order is presented, you can register it with:
- Court reference number
- Parties to the proceeding
- Date of Court Order
- Terms of Court Order
- Grounds for conclusion of Court proceeding
- Upload the Court Order document

## Installation Instructions

### Step 1: Run the Database Migration

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Run the `database-workflow-enhancement.sql` script

This will:
- Add all new columns to the cases table
- Create the court_orders table
- Set up automatic triggers for returnable date alerts
- Create helper views and functions

### Step 2: Test the System

1. Log in to your system
2. Go to "Cases" → "Register New Case"
3. Try registering a case as Defendant/Respondent
4. Try registering a case as Plaintiff/Applicant
5. Enter a returnable date and verify the alert is created

## Using the Enhanced System

### Registering a Case (STEP 2)

1. **Access the system** with your credentials (STEP 1)

2. **Navigate to Cases** and click "Register New Case" (STEP 2)

3. **Select DLPP Role**:
   - Choose "Defendant/Respondent" or "Plaintiff/Applicant"
   - The form will adapt based on your selection

4. **Fill in the form sections**:
   - **Court and Case Details**: Items 1-6 from workflow
   - **Matter Type and Hearing Details**: Items 7-8, including returnable date
   - **Land Description**: Item 9 with all land details
   - **Legal Issues and Division**: Items 10-12
   - **Legal Representatives**: Items 13-14
   - **DLPP Action Officer**: Item 15/18 with assignment details
   - **Status and Priority**: Items 16-17/15 including Section 5 notice

5. **Submit the form** to register the case

6. **System automatically creates**:
   - The case record
   - A calendar event for case registration
   - A calendar event for the returnable date (if provided)
   - An alert system for 3 days before returnable date

### Uploading Documents (STEP 3)

After registration:
1. Go to the case detail page
2. Navigate to the "Documents" section
3. Upload Court documents

### Creating Tasks (STEP 4)

Create specific tasks and activities:
- Prepare Defence
- Instructions Letter
- Brief Out Request Letter
- Affidavit
- Notice of Motion
- Affidavit in Support
- Notice of Disputed and Undisputed Facts
- Etc.

### Registering Court Orders (STEP 5 & 6)

When a matter is concluded:
1. Navigate to the concluded case
2. Go to "Court Orders" section
3. Register the Court Order with all details
4. Upload the Court Order document

## Key Features

### 1. Conditional Field Display

The form intelligently shows/hides fields based on whether DLPP is defendant or plaintiff:
- Different labels for opposing counsel
- Section 5 notice only for defendant cases
- Different item numbering as per workflow

### 2. Required vs Optional Fields

The system enforces required fields as per the workflow:
- All required fields are marked with *
- Optional fields can be left empty
- System validates before submission

### 3. Date and Time Management

- All dates are properly formatted
- Returnable dates include time for precise scheduling
- System handles date conversions automatically

### 4. Alert System

The returnable date alert system ensures you never miss important deadlines:
- Automatic calendar event creation
- 3-day advance warning
- Visual indicators in the calendar view

## Matter Types Supported

The system supports the following matter types as specified in the workflow:
- Tort
- Compensation Claim
- Fraud
- Judicial Review
- Contract Dispute
- Land Title
- Lease Dispute
- Other

## Hearing Types Supported

For returnable dates, the following hearing types are supported:
- Directions Hearing
- Substantive Hearing
- Pre-Trial Conference
- Trial
- Mediation
- Other

## Division Options

The system tracks which DLPP division is responsible:
- Lands Division
- Physical Planning Division
- Surveying Division
- Valuations Division
- Legal Division
- Other

## Lease Types

For land-related cases, lease types include:
- State Lease
- Customary Lease
- Business Lease
- Agricultural Lease
- Residential Lease
- Other

## Next Steps

After implementing this workflow:

1. **Train staff** on the new comprehensive registration form
2. **Migrate existing cases** to include the new field data
3. **Set up regular monitoring** of returnable date alerts
4. **Review Court Orders** process with legal team
5. **Customize field options** if needed for your specific requirements

## Support

If you need to customize any of the workflow fields, options, or validation rules, the main files to edit are:

- **Form UI**: `/src/app/cases/new/page.tsx`
- **Database Schema**: `/database-workflow-enhancement.sql`
- **Case Display**: `/src/app/cases/[id]/page.tsx`

## Troubleshooting

### Issue: Required fields not enforced
**Solution**: Check that the database migration ran successfully

### Issue: Alerts not appearing
**Solution**: Verify that the trigger functions are created in Supabase

### Issue: Form not submitting
**Solution**: Check browser console for validation errors

## Version History

- **Version 18**: Complete workflow integration with all 17/18 items from workflow documents
- Automatic alert system for returnable dates
- Court Orders management
- Enhanced land description fields
- Legal officer assignment tracking

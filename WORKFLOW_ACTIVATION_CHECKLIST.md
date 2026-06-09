# Workflow Enhancement Activation Checklist

## ✅ Pre-Activation Checklist

Before you can use the new comprehensive case registration form, you need to activate the database enhancements:

### Step 1: Access Supabase Dashboard
- [ ] Log in to your Supabase account
- [ ] Select your DLPP project
- [ ] Navigate to the SQL Editor

### Step 2: Run Database Migration
- [ ] Open the file `database-workflow-enhancement.sql` in this project
- [ ] Copy ALL the SQL code
- [ ] Paste it into the Supabase SQL Editor
- [ ] Click "Run" to execute the migration
- [ ] Verify that the migration completed successfully (check for error messages)

### Step 3: Verify Database Changes
- [ ] Go to the "Table Editor" in Supabase
- [ ] Select the "cases" table
- [ ] Verify that new columns exist:
  - `dlpp_role`
  - `track_number`
  - `proceeding_filed_date`
  - `matter_type`
  - `returnable_date`
  - `returnable_type`
  - `land_description`
  - `zoning`
  - `survey_plan_no`
  - `lease_type`
  - `division_responsible`
  - `allegations`
  - `reliefs_sought`
  - `opposing_lawyer_name`
  - `sol_gen_officer`
  - `dlpp_action_officer`
  - `officer_assigned_date`
  - `assignment_footnote`
  - `section5_notice`

- [ ] Verify that the `court_orders` table has been created

### Step 4: Test the System
- [ ] Log in to the DLPP Legal CMS
- [ ] Click on "Cases" → "Register New Case"
- [ ] You should see the new comprehensive registration form with:
  - DLPP Role selector (Defendant/Respondent vs Plaintiff/Applicant)
  - 7 sections organized by workflow items
  - All fields from your workflow documents

### Step 5: Test Case Registration
- [ ] Try registering a test case as Defendant/Respondent
- [ ] Fill in the required fields
- [ ] Enter a returnable date
- [ ] Submit the form
- [ ] Verify the case was created successfully
- [ ] Check the Calendar to see if the returnable date event was auto-created
- [ ] Verify the alert is set for 3 days before the returnable date

### Step 6: Test Different DLPP Roles
- [ ] Register a test case as Plaintiff/Applicant
- [ ] Notice the form adapts (no Section 5 notice checkbox, different item numbers)
- [ ] Submit and verify

## ✅ Post-Activation Tasks

### Data Migration (Optional)
If you have existing cases in the system:
- [ ] Review existing cases
- [ ] Update them with the new field information as needed
- [ ] Add returnable dates to cases that need alerts

### Staff Training
- [ ] Train staff on the new comprehensive registration form
- [ ] Explain the DLPP role selection (Defendant vs Plaintiff)
- [ ] Show how to fill in all 17 items for defendant cases
- [ ] Show how to fill in all 15 items for plaintiff cases
- [ ] Demonstrate the automatic alert system for returnable dates

### Process Documentation
- [ ] Review the `WORKFLOW_INTEGRATION_GUIDE.md` document
- [ ] Customize any field options if needed for your department
- [ ] Create internal SOPs based on the new workflow

## 🎯 What You Get After Activation

1. **Complete Workflow Compliance**: All items from your workflow documents are now captured in the system

2. **Automatic Alerts**: Never miss a returnable date with automatic 3-day advance warnings

3. **Court Orders Tracking**: Register concluded matters with full court order details

4. **Land Details Management**: Comprehensive land description fields including zoning, survey plans, and lease information

5. **Legal Officer Tracking**: Track Sol Gen officers and DLPP action officers with assignment dates and supervisor notes

6. **Conditional Forms**: Smart forms that adapt based on whether DLPP is defendant or plaintiff

7. **Section 5 Notice**: Track Section 5 notices for applicable defendant cases

## ❓ Troubleshooting

### Issue: SQL Migration Fails
**Solution**:
- Check if you already ran the main `database-schema.sql` script
- Check for syntax errors in the SQL
- Review Supabase error messages
- Contact support if needed

### Issue: Form Not Showing New Fields
**Solution**:
- Clear your browser cache
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check if the database migration ran successfully

### Issue: Can't Submit Form
**Solution**:
- Check that all required fields (marked with *) are filled
- Open browser console (F12) to see any error messages
- Verify database connection is working

## 📞 Support

If you encounter any issues during activation:
1. Review the `WORKFLOW_INTEGRATION_GUIDE.md` file
2. Check the browser console for error messages
3. Verify the database migration completed successfully
4. Review the Supabase logs for any errors

## 🎉 Ready to Use!

Once all items in this checklist are complete, your DLPP Legal Case Management System is fully upgraded with the complete workflow integration!

You can now:
- Register cases following the exact workflow process
- Track all 17 items for defendant cases
- Track all 15 items for plaintiff cases
- Get automatic alerts for returnable dates
- Register court orders for concluded matters
- Manage comprehensive land details

Proceed to register your first case using the new comprehensive form!

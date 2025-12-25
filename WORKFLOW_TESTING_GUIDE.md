# 🧪 End-to-End Workflow Testing Guide

## Complete 7-Step Legal Workflow Cycle

This guide walks you through testing the complete iterative workflow from case creation to closure and notifications.

---

## 📋 Pre-Test Checklist

Before starting the workflow test, ensure:

- [ ] Database schema is deployed (`database-workflow-extensions.sql`)
- [ ] All workflow tables exist and are accessible
- [ ] You have a test user account with appropriate role
- [ ] Dev server is running (`bun run dev`)
- [ ] Supabase Storage bucket `case-documents` is created

---

## 🔄 Complete Workflow Test Cycle

### **STEP 1: Case Registration** (Create Case ID)

**Who**: Reception / Registry Clerk
**URL**: `/cases/create-minimal`

**Test Actions**:
1. Navigate to "1. Case Registration" from the menu
2. Select DLPP Role:
   - Choose **"Defendant / Respondent"** or **"Plaintiff / Applicant"**
3. Enter brief description (optional):
   - Example: "Land dispute regarding Section 60 lease termination"
4. Click **"Create Case & Generate Case ID"**

**Expected Results**:
- ✅ Case ID auto-generated (e.g., `DLPP-2025-123456`)
- ✅ Case title auto-generated if no description provided
- ✅ Redirected to case dashboard
- ✅ Case appears in Cases list

**Record for Next Steps**:
- **Case ID**: _________________

---

### **STEP 2: Directions** (Management Instructions)

**Who**: Secretary Lands / Director Legal Services / Manager Legal Services
**URL**: `/directions`

**Test Actions**:
1. Navigate to "2. Directions" from the menu
2. Click **"Issue New Direction"**
3. Fill in the form:
   - **Case ID**: Use the Case Selector to find and select your case from Step 1
   - **Issued By**: Select "Secretary Lands" / "Director Legal Services" / "Manager Legal Services"
   - **Subject**: "Prepare response to plaintiff's claim"
   - **Priority**: "High"
   - **Direction Content**: "Review the case file and prepare a comprehensive response to the plaintiff's allegations. Coordinate with the Survey Division for land records."
   - **Due Date**: Select a date 2 weeks from today
   - **Assign To**: "John Doe (Litigation Officer)"
4. Click **"Issue Direction"**

**Expected Results**:
- ✅ Direction number auto-generated (e.g., `DIR-2025-123456`)
- ✅ Direction appears in directions list
- ✅ Displays correct badge for issuer (Secretary/Director/Manager)
- ✅ Shows priority badge
- ✅ Case linked correctly

**Note**: You can issue **multiple directions** for the same case throughout its lifecycle!

---

### **STEP 3: Case Allocation** (Manager Assigns to Officer)

**Who**: Manager Legal Services
**URL**: `/allocation`

**Test Actions**:
1. Navigate to "3. Case Allocation" from the menu
2. Click **"Allocate Case"**
3. Fill in the form:
   - **Case ID**: Select your case using the Case Selector
   - **Assign To**: "John Doe"
   - **Direction Reference**: Reference the direction from Step 2 (optional)
   - **Priority**: "High"
   - **Assignment Reason**: "Based on Secretary's direction dated [date]. Officer has experience with Section 60 lease matters."
   - **Instructions**: "Review all documents, coordinate with Survey Division, and prepare draft response within 10 days."
4. Click **"Allocate Case"**

**Expected Results**:
- ✅ Delegation created successfully
- ✅ Officer assignment recorded with delegation date
- ✅ Instructions saved
- ✅ Triggers Step 4 for the assigned officer

---

### **STEP 4: Registration & Assignment** (Litigation Officer Workspace)

**Who**: Litigation Officer (Assigned in Step 3)
**URL**: `/litigation`

**Test Scenario**: **ALL FILINGS HAPPEN HERE** - No external filings module!

#### **4a. Record a New Filing**

**Test Actions**:
1. Navigate to "4. Registration & Assignment" from the menu
2. Go to **"All Filings"** tab
3. Click **"New Filing"**
4. Fill in the form:
   - **Case ID**: Select your case
   - **Filing Type**: "Instruction Letter"
   - **Document Title**: "Draft Response to Statement of Claim"
   - **Description**: "Initial draft response addressing all allegations in plaintiff's statement of claim"
   - **Prepared Date**: Today's date
5. Click **"Record Filing"**

**Expected Results**:
- ✅ Filing recorded with status = "draft"
- ✅ Filing appears in filings list
- ✅ Document upload section available

#### **4b. Upload Document**

**Test Actions**:
1. After recording the filing, use the **Document Upload component**
2. Click "Choose File" and select a test PDF/Word document
3. Click **"Upload"**
4. Wait for upload progress (should show 0% → 100%)

**Expected Results**:
- ✅ File uploaded to Supabase Storage (`case-documents` bucket)
- ✅ Progress bar shows upload progress
- ✅ Success message displayed
- ✅ Document record created in `documents` table
- ✅ File URL saved to `filings` table

#### **4c. Update Case Status**

**Test Actions**:
1. Go to **"Status Updates"** tab
2. Click **"New Status Update"**
3. Fill in:
   - **Case ID**: Your case
   - **Status Update**: "Draft response prepared and under review"
   - **Work Done**: "Reviewed case file, coordinated with Survey Division, prepared draft response"
   - **Next Steps**: "Submit to Manager for review, then forward to Solicitor General"
4. Click **"Update Status"**

**Expected Results**:
- ✅ Status update recorded
- ✅ Officer action logged in database

---

### **STEP 5: Compliance** (Iterative Loop)

**Who**: Solicitor General / Legal Officers / Manager
**URL**: `/compliance`

**Test Scenario**: Request compliance from internal divisions

**Test Actions**:
1. Navigate to "5. Compliance" from the menu
2. Click **"New Compliance Update"**
3. Fill in the form:
   - **Case ID**: Select your case
   - **Responsible Division**: "Survey Division"
   - **Court Order Description**: "Provide survey plan and land title documents for Lot 123, Section 60"
   - **Compliance Deadline**: 2 weeks from today
   - **Compliance Notes**: "Request sent via memo DLPP/LEGAL/2025/001. Awaiting response from Survey Division."
   - **Return to Workflow Step**: "Continue Compliance" (or select "Return to Step 2" or "Return to Step 4" if needed)
4. Click **"Record Compliance Update"**

**Expected Results**:
- ✅ Compliance tracking record created
- ✅ Memo details saved
- ✅ Responsible division recorded
- ✅ Status = "pending"

**Iterative Cycle Testing**:
- **Option A**: Return to **Step 2** (Directions) - Issue updated direction
- **Option B**: Return to **Step 4** (Litigation) - Add more filings based on compliance
- **Option C**: Continue in Compliance until all obligations satisfied

**Test the Loop**:
1. Go back to Step 2 and issue another direction (e.g., "Incorporate survey documents into response")
2. Go to Step 4 and add another filing (e.g., "Updated Response with Survey Evidence")
3. Return to Step 5 and add another compliance update

**This demonstrates the iterative nature: 2→3→4→5→back to 2 or 4→repeat until ready for closure**

---

### **STEP 6: Case Closure** (Judgment and Closure)

**Who**: Manager Legal Services / Legal Officer
**URL**: `/closure`

**Pre-requisite**: Compliance satisfied, all obligations met

**Test Actions**:
1. Navigate to "6. Case Closure" from the menu
2. Click **"Close Case"**
3. Fill in the form:
   - **Case ID**: Select your case
   - **Court Order Type**: Select one (e.g., "Court Order Granted in Favour of the Plaintiff")
   - **Court Order Date**: Today's date
   - **Court Order Details**: "National Court Order dated [date]. Court ruled in favour of the plaintiff. DLPP ordered to pay K50,000 in compensation plus costs. Appeal period: 30 days."
   - **Outcome Summary**: "Case decided against DLPP. Compensation awarded to plaintiff. Matter referred to Finance Division for payment processing."
   - **Lessons Learned**: "Early coordination with Survey Division could have strengthened our case. Ensure all land records are current before proceedings."
   - **Archive Instructions**: "Physical file to Legal Registry. Scanned documents to SharePoint."
4. Click **"Close Case"**

**Expected Results**:
- ✅ Case status updated to "closed"
- ✅ Closure type saved in cases table
- ✅ Closure notes recorded
- ✅ Closure event logged in case_history
- ✅ Success message: "Proceed to Step 7 to notify parties"

---

### **STEP 7: Notifications to Parties** (After Closure)

**Who**: Legal Officer / Manager
**URL**: `/notifications`

**Pre-requisite**: Case closed in Step 6

**Test Actions** (Send 3 notifications):

#### **Notification 1: Plaintiff**

1. Navigate to "7. Notifications" from the menu
2. Click **"Send Notification"**
3. Fill in:
   - **Case ID**: Your closed case
   - **Recipient Type**: "Plaintiff"
   - **Notification Method**: "Email"
   - **Recipient Name**: "John Smith (Plaintiff)"
   - **Recipient's Lawyer**: "Smith & Associates Law Firm"
   - **Notification Content**: "Dear Mr. Smith, This is to advise that the National Court has issued judgment in Case NC 123/2025. The court ruled in your favour. Judgment details enclosed. Please contact Finance Division to arrange payment processing. Regards, DLPP Legal Section"
   - **Proof of Communication**: "Email sent to jsmith@example.com on [date]. Read receipt received."
4. Click **"Send Notification"**

#### **Notification 2: Solicitor General**

1. Click **"Send Notification"** again
2. Fill in:
   - **Case ID**: Same case
   - **Recipient Type**: "Solicitor General"
   - **Notification Method**: "Formal Letter"
   - **Recipient Name**: "Office of the Solicitor General"
   - **Notification Content**: "Re: Case NC 123/2025 - Court Judgment Notification. This is to inform your office that the National Court has issued judgment against DLPP. Judgment summary enclosed. Your office's assistance in this matter is acknowledged. Appeal assessment required within 30 days."
   - **Proof of Communication**: "Letter delivered via courier on [date]. Acknowledgment received [date]."
3. Click **"Send Notification"**

#### **Notification 3: DLPP Finance Division**

1. Click **"Send Notification"** again
2. Fill in:
   - **Case ID**: Same case
   - **Recipient Type**: "Other Party"
   - **Notification Method**: "In Person"
   - **Recipient Name**: "DLPP Finance Division"
   - **Notification Content**: "Court Order for Payment - Case NC 123/2025. Please process payment of K50,000 compensation plus K5,000 costs to plaintiff John Smith as per National Court Order dated [date]. Urgent action required. Court order attached."
   - **Proof of Communication**: "Memo hand-delivered to Finance Director on [date]. Acknowledged and accepted."
3. Click **"Send Notification"**

**Expected Results**:
- ✅ All 3 notifications recorded in `communications` table
- ✅ Direction = "outgoing"
- ✅ Proof of communication saved
- ✅ Notifications appear in notifications list
- ✅ **WORKFLOW COMPLETE!**

---

## ✅ Complete Workflow Verification Checklist

After completing all steps, verify:

### Database Records Created:
- [ ] **cases**: 1 record (Status = "closed")
- [ ] **directions**: At least 1 record (can be multiple)
- [ ] **case_delegations**: 1 record (officer assignment)
- [ ] **filings**: At least 1 record (litigation officer work)
- [ ] **documents**: At least 1 record (uploaded file)
- [ ] **compliance_tracking**: At least 1 record (division memo)
- [ ] **case_history**: Multiple records (case closed event, status updates)
- [ ] **communications**: 3 records (outgoing notifications)

### Workflow Features Tested:
- [ ] **Case Selector Component**: Works in all forms
- [ ] **Document Upload**: Successfully uploaded to Supabase Storage
- [ ] **Iterative Loop**: Tested returning from Step 5 to Steps 2 & 4
- [ ] **Multiple Directions**: Issued more than one direction
- [ ] **Role-Based Access**: Different modules for different roles
- [ ] **Dashboard Stats**: Workflow progress shows counts

---

## 🔄 Testing the Iterative Cycle

To truly test the workflow's iterative nature, run this extended cycle:

1. **Create Case** (Step 1)
2. **Issue Direction #1** (Step 2) - "Prepare initial response"
3. **Allocate to Officer** (Step 3)
4. **Record Filing #1** (Step 4) - "Draft response"
5. **Request Compliance** (Step 5) - "Need survey docs" → **Return to Step 2**
6. **Issue Direction #2** (Step 2) - "Incorporate survey evidence"
7. **Record Filing #2** (Step 4) - "Updated response with evidence"
8. **Compliance Update** (Step 5) - "Survey docs received" → **Return to Step 4**
9. **Record Filing #3** (Step 4) - "Final response submitted to SG"
10. **Compliance Complete** (Step 5) - "All obligations met" → **Ready for Closure**
11. **Close Case** (Step 6)
12. **Send Notifications** (Step 7) - To all parties

**This demonstrates**: 1→2→3→4→5→2→4→5→4→5→6→7 ✅

---

## 🎯 Success Criteria

The workflow test is successful if:

1. ✅ **All 7 steps completed** without errors
2. ✅ **Case Selector** works in all forms
3. ✅ **Document Upload** successfully saves files
4. ✅ **Iterative cycles** (2→3→4→5→back to 2 or 4) work correctly
5. ✅ **Dashboard** shows workflow progress statistics
6. ✅ **Database records** created in all workflow tables
7. ✅ **Each step references Case ID** from Step 1
8. ✅ **Notifications** sent after closure

---

## 🐛 Common Issues & Solutions

### Issue: "Case not found" in Case Selector
**Solution**: Make sure the case was created in Step 1 and appears in the Cases list

### Issue: Document upload fails
**Solution**:
- Check if `case-documents` bucket exists in Supabase Storage
- Verify bucket is set to public
- Check file size (max 50MB)

### Issue: TypeScript errors in forms
**Solution**: Database types may not be generated. Ignore for now or run type generation

### Issue: Workflow stats showing 0
**Solution**: Make sure workflow tables have RLS policies allowing read access

---

## 📊 Expected Timeline

**Complete workflow test**: 30-45 minutes

- Step 1 (Create): 2 min
- Step 2 (Directions): 3 min
- Step 3 (Allocation): 3 min
- Step 4 (Litigation + Upload): 10 min
- Step 5 (Compliance + Loops): 10 min
- Step 6 (Closure): 5 min
- Step 7 (Notifications): 10 min
- Verification: 5 min

---

## 🎓 Next Steps After Testing

Once the complete workflow test is successful:

1. ✅ Train users on each workflow step
2. ✅ Set up role-based access control
3. ✅ Configure Supabase Storage buckets
4. ✅ Import existing cases (if any)
5. ✅ Deploy to production
6. ✅ Monitor dashboard for workflow bottlenecks

**You now have a fully functional 7-step iterative legal workflow system!** 🎉

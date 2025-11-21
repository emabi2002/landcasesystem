# DLPP Litigation Workflow - Setup Guide

## 🚀 Quick Start

This guide will help you set up all the new workflow features in your Land Case Management System.

## 📋 Prerequisites

- ✅ Supabase account with project created
- ✅ Database already set up from `database-schema.sql`
- ✅ Application running locally

## 🗄️ Step 1: Run Database Extensions

You need to run the workflow extensions SQL to add all the new tables and features.

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com
   - Open your project: `yvnkyjnwvylrweyzvibs`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Workflow Extensions**
   - Open the file `database-workflow-extensions.sql` from your project
   - Copy ALL the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see "Success. No rows returned"
   - Check the Tables section to see the new tables:
     - incoming_correspondence
     - directions
     - file_requests
     - case_delegations
     - external_lawyers
     - filings
     - compliance_tracking
     - communications

### Option B: Using Command Line

```bash
# If you have Supabase CLI installed
supabase db reset
supabase db push
```

## 📊 Step 2: Verify New Tables

After running the SQL, verify these tables exist in your database:

### ✅ New Tables Created:
1. **incoming_correspondence** - Court documents received
2. **directions** - Directives from management
3. **file_requests** - Court/Land/Title file requests
4. **case_delegations** - Case assignments to officers
5. **external_lawyers** - Solicitor General & private lawyers
6. **filings** - Instruction letters & affidavits
7. **compliance_tracking** - Court order compliance
8. **communications** - Communication log

### ✅ Updated Tables:
- **cases** - Added new fields:
  - `closure_type`
  - `case_origin`
  - `court_file_number`
  - `closure_date`
  - `closure_notes`

## 🎨 Step 3: Access New Features

Once the database is set up, you can access all the new workflow modules:

### Navigation Menu:
- **Correspondence** - `/correspondence` - Register incoming court documents
- **Directions** - `/directions` - Track directives from management
- **Files** - `/file-requests` - Request and track case files
- **Filings** - `/filings` - Manage instruction letters and affidavits
- **Lawyers** - `/lawyers` - Manage external legal representatives
- **Compliance** - `/compliance-tracking` - Track court order compliance
- **Communications** - `/communications` - Log all communications

## 📝 Step 4: Workflow Usage

### 1. Incoming Correspondence (Step 1 of Workflow)
**Register documents received from:**
- Plaintiff/Defendants
- Solicitor General
- Ombudsman Commission
- Courts

**Document Types:**
- Section 5 Notice
- Search Warrant
- Court Orders
- Summons from Ombudsman

**Actions:**
- Register correspondence
- Send acknowledgement
- Link to case
- Track status

### 2. Directions (Step 2 of Workflow)
**Track directives from:**
- Secretary Lands
- Director Legal Services
- Manager Legal Services

**Features:**
- Priority levels
- Due dates
- Assignment tracking
- Status monitoring

### 3. Case Registration (Step 3 of Workflow)

**Enhanced Case Types:**
- Section 160 by Registrar for Titles
- Summons
- DLPP Initiated Cases
- Litigation Lawyers Cases

**New Features:**
- Court file number tracking
- Case origin classification
- File requests (Court, Land, Title files)
- Case delegation to officers

### 4. Filings (Step 4 & 5 of Workflow)

**Prepare and track:**
- Instruction Letters
- Affidavits
- Motions
- Responses
- Briefs

**Submit to:**
- Solicitor General
- Private Lawyers

**Status Tracking:**
- Draft → Prepared → Submitted → Filed

### 5. External Lawyers (Step 5 of Workflow)

**Manage:**
- Solicitor General office
- Private lawyers
- Contact information
- Specializations
- Active status

### 6. Compliance Tracking (Step 6 of Workflow)

**Monitor court order compliance across divisions:**
- Survey Division
- Registrar for Titles
- Alienated Lands Division
- Valuation Division
- Physical Planning Division
- ILG Division
- Customary Leases Division

**Track:**
- Court order details
- Memo sent to divisions
- Compliance deadline
- Completion status

### 7. Case Closure (Step 7 of Workflow)

**Enhanced closure types:**
- Default Judgement
- Summarily Determined
- Dismissed want of Prosecution
- Dismissed for abuse of process
- Incompetent
- Appeal Granted
- Judicial Review
- Court Order Granted (Plaintiff/Defendant)
- Settled
- Withdrawn

### 8. Communications (Step 8 of Workflow)

**Log all communications with:**
- Plaintiffs
- Defendants
- Solicitor General
- Private Lawyers
- Witnesses
- Court

**Track:**
- Direction (Incoming/Outgoing)
- Communication type (Email, Letter, Phone, In-person)
- Response requirements
- Response status

## 🔍 Step 5: Test the System

### Test Incoming Correspondence:
1. Go to `/correspondence`
2. Click "Register Correspondence"
3. Fill in:
   - Reference Number: IC-2025-001
   - Document Type: Court Order
   - Source: Court
   - Received Date: Today
   - Subject: Test court order
4. Save and verify it appears in the list

### Test Directions:
1. Go to `/directions`
2. Click "Add Direction"
3. Fill in:
   - Direction Number: DIR-2025-001
   - Source: Manager Legal Services
   - Subject: Test directive
   - Priority: Medium
4. Save and verify

### Test Case with New Fields:
1. Go to `/cases/new`
2. You should now see:
   - Case Origin dropdown
   - Court File Number field
3. Create a test case with these fields

## 🎯 Workflow Integration

All modules are now integrated with your existing case management system:

1. **Correspondence** → Can be linked to cases
2. **Directions** → Can reference cases
3. **File Requests** → Linked to specific cases
4. **Delegations** → Assign cases to officers
5. **Filings** → Linked to cases and lawyers
6. **Compliance** → Tracks case-related court orders
7. **Communications** → Logs all case communications

## 🚨 Troubleshooting

### Problem: Tables not appearing
**Solution:** Make sure you ran the COMPLETE SQL from `database-workflow-extensions.sql`

### Problem: Permission errors
**Solution:** Check Row Level Security policies are enabled in Supabase

### Problem: Cannot insert data
**Solution:** Verify you're logged in as an authenticated user

### Problem: TypeScript errors in code
**Solution:** The type definitions will auto-sync. Restart your dev server if needed.

## 📚 Next Steps

1. ✅ Run the database extensions SQL
2. ✅ Test each workflow module
3. ✅ Add sample data for testing
4. ✅ Train users on new features
5. ✅ Create standard operating procedures (SOPs)

## 🔐 Security

All new tables have Row Level Security (RLS) enabled:
- Authenticated users can manage all workflow data
- Policies ensure data integrity
- Audit trails maintained

## 📞 Support

If you encounter any issues:
1. Check the SQL execution results in Supabase
2. Verify all tables were created
3. Check browser console for errors
4. Review this guide

## ✨ Features Summary

You now have a **complete litigation workflow system** that tracks:
- ✅ All incoming correspondence
- ✅ Management directives
- ✅ File requests and tracking
- ✅ Case delegations
- ✅ External lawyers
- ✅ Court filings
- ✅ Compliance monitoring
- ✅ All communications

This implementation covers **100% of your workflow chart requirements**!

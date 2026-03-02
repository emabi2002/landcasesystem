# 🚀 DLPP Legal Workflow System - Deployment Instructions

## ✅ Status: Ready for Production Deployment

All code changes complete! Follow these steps to deploy:

---

## 📦 Step 1: Create Supabase Storage Bucket

### **Supabase Dashboard Setup** (5 minutes)

1. **Navigate to Supabase Storage**:
   - Go to https://supabase.com/dashboard
   - Select your project: `yvnkyjnwvylrweyzvibs`
   - Click **"Storage"** in the left sidebar

2. **Create New Bucket**:
   - Click **"New Bucket"** button
   - **Bucket Name**: `case-documents`
   - **Public Bucket**: ✅ **Yes** (Check this box)
   - **File Size Limit**: `52428800` (50MB in bytes)
   - Click **"Create Bucket"**

3. **Configure Bucket Policies** (Allow Authenticated Users):
   ```sql
   -- Go to Storage > Policies > New Policy

   -- Policy 1: Allow authenticated users to upload
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'case-documents');

   -- Policy 2: Allow public read access
   CREATE POLICY "Allow public read"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'case-documents');

   -- Policy 3: Allow authenticated users to update their uploads
   CREATE POLICY "Allow authenticated updates"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (bucket_id = 'case-documents');

   -- Policy 4: Allow authenticated users to delete
   CREATE POLICY "Allow authenticated deletes"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'case-documents');
   ```

4. **Verify Bucket Created**:
   - You should see `case-documents` in the Storage buckets list
   - Status should show as **"Public"**
   - Click on the bucket and try uploading a test file

---

## 🗄️ Step 2: Run Database Schema Scripts

### **Ensure All Workflow Tables Exist** (5 minutes)

1. **Check which schema scripts have been run**:
   - Go to Supabase Dashboard > SQL Editor
   - Run this query to check existing tables:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Run workflow schema if not already deployed**:
   - Location: `database-workflow-extensions.sql`
   - Open Supabase Dashboard > SQL Editor > New Query
   - Copy and paste the entire contents of `database-workflow-extensions.sql`
   - Click **"Run"**
   - Verify: No errors, all tables created

3. **Verify Required Tables Exist**:
   ```sql
   -- Run this query - should return 'EXISTS' for all
   SELECT
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cases') as cases,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'directions') as directions,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'case_delegations') as delegations,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'filings') as filings,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compliance_tracking') as compliance,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'communications') as communications,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') as documents,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'case_history') as history,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'parties') as parties,
     EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as users;
   ```
   - **All should return `true`**

4. **Check Row Level Security (RLS) Policies**:
   ```sql
   -- View all policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```
   - Verify policies exist for all workflow tables

---

## 🧪 Step 3: End-to-End Workflow Testing

### **Follow the Comprehensive Testing Guide** (30-45 minutes)

📖 **Open**: `WORKFLOW_TESTING_GUIDE.md`

**Complete all 7 workflow steps**:

1. ✅ **Step 1: Case Registration** (2 min)
   - Create new case at `/cases/create-minimal`
   - Record Case ID: `DLPP-2025-______`

2. ✅ **Step 2: Directions** (3 min)
   - Issue direction at `/directions`
   - Use **CaseSelector** to find your case
   - Assign to litigation officer

3. ✅ **Step 3: Case Allocation** (3 min)
   - Allocate case at `/allocation`
   - Use **CaseSelector** to select case
   - Assign to officer

4. ✅ **Step 4: Litigation Workspace** (10 min)
   - Record filing at `/litigation`
   - Use **CaseSelector** to select case
   - **NEW**: Upload document using **DocumentUpload** component
   - Verify document appears in Supabase Storage
   - Update status

5. ✅ **Step 5: Compliance** (10 min)
   - Create compliance record at `/compliance`
   - Use **CaseSelector** to select case
   - Test loop: Return to Step 2 or 4
   - Add another direction or filing
   - Return to compliance

6. ✅ **Step 6: Case Closure** (5 min)
   - Close case at `/closure`
   - Use **CaseSelector** to select case
   - Record court judgment
   - Verify case status = "closed"

7. ✅ **Step 7: Notifications** (10 min)
   - Send 3 notifications at `/notifications`
   - Use **CaseSelector** (should show only closed cases)
   - Notify: Plaintiff, Solicitor General, DLPP Finance

### **Verification Checklist**:

After completing all steps, verify in Supabase:

```sql
-- Check case created
SELECT * FROM cases WHERE case_number LIKE 'DLPP-2025-%' ORDER BY created_at DESC LIMIT 1;

-- Check directions
SELECT COUNT(*) FROM directions WHERE case_id = 'YOUR_CASE_ID';

-- Check delegations
SELECT COUNT(*) FROM case_delegations WHERE case_id = 'YOUR_CASE_ID';

-- Check filings
SELECT COUNT(*) FROM filings WHERE case_id = 'YOUR_CASE_ID';

-- Check documents uploaded
SELECT * FROM documents WHERE case_id = 'YOUR_CASE_ID';

-- Check compliance
SELECT COUNT(*) FROM compliance_tracking WHERE case_id = 'YOUR_CASE_ID';

-- Check communications
SELECT COUNT(*) FROM communications WHERE case_id = 'YOUR_CASE_ID' AND direction = 'outgoing';

-- Check case history
SELECT * FROM case_history WHERE case_id = 'YOUR_CASE_ID' ORDER BY created_at;
```

**Expected Results**:
- ✅ 1 case record (status = "closed")
- ✅ At least 1 direction
- ✅ At least 1 delegation
- ✅ At least 1 filing
- ✅ At least 1 document in Storage
- ✅ At least 1 compliance record
- ✅ 3 communications (outgoing notifications)
- ✅ Multiple case history entries

---

## 🎯 Step 4: Dashboard Verification

### **Check Workflow Statistics** (2 minutes)

1. Navigate to `/dashboard`
2. Scroll to **"7-Step Workflow Progress"** card
3. Verify counts are updating:
   - **Registered**: Should show open cases count
   - **Directions**: Count of direction records
   - **Allocated**: Count of delegations
   - **Litigation**: Count of filings
   - **Compliance**: Count of compliance records
   - **Ready for Closure**: Cases in review/judgment

4. **Test Dashboard Queries**:
   ```sql
   -- Workflow statistics query
   SELECT
     (SELECT COUNT(*) FROM cases WHERE status != 'closed') as open_cases,
     (SELECT COUNT(DISTINCT case_id) FROM directions) as cases_with_directions,
     (SELECT COUNT(DISTINCT case_id) FROM case_delegations) as allocated_cases,
     (SELECT COUNT(DISTINCT case_id) FROM filings) as cases_in_litigation,
     (SELECT COUNT(DISTINCT case_id) FROM compliance_tracking) as cases_in_compliance;
   ```

---

## 👥 Step 5: User Role Setup

### **Create Test Users for Each Role** (10 minutes)

1. **In Supabase Dashboard > Authentication > Users**:
   - Click **"Invite User"** or use SQL to insert

2. **Create 5 test users** (one for each role):

   ```sql
   -- Executive Management
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     'USER_ID_1',
     'secretary@lands.gov.pg',
     'Test Secretary',
     'executive',
     true
   );

   -- Manager
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     'USER_ID_2',
     'manager@lands.gov.pg',
     'Test Manager',
     'manager',
     true
   );

   -- Lawyer / Legal Officer
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     'USER_ID_3',
     'lawyer@lands.gov.pg',
     'Test Legal Officer',
     'lawyer',
     true
   );

   -- Officer / Registry Clerk
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     'USER_ID_4',
     'officer@lands.gov.pg',
     'Test Registry Clerk',
     'officer',
     true
   );

   -- System Administrator
   INSERT INTO users (id, email, full_name, role, is_active)
   VALUES (
     'USER_ID_5',
     'admin@lands.gov.pg',
     'Test Admin',
     'admin',
     true
   );
   ```

3. **Test Role-Based Access**:
   - Login as each user
   - Verify correct modules are visible
   - Refer to: `src/lib/access-control.ts` for permission matrix

---

## 🚀 Step 6: Production Deployment

### **Option A: Deploy to Vercel** (Recommended for Next.js)

1. **Install Vercel CLI**:
   ```bash
   bun install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd landcasesystem
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`: https://yvnkyjnwvylrweyzvibs.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Your anon key]
   - `SUPABASE_SERVICE_ROLE_KEY`: [Your service role key]

4. **Set Custom Domain** (if applicable)

### **Option B: Deploy to Netlify**

1. **Build the project**:
   ```bash
   cd landcasesystem
   bun run build
   ```

2. **Deploy**:
   ```bash
   bunx netlify deploy --prod --dir=.next
   ```

3. **Configure Environment Variables** in Netlify Dashboard

### **Option C: Self-Hosted (VPS/Cloud)**

1. **Build production bundle**:
   ```bash
   cd landcasesystem
   bun run build
   ```

2. **Start production server**:
   ```bash
   bun run start
   ```

3. **Use PM2 for process management**:
   ```bash
   bun install -g pm2
   pm2 start bun --name "dlpp-legal" -- run start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx reverse proxy** (example):
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

---

## 📊 Step 7: Post-Deployment Verification

### **Production Health Check** (5 minutes)

1. **Test all workflow steps** in production
2. **Verify Supabase connection**
3. **Test document upload** (should save to Storage)
4. **Check dashboard statistics** load correctly
5. **Verify user authentication** works
6. **Test role-based access control**

### **Performance Checks**:
```sql
-- Check database response time
EXPLAIN ANALYZE
SELECT * FROM cases ORDER BY created_at DESC LIMIT 10;

-- Verify indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 📚 Step 8: User Training

### **Training Materials**

1. **Share Documentation**:
   - `WORKFLOW_TESTING_GUIDE.md` - Complete workflow walkthrough
   - `WORKFLOW_DATABASE_MAPPING.md` - Schema reference
   - `IMPLEMENTATION_SUMMARY.md` - Feature overview

2. **Create Training Sessions** (by role):
   - **Registry Clerks**: Step 1 (Case Registration)
   - **Management**: Step 2 (Directions)
   - **Managers**: Step 3 (Case Allocation)
   - **Litigation Officers**: Step 4 (Litigation Workspace)
   - **Legal Officers**: Steps 4-5 (Litigation & Compliance)
   - **All Users**: Steps 6-7 (Closure & Notifications)

3. **Key Training Points**:
   - **CaseSelector**: Show how to search and select cases
   - **DocumentUpload**: Demonstrate file upload with progress
   - **Iterative Workflow**: Explain 2→3→4→5→loop back
   - **Dashboard**: How to read workflow statistics

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is ready:

### **Pre-Deployment**:
- [ ] Supabase Storage bucket `case-documents` created (Public, 50MB limit)
- [ ] All database schema scripts executed successfully
- [ ] All workflow tables exist with RLS policies
- [ ] Test users created for each role
- [ ] End-to-end workflow test completed successfully
- [ ] Dashboard statistics verified
- [ ] Document upload tested and working

### **Deployment**:
- [ ] Production build successful (`bun run build`)
- [ ] Environment variables configured
- [ ] Production server running
- [ ] SSL certificate configured (HTTPS)
- [ ] Custom domain configured (if applicable)

### **Post-Deployment**:
- [ ] Production workflow test completed
- [ ] All 7 steps tested in production
- [ ] Document upload working in production
- [ ] Dashboard loading correctly
- [ ] User authentication working
- [ ] Role-based access control verified
- [ ] Performance acceptable (page load < 3 seconds)

### **Training & Handover**:
- [ ] Training materials distributed
- [ ] User training sessions scheduled
- [ ] Admin users trained on user management
- [ ] Support process established
- [ ] Monitoring and logging configured

---

## 🆘 Troubleshooting

### **Issue: Document upload fails**
**Solution**:
- Verify `case-documents` bucket exists and is public
- Check bucket policies allow authenticated uploads
- Verify environment variables are correct
- Check browser console for errors

### **Issue: CaseSelector shows "No cases found"**
**Solution**:
- Verify cases exist in database: `SELECT COUNT(*) FROM cases;`
- Check RLS policies allow read access
- Verify user is authenticated

### **Issue: Dashboard statistics showing 0**
**Solution**:
- Verify workflow tables have data
- Check RLS policies allow authenticated reads
- Run dashboard statistics query manually to verify data exists

### **Issue: User cannot access certain modules**
**Solution**:
- Check user role in `users` table
- Verify role-based access control in `src/lib/access-control.ts`
- Ensure user is logged in with correct account

---

## 📞 Support

For deployment issues:
- **Same Support**: support@same.new
- **Project Documentation**: Check `/landcasesystem/*.md` files
- **Database Issues**: Check Supabase Dashboard > Logs

---

## 🎉 Success!

Once all steps are complete, you have a **fully functional 7-step iterative legal workflow system** with:

✅ Type-safe database operations
✅ Professional case selection dropdowns
✅ Document upload with Supabase Storage
✅ Real-time workflow statistics
✅ Role-based access control
✅ Complete audit trail
✅ Production-ready deployment

**Congratulations! Your DLPP Legal Case Management System is live!** 🚀

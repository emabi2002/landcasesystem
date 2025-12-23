# 🚀 Deployment Guide - DLPP Legal Case Management System

## Overview

This guide will help you deploy the Legal Case Management System to production for your team to use.

---

## 🎯 Deployment Options

### Option 1: Netlify (Recommended)
- ✅ Free tier available
- ✅ Easy to set up
- ✅ Automatic deployments from Git
- ✅ Built-in SSL certificates
- ✅ CDN for fast loading

### Option 2: Vercel
- ✅ Optimized for Next.js
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Great performance
- ✅ Easy to use

### Option 3: Custom Server
- Self-hosted on your infrastructure
- More control but more maintenance
- Requires server administration skills

**This guide focuses on Netlify deployment (easiest option)**

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

### 1. Database Setup ✅
- [x] Production Supabase project created
- [x] Database schema deployed (`database-schema.sql`)
- [x] Sample data loaded (optional)
- [x] Admin user created and linked
- [x] RLS policies enabled and tested

### 2. Environment Variables ✅
- [x] Production Supabase URL
- [x] Production Supabase Anon Key
- [x] Both securely stored

### 3. Testing Complete ✅
- [x] Login works
- [x] Can create cases
- [x] Can add parties, documents, tasks, events
- [x] Can upload files
- [x] Calendar works
- [x] Search and filters work
- [x] All features tested

### 4. Code Repository ✅
- [x] Code pushed to GitHub/GitLab
- [x] `.env.local` in `.gitignore` (DO NOT commit secrets!)
- [x] README.md updated
- [x] All dependencies listed in package.json

---

## 🚀 Deployment Steps (Netlify)

### Step 1: Prepare Your Repository (10 minutes)

1. **Create a GitHub Repository** (if not already done):
   ```bash
   # In your project directory
   git init
   git add .
   git commit -m "Initial commit - DLPP Legal CMS"

   # Create repo on GitHub, then:
   git remote add origin https://github.com/YOUR-USERNAME/dlpp-legal-cms.git
   git branch -M main
   git push -u origin main
   ```

2. **Verify `.gitignore`** includes:
   ```
   .env.local
   .env*.local
   node_modules/
   .next/
   out/
   build/
   ```

3. **Check `netlify.toml`** (should already exist):
   ```toml
   [build]
   command = "bun run build"
   publish = ".next"

   [[plugins]]
   package = "@netlify/plugin-nextjs"
   ```

### Step 2: Create Netlify Account (5 minutes)

1. Go to **https://www.netlify.com**
2. Click **"Sign up"**
3. Choose **"Sign up with GitHub"** (easiest)
4. Authorize Netlify to access your repositories
5. Complete your profile

### Step 3: Deploy to Netlify (10 minutes)

1. **In Netlify Dashboard**:
   - Click **"Add new site"**
   - Choose **"Import an existing project"**
   - Select **"Deploy with GitHub"**

2. **Select Repository**:
   - Find and click your `dlpp-legal-cms` repository
   - Click **"Deploy"**

3. **Configure Build Settings**:
   - Build command: `bun run build` (or `npm run build`)
   - Publish directory: `.next`
   - Click **"Show advanced"**

4. **Add Environment Variables**:
   Click **"New variable"** and add:

   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://yvnkyjnwvylrweyzvibs.supabase.co

   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **IMPORTANT**: Use your PRODUCTION Supabase credentials, not development!

5. **Deploy**:
   - Click **"Deploy site"**
   - Wait 3-5 minutes for build to complete
   - You'll see build logs in real-time

### Step 4: Verify Deployment (5 minutes)

1. **Once build succeeds**:
   - Netlify will show you the site URL (e.g., `random-name-12345.netlify.app`)
   - Click the URL to open your deployed site

2. **Test the deployment**:
   - [ ] Login page loads
   - [ ] Can login with admin credentials
   - [ ] Dashboard shows data
   - [ ] Can view cases
   - [ ] Can create new case
   - [ ] All features work

3. **If login fails**:
   - Check environment variables are set correctly
   - Verify Supabase URL and key
   - Check browser console for errors

### Step 5: Configure Custom Domain (Optional - 10 minutes)

1. **In Netlify Dashboard**:
   - Go to **"Domain settings"**
   - Click **"Add custom domain"**
   - Enter your domain (e.g., `legal.lands.gov.pg`)

2. **Update DNS** (with your domain provider):
   - Add CNAME record pointing to your Netlify subdomain
   - Or use Netlify nameservers (recommended)

3. **Enable HTTPS**:
   - Netlify automatically provisions SSL certificate
   - Wait a few minutes for verification
   - HTTPS will be enabled automatically

4. **Test custom domain**:
   - Visit your custom domain
   - Should redirect to HTTPS
   - Should show your application

---

## 🔒 Production Security Setup

### 1. Supabase Production Database

Create a separate production database:

1. **New Supabase Project**:
   - Go to https://supabase.com
   - Click **"New project"**
   - Name: `DLPP Legal CMS - Production`
   - Choose region closest to PNG (Sydney, Australia recommended)
   - Strong database password

2. **Run Setup Scripts**:
   - Open SQL Editor
   - Run `database-schema.sql`
   - Create admin user in Auth
   - Link to profiles table
   - DO NOT load sample data (or clean it after testing)

3. **Update Environment Variables**:
   - In Netlify → Site settings → Environment variables
   - Update with production Supabase URL and Key
   - Redeploy site

### 2. Row Level Security (RLS)

Verify RLS policies are working:

```sql
-- Test as different users
-- Make sure users can only see what they should
```

### 3. User Management

1. **Create User Accounts**:
   - For each staff member
   - In Supabase Auth
   - Strong passwords
   - Verify email addresses

2. **Link to Profiles**:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role, department, phone)
   VALUES
   ('user-uuid-1', 'john.kila@lands.gov.pg', 'John Kila', 'legal_officer', 'Legal Division', '+675 xxx xxxx'),
   ('user-uuid-2', 'mary.tau@lands.gov.pg', 'Mary Tau', 'registrar', 'Registry', '+675 xxx xxxx');
   ```

3. **Assign Roles**:
   - admin - Full access
   - legal_officer - Manage cases
   - registrar - Register cases
   - survey_officer - Manage land parcels
   - director - View reports
   - auditor - Read-only

### 4. Backup Strategy

1. **Automated Backups** (Supabase Pro):
   - Daily automated backups
   - Point-in-time recovery
   - Upgrade to Pro plan if needed

2. **Manual Backups**:
   - Export database weekly
   - Store securely offsite
   - Test restore procedure

3. **Document Backups**:
   - Supabase Storage has built-in redundancy
   - Consider additional backup of critical documents

---

## 📱 Mobile Access

The system is responsive and works on mobile devices:

1. **Test on Mobile**:
   - iPhones (Safari)
   - Android phones (Chrome)
   - Tablets

2. **Add to Home Screen**:
   - Users can add as web app
   - Works like native app
   - No app store needed

---

## 👥 Team Onboarding

### 1. User Training

Create training sessions:

1. **Initial Training** (2 hours):
   - System overview
   - Login and navigation
   - Creating cases
   - Adding parties and documents
   - Managing tasks

2. **Advanced Training** (1 hour):
   - Calendar management
   - Search and filters
   - Reports and exports
   - Best practices

3. **Provide Documentation**:
   - User guide (create from README)
   - Quick reference cards
   - Video tutorials (optional)

### 2. User Accounts

Create accounts for all staff:

1. **Collect Information**:
   - Full name
   - Email (must be @lands.gov.pg)
   - Role
   - Department
   - Phone number

2. **Create Accounts**:
   - In Supabase Auth
   - Send credentials securely
   - Force password change on first login

3. **Test Access**:
   - Each user logs in
   - Verify they see correct data
   - Check permissions work

### 3. Support Plan

Establish support procedures:

1. **Internal Support**:
   - Designate 1-2 IT staff as administrators
   - Train them on system administration
   - Create troubleshooting guide

2. **Issue Reporting**:
   - Create issue reporting process
   - Email or ticket system
   - Response time SLA

3. **Updates and Maintenance**:
   - Schedule monthly updates
   - Test new features in staging
   - Deploy during off-hours

---

## 📊 Monitoring and Maintenance

### 1. Monitor Usage

Track system usage:

1. **Netlify Analytics**:
   - Page views
   - User sessions
   - Performance metrics

2. **Supabase Dashboard**:
   - Database size
   - API requests
   - Storage usage
   - Active users

3. **Custom Metrics**:
   - Cases created per month
   - Documents uploaded
   - Tasks completed
   - User activity

### 2. Performance Optimization

Optimize as you grow:

1. **Database**:
   - Monitor query performance
   - Add indexes as needed
   - Regular VACUUM and ANALYZE

2. **Storage**:
   - Monitor file sizes
   - Implement file size limits
   - Clean up old files

3. **Caching**:
   - Netlify CDN caches static assets
   - Consider API response caching

### 3. Regular Maintenance

Schedule regular tasks:

1. **Weekly**:
   - Check error logs
   - Review user feedback
   - Monitor storage usage

2. **Monthly**:
   - Review security policies
   - Update dependencies
   - Performance review
   - User account audit

3. **Quarterly**:
   - Full system backup test
   - Security audit
   - Feature review and planning
   - User training refresher

---

## 🔄 Continuous Deployment

Set up automatic deployments:

1. **GitHub Integration**:
   - Netlify auto-deploys on git push
   - Main branch → Production
   - Develop branch → Staging (optional)

2. **Deployment Process**:
   ```bash
   # Make changes locally
   git add .
   git commit -m "Description of changes"
   git push origin main

   # Netlify automatically:
   # 1. Detects push
   # 2. Runs build
   # 3. Deploys if successful
   # 4. Sends notification
   ```

3. **Staging Environment** (Recommended):
   - Create separate Netlify site for staging
   - Test changes before production
   - Deploy to production when ready

---

## ✅ Go-Live Checklist

Before announcing to your team:

### Technical:
- [ ] Production database deployed
- [ ] All environment variables set
- [ ] Site deployed to Netlify
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All features tested in production
- [ ] User accounts created
- [ ] Backup system in place
- [ ] Monitoring set up

### Documentation:
- [ ] User guide created
- [ ] Quick reference available
- [ ] Training materials prepared
- [ ] Support process documented
- [ ] Issue reporting system ready

### Team:
- [ ] Training sessions scheduled
- [ ] User accounts distributed
- [ ] Support team trained
- [ ] Go-live date announced
- [ ] Communication plan ready

### Testing:
- [ ] All CRUD operations work
- [ ] File uploads work
- [ ] Search and filters work
- [ ] Calendar shows events
- [ ] Tasks track correctly
- [ ] Notifications work
- [ ] Mobile responsive
- [ ] Cross-browser tested

---

## 🎉 Go Live!

When ready:

1. **Announce to Team**:
   - Email announcement
   - Include login URL
   - Share user guide
   - Schedule support hours

2. **Monitor Closely**:
   - First week: Daily monitoring
   - Watch for errors
   - Collect user feedback
   - Quick issue resolution

3. **Iterate and Improve**:
   - Gather feedback
   - Prioritize improvements
   - Regular updates
   - Continuous enhancement

---

## 📞 Post-Deployment Support

### Common Issues and Solutions

1. **Can't Login**:
   - Verify email is correct
   - Check password
   - Confirm account is created
   - Check profile is linked

2. **Slow Performance**:
   - Check internet connection
   - Clear browser cache
   - Check Supabase status
   - Review database indexes

3. **File Upload Fails**:
   - Check file size (max 50MB)
   - Verify file type allowed
   - Check storage bucket exists
   - Review storage policies

4. **Data Not Showing**:
   - Refresh page
   - Check RLS policies
   - Verify data exists in database
   - Check browser console

---

## 🚀 Future Enhancements

Plan for future features:

### Phase 2:
- Email notifications for deadlines
- SMS alerts for court hearings
- Advanced reporting with charts
- Export to PDF/Excel
- Batch operations

### Phase 3:
- Mobile app (iOS/Android)
- Offline mode for field officers
- GIS map integration
- Document OCR and search
- API for external systems

### Phase 4:
- Court system integration
- E-filing capabilities
- Digital signatures
- Workflow automation
- AI-powered case insights

---

## ✅ Success Metrics

Track these KPIs:

1. **Adoption**:
   - Active users per week
   - Cases registered per month
   - Documents uploaded per week

2. **Efficiency**:
   - Time to register case
   - Task completion rate
   - Average response time

3. **Quality**:
   - User satisfaction score
   - Error rate
   - Support tickets

4. **Business Impact**:
   - Faster case processing
   - Reduced paper usage
   - Better compliance
   - Improved transparency

---

**You're ready for production deployment!** 🎉

Follow this guide step by step and your team will have a professional Legal Case Management System running in production.

---

**Version**: 1.0
**Last Updated**: October 29, 2025
**Difficulty**: Intermediate
**Time to Deploy**: 2-4 hours
**Production Ready**: Yes ✅

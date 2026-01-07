# Supabase Storage Setup Guide

This guide shows you how to set up file storage in Supabase so users can upload documents to cases.

## Problem

When users try to upload documents, they get an error: **"Bucket not found"**

This happens because the storage bucket hasn't been created in your Supabase project yet.

---

## Solution: Create Storage Bucket in Supabase

### Step 1: Access Your Supabase Project

1. Go to https://supabase.com
2. Sign in to your account
3. Click on your project: **yvnkyjnwvylrweyzvibs**

### Step 2: Navigate to Storage

1. In the left sidebar, click **"Storage"**
2. You'll see the Storage dashboard

### Step 3: Create New Bucket

1. Click the **"New bucket"** button (or "Create a new bucket")
2. Fill in the bucket details:
   - **Name:** `case-documents` (must be exactly this name)
   - **Public:** Toggle **OFF** (keep it private for security)
   - **File size limit:** Optional - set to 50MB or as needed
   - **Allowed MIME types:** Leave empty or specify: `image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*`

3. Click **"Create bucket"**

### Step 4: Set Up Bucket Policies (Security)

After creating the bucket, you need to set access policies:

1. Click on the **"case-documents"** bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Authenticated Users to Upload

Click **"Create a policy from scratch"**

**Policy Name:** `Authenticated users can upload`

**Target Roles:** `authenticated`

**Operation:** `INSERT`

**Policy Definition:**
```sql
(auth.role() = 'authenticated')
```

Click **"Review"** then **"Save policy"**

#### Policy 2: Allow Authenticated Users to Read

Click **"New Policy"** → **"Create a policy from scratch"**

**Policy Name:** `Authenticated users can read`

**Target Roles:** `authenticated`

**Operation:** `SELECT`

**Policy Definition:**
```sql
(auth.role() = 'authenticated')
```

Click **"Review"** then **"Save policy"**

#### Policy 3: Allow Users to Delete Their Own Files (Optional)

**Policy Name:** `Users can delete own files`

**Target Roles:** `authenticated`

**Operation:** `DELETE`

**Policy Definition:**
```sql
(auth.role() = 'authenticated')
```

Click **"Review"** then **"Save policy"**

### Step 5: Test Document Upload

1. Go back to your DLPP Legal CMS application
2. Open a case
3. Go to the Documents tab
4. Click "Upload Document"
5. Select a file and fill in the details
6. Click "Upload"

**Expected Result:** ✅ "Document uploaded successfully!"

---

## Alternative: Quick Setup via SQL

If you prefer SQL, you can run this in the Supabase SQL Editor:

```sql
-- Note: Storage bucket creation must be done via the Supabase UI
-- But you can set up the policies via SQL after creating the bucket

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-documents' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case-documents' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-documents' AND
  auth.role() = 'authenticated'
);
```

---

## Verification

After setup, verify everything works:

### 1. Check Bucket Exists
- Go to Supabase → Storage
- You should see "case-documents" bucket

### 2. Check Policies
- Click on the bucket
- Go to Policies tab
- You should see at least 2 policies (INSERT and SELECT)

### 3. Test Upload
- In DLPP CMS, upload a test document
- Check Supabase Storage → case-documents
- You should see the uploaded file

---

## Temporary Workaround (Already Implemented)

**If you can't set up storage right now**, the system has been updated to:

1. ✅ Save document metadata to the database (title, type, description)
2. ⚠️ Show a warning that file upload is disabled
3. ✅ Allow you to track documents without actual files
4. 🔧 Enable full file upload once storage is configured

**What you'll see:**
- Warning toast: "Document record saved, but file upload disabled. Contact admin to enable storage."
- Success message: "Document record saved (file upload pending storage setup)"

**Documents will appear in the list**, but without downloadable files until storage is set up.

---

## Troubleshooting

### Error: "Bucket not found"
**Solution:** Follow Step 3 above to create the bucket

### Error: "new row violates row-level security policy"
**Solution:** Set up the bucket policies (Step 4)

### Error: "File size exceeds limit"
**Solution:**
1. Go to Storage → case-documents → Settings
2. Increase the file size limit
3. Or compress your files before upload

### Files Upload But Can't Download
**Solution:**
1. Make sure the SELECT policy is set (Step 4, Policy 2)
2. Check that the bucket is not accidentally set to private with no policies

### Can't See Uploaded Files in Supabase
**Solution:**
1. Go to Storage → case-documents
2. Navigate through the folders (organized by case ID)
3. Files are stored as: `{case-id}/{timestamp}-{filename}`

---

## File Organization

Files are automatically organized in the bucket by case:

```
case-documents/
├── {case-id-1}/
│   ├── 1730000000000-complaint.pdf
│   ├── 1730000001000-survey_plan.pdf
│   └── 1730000002000-photo.jpg
├── {case-id-2}/
│   ├── 1730000003000-title_deed.pdf
│   └── 1730000004000-letter.docx
└── ...
```

This keeps files organized and makes it easy to:
- Find all documents for a case
- Manage storage space
- Export case files
- Clean up old cases

---

## Security Best Practices

1. **Keep bucket private** - Don't enable public access
2. **Use RLS policies** - Only authenticated users should access files
3. **Set file size limits** - Prevent abuse (recommend 50MB max)
4. **Restrict MIME types** - Only allow document types you need
5. **Regular backups** - Supabase handles this, but verify
6. **Audit logs** - Monitor who uploads what

---

## Storage Limits

**Supabase Free Tier:**
- Storage: 1 GB
- File uploads: 50 MB per file
- Bandwidth: 2 GB per month

**Supabase Pro Tier:**
- Storage: 100 GB (then $0.021/GB)
- File uploads: 5 GB per file
- Bandwidth: 250 GB (then $0.09/GB)

**Recommendations:**
- Start with free tier for testing
- Monitor usage in Supabase dashboard
- Upgrade when you approach limits
- Implement file compression for images
- Use PDF optimization for large documents

---

## Next Steps

After setting up storage:

1. ✅ Test document upload from the app
2. ✅ Verify files appear in Supabase Storage
3. ✅ Test document download
4. ✅ Train users on document upload process
5. ✅ Set up storage monitoring
6. ✅ Plan for storage limits and upgrades

---

## Need Help?

If you encounter issues:

1. **Check Supabase Dashboard:**
   - Storage → Logs to see upload attempts
   - API → Logs to see errors

2. **Check Browser Console:**
   - Right-click → Inspect → Console tab
   - Look for error messages

3. **Contact Support:**
   - Supabase: https://supabase.com/support
   - Same: support@same.new

---

**Last Updated:** October 30, 2025
**Status:** Required for document uploads
**Priority:** High

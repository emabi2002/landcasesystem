# ⚡ INSTANT FIX - Disable All Security (Demo Mode)

## 🎯 What This Does
Removes ALL security restrictions so everything works immediately.

Perfect for:
- ✅ Demos
- ✅ Testing
- ✅ Development
- ✅ Making it work NOW

---

## 🚀 Fix in 60 Seconds

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com
- Sign in → Your Project
- Click **"SQL Editor"** (left sidebar)
- Click **"New query"**

### 2. Copy & Run This Code

```sql
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE land_parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

**OR** just run the entire `DISABLE_RLS_DEMO.sql` file:
1. Open `DISABLE_RLS_DEMO.sql`
2. Copy everything
3. Paste in Supabase SQL Editor
4. Click **RUN**

### 3. Done! ✅

Go back to your app and try uploading again. It will work!

---

## 🎉 What You Can Now Do

With security disabled, you have **FULL PERMISSIONS** for:
- ✅ Upload documents
- ✅ Add parties
- ✅ Create tasks
- ✅ Schedule events
- ✅ Link land parcels
- ✅ Edit cases
- ✅ Everything!

**No more "row-level security policy" errors!**

---

## ⚠️ Important Notes

**This is for DEMO/TESTING only!**

Before going to production:
1. Re-enable RLS: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
2. Add proper security policies
3. Restrict access based on user roles

For now, enjoy full access! 🎉

---

## 🔄 To Re-Enable Security Later

Run this when you're ready:

```sql
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

Then add proper policies using `FIX_RLS_POLICIES.sql`

---

**Now go try uploading your document!** 🚀

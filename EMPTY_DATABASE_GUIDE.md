# 🗑️ Empty Database - Start Fresh

## ⚠️ IMPORTANT WARNING

**This will DELETE ALL data from your database!**

- ✅ Preserves: Table structures, RBAC system, database schema
- ❌ Deletes: ALL cases, documents, tasks, events, costs, etc.

---

## 📋 How to Empty the Database

### Option 1: Manual Execution (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/yvnkyjnwvylrweyzvibs/sql/new

2. **Copy the SQL Script**
   - Open the file: `EMPTY_ALL_DATA.sql`
   - Press `Ctrl+A` (Select All), then `Ctrl+C` (Copy)

3. **Run the Script**
   - Paste into Supabase SQL Editor (`Ctrl+V`)
   - Click **"RUN"** button (or press `F5`)
   - Wait for completion (should take a few seconds)

4. **Verify Deletion**
   - Check the output in SQL Editor
   - Should show all counts as 0
   - RBAC system counts should remain (8 groups, 23 modules, etc.)

---

## 📊 What Gets Deleted

### Case Data (ALL DELETED):
- ✅ Cases (10 records)
- ✅ Documents
- ✅ Tasks
- ✅ Events
- ✅ Land Parcels
- ✅ Litigation Costs (24 entries, K1675k)
- ✅ Directions
- ✅ Case Allocations
- ✅ Filings
- ✅ Compliance Tracking
- ✅ Communications
- ✅ Correspondence
- ✅ File Requests
- ✅ Notifications
- ✅ Intake Records
- ✅ Case Parties
- ✅ Lawyers

### RBAC System (PRESERVED):
- ✅ Groups (8) - Super Admin, Case Officer, etc.
- ✅ Modules (23) - All system modules
- ✅ Permissions (161+) - All permission mappings
- ✅ User Accounts - Authentication remains
- ⚠️ User Group Assignments - Optional (can keep or delete)

---

## 🔄 After Emptying Database

Your dashboard will show:
- Total Cases: **0**
- Open Cases: **0**
- Closed Cases: **0**
- Litigation Costs: **K0**
- All charts: **Empty**

The system will be ready for **real data entry** from scratch!

---

## 🆘 Troubleshooting

### "Permission denied" error
- Make sure you're logged into the correct Supabase project
- Use the SQL Editor (not the Table Editor)

### "Foreign key constraint violation" error
- The script handles this automatically by deleting in the correct order
- If you still get this error, run the script again

### Some tables not found
- Normal - some tables might not exist yet
- The script will skip them automatically

### Want to keep user assignments?
- The script keeps user group assignments by default
- To delete them too, uncomment the line in STEP 2

---

## ✅ Verification Query

After running the script, verify with this query:

```sql
SELECT 
  (SELECT COUNT(*) FROM cases) as cases,
  (SELECT COUNT(*) FROM documents) as documents,
  (SELECT COUNT(*) FROM litigation_costs) as costs,
  (SELECT COUNT(*) FROM groups) as rbac_groups,
  (SELECT COUNT(*) FROM modules) as rbac_modules;
```

**Expected Result:**
```
cases: 0
documents: 0
costs: 0
rbac_groups: 8
rbac_modules: 23
```

---

## 🚀 Next Steps After Deletion

1. **Refresh Dashboard** - All metrics should show 0
2. **Assign RBAC Groups** - If needed, reassign users
3. **Start Data Entry** - Begin with real cases
4. **Test Workflows** - Verify all modules work with fresh data

---

**Ready to empty? Run the script and start fresh!** 🎯

# Compliance Integration - Quick Start Guide

**DLPP Legal CMS**

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Database Schema

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy contents of `database-compliance-integration.sql`
5. Paste and click **Run**
6. Wait for "Success" message

### Step 2: Verify Tables Created

Check these tables exist:
- ✅ `recommendation_links`
- ✅ `recommendation_snapshots`
- ✅ `materialized_recommendations`
- ✅ `compliance_sync_log`

### Step 3: Test the Feature

1. **Start Dev Server** (if not running):
   ```bash
   cd dlpp-legal-cms
   bun run dev
   ```

2. **Access Compliance Module**:
   - Open http://localhost:3000
   - Click **Compliance** in navigation
   - You should see the Compliance Recommendations page

3. **Test Linking** (after sync):
   - Click "Link to Case" on any recommendation
   - Select a case
   - Choose link type
   - Add context
   - Submit

---

## 📊 Initial Data Sync

Since the compliance system integration is not yet live, you need to populate test data:

### Option 1: Manual SQL Insert

Run this in Supabase SQL Editor to create test recommendations:

```sql
INSERT INTO materialized_recommendations (
  recommendation_id,
  title,
  recommendation_text,
  risk_rating,
  priority,
  status,
  org_unit_name,
  region,
  target_date,
  published_at,
  parcel_ref,
  tags,
  owner_name
) VALUES
(
  gen_random_uuid(),
  'Illegal land encroachment detected in Western Province',
  'During compliance inspection, unauthorized structures were found on state land parcel WP-12345. Immediate action required to remove structures and restore land.',
  'High',
  'Urgent',
  'Published',
  'Compliance Division - Western',
  'Western Province',
  CURRENT_DATE + INTERVAL '30 days',
  NOW(),
  'WP-12345',
  ARRAY['encroachment', 'state-land', 'urgent'],
  'John Compliance Officer'
),
(
  gen_random_uuid(),
  'Boundary markers missing in Madang Province',
  'Survey inspection revealed that boundary markers for parcel MAD-67890 have been removed or destroyed. Recommend legal action to prevent disputes.',
  'Medium',
  'High',
  'Published',
  'Compliance Division - Madang',
  'Madang Province',
  CURRENT_DATE + INTERVAL '60 days',
  NOW(),
  'MAD-67890',
  ARRAY['boundary', 'survey', 'markers'],
  'Jane Surveyor'
),
(
  gen_random_uuid(),
  'Customary land rights verification needed',
  'Multiple parties claiming ownership of parcel EH-11111. Compliance review suggests legal clarification of customary rights required.',
  'Medium',
  'Medium',
  'Published',
  'Compliance Division - Eastern Highlands',
  'Eastern Highlands',
  CURRENT_DATE + INTERVAL '90 days',
  NOW(),
  'EH-11111',
  ARRAY['customary', 'ownership', 'dispute'],
  'Peter Compliance Lead'
);
```

### Option 2: Use API (Future)

When compliance system is integrated:

```bash
curl -X POST http://localhost:3000/api/compliance/sync \
  -H "Content-Type: application/json" \
  -d '{
    "recommendations": [...]
  }'
```

---

## 🔗 How to Link Recommendations

### From Compliance Page

1. **Navigate**: Go to **Compliance** in menu
2. **Find**: Search/filter for relevant recommendation
3. **Link**: Click "Link to Case" button
4. **Select Case**: Choose which legal case
5. **Choose Type**:
   - **Adopted as Basis**: Recommendation is main reason for case
   - **Supporting Reference**: Adds supporting evidence
   - **Information Only**: Background context
6. **Add Context**: Explain the relationship
7. **Create Snapshot**: ✅ Keep checked (recommended)
8. **Submit**: Click "Link to Case"

### View in Case

1. **Go to Case**: Open any case detail page
2. **Compliance Tab**: Click the "Compliance" tab
3. **View Links**: See all linked recommendations
4. **Unlink**: Click "Unlink" to remove (if needed)

---

## 📋 Link Type Guide

| Link Type | When to Use | Example |
|-----------|-------------|---------|
| **Adopted as Basis** | Recommendation triggered the case | Compliance found illegal encroachment → Case opened to remove structures |
| **Supporting Reference** | Recommendation supports existing case | Compliance confirms boundary markers → Supports plaintiff's dispute claim |
| **Information Only** | Background information | Previous surveys in area → Context for current boundary case |

---

## 🎯 Quick Tips

### ✅ Best Practices

1. **Always create snapshots** - Preserves evidence
2. **Write clear context** - Explain the relationship
3. **Use correct link type** - Helps with reporting
4. **Sync regularly** - Keep recommendations current

### ❌ Common Mistakes

1. **Skipping context** - Always explain why you're linking
2. **Wrong link type** - "Adopted as Basis" is ONLY for recommendations that directly caused the case
3. **No snapshot** - Always keep this checked for legal cases
4. **Linking to closed cases** - Only link to active cases (Open, In Progress, Pending)

---

## 🔍 Testing Checklist

After setup, verify:

- [ ] Database schema applied successfully
- [ ] Test recommendations inserted
- [ ] Compliance page loads
- [ ] Can view recommendations
- [ ] Can filter recommendations
- [ ] Can search recommendations
- [ ] Can link to a case
- [ ] Link appears in case Compliance tab
- [ ] Can unlink recommendation
- [ ] Snapshot created in database

---

## 🚨 Troubleshooting

### "No recommendations found"

**Solution**: Insert test data (see above)

### "Failed to link"

**Checks**:
1. Does the case exist?
2. Is your user role: admin, case_manager, or legal_officer?
3. Check browser console for errors

### "Database function not found"

**Solution**: Re-run `database-compliance-integration.sql` schema

### "RLS policy error"

**Solution**: Check your user has an entry in the `users` table with appropriate role

---

## 📚 Full Documentation

For complete details, see:
- **COMPLIANCE_INTEGRATION_SETUP.md** - Full setup and usage guide
- **database-compliance-integration.sql** - Database schema with comments

---

## 🆘 Support

**Need Help?**
- Check Supabase logs in Dashboard
- Review browser console for errors
- Contact DLPP IT Department

---

**Quick Start Version**: 1.0
**Last Updated**: November 1, 2025

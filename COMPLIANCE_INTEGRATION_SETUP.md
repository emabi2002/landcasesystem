# Compliance Integration Setup Guide

**DLPP Legal Case Management System**
**Version 1.0**
**Department of Lands & Physical Planning**

---

## Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Features](#features)
4. [How to Use](#how-to-use)
5. [API Endpoints](#api-endpoints)
6. [Integration with Compliance System](#integration-with-compliance-system)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Compliance Integration module allows the DLPP Legal CMS to:

- **View** published compliance recommendations from the compliance management system
- **Link** recommendations to legal cases with context
- **Track** the relationship between compliance findings and legal actions
- **Maintain** immutable snapshots for evidentiary purposes
- **Monitor** compliance-driven legal activities

### Key Benefits

✅ **Seamless Integration**: Connect compliance recommendations to legal cases
✅ **Audit Trail**: Immutable snapshots preserve recommendation state at time of linking
✅ **Contextual Linking**: Explain how recommendations relate to cases
✅ **Flexible Links**: Support multiple link types (basis, supporting, informational)
✅ **Bidirectional Visibility**: View links from both compliance and legal perspectives

---

## Database Setup

### Step 1: Run the Integration Schema

The database schema creates all necessary tables, functions, and policies for compliance integration.

**Location**: `database-compliance-integration.sql`

**How to Apply**:

1. **Open Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `dlpp-legal-cms`

2. **Go to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute Schema**
   - Open `database-compliance-integration.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press F5)

4. **Verify Success**
   - Check for success message
   - Look for any error messages
   - Verify tables were created

### Tables Created

The schema creates these tables in the `public` schema:

#### 1. `recommendation_links`
Tracks links between legal cases and compliance recommendations.

**Key Columns**:
- `legal_case_id`: Reference to cases table
- `recommendation_id`: Reference to compliance recommendation
- `link_type`: Type of link (adopted_as_basis, supporting_reference, information_only)
- `link_status`: Status (linked, unlinked)
- `link_context`: Explanation of the link
- Cached recommendation metadata for performance

#### 2. `recommendation_snapshots`
Immutable snapshots of recommendations at time of linking.

**Key Columns**:
- `recommendation_id`: Reference to original recommendation
- `snapshot_jsonb`: Complete recommendation data
- `snapshot_hash`: SHA-256 hash for integrity verification

#### 3. `materialized_recommendations`
Local cache of published compliance recommendations.

**Key Columns**:
- All core recommendation fields (title, text, risk, priority, etc.)
- `search_vector`: Full-text search support
- `last_synced_at`: Last sync timestamp

#### 4. `compliance_sync_log`
Audit log of synchronization operations.

**Key Columns**:
- `sync_type`: Type of sync operation
- `sync_status`: Success/failed/partial
- `records_processed`: Count of records
- `sync_details`: JSONB with details

### Database Functions

#### `link_recommendation_to_case()`
Securely creates a link between a recommendation and case.

**Parameters**:
- `p_legal_case_id`: UUID of legal case
- `p_recommendation_id`: UUID of recommendation
- `p_link_type`: Link type
- `p_link_context`: Contextual explanation
- `p_snapshot_data`: Recommendation data for snapshot

**Returns**: UUID of created link

#### `unlink_recommendation_from_case()`
Marks a link as unlinked (soft delete).

**Parameters**:
- `p_link_id`: UUID of link to unlink
- `p_reason`: Reason for unlinking

**Returns**: Boolean success

#### `sync_published_recommendations()`
Syncs recommendations from compliance system.

**Parameters**:
- `p_recommendations`: JSONB array of recommendations

**Returns**: Integer count of synced recommendations

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **View**: All authenticated users can view linked recommendations for cases they can access
- **Create**: Case managers, legal officers, and admins can create links
- **Update**: Case managers, legal officers, and admins can update/unlink
- **Sync**: Admins can perform sync operations

---

## Features

### 1. Compliance Recommendations Page

**Access**: Navigate to **Compliance** in the main navigation

**Features**:
- View all published compliance recommendations
- Filter by region, priority, risk rating
- Search recommendations by keywords
- View detailed recommendation information
- Link recommendations to legal cases

**Statistics Cards**:
- Total Published recommendations
- High Priority count
- Critical Risk count
- Number of regions

### 2. Link Recommendations to Cases

**From Compliance Page**:
1. Click "Link to Case" on any recommendation
2. Select the legal case
3. Choose link type:
   - **Adopted as Basis**: Recommendation is primary reason for legal action
   - **Supporting Reference**: Recommendation provides supporting evidence
   - **Information Only**: For reference purposes
4. Add context explaining the link
5. Option to create immutable snapshot (recommended)
6. Click "Link to Case"

**Link Types Explained**:

| Type | Use When | Example |
|------|----------|---------|
| Adopted as Basis | Recommendation directly triggered the case | "Compliance found illegal land use; case opened to enforce regulations" |
| Supporting Reference | Recommendation supports ongoing case | "Compliance report corroborates plaintiff's boundary dispute claim" |
| Information Only | Recommendation provides context | "Background information on previous land surveys in the area" |

### 3. View Linked Recommendations

**From Case Detail Page**:
1. Go to any case detail page
2. Click the **Compliance** tab
3. View all linked recommendations
4. See link type, context, and metadata
5. Option to unlink recommendations

**Information Shown**:
- Recommendation title
- Link type badge
- Risk rating and priority
- Link context (why it was linked)
- Region and parcel reference
- Linked date

### 4. Unlink Recommendations

**To Remove a Link**:
1. Go to case detail → Compliance tab
2. Click "Unlink" on the recommendation
3. Confirm the action
4. Link is marked as unlinked (preserved in history)

**Note**: Snapshots are preserved even after unlinking for audit purposes.

### 5. Sync Recommendations

**Manual Sync**:
1. Go to Compliance page
2. Click "Sync Recommendations"
3. System fetches latest published recommendations
4. Sync log is created

**Automatic Sync** (Future):
- Schedule periodic syncs
- Webhook integration with compliance system
- Real-time updates

---

## How to Use

### Common Workflows

#### Workflow 1: Link Compliance Recommendation to New Case

**Scenario**: A compliance audit found illegal land encroachment. Legal team needs to open a case.

**Steps**:

1. **Create Legal Case**:
   - Go to Cases → Register New Case
   - Title: "Land Encroachment - Western Province"
   - Type: State Land
   - Region: Western Province
   - Save

2. **Find Recommendation**:
   - Go to Compliance module
   - Filter by Region: Western Province
   - Search for relevant recommendation
   - Review recommendation details

3. **Link to Case**:
   - Click "Link to Case"
   - Select the newly created case
   - Link Type: "Adopted as Basis"
   - Context: "This recommendation identified the encroachment issue. Legal action is being taken to remove unauthorized structures and restore state land."
   - Create snapshot: ✓ (checked)
   - Click "Link to Case"

4. **Add Supporting Information**:
   - Go to case detail → Documents tab
   - Upload compliance report PDF
   - Go to Land tab
   - Add land parcel with GPS coordinates

5. **Monitor Progress**:
   - View linked recommendation in Compliance tab
   - Update case status as it progresses
   - Track tasks and events

#### Workflow 2: Add Supporting Recommendation to Existing Case

**Scenario**: An ongoing land dispute case can benefit from a compliance finding.

**Steps**:

1. **Identify Relevant Recommendation**:
   - Go to Compliance module
   - Search for recommendations in same region
   - Review recommendations related to the case

2. **Link as Supporting Reference**:
   - Click "Link to Case"
   - Select existing case
   - Link Type: "Supporting Reference"
   - Context: "Compliance inspection confirms boundary markers are in original positions, supporting plaintiff's claim."
   - Create snapshot: ✓
   - Link

3. **Reference in Case**:
   - View in Compliance tab
   - Create task: "Review compliance findings"
   - Add note to case history

#### Workflow 3: Review All Compliance-Linked Cases

**Scenario**: Management wants to see all legal cases driven by compliance.

**Steps**:

1. **Generate Report**:
   - Go to Reports module
   - Select "Case Summary Report"
   - (Future: Add filter for "Compliance-Linked Cases")

2. **Review in Database** (For Admins):
   ```sql
   SELECT
     c.case_number,
     c.title,
     c.status,
     rl.link_type,
     rl.recommendation_title
   FROM cases c
   JOIN recommendation_links rl ON c.id = rl.legal_case_id
   WHERE rl.link_status = 'linked'
   AND rl.link_type = 'adopted_as_basis'
   ORDER BY c.created_at DESC;
   ```

---

## API Endpoints

### 1. GET `/api/compliance/recommendations`

Fetch published compliance recommendations.

**Query Parameters**:
- `region` (string): Filter by region
- `priority` (string): Filter by priority
- `risk_rating` (string): Filter by risk rating
- `parcel_ref` (string): Filter by parcel reference
- `search` (string): Full-text search
- `limit` (number): Results per page (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Response**:
```json
{
  "data": [
    {
      "recommendation_id": "uuid",
      "title": "Illegal land encroachment detected",
      "recommendation_text": "...",
      "risk_rating": "High",
      "priority": "Urgent",
      "region": "Western Province",
      "published_at": "2025-10-15T10:00:00Z",
      ...
    }
  ],
  "count": 25,
  "limit": 50,
  "offset": 0
}
```

### 2. POST `/api/compliance/link`

Link a recommendation to a legal case.

**Request Body**:
```json
{
  "legal_case_id": "uuid",
  "recommendation_id": "uuid",
  "link_type": "adopted_as_basis",
  "link_context": "Explanation...",
  "create_snapshot": true,
  "recommendation_data": { ... }
}
```

**Response**:
```json
{
  "success": true,
  "link_id": "uuid",
  "message": "Recommendation linked successfully"
}
```

### 3. DELETE `/api/compliance/link`

Unlink a recommendation from a case.

**Query Parameters**:
- `link_id` (uuid): ID of link to remove
- `reason` (string): Reason for unlinking

**Response**:
```json
{
  "success": true,
  "message": "Recommendation unlinked successfully"
}
```

### 4. POST `/api/compliance/sync`

Sync recommendations from compliance system (admin only).

**Request Body**:
```json
{
  "recommendations": [
    { ... recommendation data ... }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "synced_count": 15,
  "total": 15,
  "message": "Successfully synced 15 recommendations"
}
```

---

## Integration with Compliance System

### Option 1: Manual Sync (Current)

1. Export recommendations from compliance system
2. Format as JSON array
3. POST to `/api/compliance/sync`

### Option 2: Scheduled Sync (Recommended)

**Setup Cron Job**:

```javascript
// pages/api/cron/sync-compliance.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch from compliance system API
  const response = await fetch('https://compliance-system.dlpp.gov.pg/api/published-recommendations');
  const recommendations = await response.json();

  // Sync to legal CMS
  await fetch('http://localhost:3000/api/compliance/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendations }),
  });

  return Response.json({ success: true });
}
```

**Configure Vercel Cron** (vercel.json):
```json
{
  "crons": [{
    "path": "/api/cron/sync-compliance",
    "schedule": "0 */6 * * *"
  }]
}
```

### Option 3: Webhook Integration (Best)

Compliance system sends webhook when recommendations are published.

```javascript
// pages/api/webhooks/compliance.ts
export async function POST(request: Request) {
  const { event, recommendation } = await request.json();

  if (event === 'recommendation.published') {
    // Sync individual recommendation
    await supabase
      .from('materialized_recommendations')
      .upsert([recommendation]);
  }

  return Response.json({ received: true });
}
```

---

## Troubleshooting

### Issue: "Failed to load recommendations"

**Possible Causes**:
- Database tables not created
- RLS policies blocking access
- Sync not run yet

**Solutions**:
1. Verify database schema applied successfully
2. Check RLS policies allow authenticated users to view
3. Run initial sync to populate `materialized_recommendations`

### Issue: "Failed to link recommendation"

**Possible Causes**:
- Case doesn't exist
- User lacks permissions
- Database function error

**Solutions**:
1. Verify case ID is correct
2. Ensure user has role: admin, case_manager, or legal_officer
3. Check database logs for function errors

### Issue: "No recommendations showing"

**Possible Causes**:
- No recommendations synced yet
- All recommendations filtered out
- Status not "Published"

**Solutions**:
1. Run sync to populate recommendations
2. Clear all filters
3. Verify compliance system has published recommendations

### Issue: "Snapshot not created"

**Possible Causes**:
- `create_snapshot` set to false
- `recommendation_data` not provided
- Database constraint error

**Solutions**:
1. Ensure `create_snapshot: true` in request
2. Pass full recommendation object as `recommendation_data`
3. Check unique constraint on `link_id`

---

## Best Practices

### 1. Always Create Snapshots

✅ **Do**: Create snapshots when linking (default behavior)
❌ **Don't**: Skip snapshots for evidentiary records

**Why**: Recommendations may be updated or deleted in the compliance system. Snapshots preserve the state at time of legal action.

### 2. Provide Clear Context

✅ **Do**: Explain how the recommendation relates to the case
❌ **Don't**: Leave context empty

**Example**:
```
Good: "This compliance audit identified unauthorized clearing of state land.
       Legal action is being initiated to restore the land and prosecute offenders."

Bad: "Found issue"
```

### 3. Use Correct Link Types

- **Adopted as Basis**: ONLY when recommendation directly caused the case
- **Supporting Reference**: When recommendation provides evidence
- **Information Only**: For background context

### 4. Regular Syncs

- Sync recommendations at least daily
- Set up automated sync (cron or webhook)
- Monitor sync logs for failures

### 5. Review Linked Recommendations

- Periodically review all links
- Unlink if no longer relevant
- Update context as case evolves

---

## Security Considerations

### 1. Row Level Security

All tables have RLS enabled. Users can only:
- View recommendations linked to cases they can access
- Create/update links if they have appropriate role
- Admins can perform sync operations

### 2. Immutable Snapshots

Snapshots cannot be edited or deleted once created. This ensures:
- Evidentiary integrity
- Audit compliance
- Historical accuracy

### 3. Service Role Key

The API uses `SUPABASE_SERVICE_ROLE_KEY` for server-side operations. This key:
- Must be kept secret
- Should only be in `.env.local` (not committed to git)
- Bypasses RLS for administrative operations

### 4. Audit Trail

All operations are logged:
- Sync operations in `compliance_sync_log`
- Links created/updated in `recommendation_links`
- User actions tracked with `created_by` and `updated_by`

---

## Future Enhancements

### Planned Features

1. **Notification System**
   - Alert when new recommendations match case criteria
   - Notify when linked recommendations are updated

2. **Advanced Reporting**
   - Compliance-driven cases report
   - Link effectiveness analysis
   - Time-to-action metrics

3. **Bidirectional Integration**
   - Push case updates back to compliance system
   - Two-way status synchronization
   - Shared document repository

4. **AI-Powered Matching**
   - Suggest relevant recommendations for cases
   - Auto-link based on similarity
   - Smart filtering by context

5. **Enhanced Search**
   - Semantic search across recommendations
   - Filter by multiple criteria
   - Saved searches

---

## Support

For questions or issues with the Compliance Integration:

**Technical Support**:
- Email: dlpp-it@dlpp.gov.pg
- Phone: +675 XXX-XXXX

**Database Issues**:
- Check Supabase dashboard logs
- Review RLS policies
- Verify schema applied correctly

**Integration Issues**:
- Contact compliance system administrator
- Review API documentation
- Check sync logs

---

**Document Version**: 1.0
**Last Updated**: November 1, 2025
**Prepared By**: DLPP IT Department

**Department of Lands & Physical Planning**
**Papua New Guinea**

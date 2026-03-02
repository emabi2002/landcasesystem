# 🔗 Compliance Integration Guide

## Overview

The DLPP Legal CMS integrates with a Compliance System to allow legal officers to:
- **View** published compliance recommendations
- **Link** recommendations to legal cases
- **Track** the relationship between compliance findings and legal actions
- **Maintain** immutable records for evidentiary purposes

---

## Architecture

### System Separation

```
┌─────────────────────┐         ┌─────────────────────┐
│  Compliance System  │         │   Legal CMS         │
│                     │         │                     │
│  - Recommendations  │◄───────►│  - Cases            │
│  - Risk Assessments │  REST   │  - Documents        │
│  - Compliance Data  │  API    │  - Legal Actions    │
└─────────────────────┘         └─────────────────────┘
         │                                   │
         └────────┐                 ┌────────┘
                  ▼                 ▼
           ┌──────────────────────────┐
           │  Shared Supabase DB      │
           │  - Schema separation     │
           │  - Secure RPC functions  │
           └──────────────────────────┘
```

### Key Principles

1. **Independence**: Legal CMS never writes directly to compliance tables
2. **Security**: All write operations via secure RPC functions
3. **Immutability**: Snapshots preserve evidence
4. **Performance**: Optional materialized cache for fast queries

---

## Database Schema

### Core Tables

#### 1. `recommendation_links`

Links legal cases to compliance recommendations.

```sql
- id: UUID (PK)
- legal_case_id: UUID (FK → cases)
- recommendation_id: UUID (external reference)
- link_type: adopted_as_basis | supporting_reference | information_only
- link_status: linked | unlinked
- link_context: TEXT (why linked)
- recommendation_title: TEXT (cached)
- recommendation_priority: TEXT (cached)
- recommendation_risk_rating: TEXT (cached)
- linked_at: TIMESTAMPTZ
- created_by: UUID
```

**Link Types:**
- `adopted_as_basis`: Recommendation is the primary basis for legal action
- `supporting_reference`: Recommendation supports the case
- `information_only`: For reference only

#### 2. `recommendation_snapshots`

Immutable record of recommendations at time of linking.

```sql
- id: UUID (PK)
- recommendation_id: UUID
- legal_case_id: UUID (FK → cases)
- link_id: UUID (FK → recommendation_links)
- snapshot_jsonb: JSONB (complete recommendation data)
- snapshot_hash: TEXT (SHA-256 integrity hash)
- snapped_at: TIMESTAMPTZ
- snapped_by: UUID
```

**Purpose**: Legal evidence, historical record, audit compliance

#### 3. `materialized_recommendations` (Optional)

Local cache of published recommendations for performance.

```sql
- recommendation_id: UUID (PK)
- title: TEXT
- recommendation_text: TEXT
- risk_rating: TEXT
- priority: TEXT
- status: TEXT
- region: TEXT
- parcel_ref: TEXT
- published_at: TIMESTAMPTZ
- full_data: JSONB
- search_vector: tsvector (for full-text search)
```

#### 4. `compliance_sync_log`

Audit log of sync operations.

```sql
- id: UUID
- sync_type: TEXT
- sync_status: success | failed | partial
- records_processed: INTEGER
- error_message: TEXT
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
```

---

## API Endpoints

### 1. GET `/api/compliance/recommendations`

Fetch published compliance recommendations.

**Query Parameters:**
- `region` - Filter by region
- `priority` - Filter by priority (low, medium, high, urgent)
- `risk_rating` - Filter by risk (low, medium, high, critical)
- `parcel_ref` - Filter by parcel reference
- `search` - Full-text search query
- `limit` - Max results (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "recommendation_id": "uuid",
      "title": "string",
      "recommendation_text": "string",
      "risk_rating": "high",
      "priority": "urgent",
      "region": "Madang Province",
      "parcel_ref": "SEC123-ALL456",
      "published_at": "2025-11-01T00:00:00Z",
      "owner_name": "string"
    }
  ],
  "count": 150,
  "limit": 50,
  "offset": 0
}
```

### 2. POST `/api/compliance/link`

Link a recommendation to a legal case.

**Request Body:**
```json
{
  "legal_case_id": "uuid",
  "recommendation_id": "uuid",
  "link_type": "adopted_as_basis",
  "link_context": "This recommendation forms the basis for legal action",
  "create_snapshot": true,
  "recommendation_data": { } // Full recommendation object
}
```

**Response:**
```json
{
  "success": true,
  "link_id": "uuid",
  "message": "Recommendation linked successfully"
}
```

### 3. DELETE `/api/compliance/link?link_id={uuid}&reason={text}`

Unlink a recommendation from a case.

**Response:**
```json
{
  "success": true,
  "message": "Recommendation unlinked successfully"
}
```

### 4. POST `/api/compliance/sync`

Sync recommendations from compliance system (admin only).

**Request Body:**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "title": "string",
      "recommendation_text": "string",
      "risk_rating": "high",
      "priority": "urgent",
      "status": "Published",
      "region": "string",
      "published_at": "2025-11-01T00:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced_count": 25,
  "total": 25,
  "message": "Successfully synced 25 recommendations"
}
```

---

## Setup Instructions

### Step 1: Run Database Schema

Execute `database-compliance-integration.sql` in Supabase SQL Editor.

```bash
# In Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of database-compliance-integration.sql
3. Click "Run"
```

### Step 2: Verify Tables Created

```sql
-- Check tables exist
SELECT tablename
FROM pg_tables
WHERE tablename IN (
  'recommendation_links',
  'recommendation_snapshots',
  'materialized_recommendations',
  'compliance_sync_log'
);
```

### Step 3: Test RPC Functions

```sql
-- Test link function (replace UUIDs)
SELECT link_recommendation_to_case(
  'case-uuid-here'::UUID,
  'recommendation-uuid-here'::UUID,
  'supporting_reference',
  'Test link'
);
```

### Step 4: Add Environment Variables

Ensure `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Test API Endpoints

```bash
# Test fetching recommendations
curl http://localhost:3000/api/compliance/recommendations

# Test linking (replace with real UUIDs)
curl -X POST http://localhost:3000/api/compliance/link \
  -H "Content-Type: application/json" \
  -d '{
    "legal_case_id": "uuid",
    "recommendation_id": "uuid",
    "link_type": "supporting_reference"
  }'
```

---

## Usage Workflows

### Workflow 1: Link Recommendation to Case

1. **Legal Officer** reviews case
2. **Searches** compliance recommendations by region/parcel
3. **Previews** recommendation details
4. **Clicks** "Link to Case"
5. **Selects** link type:
   - Adopted as Basis
   - Supporting Reference
   - Information Only
6. **Adds** context notes
7. **Optionally** creates immutable snapshot
8. **Confirms** link

**System Actions:**
- Creates `recommendation_links` record
- Optionally creates `recommendation_snapshots` record
- Updates case history
- (Optional) Notifies compliance system

### Workflow 2: Review Linked Recommendations

1. **Open** case detail page
2. **Click** "Compliance Recommendations" tab
3. **View** all linked recommendations
4. **See**:
   - Recommendation title
   - Risk rating
   - Priority
   - Link type
   - Linked date
   - Link context
5. **Actions**:
   - View full recommendation
   - View snapshot (if exists)
   - Unlink recommendation
   - Open in compliance system

### Workflow 3: Generate Report

1. **Go to** Reports module
2. **Select** "Cases backed by Compliance Recommendations"
3. **Filter** by:
   - Date range
   - Region
   - Risk rating
   - Link type
4. **Export** to Excel/PDF

---

## Security & Permissions

### Row-Level Security (RLS)

All tables have RLS enabled with policies:

**recommendation_links:**
- ✅ Users can view links for cases they can access
- ✅ Case managers/admins can create links
- ✅ Case managers/admins can update links

**recommendation_snapshots:**
- ✅ Users can view snapshots for their cases
- ❌ No one can modify snapshots (immutable)

**materialized_recommendations:**
- ✅ All authenticated users can view published recommendations
- ❌ Only system can write (via sync function)

**compliance_sync_log:**
- ✅ Admins can view sync logs

### Integration Security

**Client-side:**
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` only
- Never expose service role key
- All reads via anon key with RLS

**Server-side (API routes):**
- Use `SUPABASE_SERVICE_ROLE_KEY` for writes
- Validate user permissions before operations
- RPC functions have `SECURITY DEFINER`

---

## Performance Optimization

### Materialized Recommendations Cache

For fast queries without hitting compliance system:

**Sync Strategy:**
```javascript
// Nightly cron job (server-side)
async function syncCompliance() {
  // 1. Fetch published recommendations from compliance API
  const recommendations = await fetchFromComplianceAPI();

  // 2. Sync to local cache
  await fetch('/api/compliance/sync', {
    method: 'POST',
    body: JSON.stringify({ recommendations })
  });
}
```

**Watermark-based Updates:**
```sql
-- Only sync new/updated since last sync
SELECT * FROM published_recommendations
WHERE published_at > (
  SELECT MAX(last_synced_at)
  FROM materialized_recommendations
);
```

### Indexes

Critical indexes already created:
- `idx_rec_links_case_id` - Fast case lookups
- `idx_mat_rec_search` - Full-text search
- `idx_mat_rec_published` - Recent recommendations
- `idx_mat_rec_region` - Regional filters

---

## Troubleshooting

### Error: "Table recommendation_links does not exist"

**Solution:** Run `database-compliance-integration.sql`

### Error: "Permission denied for function link_recommendation_to_case"

**Solution:**
```sql
GRANT EXECUTE ON FUNCTION link_recommendation_to_case TO authenticated;
```

### Error: "Could not find recommendation"

**Possible causes:**
1. Recommendation not synced to local cache
2. Recommendation status not "Published"
3. User doesn't have access to region

**Solution:**
```sql
-- Check if recommendation exists
SELECT * FROM materialized_recommendations
WHERE recommendation_id = 'uuid';

-- Check if it's published
SELECT status FROM materialized_recommendations
WHERE recommendation_id = 'uuid';
```

### Slow Recommendation Search

**Solutions:**
1. Ensure indexes exist:
```sql
-- Verify indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'materialized_recommendations';
```

2. Update statistics:
```sql
ANALYZE materialized_recommendations;
```

3. Check cache freshness:
```sql
SELECT
  COUNT(*) as total,
  MAX(last_synced_at) as last_sync
FROM materialized_recommendations;
```

---

## Acceptance Testing

### Test 1: Search Recommendations

```sql
-- Should return published recommendations
SELECT * FROM available_recommendations
WHERE region = 'Madang Province'
LIMIT 10;
```

### Test 2: Link Recommendation

```sql
-- Should create link and return link_id
SELECT link_recommendation_to_case(
  'valid-case-uuid'::UUID,
  'valid-recommendation-uuid'::UUID,
  'supporting_reference',
  'Test context',
  '{"test": "data"}'::JSONB
);
```

### Test 3: Verify RLS

```sql
-- As non-admin user, should only see published
SET ROLE authenticated;
SELECT COUNT(*) FROM materialized_recommendations
WHERE status != 'Published'; -- Should be 0
```

### Test 4: Snapshot Integrity

```sql
-- Verify snapshot hash matches
SELECT
  id,
  snapshot_hash = generate_snapshot_hash(snapshot_jsonb) as hash_valid
FROM recommendation_snapshots;
-- All should be true
```

---

## Monitoring & Maintenance

### Daily Checks

```sql
-- Check sync health
SELECT * FROM compliance_sync_log
WHERE started_at > NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;

-- Check link activity
SELECT
  DATE(linked_at) as date,
  COUNT(*) as links_created
FROM recommendation_links
WHERE linked_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(linked_at)
ORDER BY date DESC;
```

### Monthly Maintenance

```sql
-- Clean up old sync logs (keep 90 days)
DELETE FROM compliance_sync_log
WHERE started_at < NOW() - INTERVAL '90 days';

-- Vacuum tables
VACUUM ANALYZE recommendation_links;
VACUUM ANALYZE materialized_recommendations;
```

---

## API Integration Example

### Client-side Service

```typescript
// src/lib/compliance-service.ts
export async function fetchRecommendations(filters: {
  region?: string;
  priority?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters.region) params.append('region', filters.region);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`/api/compliance/recommendations?${params}`);
  return response.json();
}

export async function linkRecommendation(
  caseId: string,
  recommendationId: string,
  linkType: string,
  context: string
) {
  const response = await fetch('/api/compliance/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      legal_case_id: caseId,
      recommendation_id: recommendationId,
      link_type: linkType,
      link_context: context,
      create_snapshot: true
    })
  });
  return response.json();
}
```

---

## Future Enhancements

### Planned Features

1. **Bidirectional Sync**
   - Notify compliance system when linked
   - Update compliance with legal case status

2. **Advanced Filtering**
   - Filter by compliance officer
   - Filter by target date range
   - Filter by tags

3. **Bulk Operations**
   - Link multiple recommendations at once
   - Export linked recommendations

4. **Analytics**
   - Dashboard showing link trends
   - Aging of recommendations
   - Compliance → Legal conversion rates

---

## Support

**Documentation:**
- This guide
- API endpoint documentation
- Database schema comments

**Contact:**
- DLPP IT Department
- support@dlpp.gov.pg

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2025 | Initial implementation |

---

**Department of Lands & Physical Planning**
**Papua New Guinea**

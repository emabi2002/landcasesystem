-- =====================================================
-- USEFUL SQL QUERIES FOR NORMALIZED DATABASE
-- DLPP Legal Case Management System
-- =====================================================
-- These queries demonstrate the power of the normalized structure
-- Run them in Supabase SQL Editor to explore your data
-- =====================================================

-- =====================================================
-- SECTION 1: BASIC VERIFICATION
-- =====================================================

-- 1.1 Count records in all tables
SELECT
  'cases' as table_name,
  (SELECT COUNT(*) FROM cases) as count
UNION ALL
SELECT 'parties', (SELECT COUNT(*) FROM parties)
UNION ALL
SELECT 'land_parcels', (SELECT COUNT(*) FROM land_parcels)
UNION ALL
SELECT 'events', (SELECT COUNT(*) FROM events)
UNION ALL
SELECT 'tasks', (SELECT COUNT(*) FROM tasks)
UNION ALL
SELECT 'documents', (SELECT COUNT(*) FROM documents)
UNION ALL
SELECT 'case_history', (SELECT COUNT(*) FROM case_history);

-- 1.2 Verify foreign key relationships
SELECT
  c.case_number,
  COUNT(DISTINCT p.id) as parties,
  COUNT(DISTINCT lp.id) as land_parcels,
  COUNT(DISTINCT e.id) as events,
  COUNT(DISTINCT t.id) as tasks,
  COUNT(DISTINCT d.id) as documents
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
LEFT JOIN land_parcels lp ON lp.case_id = c.id
LEFT JOIN events e ON e.case_id = c.id
LEFT JOIN tasks t ON t.case_id = c.id
LEFT JOIN documents d ON d.case_id = c.id
GROUP BY c.id, c.case_number
LIMIT 10;

-- 1.3 Check for cases with missing parties (should be none)
SELECT
  c.case_number,
  c.title,
  COUNT(p.id) as party_count
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
GROUP BY c.id
HAVING COUNT(p.id) < 2
ORDER BY c.case_number;

-- =====================================================
-- SECTION 2: PARTY QUERIES
-- =====================================================

-- 2.1 Find all cases for a specific party
SELECT
  c.case_number,
  c.title,
  c.status,
  p.role as party_role,
  p.party_type,
  c.created_at
FROM cases c
JOIN parties p ON p.case_id = c.id
WHERE p.name ILIKE '%Timothy Timas%'  -- Change this to search for any party
ORDER BY c.created_at DESC;

-- 2.2 Count cases by party type
SELECT
  p.party_type,
  COUNT(DISTINCT p.case_id) as case_count,
  COUNT(p.id) as total_party_records
FROM parties p
GROUP BY p.party_type
ORDER BY case_count DESC;

-- 2.3 Find parties appearing in multiple cases
SELECT
  p.name,
  COUNT(DISTINCT p.case_id) as case_count,
  string_agg(DISTINCT p.role, ', ') as roles_played
FROM parties p
GROUP BY p.name
HAVING COUNT(DISTINCT p.case_id) > 1
ORDER BY case_count DESC
LIMIT 20;

-- 2.4 Get cases with multiple plaintiffs or defendants
SELECT
  c.case_number,
  c.title,
  COUNT(CASE WHEN p.role = 'plaintiff' THEN 1 END) as plaintiff_count,
  COUNT(CASE WHEN p.role = 'defendant' THEN 1 END) as defendant_count,
  string_agg(CASE WHEN p.role = 'plaintiff' THEN p.name END, ', ') as plaintiffs,
  string_agg(CASE WHEN p.role = 'defendant' THEN p.name END, ', ') as defendants
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
GROUP BY c.id
HAVING COUNT(CASE WHEN p.role = 'plaintiff' THEN 1 END) > 1
   OR COUNT(CASE WHEN p.role = 'defendant' THEN 1 END) > 1
ORDER BY c.case_number
LIMIT 20;

-- 2.5 Cases where DLPP is plaintiff vs defendant
SELECT
  p.role as dlpp_role,
  COUNT(DISTINCT p.case_id) as case_count,
  ROUND(COUNT(DISTINCT p.case_id)::numeric / (SELECT COUNT(*) FROM cases) * 100, 2) as percentage
FROM parties p
WHERE p.name ILIKE '%Department of Lands%'
  OR p.name ILIKE '%DLPP%'
GROUP BY p.role;

-- =====================================================
-- SECTION 3: LAND PARCEL QUERIES
-- =====================================================

-- 3.1 Cases with land parcels
SELECT
  c.case_number,
  c.title,
  lp.parcel_number,
  lp.location,
  lp.notes
FROM cases c
JOIN land_parcels lp ON lp.case_id = c.id
WHERE lp.parcel_number IS NOT NULL
  AND lp.parcel_number != 'N/A'
ORDER BY c.case_number
LIMIT 20;

-- 3.2 Land disputes by region
SELECT
  lp.location as region,
  COUNT(DISTINCT lp.case_id) as case_count,
  COUNT(lp.id) as parcel_count
FROM land_parcels lp
WHERE lp.location IS NOT NULL
GROUP BY lp.location
ORDER BY case_count DESC
LIMIT 20;

-- 3.3 Cases with multiple land parcels
SELECT
  c.case_number,
  c.title,
  COUNT(lp.id) as parcel_count,
  string_agg(lp.parcel_number, ', ') as parcels
FROM cases c
JOIN land_parcels lp ON lp.case_id = c.id
GROUP BY c.id
HAVING COUNT(lp.id) > 1
ORDER BY parcel_count DESC
LIMIT 10;

-- 3.4 Find land parcels by survey plan number
SELECT
  lp.parcel_number,
  c.case_number,
  c.title,
  c.status,
  lp.location
FROM land_parcels lp
JOIN cases c ON c.id = lp.case_id
WHERE lp.parcel_number LIKE '%SP%'  -- Change this to search for specific survey plans
ORDER BY lp.parcel_number
LIMIT 20;

-- =====================================================
-- SECTION 4: EVENT & CALENDAR QUERIES
-- =====================================================

-- 4.1 Upcoming events in next 30 days
SELECT
  e.event_date,
  e.title,
  e.event_type,
  e.location,
  c.case_number,
  c.title as case_title,
  EXTRACT(DAY FROM e.event_date - NOW()) as days_until,
  CASE
    WHEN e.event_date <= NOW() + INTERVAL '3 days' THEN 'URGENT'
    WHEN e.event_date <= NOW() + INTERVAL '7 days' THEN 'SOON'
    ELSE 'SCHEDULED'
  END as urgency
FROM events e
JOIN cases c ON c.id = e.case_id
WHERE e.event_date > NOW()
  AND e.event_date <= NOW() + INTERVAL '30 days'
ORDER BY e.event_date;

-- 4.2 Overdue events
SELECT
  e.event_date,
  e.title,
  c.case_number,
  c.title as case_title,
  c.status,
  ABS(EXTRACT(DAY FROM NOW() - e.event_date)) as days_overdue
FROM events e
JOIN cases c ON c.id = e.case_id
WHERE e.event_date < NOW()
  AND c.status NOT IN ('closed', 'settled')
ORDER BY e.event_date DESC
LIMIT 20;

-- 4.3 Events by type
SELECT
  e.event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT e.case_id) as case_count,
  MIN(e.event_date) as earliest_event,
  MAX(e.event_date) as latest_event
FROM events e
GROUP BY e.event_type
ORDER BY event_count DESC;

-- 4.4 Cases with multiple scheduled events
SELECT
  c.case_number,
  c.title,
  COUNT(e.id) as event_count,
  MIN(e.event_date) as next_event,
  string_agg(e.title, ', ' ORDER BY e.event_date) as all_events
FROM cases c
JOIN events e ON e.case_id = c.id
WHERE e.event_date > NOW()
GROUP BY c.id
HAVING COUNT(e.id) > 1
ORDER BY event_count DESC
LIMIT 10;

-- =====================================================
-- SECTION 5: TASK & WORKLOAD QUERIES
-- =====================================================

-- 5.1 Officer workload summary
SELECT
  COALESCE(t.assigned_to, 'Unassigned') as officer,
  COUNT(DISTINCT t.case_id) as case_count,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue
FROM tasks t
GROUP BY t.assigned_to
ORDER BY case_count DESC;

-- 5.2 Overdue tasks
SELECT
  t.title,
  t.due_date,
  t.assigned_to as officer,
  c.case_number,
  c.title as case_title,
  ABS(EXTRACT(DAY FROM NOW() - t.due_date)) as days_overdue
FROM tasks t
JOIN cases c ON c.id = t.case_id
WHERE t.due_date < NOW()
  AND t.status NOT IN ('completed', 'cancelled')
ORDER BY t.due_date
LIMIT 20;

-- 5.3 Tasks by priority
SELECT
  t.priority,
  COUNT(*) as task_count,
  COUNT(DISTINCT t.case_id) as case_count,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed
FROM tasks t
GROUP BY t.priority
ORDER BY
  CASE t.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- =====================================================
-- SECTION 6: DOCUMENT QUERIES
-- =====================================================

-- 6.1 Cases with most documents
SELECT
  c.case_number,
  c.title,
  COUNT(d.id) as document_count,
  MIN(d.uploaded_at) as oldest_doc,
  MAX(d.uploaded_at) as newest_doc
FROM cases c
JOIN documents d ON d.case_id = c.id
GROUP BY c.id
ORDER BY document_count DESC
LIMIT 20;

-- 6.2 Documents by type
SELECT
  d.document_type,
  COUNT(*) as document_count,
  COUNT(DISTINCT d.case_id) as case_count
FROM documents d
GROUP BY d.document_type
ORDER BY document_count DESC;

-- 6.3 Recent document uploads
SELECT
  d.uploaded_at,
  d.title,
  d.document_type,
  c.case_number,
  c.title as case_title
FROM documents d
JOIN cases c ON c.id = d.case_id
ORDER BY d.uploaded_at DESC
LIMIT 20;

-- =====================================================
-- SECTION 7: CASE HISTORY & AUDIT
-- =====================================================

-- 7.1 Case activity timeline
SELECT
  ch.created_at,
  ch.action,
  ch.description,
  c.case_number
FROM case_history ch
JOIN cases c ON c.id = ch.case_id
WHERE c.case_number = 'DLPP-2025-0001'  -- Change to your case number
ORDER BY ch.created_at DESC;

-- 7.2 Most active cases (by history records)
SELECT
  c.case_number,
  c.title,
  c.status,
  COUNT(ch.id) as activity_count,
  MIN(ch.created_at) as first_activity,
  MAX(ch.created_at) as last_activity
FROM cases c
JOIN case_history ch ON ch.case_id = c.id
GROUP BY c.id
ORDER BY activity_count DESC
LIMIT 20;

-- 7.3 Activity by action type
SELECT
  ch.action,
  COUNT(*) as count,
  COUNT(DISTINCT ch.case_id) as case_count
FROM case_history ch
GROUP BY ch.action
ORDER BY count DESC;

-- =====================================================
-- SECTION 8: COMPLEX ANALYTICS
-- =====================================================

-- 8.1 Case complexity score
-- (based on number of parties, parcels, events, tasks, documents)
SELECT
  c.case_number,
  c.title,
  c.status,
  COUNT(DISTINCT p.id) as parties,
  COUNT(DISTINCT lp.id) as parcels,
  COUNT(DISTINCT e.id) as events,
  COUNT(DISTINCT t.id) as tasks,
  COUNT(DISTINCT d.id) as documents,
  (COUNT(DISTINCT p.id) +
   COUNT(DISTINCT lp.id) * 2 +
   COUNT(DISTINCT e.id) +
   COUNT(DISTINCT t.id) +
   COUNT(DISTINCT d.id)) as complexity_score
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
LEFT JOIN land_parcels lp ON lp.case_id = c.id
LEFT JOIN events e ON e.case_id = c.id
LEFT JOIN tasks t ON t.case_id = c.id
LEFT JOIN documents d ON d.case_id = c.id
GROUP BY c.id
ORDER BY complexity_score DESC
LIMIT 20;

-- 8.2 Regional case distribution with details
SELECT
  c.region,
  COUNT(*) as total_cases,
  COUNT(CASE WHEN c.status = 'in_court' THEN 1 END) as in_court,
  COUNT(CASE WHEN c.status = 'closed' THEN 1 END) as closed,
  COUNT(CASE WHEN c.status = 'settled' THEN 1 END) as settled,
  COUNT(DISTINCT lp.id) as land_parcels,
  ROUND(AVG(EXTRACT(DAY FROM NOW() - c.created_at)), 0) as avg_age_days
FROM cases c
LEFT JOIN land_parcels lp ON lp.case_id = c.id
WHERE c.region IS NOT NULL
GROUP BY c.region
ORDER BY total_cases DESC;

-- 8.3 Find similar cases by party overlap
SELECT
  c1.case_number as case_1,
  c2.case_number as case_2,
  COUNT(DISTINCT p1.name) as common_parties,
  string_agg(DISTINCT p1.name, ', ') as shared_parties
FROM parties p1
JOIN parties p2 ON p2.name = p1.name AND p2.case_id != p1.case_id
JOIN cases c1 ON c1.id = p1.case_id
JOIN cases c2 ON c2.id = p2.case_id
WHERE c1.id < c2.id  -- Avoid duplicate pairs
GROUP BY c1.id, c2.id
HAVING COUNT(DISTINCT p1.name) >= 2
ORDER BY common_parties DESC
LIMIT 20;

-- 8.4 Case lifecycle metrics
SELECT
  c.case_number,
  c.title,
  c.created_at as registered,
  (SELECT MIN(e.event_date) FROM events e WHERE e.case_id = c.id) as first_event,
  (SELECT MAX(e.event_date) FROM events e WHERE e.case_id = c.id) as last_event,
  (SELECT COUNT(*) FROM case_history ch WHERE ch.case_id = c.id) as total_activities,
  EXTRACT(DAY FROM NOW() - c.created_at) as age_days,
  CASE
    WHEN c.status IN ('closed', 'settled') THEN 'Concluded'
    WHEN (SELECT MAX(e.event_date) FROM events e WHERE e.case_id = c.id) > NOW() THEN 'Active - Future Events'
    WHEN EXTRACT(DAY FROM NOW() - c.created_at) > 365 THEN 'Stale - No Recent Activity'
    ELSE 'Active'
  END as lifecycle_status
FROM cases c
ORDER BY c.created_at DESC
LIMIT 20;

-- =====================================================
-- SECTION 9: DATA QUALITY CHECKS
-- =====================================================

-- 9.1 Cases missing critical data
SELECT
  c.case_number,
  c.title,
  CASE WHEN COUNT(DISTINCT p.id) < 2 THEN 'Missing parties' ELSE '' END as party_issue,
  CASE WHEN COUNT(DISTINCT e.id) = 0 THEN 'No events' ELSE '' END as event_issue,
  CASE WHEN COUNT(DISTINCT t.id) = 0 THEN 'No tasks' ELSE '' END as task_issue,
  CASE WHEN COUNT(DISTINCT lp.id) = 0 THEN 'No land data' ELSE '' END as land_issue
FROM cases c
LEFT JOIN parties p ON p.case_id = c.id
LEFT JOIN events e ON e.case_id = c.id
LEFT JOIN tasks t ON t.case_id = c.id
LEFT JOIN land_parcels lp ON lp.case_id = c.id
GROUP BY c.id
HAVING COUNT(DISTINCT p.id) < 2
   OR COUNT(DISTINCT e.id) = 0
   OR COUNT(DISTINCT t.id) = 0
   OR COUNT(DISTINCT lp.id) = 0
ORDER BY c.case_number
LIMIT 20;

-- 9.2 Duplicate party names (potential data quality issue)
SELECT
  lower(p.name) as normalized_name,
  COUNT(*) as occurrence_count,
  string_agg(DISTINCT p.name, ' | ') as variations,
  COUNT(DISTINCT p.case_id) as case_count
FROM parties p
GROUP BY lower(p.name)
HAVING COUNT(*) > 1 AND COUNT(DISTINCT p.name) > 1
ORDER BY occurrence_count DESC
LIMIT 20;

-- =====================================================
-- SECTION 10: USING DATABASE VIEWS
-- =====================================================

-- 10.1 Use case_complete_view for full case details
SELECT
  case_number,
  title,
  status,
  parties,
  party_count,
  event_count,
  task_count,
  document_count
FROM case_complete_view
WHERE case_number LIKE 'DLPP%'
LIMIT 5;

-- 10.2 Use cases_with_parties for easy display
SELECT
  case_number,
  title,
  status,
  plaintiffs,
  defendants,
  region,
  created_at
FROM cases_with_parties
WHERE status = 'in_court'
ORDER BY created_at DESC
LIMIT 20;

-- 10.3 Find cases by plaintiff name using view
SELECT *
FROM cases_with_parties
WHERE plaintiffs ILIKE '%John%'
ORDER BY created_at DESC;

-- 10.4 Find cases by defendant name using view
SELECT *
FROM cases_with_parties
WHERE defendants ILIKE '%DLPP%'
ORDER BY created_at DESC;

-- =====================================================
-- NOTES
-- =====================================================
-- These queries demonstrate the power of normalization:
-- 1. Easy joins between related tables
-- 2. No text parsing required
-- 3. Fast performance with indexes
-- 4. Flexible filtering and aggregation
-- 5. Data integrity enforced by foreign keys
--
-- Customize these queries for your specific needs!
-- =====================================================

-- DATABASE NORMALIZATION MIGRATION
-- Extracts data from cases table into properly normalized related tables
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Normalize PARTIES from parties_description
-- ============================================================================

-- Extract parties from the parties_description field
-- Format: "Plaintiff Name -v- Defendant Name" or "Party1 & Party2 -v- Party3 & Party4"

INSERT INTO public.parties (case_id, name, role, party_type, created_at)
SELECT
  c.id as case_id,
  TRIM(
    CASE
      WHEN position(' -v- ' in c.parties_description) > 0 THEN
        CASE
          WHEN c.dlpp_role = 'plaintiff' THEN
            split_part(c.parties_description, ' -v- ', 1) -- DLPP is plaintiff (first part)
          ELSE
            split_part(c.parties_description, ' -v- ', 2) -- DLPP is defendant (second part)
        END
      ELSE c.parties_description
    END
  ) as name,
  CASE
    WHEN c.dlpp_role = 'plaintiff' THEN 'plaintiff'
    ELSE 'defendant'
  END as role,
  'government_entity' as party_type,
  NOW() as created_at
FROM public.cases c
WHERE c.parties_description IS NOT NULL
  AND c.parties_description != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.parties p WHERE p.case_id = c.id AND p.name = 'Department of Lands & Physical Planning'
  );

-- Add DLPP as a party
INSERT INTO public.parties (case_id, name, role, party_type, created_at)
SELECT
  c.id as case_id,
  'Department of Lands & Physical Planning' as name,
  c.dlpp_role as role,
  'government_entity' as party_type,
  NOW() as created_at
FROM public.cases c
WHERE NOT EXISTS (
  SELECT 1 FROM public.parties p
  WHERE p.case_id = c.id
  AND p.name = 'Department of Lands & Physical Planning'
);

-- Add opposing party
INSERT INTO public.parties (case_id, name, role, party_type, created_at)
SELECT
  c.id as case_id,
  TRIM(
    CASE
      WHEN position(' -v- ' in c.parties_description) > 0 THEN
        CASE
          WHEN c.dlpp_role = 'plaintiff' THEN
            split_part(c.parties_description, ' -v- ', 2) -- Defendant is second part
          ELSE
            split_part(c.parties_description, ' -v- ', 1) -- Plaintiff is first part
        END
      ELSE 'Unknown Party'
    END
  ) as name,
  CASE
    WHEN c.dlpp_role = 'plaintiff' THEN 'defendant'
    ELSE 'plaintiff'
  END as role,
  'individual' as party_type,
  NOW() as created_at
FROM public.cases c
WHERE c.parties_description IS NOT NULL
  AND c.parties_description != ''
  AND position(' -v- ' in c.parties_description) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.parties p
    WHERE p.case_id = c.id
    AND p.role = CASE WHEN c.dlpp_role = 'plaintiff' THEN 'defendant' ELSE 'plaintiff' END
  );

-- ============================================================================
-- STEP 2: Normalize LAND PARCELS from land_description
-- ============================================================================

INSERT INTO public.land_parcels (
  case_id,
  parcel_number,
  location,
  area_sqm,
  notes,
  created_at
)
SELECT
  c.id as case_id,
  COALESCE(c.survey_plan_no, 'N/A') as parcel_number,
  COALESCE(c.region, 'Not specified') as location,
  NULL as area_sqm, -- We don't have this data
  CONCAT(
    'Land Description: ', COALESCE(c.land_description, 'N/A'), E'\n',
    'Zoning: ', COALESCE(c.zoning, 'N/A'), E'\n',
    'Survey Plan: ', COALESCE(c.survey_plan_no, 'N/A'), E'\n',
    'Lease Type: ', COALESCE(c.lease_type, 'N/A'), E'\n',
    'Lease Period: ',
    COALESCE(c.lease_commencement_date::text, 'N/A'),
    ' to ',
    COALESCE(c.lease_expiration_date::text, 'N/A')
  ) as notes,
  NOW() as created_at
FROM public.cases c
WHERE c.land_description IS NOT NULL
  AND c.land_description != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.land_parcels lp WHERE lp.case_id = c.id
  );

-- ============================================================================
-- STEP 3: Normalize EVENTS from returnable_date
-- ============================================================================

-- These are already created by trigger, but let's ensure all have events
INSERT INTO public.events (
  case_id,
  event_type,
  title,
  description,
  event_date,
  location,
  auto_created,
  created_at
)
SELECT
  c.id as case_id,
  'hearing' as event_type,
  CONCAT(
    COALESCE(c.returnable_type, 'Hearing'),
    ' - ',
    c.case_number
  ) as title,
  CONCAT(
    'Case: ', c.title, E'\n',
    'Matter Type: ', COALESCE(c.matter_type, 'N/A'), E'\n',
    'Court Reference: ', COALESCE(c.court_file_number, 'N/A')
  ) as description,
  c.returnable_date as event_date,
  'Court' as location,
  true as auto_created,
  NOW() as created_at
FROM public.cases c
WHERE c.returnable_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.case_id = c.id
    AND e.event_date = c.returnable_date
  );

-- ============================================================================
-- STEP 4: Create TASKS for action officers
-- ============================================================================

INSERT INTO public.tasks (
  case_id,
  title,
  description,
  due_date,
  status,
  priority,
  created_at
)
SELECT
  c.id as case_id,
  CONCAT('Case Assignment: ', c.case_number) as title,
  CONCAT(
    'DLPP Action Officer: ', COALESCE(c.dlpp_action_officer, 'Not assigned'), E'\n',
    'Sol Gen Officer: ', COALESCE(c.sol_gen_officer, 'Not assigned'), E'\n',
    'Division Responsible: ', COALESCE(c.division_responsible, 'Not specified'), E'\n',
    'Assignment Date: ', COALESCE(c.officer_assigned_date::text, 'N/A'), E'\n',
    'Notes: ', COALESCE(c.assignment_footnote, 'N/A')
  ) as description,
  COALESCE(c.returnable_date, NOW() + INTERVAL '30 days') as due_date,
  CASE
    WHEN c.status IN ('closed', 'settled') THEN 'completed'
    ELSE 'pending'
  END as status,
  c.priority as priority,
  NOW() as created_at
FROM public.cases c
WHERE c.dlpp_action_officer IS NOT NULL
  AND c.dlpp_action_officer != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.case_id = c.id
    AND t.title LIKE 'Case Assignment%'
  );

-- ============================================================================
-- STEP 5: Create initial DOCUMENTS entry for court documents
-- ============================================================================

INSERT INTO public.documents (
  case_id,
  title,
  description,
  document_type,
  file_url,
  uploaded_at
)
SELECT
  c.id as case_id,
  CONCAT('Court Documents - ', c.court_file_number) as title,
  CONCAT(
    'Court Reference: ', COALESCE(c.court_file_number, 'N/A'), E'\n',
    'Document Type: ', COALESCE(c.court_documents_type, 'N/A'), E'\n',
    'Filed Date: ', COALESCE(c.proceeding_filed_date::text, 'N/A'), E'\n',
    'Served Date: ', COALESCE(c.documents_served_date::text, 'N/A')
  ) as description,
  'filing' as document_type,
  '#' as file_url, -- Placeholder, actual documents to be uploaded
  NOW() as uploaded_at
FROM public.cases c
WHERE c.court_file_number IS NOT NULL
  AND c.court_file_number != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.case_id = c.id
    AND d.document_type = 'filing'
  );

-- ============================================================================
-- STEP 6: Create CASE HISTORY entries
-- ============================================================================

-- History for case registration
INSERT INTO public.case_history (
  case_id,
  action,
  description,
  metadata,
  created_at
)
SELECT
  c.id as case_id,
  'Case Registered' as action,
  CONCAT('Case registered with court reference: ', c.court_file_number) as description,
  jsonb_build_object(
    'court_reference', c.court_file_number,
    'dlpp_role', c.dlpp_role,
    'matter_type', c.matter_type,
    'import_source', 'excel_import'
  ) as metadata,
  c.created_at
FROM public.cases c
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_history ch
  WHERE ch.case_id = c.id
  AND ch.action = 'Case Registered'
);

-- History for status changes
INSERT INTO public.case_history (
  case_id,
  action,
  description,
  metadata,
  created_at
)
SELECT
  c.id as case_id,
  'Status Updated' as action,
  CONCAT('Case status: ', c.status) as description,
  jsonb_build_object(
    'status', c.status,
    'priority', c.priority
  ) as metadata,
  c.updated_at
FROM public.cases c
WHERE c.status IN ('closed', 'settled', 'judgment')
  AND NOT EXISTS (
    SELECT 1 FROM public.case_history ch
    WHERE ch.case_id = c.id
    AND ch.action = 'Status Updated'
  );

-- ============================================================================
-- STEP 7: Create VIEWS for easier querying
-- ============================================================================

-- View: Complete Case Information with all related data
CREATE OR REPLACE VIEW case_complete_view AS
SELECT
  c.id,
  c.case_number,
  c.title,
  c.description,
  c.status,
  c.priority,
  c.case_type,
  c.matter_type,
  c.dlpp_role,
  c.court_file_number,
  c.region,
  c.created_at,
  c.updated_at,

  -- Parties
  (
    SELECT json_agg(json_build_object(
      'id', p.id,
      'name', p.name,
      'role', p.role,
      'type', p.party_type
    ))
    FROM public.parties p
    WHERE p.case_id = c.id
  ) as parties,

  -- Land Parcels
  (
    SELECT json_agg(json_build_object(
      'id', lp.id,
      'parcel_number', lp.parcel_number,
      'location', lp.location,
      'notes', lp.notes
    ))
    FROM public.land_parcels lp
    WHERE lp.case_id = c.id
  ) as land_parcels,

  -- Events
  (
    SELECT json_agg(json_build_object(
      'id', e.id,
      'type', e.event_type,
      'title', e.title,
      'date', e.event_date,
      'location', e.location
    ) ORDER BY e.event_date)
    FROM public.events e
    WHERE e.case_id = c.id
  ) as events,

  -- Tasks
  (
    SELECT json_agg(json_build_object(
      'id', t.id,
      'title', t.title,
      'status', t.status,
      'priority', t.priority,
      'due_date', t.due_date
    ) ORDER BY t.due_date)
    FROM public.tasks t
    WHERE t.case_id = c.id
  ) as tasks,

  -- Documents
  (
    SELECT json_agg(json_build_object(
      'id', d.id,
      'title', d.title,
      'type', d.document_type,
      'uploaded_at', d.uploaded_at
    ) ORDER BY d.uploaded_at DESC)
    FROM public.documents d
    WHERE d.case_id = c.id
  ) as documents,

  -- Count statistics
  (SELECT COUNT(*) FROM public.parties WHERE case_id = c.id) as parties_count,
  (SELECT COUNT(*) FROM public.documents WHERE case_id = c.id) as documents_count,
  (SELECT COUNT(*) FROM public.tasks WHERE case_id = c.id) as tasks_count,
  (SELECT COUNT(*) FROM public.events WHERE case_id = c.id) as events_count,
  (SELECT COUNT(*) FROM public.land_parcels WHERE case_id = c.id) as land_parcels_count

FROM public.cases c;

-- Grant access to the view
GRANT SELECT ON case_complete_view TO authenticated;

-- View: Cases with Party Names (for easy display)
CREATE OR REPLACE VIEW cases_with_parties AS
SELECT
  c.*,
  string_agg(
    CASE
      WHEN p.role = 'plaintiff' THEN p.name
      ELSE NULL
    END,
    ', '
  ) as plaintiffs,
  string_agg(
    CASE
      WHEN p.role = 'defendant' THEN p.name
      ELSE NULL
    END,
    ', '
  ) as defendants
FROM public.cases c
LEFT JOIN public.parties p ON p.case_id = c.id
GROUP BY c.id;

GRANT SELECT ON cases_with_parties TO authenticated;

-- ============================================================================
-- STEP 8: Create indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_parties_case_id ON public.parties(case_id);
CREATE INDEX IF NOT EXISTS idx_parties_role ON public.parties(role);
CREATE INDEX IF NOT EXISTS idx_land_parcels_case_id ON public.land_parcels(case_id);
CREATE INDEX IF NOT EXISTS idx_events_case_id ON public.events(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON public.case_history(case_id);

-- ============================================================================
-- STEP 9: Success Summary
-- ============================================================================

DO $$
DECLARE
  parties_count INT;
  land_parcels_count INT;
  events_count INT;
  tasks_count INT;
  documents_count INT;
BEGIN
  SELECT COUNT(*) INTO parties_count FROM public.parties;
  SELECT COUNT(*) INTO land_parcels_count FROM public.land_parcels;
  SELECT COUNT(*) INTO events_count FROM public.events;
  SELECT COUNT(*) INTO tasks_count FROM public.tasks;
  SELECT COUNT(*) INTO documents_count FROM public.documents;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '  DATABASE NORMALIZATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Data extracted from cases table to:';
  RAISE NOTICE '  - Parties: % records', parties_count;
  RAISE NOTICE '  - Land Parcels: % records', land_parcels_count;
  RAISE NOTICE '  - Events: % records', events_count;
  RAISE NOTICE '  - Tasks: % records', tasks_count;
  RAISE NOTICE '  - Documents: % records', documents_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  - case_complete_view (all related data)';
  RAISE NOTICE '  - cases_with_parties (easy party display)';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables now properly linked with foreign keys!';
  RAISE NOTICE '============================================';
END $$;

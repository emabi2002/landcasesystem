-- =============================================================================
-- SEARCH WARRANTS MODULE - Database migration
-- Run this ONCE in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- It is idempotent: safe to run more than once.
-- =============================================================================

-- 1. Main table -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_warrants (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                  uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  warrant_number           text,
  crime_report_number      text,
  date_received            date,
  received_from            text,
  police_officer_name      text,
  police_officer_rank      text,
  police_contact_details   text,
  received_by              text,
  date_assigned_to_lawyer  date,
  dlpp_lawyer_in_carriage  text,
  applicant_informant      text,
  respondent               text,
  land_description         text,
  legal_issue              text,
  land_file_reference      text,
  title_file_reference     text,
  documents_to_provide     text,
  witness_statement_status text,
  status                   text NOT NULL DEFAULT 'Received',
  remarks_comments         text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  created_by               uuid,
  updated_by               uuid
);

-- 2. Disable RLS so the app (anon/authenticated key) can read/write it exactly
--    like it does the cases table (this project runs with RLS disabled for demo).
ALTER TABLE public.search_warrants DISABLE ROW LEVEL SECURITY;

-- 3. Keep updated_at fresh --------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_search_warrants_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_search_warrants_updated_at ON public.search_warrants;
CREATE TRIGGER trg_search_warrants_updated_at
  BEFORE UPDATE ON public.search_warrants
  FOR EACH ROW EXECUTE FUNCTION public.set_search_warrants_updated_at();

-- 4. Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sw_case_id       ON public.search_warrants(case_id);
CREATE INDEX IF NOT EXISTS idx_sw_status        ON public.search_warrants(status);
CREATE INDEX IF NOT EXISTS idx_sw_warrant_no    ON public.search_warrants(warrant_number);
CREATE INDEX IF NOT EXISTS idx_sw_crime_report  ON public.search_warrants(crime_report_number);
CREATE INDEX IF NOT EXISTS idx_sw_lawyer        ON public.search_warrants(dlpp_lawyer_in_carriage);
CREATE INDEX IF NOT EXISTS idx_sw_date_received ON public.search_warrants(date_received);

-- 5. Link documents to a specific warrant (they still show under the case via
--    case_id, so warrant documents appear in the main case document list too).
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS search_warrant_id uuid REFERENCES public.search_warrants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_search_warrant_id ON public.documents(search_warrant_id);

-- 6. Register the module (for RBAC + sidebar) -------------------------------
INSERT INTO public.modules
  (module_name, module_key, description, icon, route, display_order, is_active, category, system)
SELECT 'Search Warrants', 'search_warrants',
       'Official search warrant / investigation records linked to cases',
       'ShieldAlert', '/search-warrants', 3, true, 'legal', 'landcase'
WHERE NOT EXISTS (SELECT 1 FROM public.modules WHERE module_key = 'search_warrants');

-- 7. Grant role-based permissions -------------------------------------------
--    Admin/Manager: full.  Legal Clerk/Case Officer/Document Clerk: CRUD minus
--    delete/approve.  Viewer: read + print only.
WITH m AS (SELECT id FROM public.modules WHERE module_key = 'search_warrants')
INSERT INTO public.group_module_permissions
  (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT g.group_id, m.id, g.c, g.r, g.u, g.d, g.p, g.a, g.e
FROM m, (VALUES
  ('58581d49-b63c-47b8-b552-1651ad1acc88'::uuid, true,  true, true,  true,  true, true,  true),  -- Super Admin
  ('535686da-20a2-458b-a5a6-e7b39de40728'::uuid, true,  true, true,  true,  true, true,  true),  -- Manager
  ('df9c5616-c97f-4533-8b68-ed4c17ba7a18'::uuid, true,  true, true,  false, true, false, true),  -- Legal Clerk
  ('7478eb98-18b9-461f-a5a1-6e5cb393bbb5'::uuid, true,  true, true,  false, true, false, true),  -- Case Officer
  ('20ca7c40-0031-4930-b470-7b27e36c7431'::uuid, true,  true, true,  false, true, false, true),  -- Document Clerk
  ('bc83e119-4ea4-4e22-853a-5e345f815837'::uuid, false, true, false, false, true, false, false)  -- Viewer
) AS g(group_id, c, r, u, d, p, a, e)
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_module_permissions x
  WHERE x.group_id = g.group_id AND x.module_id = m.id
);

-- 8. Auditor group -----------------------------------------------------------
--    A read-only oversight role. It can view (and export) the search warrant
--    register, linked cases and reports. All actions are captured in audit_logs.
INSERT INTO public.groups (group_name, description)
SELECT 'Auditor', 'Read-only oversight role with access to the search warrant register and audit trail'
WHERE NOT EXISTS (SELECT 1 FROM public.groups WHERE group_name = 'Auditor');

WITH a AS (SELECT id FROM public.groups WHERE group_name = 'Auditor')
INSERT INTO public.group_module_permissions
  (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT a.id, m.id, false, true, false, false, true, false, true
FROM a, public.modules m
WHERE m.module_key IN ('search_warrants', 'cases', 'reports')
  AND NOT EXISTS (
    SELECT 1 FROM public.group_module_permissions x
    WHERE x.group_id = a.id AND x.module_id = m.id
  );

-- Done. Reload the app and sign in again to pick up the new menu + permissions.
-- Assign users to the "Auditor" group from Admin -> User Management as needed.

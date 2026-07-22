-- =============================================================================
-- SECTION 5 NOTICE REGISTER MODULE - Database migration
-- Run this ONCE in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- It is idempotent: safe to run more than once.
--
-- A Section 5 Notice is an official legal notice received by DLPP relating to
-- land claims, Incorporated Land Groups (ILGs), customary land, State leases,
-- ownership claims and other matters requiring legal attention. It is a legal
-- REGISTRY entry (not a plaintiff/defendant) and may later create or link to a
-- legal case.
-- =============================================================================

-- 1. Main table -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.section5_notices (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_number             text,
  case_id                   uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  date_received             date,
  file_opened_date          date,
  assigned_lawyer_date      date,
  dlpp_lawyer_id            text,   -- DLPP lawyer in carriage (display name)
  dlpp_lawyer_user_id       uuid,   -- linked system user (for notifications)
  solicitor_general_lawyer  text,
  claimant_lawyers          text,
  claimant_name             text,
  claimant_type             text,   -- Individual / Incorporated Land Group / Company / Government / Clan / Community
  ilg_name                  text,
  ilg_registration_number   text,
  land_description          text,
  land_file_reference       text,
  title_file_reference      text,
  survey_reference          text,
  province                  text,
  district                  text,
  llg                       text,
  ward                      text,
  legal_issue               text,
  notice_summary            text,
  current_status            text NOT NULL DEFAULT 'Received',
  remarks                   text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  created_by                uuid,
  updated_by                uuid
);

-- 2. Disable RLS so the app (anon/authenticated key) can read/write it exactly
--    like it does the cases table (this project runs with RLS disabled for demo).
ALTER TABLE public.section5_notices DISABLE ROW LEVEL SECURITY;

-- 3. Keep updated_at fresh --------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_section5_notices_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_section5_notices_updated_at ON public.section5_notices;
CREATE TRIGGER trg_section5_notices_updated_at
  BEFORE UPDATE ON public.section5_notices
  FOR EACH ROW EXECUTE FUNCTION public.set_section5_notices_updated_at();

-- 4. Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_s5_case_id        ON public.section5_notices(case_id);
CREATE INDEX IF NOT EXISTS idx_s5_status         ON public.section5_notices(current_status);
CREATE INDEX IF NOT EXISTS idx_s5_notice_no      ON public.section5_notices(notice_number);
CREATE INDEX IF NOT EXISTS idx_s5_claimant       ON public.section5_notices(claimant_name);
CREATE INDEX IF NOT EXISTS idx_s5_ilg_reg        ON public.section5_notices(ilg_registration_number);
CREATE INDEX IF NOT EXISTS idx_s5_lawyer         ON public.section5_notices(dlpp_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_s5_lawyer_user    ON public.section5_notices(dlpp_lawyer_user_id);
CREATE INDEX IF NOT EXISTS idx_s5_province       ON public.section5_notices(province);
CREATE INDEX IF NOT EXISTS idx_s5_date_received  ON public.section5_notices(date_received);

-- 5. Link documents to a specific notice (they still show under the case via
--    case_id, so notice documents appear in the main case document list too).
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS section5_notice_id uuid REFERENCES public.section5_notices(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_section5_notice_id ON public.documents(section5_notice_id);

-- 6. Register the module (for RBAC + sidebar) -------------------------------
INSERT INTO public.modules
  (module_name, module_key, description, icon, route, display_order, is_active, category, system)
SELECT 'Section 5 Notices', 'section5_notices',
       'Registry of official Section 5 Notices received by the Department, linked to cases',
       'FileWarning', '/section5-notices', 2, true, 'legal', 'landcase'
WHERE NOT EXISTS (SELECT 1 FROM public.modules WHERE module_key = 'section5_notices');

-- 7. Grant role-based permissions -------------------------------------------
--    Admin/Manager: full.  Legal Clerk/Case Officer/Document Clerk: CRUD minus
--    delete/approve.  Viewer: read + print only.
WITH m AS (SELECT id FROM public.modules WHERE module_key = 'section5_notices')
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

-- 8. Give the read-only Auditor group oversight of the Section 5 register -----
WITH a AS (SELECT id FROM public.groups WHERE group_name = 'Auditor')
INSERT INTO public.group_module_permissions
  (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT a.id, m.id, false, true, false, false, true, false, true
FROM a, public.modules m
WHERE m.module_key = 'section5_notices'
  AND NOT EXISTS (
    SELECT 1 FROM public.group_module_permissions x
    WHERE x.group_id = a.id AND x.module_id = m.id
  );

-- Done. Reload the app and sign in again to pick up the new menu + permissions.
-- The register appears under Registry -> Section 5 Notices, and a "Section 5
-- Notices" tab appears inside each linked case.

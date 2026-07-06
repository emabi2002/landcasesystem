-- =============================================================================
-- SECTION 160(2) APPLICATION REGISTER MODULE - Database migration
-- Run this ONCE in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- It is idempotent: safe to run more than once.
--
-- Section 160(2) Applications relate to matters under the Land Registration Act
-- 1981 — title disputes, Registrar of Titles matters, summons, fraud, consent
-- issues, title rectification and court-related land registration matters.
-- It is a legal REGISTRY entry and may create or link to a legal case.
-- =============================================================================

-- 1. Main table -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.section_160_applications (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_year               text,
  date_received                  date,
  date_assigned_to_legal_officer date,
  dlpp_lawyer_in_carriage        text,   -- display name
  dlpp_lawyer_user_id            uuid,   -- linked system user (for notifications)
  solicitor_general_lawyer       text,
  private_law_firm               text,
  defendants_lawyer              text,
  applicant_registrar_of_titles  text,
  defendant                      text,
  land_description               text,
  title_file_reference           text,
  letter_of_summons_date         date,
  summons_date                   date,
  consignment_note               text,
  grounds_for_application        text,
  court_file_reference_no        text,
  status_of_matter               text NOT NULL DEFAULT 'Received',
  comments_remarks               text,
  case_id                        uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now(),
  created_by                     uuid,
  updated_by                     uuid
);

-- 2. Disable RLS so the app (anon/authenticated key) can read/write it exactly
--    like it does the cases table (this project runs with RLS disabled for demo).
ALTER TABLE public.section_160_applications DISABLE ROW LEVEL SECURITY;

-- 3. Keep updated_at fresh --------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_section_160_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_section_160_updated_at ON public.section_160_applications;
CREATE TRIGGER trg_section_160_updated_at
  BEFORE UPDATE ON public.section_160_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_section_160_updated_at();

-- 4. Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_s160_case_id       ON public.section_160_applications(case_id);
CREATE INDEX IF NOT EXISTS idx_s160_status        ON public.section_160_applications(status_of_matter);
CREATE INDEX IF NOT EXISTS idx_s160_year          ON public.section_160_applications(application_year);
CREATE INDEX IF NOT EXISTS idx_s160_defendant     ON public.section_160_applications(defendant);
CREATE INDEX IF NOT EXISTS idx_s160_title_ref     ON public.section_160_applications(title_file_reference);
CREATE INDEX IF NOT EXISTS idx_s160_court_ref     ON public.section_160_applications(court_file_reference_no);
CREATE INDEX IF NOT EXISTS idx_s160_lawyer        ON public.section_160_applications(dlpp_lawyer_in_carriage);
CREATE INDEX IF NOT EXISTS idx_s160_lawyer_user   ON public.section_160_applications(dlpp_lawyer_user_id);
CREATE INDEX IF NOT EXISTS idx_s160_date_received ON public.section_160_applications(date_received);

-- 5. Link documents to a specific application (they still show under the case
--    via case_id, so application documents appear in the case document list).
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS section_160_application_id uuid
    REFERENCES public.section_160_applications(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_section_160_application_id
  ON public.documents(section_160_application_id);

-- 6. Register the module (for RBAC + sidebar) -------------------------------
INSERT INTO public.modules
  (module_name, module_key, description, icon, route, display_order, is_active, category, system)
SELECT 'Section 160(2) Applications', 'section_160',
       'Register of Section 160(2) applications under the Land Registration Act 1981, linked to cases',
       'Landmark', '/section-160', 4, true, 'legal', 'landcase'
WHERE NOT EXISTS (SELECT 1 FROM public.modules WHERE module_key = 'section_160');

-- 7. Grant role-based permissions -------------------------------------------
WITH m AS (SELECT id FROM public.modules WHERE module_key = 'section_160')
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

-- 8. Read-only Auditor oversight --------------------------------------------
WITH a AS (SELECT id FROM public.groups WHERE group_name = 'Auditor')
INSERT INTO public.group_module_permissions
  (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT a.id, m.id, false, true, false, false, true, false, true
FROM a, public.modules m
WHERE m.module_key = 'section_160'
  AND NOT EXISTS (
    SELECT 1 FROM public.group_module_permissions x
    WHERE x.group_id = a.id AND x.module_id = m.id
  );

-- Done. Reload the app and sign in again to pick up the new menu + permissions.
-- The register appears under Registry -> Section 160(2) Applications, and a
-- "Section 160(2) Applications" tab appears inside each linked case.

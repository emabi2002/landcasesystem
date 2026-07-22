-- ===============================================
-- Setup Case Officer Group - Full Permissions
-- ===============================================
-- ⚠️  OPTIONAL SCRIPT - UI METHOD RECOMMENDED!
--
-- This is an OPTIONAL automated setup script.
-- You can do everything through the UI instead:
--
-- UI Method (Recommended):
--   1. Login → Administration → Groups
--   2. Find/Create "Case Officer" group
--   3. Click "Manage Permissions"
--   4. Check/uncheck boxes for each module
--   5. Click "Save"
--
-- See: ADMIN_UI_PERMISSION_GUIDE.md for step-by-step instructions
--
-- Only run this SQL if you prefer automated setup.
-- ===============================================
--
-- This script ensures Case Officers can see and use:
-- ✅ Case Workflow menu (Register, Assignments, My Cases, All Cases, Directions, Compliance, Notifications)
-- ✅ Case Management menu (Calendar, Tasks, Documents, Land Parcels)
-- ❌ Dashboard Overview (hidden)
-- ❌ Administration menu (hidden)

-- Step 1: Ensure all required modules exist
INSERT INTO public.modules (module_key, module_name, description, category) VALUES
  ('cases', 'Cases', 'Case management and registration', 'Case Management'),
  ('allocation', 'Case Allocation', 'Case assignment and distribution', 'Case Management'),
  ('directions', 'Directions & Hearings', 'Court directions and hearings', 'Case Management'),
  ('compliance', 'Compliance Tracking', 'Compliance monitoring', 'Case Management'),
  ('notifications', 'Notifications', 'System notifications', 'Communications'),
  ('calendar', 'Calendar', 'Calendar and events', 'Case Management'),
  ('tasks', 'Tasks', 'Task management', 'Case Management'),
  ('documents', 'Documents', 'Document management', 'Documents'),
  ('land_parcels', 'Land Parcels', 'Land parcel information', 'Property & Land'),
  ('dashboard', 'Dashboard Overview', 'Dashboard overview with statistics', 'Reporting')
ON CONFLICT (module_key) DO UPDATE SET
  module_name = EXCLUDED.module_name,
  description = EXCLUDED.description;

-- Step 2: Ensure Case Officer group exists
INSERT INTO public.groups (group_name, description) VALUES
  ('Case Officer', 'Case officers who manage cases from registration through closure')
ON CONFLICT (group_name) DO UPDATE SET
  description = EXCLUDED.description;

-- Step 3: Configure Case Officer permissions
DO $$
DECLARE
  case_officer_group_id UUID;
  module_record RECORD;
BEGIN
  -- Get Case Officer group
  SELECT id INTO case_officer_group_id
  FROM public.groups
  WHERE group_name = 'Case Officer';

  IF case_officer_group_id IS NULL THEN
    RAISE EXCEPTION 'Case Officer group not found!';
  END IF;

  -- Grant permissions for each module
  FOR module_record IN
    SELECT id, module_key FROM public.modules
  LOOP
    -- Determine permissions based on module
    CASE module_record.module_key

      -- FULL ACCESS - Case Workflow Modules
      WHEN 'cases' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, true,  -- Full CRUD
          true, false, true         -- Can print & export, no approve
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = true,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Cases: FULL ACCESS ✓';

      WHEN 'allocation' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, false,  -- Create, Read, Update
          true, false, true
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = false,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Allocation: FULL ACCESS ✓';

      WHEN 'directions' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, true,
          true, false, true
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = true,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Directions: FULL ACCESS ✓';

      WHEN 'compliance' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, true,
          true, false, true
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = true,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Compliance: FULL ACCESS ✓';

      WHEN 'notifications' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          false, true, true, false,  -- Read and Update only
          false, false, false
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = false, can_read = true, can_update = true, can_delete = false,
          can_print = false, can_approve = false, can_export = false;
        RAISE NOTICE 'Notifications: READ/UPDATE ✓';

      -- FULL ACCESS - Case Management Modules
      WHEN 'calendar' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, true,
          true, false, true
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = true,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Calendar: FULL ACCESS ✓';

      WHEN 'tasks' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, true,
          true, false, true
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = true,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Tasks: FULL ACCESS ✓';

      WHEN 'documents' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, true,
          true, false, true
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = true,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Documents: FULL ACCESS ✓';

      WHEN 'land_parcels' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          true, true, true, true,
          true, false, true
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = true, can_read = true, can_update = true, can_delete = true,
          can_print = true, can_approve = false, can_export = true;
        RAISE NOTICE 'Land Parcels: FULL ACCESS ✓';

      -- NO ACCESS - Dashboard and Admin
      WHEN 'dashboard' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          false, false, false, false,  -- NO ACCESS
          false, false, false
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = false, can_read = false, can_update = false, can_delete = false,
          can_print = false, can_approve = false, can_export = false;
        RAISE NOTICE 'Dashboard: NO ACCESS (hidden) ✓';

      -- NO ACCESS - Admin modules
      WHEN 'admin', 'users', 'groups', 'modules', 'master_files', 'internal_officers' THEN
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          false, false, false, false,  -- NO ACCESS
          false, false, false
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_create = false, can_read = false, can_update = false, can_delete = false,
          can_print = false, can_approve = false, can_export = false;
        RAISE NOTICE 'Admin module (%) : NO ACCESS (hidden) ✓', module_record.module_key;

      ELSE
        -- For any other modules, grant read access by default
        INSERT INTO public.group_module_permissions (
          group_id, module_id,
          can_create, can_read, can_update, can_delete,
          can_print, can_approve, can_export
        ) VALUES (
          case_officer_group_id, module_record.id,
          false, true, false, false,
          false, false, false
        )
        ON CONFLICT (group_id, module_id) DO UPDATE SET
          can_read = true;
        RAISE NOTICE 'Module (%): READ ONLY', module_record.module_key;
    END CASE;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Case Officer permissions configured! ✓';
  RAISE NOTICE '========================================';
END $$;

-- Step 4: Verification - Show what Case Officers can see
SELECT
  g.group_name,
  m.module_name,
  m.module_key,
  gmp.can_read AS "Visible?",
  gmp.can_create AS "Create",
  gmp.can_update AS "Update",
  gmp.can_delete AS "Delete",
  gmp.can_print AS "Print",
  gmp.can_export AS "Export"
FROM public.group_module_permissions gmp
JOIN public.groups g ON gmp.group_id = g.id
JOIN public.modules m ON gmp.module_id = m.id
WHERE g.group_name = 'Case Officer'
  AND m.module_key IN (
    'cases', 'allocation', 'directions', 'compliance', 'notifications',
    'calendar', 'tasks', 'documents', 'land_parcels', 'dashboard'
  )
ORDER BY
  CASE m.module_key
    WHEN 'cases' THEN 1
    WHEN 'allocation' THEN 2
    WHEN 'directions' THEN 3
    WHEN 'compliance' THEN 4
    WHEN 'notifications' THEN 5
    WHEN 'calendar' THEN 6
    WHEN 'tasks' THEN 7
    WHEN 'documents' THEN 8
    WHEN 'land_parcels' THEN 9
    WHEN 'dashboard' THEN 10
    ELSE 99
  END;

-- Expected Results:
-- =========================================================================
-- | Module Name              | Visible? | Create | Update | Delete | Print | Export |
-- =========================================================================
-- | Cases                    | true     | true   | true   | true   | true  | true   |
-- | Case Allocation          | true     | true   | true   | false  | true  | true   |
-- | Directions & Hearings    | true     | true   | true   | true   | true  | true   |
-- | Compliance Tracking      | true     | true   | true   | true   | true  | true   |
-- | Notifications            | true     | false  | true   | false  | false | false  |
-- | Calendar                 | true     | true   | true   | true   | true  | true   |
-- | Tasks                    | true     | true   | true   | true   | true  | true   |
-- | Documents                | true     | true   | true   | true   | true  | true   |
-- | Land Parcels             | true     | true   | true   | true   | true  | true   |
-- | Dashboard Overview       | FALSE    | false  | false  | false  | false | false  |
-- =========================================================================

-- What Case Officers will see in sidebar:
-- ✅ Case Workflow (7 items)
-- ✅ Case Management (4 items)
-- ❌ Dashboard Overview (hidden)
-- ❌ Administration (hidden)

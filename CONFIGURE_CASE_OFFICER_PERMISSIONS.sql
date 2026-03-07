-- ===============================================
-- Configure Case Officer Group Permissions
-- ===============================================
-- This script ensures Case Officers:
-- ✅ Can access case management features
-- ❌ Cannot see Dashboard Overview
-- ❌ Cannot access admin features

-- Step 1: Ensure Dashboard module exists
INSERT INTO public.modules (module_key, module_name, description)
VALUES ('dashboard', 'Dashboard Overview', 'Dashboard overview with statistics and charts')
ON CONFLICT (module_key) DO NOTHING;

-- Step 2: Find Case Officer group ID
DO $$
DECLARE
  case_officer_group_id UUID;
  dashboard_module_id UUID;
BEGIN
  -- Get Case Officer group
  SELECT id INTO case_officer_group_id
  FROM public.groups
  WHERE group_name = 'Case Officer';

  -- Get Dashboard module
  SELECT id INTO dashboard_module_id
  FROM public.modules
  WHERE module_key = 'dashboard';

  -- If Case Officer group exists, configure permissions
  IF case_officer_group_id IS NOT NULL AND dashboard_module_id IS NOT NULL THEN

    -- Remove dashboard access from Case Officer
    INSERT INTO public.group_module_permissions (
      group_id,
      module_id,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_print,
      can_approve,
      can_export
    )
    VALUES (
      case_officer_group_id,
      dashboard_module_id,
      false, -- can_create
      false, -- can_read ← Case Officers cannot see dashboard
      false, -- can_update
      false, -- can_delete
      false, -- can_print
      false, -- can_approve
      false  -- can_export
    )
    ON CONFLICT (group_id, module_id)
    DO UPDATE SET
      can_read = false,  -- Ensure it's false even if exists
      can_create = false,
      can_update = false,
      can_delete = false;

    RAISE NOTICE 'Case Officer group dashboard access: DISABLED ✓';
  ELSE
    RAISE NOTICE 'Case Officer group or Dashboard module not found. Please create them first.';
  END IF;
END $$;

-- Step 3: Grant dashboard access to Super Admin
DO $$
DECLARE
  super_admin_group_id UUID;
  dashboard_module_id UUID;
BEGIN
  -- Get Super Admin group
  SELECT id INTO super_admin_group_id
  FROM public.groups
  WHERE group_name = 'Super Admin';

  -- Get Dashboard module
  SELECT id INTO dashboard_module_id
  FROM public.modules
  WHERE module_key = 'dashboard';

  -- If Super Admin group exists, grant full access
  IF super_admin_group_id IS NOT NULL AND dashboard_module_id IS NOT NULL THEN

    INSERT INTO public.group_module_permissions (
      group_id,
      module_id,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_print,
      can_approve,
      can_export
    )
    VALUES (
      super_admin_group_id,
      dashboard_module_id,
      true, -- can_create
      true, -- can_read ← Super Admins CAN see dashboard
      true, -- can_update
      true, -- can_delete
      true, -- can_print
      true, -- can_approve
      true  -- can_export
    )
    ON CONFLICT (group_id, module_id)
    DO UPDATE SET
      can_read = true,   -- Ensure it's true
      can_create = true,
      can_update = true,
      can_delete = true,
      can_print = true,
      can_approve = true,
      can_export = true;

    RAISE NOTICE 'Super Admin group dashboard access: ENABLED ✓';
  END IF;
END $$;

-- Step 4: Grant dashboard access to Manager group
DO $$
DECLARE
  manager_group_id UUID;
  dashboard_module_id UUID;
BEGIN
  -- Get Manager group
  SELECT id INTO manager_group_id
  FROM public.groups
  WHERE group_name = 'Manager';

  -- Get Dashboard module
  SELECT id INTO dashboard_module_id
  FROM public.modules
  WHERE module_key = 'dashboard';

  -- If Manager group exists, grant full access
  IF manager_group_id IS NOT NULL AND dashboard_module_id IS NOT NULL THEN

    INSERT INTO public.group_module_permissions (
      group_id,
      module_id,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_print,
      can_approve,
      can_export
    )
    VALUES (
      manager_group_id,
      dashboard_module_id,
      true, -- can_create
      true, -- can_read ← Managers CAN see dashboard
      true, -- can_update
      true, -- can_delete
      true, -- can_print
      true, -- can_approve
      true  -- can_export
    )
    ON CONFLICT (group_id, module_id)
    DO UPDATE SET
      can_read = true,
      can_create = true,
      can_update = true,
      can_delete = true,
      can_print = true,
      can_approve = true,
      can_export = true;

    RAISE NOTICE 'Manager group dashboard access: ENABLED ✓';
  END IF;
END $$;

-- Step 5: Verification query
SELECT
  g.group_name,
  m.module_name,
  gmp.can_read AS "Can See Dashboard?"
FROM public.group_module_permissions gmp
JOIN public.groups g ON gmp.group_id = g.id
JOIN public.modules m ON gmp.module_id = m.id
WHERE m.module_key = 'dashboard'
ORDER BY g.group_name;

-- Expected Results:
-- ================================
-- | Group Name   | Module Name          | Can See Dashboard? |
-- ================================
-- | Case Officer | Dashboard Overview   | false              |
-- | Manager      | Dashboard Overview   | true               |
-- | Super Admin  | Dashboard Overview   | true               |
-- ================================

-- ============================================
-- MAKE admin@land.gov.pg A SUPER ADMINISTRATOR
-- ============================================
-- This grants full access to see and manage everything
-- Run this in Supabase SQL Editor
-- ============================================

DO $$
DECLARE
  admin_user_id UUID;
  super_admin_group_id UUID;
  existing_assignment UUID;
BEGIN
  -- Step 1: Get the user ID for admin@land.gov.pg
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@land.gov.pg';

  IF admin_user_id IS NULL THEN
    RAISE NOTICE '❌ User admin@land.gov.pg NOT FOUND in auth.users';
    RAISE NOTICE '⚠️  Please create this user first in Supabase Authentication';
    RAISE EXCEPTION 'User not found. Create the user first.';
  ELSE
    RAISE NOTICE '✅ Found user: admin@land.gov.pg (ID: %)', admin_user_id;
  END IF;

  -- Step 2: Get Super Admin group ID
  SELECT id INTO super_admin_group_id
  FROM public.groups
  WHERE group_name = 'Super Admin';

  IF super_admin_group_id IS NULL THEN
    RAISE NOTICE '❌ Super Admin group NOT FOUND';
    RAISE EXCEPTION 'Super Admin group missing. Run RBAC schema first.';
  ELSE
    RAISE NOTICE '✅ Found Super Admin group (ID: %)', super_admin_group_id;
  END IF;

  -- Step 3: Check if already assigned
  SELECT id INTO existing_assignment
  FROM public.user_groups
  WHERE user_id = admin_user_id
    AND group_id = super_admin_group_id;

  IF existing_assignment IS NOT NULL THEN
    RAISE NOTICE '✅ User is ALREADY assigned to Super Admin group';
  ELSE
    -- Step 4: Assign user to Super Admin group
    INSERT INTO public.user_groups (user_id, group_id, assigned_by)
    VALUES (admin_user_id, super_admin_group_id, admin_user_id);

    RAISE NOTICE '✅ Successfully assigned admin@land.gov.pg to Super Admin group';
  END IF;

  -- Step 5: Verify assignment
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'User: admin@land.gov.pg';
  RAISE NOTICE 'Group: Super Admin';
  RAISE NOTICE 'Scope: ALL (can see all cases)';
  RAISE NOTICE 'Permissions: Full access to everything';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Login as admin@land.gov.pg';
  RAISE NOTICE '2. Navigate to /cases - should see ALL cases';
  RAISE NOTICE '3. Access /admin/users to manage other users';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error occurred: %', SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE 'Troubleshooting:';
    RAISE NOTICE '1. Ensure user admin@land.gov.pg exists in Supabase Auth';
    RAISE NOTICE '2. Ensure RBAC tables exist (run RBAC_PHASE_B_ENHANCED_SCHEMA.sql first)';
    RAISE;
END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to confirm the assignment worked:

SELECT
  u.email,
  g.group_name,
  ug.assigned_at,
  'User has Super Admin access' as status
FROM auth.users u
JOIN public.user_groups ug ON ug.user_id = u.id
JOIN public.groups g ON g.id = ug.group_id
WHERE u.email = 'admin@land.gov.pg';

-- ============================================
-- CHECK USER'S EFFECTIVE PERMISSIONS
-- ============================================
-- This shows what the admin can do:

SELECT
  g.group_name,
  m.module_name,
  gmp.can_create,
  gmp.can_read,
  gmp.can_update,
  gmp.can_delete,
  gmp.can_print,
  gmp.can_approve,
  gmp.can_export,
  gmp.can_allocate,
  gmp.can_recommend,
  gmp.can_directive,
  gmp.can_close_case,
  gmp.can_reassign
FROM public.user_groups ug
JOIN public.groups g ON g.id = ug.group_id
JOIN public.group_module_permissions gmp ON gmp.group_id = g.id
JOIN public.modules m ON m.id = gmp.module_id
JOIN auth.users u ON u.id = ug.user_id
WHERE u.email = 'admin@land.gov.pg'
  AND m.module_key = 'case_management';

-- ============================================
-- CHECK USER'S DATA SCOPE
-- ============================================
-- This shows which cases the admin can see:

SELECT
  g.group_name,
  m.module_name,
  ds.code as scope,
  ds.name as scope_description
FROM public.user_groups ug
JOIN public.groups g ON g.id = ug.group_id
JOIN public.group_scope_rules gsr ON gsr.group_id = g.id
JOIN public.modules m ON m.id = gsr.module_id
JOIN public.data_scopes ds ON ds.id = gsr.scope_id
JOIN auth.users u ON u.id = ug.user_id
WHERE u.email = 'admin@land.gov.pg'
  AND m.module_key = 'case_management'
  AND gsr.allow = TRUE;

-- Expected: scope = 'ALL' (can see all cases)

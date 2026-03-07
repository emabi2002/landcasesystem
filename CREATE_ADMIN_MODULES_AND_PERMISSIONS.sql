-- ============================================================================
-- CREATE ADMIN MODULES AND GRANT SUPER ADMIN ACCESS
-- ============================================================================
-- This script:
-- 1. Creates missing admin modules (groups, users, modules, admin)
-- 2. Grants Super Admin full access to these modules
-- ============================================================================
-- STEP 1: Create admin modules if they don't exist
-- ============================================================================
INSERT INTO public.modules (module_key, module_name, description, icon, route)
VALUES
    ('groups', 'Groups Management', 'Manage user groups and roles', 'Users', '/admin/groups'),
    ('users', 'User Management', 'Manage system users', 'UserCog', '/admin/users'),
    ('modules', 'Modules Management', 'Manage system modules', 'Package', '/admin/modules'),
    ('admin', 'Admin Panel', 'System administration', 'Settings', '/admin'),
    ('master_files', 'Master Files', 'Manage master data files', 'Database', '/admin/master-files'),
    ('internal_officers', 'Internal Officers', 'Manage internal officers', 'UserCheck', '/admin/internal-officers')
ON CONFLICT (module_key) DO UPDATE SET
    module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    route = EXCLUDED.route;
-- Verify modules were created
SELECT module_key, module_name FROM public.modules
WHERE module_key IN ('groups', 'users', 'modules', 'admin', 'master_files', 'internal_officers')
ORDER BY module_name;
-- STEP 2: Grant Super Admin full access to all admin modules
-- ============================================================================
DO $$
DECLARE
    v_super_admin_id UUID;
    v_module RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Granting Super Admin full admin access';
    RAISE NOTICE '========================================';
    -- Get Super Admin group ID
    SELECT id INTO v_super_admin_id
    FROM public.groups
    WHERE group_name = 'Super Admin';
    IF v_super_admin_id IS NULL THEN
        RAISE NOTICE '❌ Super Admin group not found!';
        RETURN;
    END IF;
    RAISE NOTICE '✅ Super Admin group found';
    RAISE NOTICE '';
    -- Grant full access to all admin modules
    FOR v_module IN
        SELECT id, module_key, module_name
        FROM public.modules
        WHERE module_key IN ('groups', 'users', 'modules', 'admin', 'master_files', 'internal_officers')
    LOOP
        INSERT INTO public.group_module_permissions
            (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES
            (v_super_admin_id, v_module.id, true, true, true, true, true, true, true)
        ON CONFLICT (group_id, module_id)
        DO UPDATE SET
            can_read = true,
            can_create = true,
            can_update = true,
            can_delete = true,
            can_print = true,
            can_approve = true,
            can_export = true,
            updated_at = NOW();
        RAISE NOTICE '✅ % (%)', v_module.module_name, v_module.module_key;
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Super Admin now has full access to all admin modules!';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Log out and back in to see the Administration menu items.';
END $$;
-- STEP 3: Verify Super Admin permissions
-- ============================================================================
SELECT
    m.module_name,
    m.module_key,
    gmp.can_read,
    gmp.can_create,
    gmp.can_update,
    gmp.can_delete
FROM public.groups g
JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
JOIN public.modules m ON gmp.module_id = m.id
WHERE g.group_name = 'Super Admin'
  AND m.module_key IN ('admin', 'users', 'groups', 'modules', 'master_files', 'internal_officers')
ORDER BY m.module_name;
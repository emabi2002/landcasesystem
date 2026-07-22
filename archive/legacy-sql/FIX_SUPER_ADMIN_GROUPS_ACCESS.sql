-- ============================================================================
-- FIX: Give Super Admin Access to Groups Management
-- ============================================================================
-- This ensures Super Admin can see and access the Groups menu in Administration
-- ============================================================================

DO $$
DECLARE
    v_super_admin_id UUID;
    v_groups_module_id UUID;
    v_users_module_id UUID;
    v_modules_module_id UUID;
    v_admin_module_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ensuring Super Admin has full admin access';
    RAISE NOTICE '========================================';

    -- Get Super Admin group ID
    SELECT id INTO v_super_admin_id
    FROM public.groups
    WHERE group_name = 'Super Admin';

    IF v_super_admin_id IS NULL THEN
        RAISE NOTICE '❌ Super Admin group not found!';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Super Admin group found: %', v_super_admin_id;

    -- Get module IDs
    SELECT id INTO v_groups_module_id FROM public.modules WHERE module_key = 'groups';
    SELECT id INTO v_users_module_id FROM public.modules WHERE module_key = 'users';
    SELECT id INTO v_modules_module_id FROM public.modules WHERE module_key = 'modules';
    SELECT id INTO v_admin_module_id FROM public.modules WHERE module_key = 'admin';

    -- Add or update Groups module permission
    IF v_groups_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions
            (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES
            (v_super_admin_id, v_groups_module_id, true, true, true, true, true, true, true)
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

        RAISE NOTICE '✅ Groups module permission granted';
    END IF;

    -- Add or update Users module permission
    IF v_users_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions
            (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES
            (v_super_admin_id, v_users_module_id, true, true, true, true, true, true, true)
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

        RAISE NOTICE '✅ Users module permission granted';
    END IF;

    -- Add or update Modules module permission
    IF v_modules_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions
            (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES
            (v_super_admin_id, v_modules_module_id, true, true, true, true, true, true, true)
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

        RAISE NOTICE '✅ Modules module permission granted';
    END IF;

    -- Add or update Admin module permission
    IF v_admin_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions
            (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES
            (v_super_admin_id, v_admin_module_id, true, true, true, true, true, true, true)
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

        RAISE NOTICE '✅ Admin module permission granted';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Super Admin now has full access to all admin modules!';
    RAISE NOTICE '';
    RAISE NOTICE 'Log out and back in to see the Groups menu item.';

END $$;

-- Verify Super Admin permissions
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
  AND m.module_key IN ('admin', 'users', 'groups', 'modules')
ORDER BY m.module_name;

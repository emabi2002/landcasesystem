-- ============================================================================
-- FIX MODULE_ID NULL CONSTRAINT VIOLATION - COMPLETE SOLUTION
-- ============================================================================
-- This script fixes the error:
-- "null value in column "module_id" of relation "group_module_permissions"
--  violates not-null constraint"
--
-- The issue: Trying to create permissions for modules that don't exist yet
-- The solution: Create all modules first, then create permissions
-- ============================================================================
-- STEP 1: Display current state
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC: Current System State';
    RAISE NOTICE '========================================';
END $$;
-- Show existing modules
SELECT 'EXISTING MODULES:' as info;
SELECT module_key, module_name, id
FROM public.modules
ORDER BY module_name;
-- Show existing groups
SELECT '' as separator;
SELECT 'EXISTING GROUPS:' as info;
SELECT group_name, id
FROM public.groups
ORDER BY group_name;
-- STEP 2: Create ALL necessary modules (if they don't exist)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 1: Creating All Necessary Modules';
    RAISE NOTICE '========================================';
END $$;
-- Create admin modules
INSERT INTO public.modules (module_key, module_name, description, icon, route, category)
VALUES
    ('admin', 'Admin Panel', 'System administration and settings', 'Settings', '/admin', 'administration'),
    ('users', 'User Management', 'Manage system users and accounts', 'UserCog', '/admin/users', 'administration'),
    ('groups', 'Groups Management', 'Manage user groups and roles', 'Users', '/admin/groups', 'administration'),
    ('modules', 'Modules Management', 'Manage system modules and features', 'Package', '/admin/modules', 'administration'),
    ('master_files', 'Master Files', 'Manage master data files', 'Database', '/admin/master-files', 'administration'),
    ('internal_officers', 'Internal Officers', 'Manage internal officers', 'UserCheck', '/admin/internal-officers', 'administration')
ON CONFLICT (module_key)
DO UPDATE SET
    module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    route = EXCLUDED.route,
    category = EXCLUDED.category;
-- Create all other core modules if missing
INSERT INTO public.modules (module_key, module_name, description, icon, route, category)
VALUES
    ('dashboard', 'Dashboard', 'Overview and statistics', 'LayoutDashboard', '/dashboard', 'case_management'),
    ('cases', 'Cases', 'Case management', 'FolderOpen', '/cases', 'case_management'),
    ('allocation', 'Allocation', 'Case assignments and allocations', 'UserCheck', '/cases/assignments', 'case_management'),
    ('directions', 'Directions & Hearings', 'Manage directions and hearings', 'ClipboardList', '/directions', 'legal'),
    ('compliance', 'Compliance', 'Compliance tracking', 'CheckSquare', '/compliance', 'legal'),
    ('notifications', 'Notifications', 'System notifications', 'Bell', '/notifications', 'communications'),
    ('calendar', 'Calendar', 'Events and scheduling', 'Calendar', '/calendar', 'case_management'),
    ('tasks', 'Tasks', 'Task management', 'ListTodo', '/tasks', 'case_management'),
    ('documents', 'Documents', 'Document management', 'FileText', '/documents', 'documents'),
    ('land_parcels', 'Land Parcels', 'Land parcel information', 'MapPin', '/land-parcels', 'property'),
    ('correspondence', 'Correspondence', 'Correspondence management', 'Mail', '/correspondence', 'communications'),
    ('communications', 'Communications', 'Communications log', 'MessageSquare', '/communications', 'communications'),
    ('file_requests', 'File Requests', 'File request tracking', 'FileSearch', '/file-requests', 'documents'),
    ('lawyers', 'Lawyers', 'Lawyer management', 'Users', '/lawyers', 'legal'),
    ('filings', 'Court Filings', 'Court filing management', 'FileText', '/filings', 'legal'),
    ('litigation_costs', 'Litigation Costs', 'Litigation cost tracking', 'DollarSign', '/litigation-costs', 'finance'),
    ('reports', 'Reports', 'Reporting and analytics', 'BarChart3', '/reports', 'reporting')
ON CONFLICT (module_key)
DO UPDATE SET
    module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category;
-- Verify modules were created
SELECT '' as separator;
SELECT '✅ Modules Created/Updated:' as status;
SELECT module_key, module_name, category
FROM public.modules
WHERE module_key IN ('admin', 'users', 'groups', 'modules', 'master_files', 'internal_officers')
ORDER BY module_name;
-- STEP 3: Ensure Super Admin group exists
-- ============================================================================
DO $$
DECLARE
    v_super_admin_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 2: Ensuring Super Admin Group Exists';
    RAISE NOTICE '========================================';
    -- Check if Super Admin group exists
    SELECT id INTO v_super_admin_id FROM public.groups WHERE group_name = 'Super Admin';
    IF v_super_admin_id IS NULL THEN
        -- Create Super Admin group
        INSERT INTO public.groups (group_name, description)
        VALUES ('Super Admin', 'Full system access including user management, configuration, and all modules. Intended for system administrators and IT staff.')
        RETURNING id INTO v_super_admin_id;
        RAISE NOTICE '✅ Created Super Admin group: %', v_super_admin_id;
    ELSE
        RAISE NOTICE '✅ Super Admin group already exists: %', v_super_admin_id;
    END IF;
END $$;
-- STEP 4: Grant Super Admin FULL access to ALL modules
-- ============================================================================
DO $$
DECLARE
    v_super_admin_id UUID;
    v_module RECORD;
    v_inserted INTEGER := 0;
    v_updated INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 3: Granting Super Admin Full Access';
    RAISE NOTICE '========================================';
    -- Get Super Admin group ID
    SELECT id INTO v_super_admin_id FROM public.groups WHERE group_name = 'Super Admin';
    IF v_super_admin_id IS NULL THEN
        RAISE EXCEPTION 'Super Admin group not found!';
    END IF;
    RAISE NOTICE 'Super Admin Group ID: %', v_super_admin_id;
    RAISE NOTICE '';
    -- Grant full access to ALL modules
    FOR v_module IN
        SELECT id, module_key, module_name
        FROM public.modules
        ORDER BY module_name
    LOOP
        -- Check if permission already exists
        IF EXISTS (
            SELECT 1 FROM public.group_module_permissions
            WHERE group_id = v_super_admin_id
            AND module_id = v_module.id
        ) THEN
            -- Update existing permission
            UPDATE public.group_module_permissions
            SET
                can_read = true,
                can_create = true,
                can_update = true,
                can_delete = true,
                can_print = true,
                can_approve = true,
                can_export = true,
                updated_at = NOW()
            WHERE group_id = v_super_admin_id
            AND module_id = v_module.id;
            v_updated := v_updated + 1;
            RAISE NOTICE '✏️  Updated: % (%)', v_module.module_name, v_module.module_key;
        ELSE
            -- Insert new permission
            INSERT INTO public.group_module_permissions
                (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
            VALUES
                (v_super_admin_id, v_module.id, true, true, true, true, true, true, true);
            v_inserted := v_inserted + 1;
            RAISE NOTICE '✅ Created: % (%)', v_module.module_name, v_module.module_key;
        END IF;
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   - Permissions Created: %', v_inserted;
    RAISE NOTICE '   - Permissions Updated: %', v_updated;
    RAISE NOTICE '   - Total Modules: %', v_inserted + v_updated;
END $$;
-- STEP 5: Verify Super Admin has all permissions
-- ============================================================================
SELECT '' as separator;
SELECT '✅ VERIFICATION: Super Admin Permissions' as status;
SELECT
    m.module_name,
    m.module_key,
    m.category,
    gmp.can_read,
    gmp.can_create,
    gmp.can_update,
    gmp.can_delete,
    gmp.can_approve
FROM public.groups g
JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
JOIN public.modules m ON gmp.module_id = m.id
WHERE g.group_name = 'Super Admin'
ORDER BY m.category, m.module_name;
-- STEP 6: Count total permissions
-- ============================================================================
SELECT '' as separator;
SELECT '📊 FINAL COUNT:' as status;
SELECT
    g.group_name,
    COUNT(gmp.id) as total_modules,
    COUNT(CASE WHEN gmp.can_read THEN 1 END) as can_read,
    COUNT(CASE WHEN gmp.can_create THEN 1 END) as can_create,
    COUNT(CASE WHEN gmp.can_update THEN 1 END) as can_update,
    COUNT(CASE WHEN gmp.can_delete THEN 1 END) as can_delete,
    COUNT(CASE WHEN gmp.can_approve THEN 1 END) as can_approve
FROM public.groups g
LEFT JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
WHERE g.group_name = 'Super Admin'
GROUP BY g.group_name;
-- STEP 7: Final instructions
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What to do next:';
    RAISE NOTICE '1. Log out of the application';
    RAISE NOTICE '2. Clear browser cache (Ctrl + Shift + Delete)';
    RAISE NOTICE '3. Log back in as Super Admin';
    RAISE NOTICE '4. You should now see ALL menu items including:';
    RAISE NOTICE '   - Administration → User Management';
    RAISE NOTICE '   - Administration → Groups';
    RAISE NOTICE '   - Administration → Modules';
    RAISE NOTICE '   - All other menus';
    RAISE NOTICE '';
    RAISE NOTICE 'If you still have issues, check the browser console (F12)';
    RAISE NOTICE 'for permission loading errors.';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
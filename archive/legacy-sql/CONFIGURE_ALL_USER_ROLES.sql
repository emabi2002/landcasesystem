-- ============================================================================
-- CONFIGURE ALL USER ROLES - COMPLETE PERMISSION SETUP
-- ============================================================================
-- This script configures permissions for all user groups in the system
-- Each role gets appropriate access based on their responsibilities
-- ============================================================================

-- ============================================================================
-- 1. CASE OFFICER (✅ Already Configured)
-- ============================================================================
-- Case Officers handle day-to-day case management
-- Access: Cases, Allocations, Directions, Calendar, Tasks, Documents, etc.
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. CASE OFFICER - Already Configured ✅';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 2. DOCUMENT CLERK
-- ============================================================================
-- Document Clerks manage documents and file requests
-- Access: Documents, File Requests, Tasks, Calendar (limited)
-- ============================================================================

DO $$
DECLARE
    v_group_id UUID;
    v_module_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '2. CONFIGURING DOCUMENT CLERK';
    RAISE NOTICE '========================================';

    SELECT id INTO v_group_id FROM public.groups WHERE group_name = 'Document Clerk';

    IF v_group_id IS NULL THEN
        RAISE NOTICE '⚠️  Document Clerk group not found - skipping';
        RETURN;
    END IF;

    -- Clear existing permissions
    DELETE FROM public.group_module_permissions WHERE group_id = v_group_id;

    -- Documents (full access)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'documents';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, true);
        RAISE NOTICE '✅ Documents';
    END IF;

    -- File Requests (full access)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'file_requests';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, true);
        RAISE NOTICE '✅ File Requests';
    END IF;

    -- Tasks (read, create, update)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'tasks';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, false);
        RAISE NOTICE '✅ Tasks';
    END IF;

    -- Calendar (read only)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'calendar';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, false, false, false, false, false);
        RAISE NOTICE '✅ Calendar';
    END IF;

    -- Notifications (read, update)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'notifications';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, true, false, false, false, false);
        RAISE NOTICE '✅ Notifications';
    END IF;

    -- Cases (read only - to view context)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'cases';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, false, false, false, false, false);
        RAISE NOTICE '✅ Cases (Read Only)';
    END IF;

    RAISE NOTICE '✅ Document Clerk configured successfully';
END $$;

-- ============================================================================
-- 3. LEGAL CLERK
-- ============================================================================
-- Legal Clerks support case processing
-- Access: Cases, Documents, Tasks, Calendar, Directions (limited)
-- ============================================================================

DO $$
DECLARE
    v_group_id UUID;
    v_module_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '3. CONFIGURING LEGAL CLERK';
    RAISE NOTICE '========================================';

    SELECT id INTO v_group_id FROM public.groups WHERE group_name = 'Legal Clerk';

    IF v_group_id IS NULL THEN
        RAISE NOTICE '⚠️  Legal Clerk group not found - skipping';
        RETURN;
    END IF;

    DELETE FROM public.group_module_permissions WHERE group_id = v_group_id;

    -- Cases (read, create, update)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'cases';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, true);
        RAISE NOTICE '✅ Cases';
    END IF;

    -- Documents (full access)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'documents';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, true);
        RAISE NOTICE '✅ Documents';
    END IF;

    -- Tasks (full access)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'tasks';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, false);
        RAISE NOTICE '✅ Tasks';
    END IF;

    -- Calendar (create, update)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'calendar';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, false);
        RAISE NOTICE '✅ Calendar';
    END IF;

    -- Directions (read, update)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'directions';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, true, false, true, false, false);
        RAISE NOTICE '✅ Directions';
    END IF;

    -- Correspondence
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'correspondence';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, true, true, false, true, false, true);
        RAISE NOTICE '✅ Correspondence';
    END IF;

    -- Notifications
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'notifications';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, true, false, false, false, false);
        RAISE NOTICE '✅ Notifications';
    END IF;

    RAISE NOTICE '✅ Legal Clerk configured successfully';
END $$;

-- ============================================================================
-- 4. MANAGER
-- ============================================================================
-- Managers have broad access but no admin functions
-- Access: Most modules with approval rights
-- ============================================================================

DO $$
DECLARE
    v_group_id UUID;
    v_module_id UUID;
    v_module RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '4. CONFIGURING MANAGER';
    RAISE NOTICE '========================================';

    SELECT id INTO v_group_id FROM public.groups WHERE group_name = 'Manager';

    IF v_group_id IS NULL THEN
        RAISE NOTICE '⚠️  Manager group not found - skipping';
        RETURN;
    END IF;

    DELETE FROM public.group_module_permissions WHERE group_id = v_group_id;

    -- Managers get access to most modules (excluding admin modules)
    FOR v_module IN
        SELECT id, module_key, module_name
        FROM public.modules
        WHERE module_key NOT IN ('admin', 'users', 'groups', 'modules', 'rbac_management')
        ORDER BY module_name
    LOOP
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module.id, true, true, true, true, true, true, true);
        RAISE NOTICE '✅ %', v_module.module_name;
    END LOOP;

    RAISE NOTICE '✅ Manager configured successfully';
END $$;

-- ============================================================================
-- 5. SUPER ADMIN
-- ============================================================================
-- Super Admins have FULL access to everything
-- Access: ALL modules including administration
-- ============================================================================

DO $$
DECLARE
    v_group_id UUID;
    v_module RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '5. CONFIGURING SUPER ADMIN';
    RAISE NOTICE '========================================';

    SELECT id INTO v_group_id FROM public.groups WHERE group_name = 'Super Admin';

    IF v_group_id IS NULL THEN
        RAISE NOTICE '⚠️  Super Admin group not found - skipping';
        RETURN;
    END IF;

    DELETE FROM public.group_module_permissions WHERE group_id = v_group_id;

    -- Super Admin gets FULL access to ALL modules
    FOR v_module IN
        SELECT id, module_name
        FROM public.modules
        ORDER BY module_name
    LOOP
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module.id, true, true, true, true, true, true, true);
        RAISE NOTICE '✅ %', v_module.module_name;
    END LOOP;

    RAISE NOTICE '✅ Super Admin configured successfully (FULL ACCESS)';
END $$;

-- ============================================================================
-- 6. VIEWER
-- ============================================================================
-- Viewers have READ-ONLY access
-- Access: Read only to cases, documents, calendar
-- ============================================================================

DO $$
DECLARE
    v_group_id UUID;
    v_module_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '6. CONFIGURING VIEWER';
    RAISE NOTICE '========================================';

    SELECT id INTO v_group_id FROM public.groups WHERE group_name = 'Viewer';

    IF v_group_id IS NULL THEN
        RAISE NOTICE '⚠️  Viewer group not found - skipping';
        RETURN;
    END IF;

    DELETE FROM public.group_module_permissions WHERE group_id = v_group_id;

    -- Cases (read only)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'cases';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, false, false, false, false, false);
        RAISE NOTICE '✅ Cases (Read Only)';
    END IF;

    -- Documents (read only)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'documents';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, false, false, false, false, false);
        RAISE NOTICE '✅ Documents (Read Only)';
    END IF;

    -- Calendar (read only)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'calendar';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, false, false, false, false, false);
        RAISE NOTICE '✅ Calendar (Read Only)';
    END IF;

    -- Notifications (read only)
    SELECT id INTO v_module_id FROM public.modules WHERE module_key = 'notifications';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.group_module_permissions (group_id, module_id, can_read, can_create, can_update, can_delete, can_print, can_approve, can_export)
        VALUES (v_group_id, v_module_id, true, false, false, false, false, false, false);
        RAISE NOTICE '✅ Notifications (Read Only)';
    END IF;

    RAISE NOTICE '✅ Viewer configured successfully (READ ONLY ACCESS)';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONFIGURATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Run the verification query below to see all permissions';
END $$;

-- Show summary of permissions for each group
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
GROUP BY g.group_name
ORDER BY g.group_name;

-- ============================================================================
-- REMOVE DASHBOARD ACCESS FOR CASE OFFICER
-- ============================================================================
-- This ensures Case Officer users cannot access the Dashboard Overview page
-- They will be redirected to /cases instead
-- ============================================================================

DO $$
DECLARE
    v_case_officer_group_id UUID;
    v_dashboard_module_id UUID;
BEGIN
    -- Get Case Officer group ID
    SELECT id INTO v_case_officer_group_id
    FROM public.groups
    WHERE group_name = 'Case Officer';

    -- Get Dashboard module ID
    SELECT id INTO v_dashboard_module_id
    FROM public.modules
    WHERE module_key = 'dashboard';

    IF v_case_officer_group_id IS NOT NULL AND v_dashboard_module_id IS NOT NULL THEN
        -- Delete any dashboard permission for Case Officer
        DELETE FROM public.group_module_permissions
        WHERE group_id = v_case_officer_group_id
          AND module_id = v_dashboard_module_id;

        RAISE NOTICE '✅ Dashboard access removed from Case Officer group';
    ELSE
        RAISE NOTICE '⚠️  Case Officer group or Dashboard module not found';
    END IF;

    -- Verify
    PERFORM 1
    FROM public.group_module_permissions gmp
    JOIN public.groups g ON gmp.group_id = g.id
    JOIN public.modules m ON gmp.module_id = m.id
    WHERE g.group_name = 'Case Officer'
      AND m.module_key = 'dashboard';

    IF FOUND THEN
        RAISE NOTICE '❌ ERROR: Case Officer still has dashboard access!';
    ELSE
        RAISE NOTICE '✅ VERIFIED: Case Officer has NO dashboard access';
    END IF;

END $$;

-- Show what Case Officer CAN access
SELECT
    m.module_name,
    m.module_key,
    gmp.can_read
FROM public.groups g
JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
JOIN public.modules m ON gmp.module_id = m.id
WHERE g.group_name = 'Case Officer'
  AND gmp.can_read = true
ORDER BY m.module_name;

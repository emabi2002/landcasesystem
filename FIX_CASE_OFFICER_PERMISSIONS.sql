-- ============================================================================
-- FIX CASE OFFICER USER PERMISSIONS
-- ============================================================================
-- This script diagnoses and fixes issues where Case Officer users
-- are seeing the wrong menu (superadmin menu instead of Case Officer menu)
-- ============================================================================

-- STEP 1: DIAGNOSTIC - Check current user-group assignments
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC: Current User Group Assignments';
    RAISE NOTICE '========================================';
END $$;

SELECT
    u.email,
    g.name as group_name,
    g.description,
    ug.is_active,
    ug.assigned_at
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id
LEFT JOIN public.groups g ON ug.group_id = g.id
WHERE u.email LIKE '%case%' OR u.email LIKE '%officer%'
ORDER BY u.email, g.name;

-- STEP 2: DIAGNOSTIC - Check what permissions Case Officer group has
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC: Case Officer Group Permissions';
    RAISE NOTICE '========================================';
END $$;

SELECT
    g.name as group_name,
    m.module_name,
    m.module_key,
    gmp.can_read,
    gmp.can_create,
    gmp.can_update,
    gmp.can_delete
FROM public.groups g
JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
JOIN public.modules m ON gmp.module_id = m.id
WHERE g.name = 'Case Officer'
ORDER BY m.module_name;

-- STEP 3: DIAGNOSTIC - Check all groups and their member counts
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC: All Groups and Member Counts';
    RAISE NOTICE '========================================';
END $$;

SELECT
    g.name,
    g.description,
    COUNT(ug.user_id) as member_count,
    ARRAY_AGG(u.email) FILTER (WHERE u.email IS NOT NULL) as members
FROM public.groups g
LEFT JOIN public.user_groups ug ON g.id = ug.group_id AND ug.is_active = true
LEFT JOIN auth.users u ON ug.user_id = u.id
GROUP BY g.id, g.name, g.description
ORDER BY g.name;

-- STEP 4: FIX - Function to assign user ONLY to Case Officer group
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Creating Function: assign_user_to_case_officer_only';
    RAISE NOTICE '========================================';
END $$;

CREATE OR REPLACE FUNCTION assign_user_to_case_officer_only(
    p_user_email TEXT
)
RETURNS TABLE (
    action TEXT,
    details TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_case_officer_group_id UUID;
    v_admin_id UUID;
    v_removed_count INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_user_email;

    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT 'ERROR'::TEXT, 'User not found: ' || p_user_email;
        RETURN;
    END IF;

    -- Get Case Officer group ID
    SELECT id INTO v_case_officer_group_id
    FROM public.groups
    WHERE name = 'Case Officer';

    IF v_case_officer_group_id IS NULL THEN
        RETURN QUERY SELECT 'ERROR'::TEXT, 'Case Officer group not found';
        RETURN;
    END IF;

    -- Get an admin user ID for assigned_by (use first superadmin)
    SELECT u.id INTO v_admin_id
    FROM auth.users u
    JOIN public.user_groups ug ON u.id = ug.user_id
    JOIN public.groups g ON ug.group_id = g.id
    WHERE g.name = 'Superadmin'
    LIMIT 1;

    -- Remove user from ALL groups first
    WITH deleted AS (
        DELETE FROM public.user_groups
        WHERE user_id = v_user_id
        RETURNING group_id
    )
    SELECT COUNT(*) INTO v_removed_count FROM deleted;

    RETURN QUERY SELECT 'REMOVED'::TEXT,
        'Removed user from ' || v_removed_count::TEXT || ' group(s)';

    -- Add user to Case Officer group ONLY
    INSERT INTO public.user_groups (user_id, group_id, assigned_by, is_active)
    VALUES (v_user_id, v_case_officer_group_id, v_admin_id, true)
    ON CONFLICT (user_id, group_id) DO UPDATE
    SET is_active = true, assigned_at = NOW();

    RETURN QUERY SELECT 'ASSIGNED'::TEXT,
        'User ' || p_user_email || ' assigned to Case Officer group ONLY';

    -- Verify the assignment
    RETURN QUERY
    SELECT 'VERIFICATION'::TEXT,
        'User is now in group: ' || g.name
    FROM public.user_groups ug
    JOIN public.groups g ON ug.group_id = g.id
    WHERE ug.user_id = v_user_id AND ug.is_active = true;

END;
$$ LANGUAGE plpgsql;

-- STEP 5: INSTRUCTIONS FOR MANUAL USE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOW TO USE THIS SCRIPT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '1. Review the diagnostic output above to understand current state';
    RAISE NOTICE '';
    RAISE NOTICE '2. To assign a user to Case Officer ONLY, run:';
    RAISE NOTICE '   SELECT * FROM assign_user_to_case_officer_only(''user@example.com'');';
    RAISE NOTICE '';
    RAISE NOTICE '3. This will:';
    RAISE NOTICE '   - Remove the user from ALL groups';
    RAISE NOTICE '   - Assign them ONLY to the Case Officer group';
    RAISE NOTICE '   - Verify the assignment';
    RAISE NOTICE '';
    RAISE NOTICE '4. Example:';
    RAISE NOTICE '   SELECT * FROM assign_user_to_case_officer_only(''caseofficer@dlpp.gov'');';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- STEP 6: Quick test function to see what modules a user should see
-- ============================================================================
CREATE OR REPLACE FUNCTION check_user_menu_access(p_user_email TEXT)
RETURNS TABLE (
    module_key VARCHAR,
    module_name VARCHAR,
    has_read_access BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;

    RETURN QUERY
    SELECT DISTINCT
        m.module_key,
        m.module_name,
        BOOL_OR(gmp.can_read) as has_read_access
    FROM public.user_groups ug
    JOIN public.group_module_permissions gmp ON ug.group_id = gmp.group_id
    JOIN public.modules m ON gmp.module_id = m.id
    WHERE ug.user_id = v_user_id
      AND ug.is_active = true
    GROUP BY m.module_key, m.module_name
    ORDER BY m.module_name;
END;
$$ LANGUAGE plpgsql;

-- Example usage (commented out):
-- SELECT * FROM check_user_menu_access('caseofficer@dlpp.gov');

-- ============================================================================
-- EMERGENCY FIX: Correct ALL User Group Assignments
-- ============================================================================
-- This script will diagnose and fix the issue where users are seeing
-- incorrect menus because they're assigned to multiple groups
-- ============================================================================

-- STEP 1: DIAGNOSTIC - See current situation
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CURRENT USER-GROUP ASSIGNMENTS';
    RAISE NOTICE '========================================';
END $$;

SELECT
    u.email,
    STRING_AGG(g.group_name, ', ' ORDER BY g.group_name) as assigned_groups,
    COUNT(ug.group_id) as total_groups
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
LEFT JOIN public.groups g ON ug.group_id = g.id
GROUP BY u.email
ORDER BY u.email;

-- STEP 2: Find problematic users (those in multiple groups)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USERS IN MULTIPLE GROUPS (PROBLEM!)';
    RAISE NOTICE '========================================';
END $$;

SELECT
    u.email,
    STRING_AGG(g.group_name, ', ' ORDER BY g.group_name) as groups,
    COUNT(ug.group_id) as group_count
FROM auth.users u
JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
JOIN public.groups g ON ug.group_id = g.id
GROUP BY u.id, u.email
HAVING COUNT(ug.group_id) > 1
ORDER BY u.email;

-- STEP 3: Check what modules each user should see
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MODULES EACH USER CAN ACCESS';
    RAISE NOTICE '========================================';
END $$;

SELECT
    u.email,
    COUNT(DISTINCT m.id) as module_count,
    STRING_AGG(DISTINCT m.module_name, ', ' ORDER BY m.module_name) as accessible_modules
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
LEFT JOIN public.group_module_permissions gmp ON ug.group_id = gmp.group_id
LEFT JOIN public.modules m ON gmp.module_id = m.id AND gmp.can_read = true
GROUP BY u.id, u.email
ORDER BY u.email;

-- STEP 4: Create function to fix user group assignments
-- ============================================================================
CREATE OR REPLACE FUNCTION fix_user_group_assignment(
    p_user_email TEXT,
    p_target_group_name TEXT
)
RETURNS TABLE (
    step TEXT,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_target_group_id UUID;
    v_admin_id UUID;
    v_removed_count INTEGER;
    v_old_groups TEXT;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;

    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT '❌ ERROR'::TEXT, 'FAILED'::TEXT, 'User not found: ' || p_user_email;
        RETURN;
    END IF;

    RETURN QUERY SELECT '1️⃣ User Found'::TEXT, 'SUCCESS'::TEXT, 'User: ' || p_user_email;

    -- Get current groups
    SELECT STRING_AGG(g.group_name, ', ') INTO v_old_groups
    FROM user_groups ug
    JOIN groups g ON ug.group_id = g.id
    WHERE ug.user_id = v_user_id AND ug.is_active = true;

    IF v_old_groups IS NOT NULL THEN
        RETURN QUERY SELECT '2️⃣ Current Groups'::TEXT, 'INFO'::TEXT,
            'Was in: ' || v_old_groups;
    ELSE
        RETURN QUERY SELECT '2️⃣ Current Groups'::TEXT, 'INFO'::TEXT, 'Not in any groups';
    END IF;

    -- Get target group ID
    SELECT id INTO v_target_group_id FROM groups WHERE group_name = p_target_group_name;

    IF v_target_group_id IS NULL THEN
        RETURN QUERY SELECT '❌ ERROR'::TEXT, 'FAILED'::TEXT,
            'Group not found: ' || p_target_group_name;
        RETURN;
    END IF;

    RETURN QUERY SELECT '3️⃣ Target Group'::TEXT, 'SUCCESS'::TEXT,
        'Will assign to: ' || p_target_group_name;

    -- Get admin for assigned_by
    SELECT u.id INTO v_admin_id
    FROM auth.users u
    JOIN user_groups ug ON u.id = ug.user_id
    JOIN groups g ON ug.group_id = g.id
    WHERE g.group_name IN ('Superadmin', 'Administrator')
    ORDER BY g.group_name
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        v_admin_id := v_user_id;
    END IF;

    -- Remove from ALL groups
    WITH deleted AS (
        DELETE FROM user_groups WHERE user_id = v_user_id RETURNING group_id
    )
    SELECT COUNT(*) INTO v_removed_count FROM deleted;

    RETURN QUERY SELECT '4️⃣ Cleanup'::TEXT, 'SUCCESS'::TEXT,
        'Removed from ' || v_removed_count::TEXT || ' group(s)';

    -- Assign to target group ONLY
    INSERT INTO user_groups (user_id, group_id, assigned_by, is_active)
    VALUES (v_user_id, v_target_group_id, v_admin_id, true);

    RETURN QUERY SELECT '5️⃣ Assignment'::TEXT, 'SUCCESS'::TEXT,
        'Assigned to ' || p_target_group_name || ' ONLY';

    -- Verify
    RETURN QUERY
    SELECT '6️⃣ Verification'::TEXT, 'SUCCESS'::TEXT,
        'Now in group: ' || g.group_name
    FROM user_groups ug
    JOIN groups g ON ug.group_id = g.id
    WHERE ug.user_id = v_user_id AND ug.is_active = true;

    RETURN QUERY SELECT '✅ COMPLETE'::TEXT, 'SUCCESS'::TEXT,
        'User must log out and back in to see changes';

END;
$$ LANGUAGE plpgsql;

-- STEP 5: INSTRUCTIONS AND EXAMPLES
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOW TO FIX EACH USER';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Use the fix_user_group_assignment function:';
    RAISE NOTICE '';
    RAISE NOTICE 'Example: Fix Case Officer user';
    RAISE NOTICE '  SELECT * FROM fix_user_group_assignment(''caseofficer@dlpp.gov'', ''Case Officer'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Example: Fix Document Clerk user';
    RAISE NOTICE '  SELECT * FROM fix_user_group_assignment(''clerk@dlpp.gov'', ''Document Clerk'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Example: Fix Litigation Officer';
    RAISE NOTICE '  SELECT * FROM fix_user_group_assignment(''litigation@dlpp.gov'', ''Litigation Officer'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Available groups in your system:';
END $$;

SELECT
    group_name,
    description
FROM public.groups
ORDER BY group_name;

-- STEP 6: READY-TO-USE FIX COMMANDS (Edit these with actual emails)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COPY AND EDIT THESE COMMANDS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '-- Uncomment and edit the user emails below:';
    RAISE NOTICE '';
END $$;

-- 🔧 EDIT THESE WITH YOUR ACTUAL USER EMAILS:
-- ============================================================================

-- Fix Case Officer user:
-- SELECT * FROM fix_user_group_assignment('EDIT_EMAIL_HERE@example.com', 'Case Officer');

-- Fix Document Clerk user:
-- SELECT * FROM fix_user_group_assignment('EDIT_EMAIL_HERE@example.com', 'Document Clerk');

-- Fix Litigation Officer user:
-- SELECT * FROM fix_user_group_assignment('EDIT_EMAIL_HERE@example.com', 'Litigation Officer');

-- Fix Compliance Officer user:
-- SELECT * FROM fix_user_group_assignment('EDIT_EMAIL_HERE@example.com', 'Compliance Officer');

-- Fix Reception user:
-- SELECT * FROM fix_user_group_assignment('EDIT_EMAIL_HERE@example.com', 'Reception');

-- ============================================================================
-- STEP 7: VERIFICATION QUERY
-- ============================================================================
-- Run this after fixing to verify all users are correctly assigned:

CREATE OR REPLACE FUNCTION verify_all_user_assignments()
RETURNS TABLE (
    email TEXT,
    assigned_group TEXT,
    module_count BIGINT,
    has_admin_access BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.email,
        COALESCE(g.group_name, 'NO GROUP') as assigned_group,
        COUNT(DISTINCT CASE WHEN gmp.can_read = true THEN m.id ELSE NULL END) as module_count,
        BOOL_OR(g.group_name IN ('Superadmin', 'Administrator')) as has_admin_access
    FROM auth.users u
    LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
    LEFT JOIN public.groups g ON ug.group_id = g.id
    LEFT JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
    LEFT JOIN public.modules m ON gmp.module_id = m.id
    GROUP BY u.email, g.group_name
    ORDER BY u.email;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FINAL NOTES
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AFTER RUNNING FIXES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '1. Each user must LOG OUT and LOG BACK IN';
    RAISE NOTICE '2. Clear browser cache if issues persist';
    RAISE NOTICE '3. Run: SELECT * FROM verify_all_user_assignments();';
    RAISE NOTICE '4. Check that users see correct menus';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SAFE FIX: Case Officer Seeing Super Admin Menu
-- ============================================================================
-- This version uses the existing function to bypass RLS issues
-- ============================================================================

-- STEP 1: First, let's see which users need fixing
SELECT 
    u.email,
    STRING_AGG(g.group_name, ', ' ORDER BY g.group_name) as current_groups,
    COUNT(ug.group_id) as group_count
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
LEFT JOIN public.groups g ON ug.group_id = g.id
GROUP BY u.id, u.email
ORDER BY u.email;

-- STEP 2: Check if fix function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'fix_user_group_assignment'
AND routine_schema = 'public';

-- STEP 3: If function doesn't exist, create it
CREATE OR REPLACE FUNCTION public.fix_user_group_assignment(
    p_user_email TEXT,
    p_target_group_name TEXT
)
RETURNS TABLE (
    step TEXT,
    status TEXT,
    message TEXT
) 
SECURITY DEFINER -- This bypasses RLS
SET search_path = public
AS $$
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
        RETURN QUERY SELECT 'ERROR'::TEXT, 'FAILED'::TEXT, 'User not found: ' || p_user_email;
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
        RETURN QUERY SELECT 'ERROR'::TEXT, 'FAILED'::TEXT,
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
    WHERE g.group_name IN ('Super Admin', 'Superadmin')
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

-- STEP 4: Grant execute permission
GRANT EXECUTE ON FUNCTION public.fix_user_group_assignment(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_user_group_assignment(TEXT, TEXT) TO service_role;

-- STEP 5: Now use the function to fix each Case Officer
-- ============================================================================
-- IMPORTANT: Replace 'caseofficer@dlpp.gov' with YOUR actual Case Officer email
-- ============================================================================

SELECT * FROM public.fix_user_group_assignment('caseofficer@dlpp.gov', 'Case Officer');

-- If you have multiple Case Officers, run this for each one:
-- SELECT * FROM public.fix_user_group_assignment('officer2@dlpp.gov', 'Case Officer');
-- SELECT * FROM public.fix_user_group_assignment('officer3@dlpp.gov', 'Case Officer');

-- STEP 6: Verify all users are correctly assigned
SELECT 
    u.email,
    g.group_name,
    COUNT(DISTINCT m.id) as total_modules
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
LEFT JOIN public.groups g ON ug.group_id = g.id
LEFT JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
LEFT JOIN public.modules m ON gmp.module_id = m.id AND gmp.can_read = true
GROUP BY u.email, g.group_name
ORDER BY u.email;

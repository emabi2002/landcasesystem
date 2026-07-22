-- ============================================================================
-- IMPROVED FIX: Better Error Messages
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fix_user_group_assignment(
    p_user_email TEXT,
    p_target_group_name TEXT
)
RETURNS TABLE (step TEXT, status TEXT, message TEXT) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_target_group_id UUID;
    v_admin_id UUID;
    v_removed_count INTEGER;
BEGIN
    -- Check if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT 
            '❌ ERROR'::TEXT, 
            'USER_NOT_FOUND'::TEXT, 
            'No user found with email: ' || p_user_email || '. Check spelling and case!';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        '1️⃣ User Found'::TEXT, 
        'SUCCESS'::TEXT, 
        'User ID: ' || v_user_id::TEXT;
    
    -- Check if group exists
    SELECT id INTO v_target_group_id FROM groups WHERE group_name = p_target_group_name;
    
    IF v_target_group_id IS NULL THEN
        RETURN QUERY SELECT 
            '❌ ERROR'::TEXT, 
            'GROUP_NOT_FOUND'::TEXT, 
            'No group found with name: ' || p_target_group_name;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        '2️⃣ Group Found'::TEXT, 
        'SUCCESS'::TEXT, 
        'Group ID: ' || v_target_group_id::TEXT;
    
    -- Get admin ID
    SELECT u.id INTO v_admin_id
    FROM auth.users u
    JOIN user_groups ug ON u.id = ug.user_id
    JOIN groups g ON ug.group_id = g.id
    WHERE g.group_name IN ('Super Admin', 'Superadmin')
    LIMIT 1;
    
    -- Remove from ALL groups
    WITH deleted AS (
        DELETE FROM user_groups WHERE user_id = v_user_id RETURNING group_id
    )
    SELECT COUNT(*) INTO v_removed_count FROM deleted;
    
    RETURN QUERY SELECT 
        '3️⃣ Removed'::TEXT, 
        'SUCCESS'::TEXT, 
        'Removed from ' || v_removed_count::TEXT || ' group(s)';
    
    -- Add to target group
    INSERT INTO user_groups (user_id, group_id, assigned_by, is_active)
    VALUES (v_user_id, v_target_group_id, COALESCE(v_admin_id, v_user_id), true);
    
    RETURN QUERY SELECT 
        '4️⃣ Assigned'::TEXT, 
        'SUCCESS'::TEXT, 
        'User assigned to ' || p_target_group_name || ' ONLY';
    
    RETURN QUERY SELECT 
        '✅ COMPLETE'::TEXT, 
        'SUCCESS'::TEXT, 
        'User must log out and clear cache!';
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            '❌ ERROR'::TEXT, 
            'EXCEPTION'::TEXT, 
            'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.fix_user_group_assignment(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_user_group_assignment(TEXT, TEXT) TO service_role;

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. First run FIND_USERS_FIRST.sql to see all users
-- 2. Copy the EXACT email from the results
-- 3. Replace 'USER_EMAIL_HERE' below with that exact email
-- 4. Run this script
-- ============================================================================

-- Example (replace with actual email!):
-- SELECT * FROM public.fix_user_group_assignment('<admin-email>', 'Case Officer');

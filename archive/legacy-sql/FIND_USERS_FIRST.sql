-- ============================================================================
-- STEP 1: Find ALL Users in Your System
-- ============================================================================

SELECT 
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: See Which Groups Each User Is In
-- ============================================================================

SELECT 
    u.email,
    STRING_AGG(g.group_name, ', ' ORDER BY g.group_name) as current_groups,
    COUNT(ug.group_id) as total_groups
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
LEFT JOIN public.groups g ON ug.group_id = g.id
GROUP BY u.email
ORDER BY u.email;

-- ============================================================================
-- STEP 3: Find Users in Multiple Groups (THE PROBLEM!)
-- ============================================================================

SELECT 
    u.email,
    STRING_AGG(g.group_name, ', ') as groups,
    COUNT(ug.group_id) as group_count
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
LEFT JOIN public.groups g ON ug.group_id = g.id
GROUP BY u.email
HAVING COUNT(ug.group_id) > 1
ORDER BY u.email;

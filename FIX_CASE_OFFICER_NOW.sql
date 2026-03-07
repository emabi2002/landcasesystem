-- ============================================================================
-- EMERGENCY FIX: Case Officer Seeing Super Admin Menu  
-- ============================================================================
-- This fixes users who are in MULTIPLE groups and seeing wrong menus
-- ============================================================================

-- STEP 1: DIAGNOSE - Show users in multiple groups
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users in Multiple Groups (PROBLEM):';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    u.email,
    STRING_AGG(g.group_name, ', ' ORDER BY g.group_name) as groups,
    COUNT(ug.group_id) as group_count
FROM auth.users u
LEFT JOIN public.user_groups ug ON u.id = ug.user_id AND ug.is_active = true
LEFT JOIN public.groups g ON ug.group_id = g.id
GROUP BY u.id, u.email
HAVING COUNT(ug.group_id) > 1
ORDER BY u.email;

-- STEP 2: FIX - Remove Case Officers from ALL other groups
DO $$
DECLARE
    v_case_officer_id UUID;
    v_user RECORD;
    v_admin_id UUID;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIXING Case Officers:';
    RAISE NOTICE '========================================';
    
    -- Get Case Officer group ID
    SELECT id INTO v_case_officer_id 
    FROM public.groups WHERE group_name = 'Case Officer';
    
    -- Get admin ID for assigned_by
    SELECT u.id INTO v_admin_id
    FROM auth.users u
    JOIN public.user_groups ug ON u.id = ug.user_id  
    JOIN public.groups g ON ug.group_id = g.id
    WHERE g.group_name = 'Super Admin'
    LIMIT 1;
    
    -- Fix each Case Officer user
    FOR v_user IN 
        SELECT DISTINCT u.id, u.email
        FROM auth.users u
        JOIN public.user_groups ug ON u.id = ug.user_id
        WHERE ug.group_id = v_case_officer_id
        AND ug.is_active = true
    LOOP
        -- Remove from ALL groups
        DELETE FROM public.user_groups WHERE user_id = v_user.id;
        
        -- Add back to Case Officer ONLY
        INSERT INTO public.user_groups (user_id, group_id, assigned_by, is_active)
        VALUES (v_user.id, v_case_officer_id, v_admin_id, true);
        
        v_count := v_count + 1;
        RAISE NOTICE '✅ Fixed: % → Case Officer ONLY', v_user.email;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total users fixed: %', v_count;
END $$;

-- STEP 3: VERIFY - Show final state
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION - Current Assignments:';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    u.email,
    g.group_name,
    COUNT(DISTINCT m.id) as total_modules
FROM auth.users u
JOIN public.user_groups ug ON u.id = ug.user_id
JOIN public.groups g ON ug.group_id = g.id
LEFT JOIN public.group_module_permissions gmp ON g.id = gmp.group_id
LEFT JOIN public.modules m ON gmp.module_id = m.id AND gmp.can_read = true
WHERE ug.is_active = true
GROUP BY u.email, g.group_name
ORDER BY u.email;

-- STEP 4: Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'ALL Case Officer users MUST now:';
    RAISE NOTICE '1. Log out immediately';
    RAISE NOTICE '2. Clear browser cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '3. Log back in';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected: Case Officers see 10 modules (NOT 32)';
    RAISE NOTICE 'Expected: NO Administration menu for Case Officers';
    RAISE NOTICE '';
END $$;

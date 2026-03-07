-- ============================================================================
-- QUICK FIX: Assign User to Case Officer Group ONLY
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_CASE_OFFICER_EMAIL@example.com' with the actual email
-- 2. Run this entire script in Supabase SQL Editor
-- 3. Log out and log back in as the Case Officer user
-- ============================================================================

-- Step 1: Create the fix function
CREATE OR REPLACE FUNCTION fix_case_officer_user(p_user_email TEXT)
RETURNS TABLE (
    step TEXT,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_case_officer_group_id UUID;
    v_admin_id UUID;
    v_removed_count INTEGER;
    v_current_groups TEXT;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;

    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT '❌ ERROR'::TEXT, 'FAILED'::TEXT, 'User not found: ' || p_user_email;
        RETURN;
    END IF;

    RETURN QUERY SELECT '1️⃣ User Found'::TEXT, 'SUCCESS'::TEXT, 'User ID: ' || v_user_id::TEXT;

    -- Get current groups
    SELECT STRING_AGG(g.name, ', ') INTO v_current_groups
    FROM user_groups ug
    JOIN groups g ON ug.group_id = g.id
    WHERE ug.user_id = v_user_id AND ug.is_active = true;

    IF v_current_groups IS NOT NULL THEN
        RETURN QUERY SELECT '2️⃣ Current Groups'::TEXT, 'INFO'::TEXT,
            'User is in: ' || v_current_groups;
    ELSE
        RETURN QUERY SELECT '2️⃣ Current Groups'::TEXT, 'INFO'::TEXT, 'User is not in any groups';
    END IF;

    -- Get Case Officer group ID
    SELECT id INTO v_case_officer_group_id FROM groups WHERE name = 'Case Officer';

    IF v_case_officer_group_id IS NULL THEN
        RETURN QUERY SELECT '❌ ERROR'::TEXT, 'FAILED'::TEXT,
            'Case Officer group not found in database';
        RETURN;
    END IF;

    RETURN QUERY SELECT '3️⃣ Case Officer Group'::TEXT, 'SUCCESS'::TEXT,
        'Group ID: ' || v_case_officer_group_id::TEXT;

    -- Get an admin user for assigned_by
    SELECT u.id INTO v_admin_id
    FROM auth.users u
    JOIN user_groups ug ON u.id = ug.user_id
    JOIN groups g ON ug.group_id = g.id
    WHERE g.name IN ('Superadmin', 'Administrator')
    ORDER BY g.name
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        v_admin_id := v_user_id; -- Self-assign if no admin found
    END IF;

    -- Remove from ALL groups
    WITH deleted AS (
        DELETE FROM user_groups WHERE user_id = v_user_id RETURNING group_id
    )
    SELECT COUNT(*) INTO v_removed_count FROM deleted;

    RETURN QUERY SELECT '4️⃣ Removed from Groups'::TEXT, 'SUCCESS'::TEXT,
        'Removed from ' || v_removed_count::TEXT || ' group(s)';

    -- Add to Case Officer group ONLY
    INSERT INTO user_groups (user_id, group_id, assigned_by, is_active)
    VALUES (v_user_id, v_case_officer_group_id, v_admin_id, true);

    RETURN QUERY SELECT '5️⃣ Assigned to Case Officer'::TEXT, 'SUCCESS'::TEXT,
        'User now belongs ONLY to Case Officer group';

    -- Verify
    RETURN QUERY
    SELECT '6️⃣ Verification'::TEXT, 'SUCCESS'::TEXT,
        'User is now in: ' || g.name || ' (id: ' || g.id::TEXT || ')'
    FROM user_groups ug
    JOIN groups g ON ug.group_id = g.id
    WHERE ug.user_id = v_user_id AND ug.is_active = true;

    RETURN QUERY SELECT '✅ COMPLETE'::TEXT, 'SUCCESS'::TEXT,
        'User ' || p_user_email || ' is now a Case Officer ONLY. Please log out and log back in.';

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Step 2: Run the fix (EDIT THE EMAIL ADDRESS BELOW!)
-- ============================================================================

-- 🔧 EDIT THIS LINE - Replace with your Case Officer's email:
SELECT * FROM fix_case_officer_user('caseofficer@dlpp.gov');

-- ============================================================================
-- Step 3: Verify what modules the user can now see
-- ============================================================================

-- 🔍 Check which menu items should be visible:
CREATE OR REPLACE FUNCTION verify_case_officer_menu(p_user_email TEXT)
RETURNS TABLE (
    module_name VARCHAR,
    module_key VARCHAR,
    can_read BOOLEAN,
    can_create BOOLEAN,
    can_update BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;

    RETURN QUERY
    SELECT DISTINCT
        m.module_name,
        m.module_key,
        BOOL_OR(gmp.can_read) as can_read,
        BOOL_OR(gmp.can_create) as can_create,
        BOOL_OR(gmp.can_update) as can_update
    FROM user_groups ug
    JOIN group_module_permissions gmp ON ug.group_id = gmp.group_id
    JOIN modules m ON gmp.module_id = m.id
    WHERE ug.user_id = v_user_id AND ug.is_active = true
    GROUP BY m.module_name, m.module_key
    ORDER BY m.module_name;
END;
$$ LANGUAGE plpgsql;

-- 🔍 EDIT THIS LINE - Replace with your Case Officer's email:
SELECT * FROM verify_case_officer_menu('caseofficer@dlpp.gov');

-- ============================================================================
-- Expected Output for Case Officer:
-- ============================================================================
-- The user should see these modules:
-- ✅ Dashboard
-- ✅ Cases
-- ✅ Allocation
-- ✅ Directions
-- ✅ Notifications
-- ✅ Calendar
-- etc.
--
-- The user should NOT see:
-- ❌ Administration
-- ❌ RBAC Management
-- ❌ User Management
-- ❌ Groups
-- ❌ System Settings
-- ============================================================================

-- ============================================================================
-- Cleanup (Optional)
-- ============================================================================
-- Uncomment these lines to remove the helper functions after use:
-- DROP FUNCTION IF EXISTS fix_case_officer_user(TEXT);
-- DROP FUNCTION IF EXISTS verify_case_officer_menu(TEXT);
-- ============================================================================

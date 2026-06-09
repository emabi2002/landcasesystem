-- ===============================================
-- CLEANUP OLD RBAC SYSTEM
-- ===============================================
-- This script removes the old group-based system
-- and keeps only the NEW RBAC groups
--
-- OLD Groups (will be deleted):
--   - Auditor
--   - Data Entry Clerk
--   - Department Admin
--   - Director
--   - Legal Officer
--   - Reception
--   - Registrar
--
-- NEW Groups (will be kept):
--   - Super Admin
--   - Manager
--   - Case Officer
--   - Legal Clerk
--   - Document Clerk
--   - Viewer
-- ===============================================

-- STEP 1: Show current groups (for reference)
SELECT '=== CURRENT GROUPS ===' AS info;
SELECT group_name, description
FROM public.groups
ORDER BY group_name;

-- STEP 2: Show users in old groups (WARNING: These users will be unassigned!)
SELECT '=== USERS IN OLD GROUPS (will be unassigned) ===' AS info;
SELECT
  u.email,
  g.group_name
FROM public.user_groups ug
JOIN auth.users u ON ug.user_id = u.id
JOIN public.groups g ON ug.group_id = g.id
WHERE g.group_name IN (
  'Auditor',
  'Data Entry Clerk',
  'Department Admin',
  'Director',
  'Legal Officer',
  'Reception',
  'Registrar'
)
ORDER BY u.email, g.group_name;

-- STEP 3: Delete user assignments from old groups
DELETE FROM public.user_groups
WHERE group_id IN (
  SELECT id FROM public.groups
  WHERE group_name IN (
    'Auditor',
    'Data Entry Clerk',
    'Department Admin',
    'Director',
    'Legal Officer',
    'Reception',
    'Registrar'
  )
);

-- STEP 4: Delete permissions for old groups
DELETE FROM public.group_module_permissions
WHERE group_id IN (
  SELECT id FROM public.groups
  WHERE group_name IN (
    'Auditor',
    'Data Entry Clerk',
    'Department Admin',
    'Director',
    'Legal Officer',
    'Reception',
    'Registrar'
  )
);

-- STEP 5: Delete old groups
DELETE FROM public.groups
WHERE group_name IN (
  'Auditor',
  'Data Entry Clerk',
  'Department Admin',
  'Director',
  'Legal Officer',
  'Reception',
  'Registrar'
);

-- STEP 6: Ensure NEW groups exist
INSERT INTO public.groups (group_name, description) VALUES
  ('Super Admin', 'Full system access including user management and configuration'),
  ('Manager', 'Department heads and supervisors with approval rights'),
  ('Case Officer', 'Legal officers handling case assignments and management'),
  ('Legal Clerk', 'Support staff assisting with case processing'),
  ('Document Clerk', 'Document management specialists'),
  ('Viewer', 'Read-only access for observers and auditors')
ON CONFLICT (group_name) DO UPDATE SET
  description = EXCLUDED.description;

-- STEP 7: Show final result
SELECT '=== FINAL GROUPS (only NEW RBAC) ===' AS info;
SELECT group_name, description
FROM public.groups
ORDER BY group_name;

-- SUCCESS MESSAGE
SELECT '✅ OLD RBAC SYSTEM REMOVED!' AS status;
SELECT '✅ Only NEW groups remain' AS status;
SELECT '⚠️ Users from old groups were unassigned - reassign them through UI!' AS warning;

-- NEXT STEPS:
-- 1. Go to: Administration → User Management
-- 2. For each user, click "Assign Group"
-- 3. Select appropriate NEW group (Case Officer, Manager, etc.)
-- 4. Configure permissions: Administration → Groups → Manage Permissions

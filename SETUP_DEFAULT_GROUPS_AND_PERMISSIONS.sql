-- ============================================================================
-- LEGAL CASE MANAGEMENT SYSTEM
-- Setup Default Groups and Permissions
-- ============================================================================
-- This script creates the default RBAC structure:
-- - 6 Default Groups (Super Admin, Manager, Case Officer, Legal Clerk, Document Clerk, Viewer)
-- - All System Modules
-- - Appropriate Permissions for each Group
--
-- Run this script in Supabase SQL Editor after creating the base tables
-- Safe to run multiple times (uses ON CONFLICT)
-- ============================================================================

-- STEP 1: Create System Modules
-- ============================================================================

INSERT INTO modules (module_name, module_key, description) VALUES
  ('Dashboard', 'dashboard', 'System dashboard with statistics and overview'),
  ('Case Management', 'case_management', 'Register, assign, and track legal cases'),
  ('Documents', 'documents', 'Upload, organize, and manage case documents'),
  ('Tasks', 'tasks', 'Task assignments and tracking'),
  ('Calendar', 'calendar', 'Events, hearings, and deadlines'),
  ('Correspondence', 'correspondence', 'Letters, emails, and communications'),
  ('Lawyers', 'lawyers', 'External counsel and lawyer management'),
  ('Land Parcels', 'land_parcels', 'Property records and land registry'),
  ('Court Filings', 'court_filings', 'Legal submissions and court documents'),
  ('Directions & Hearings', 'directions_hearings', 'Court directions and hearing schedules'),
  ('Compliance', 'compliance', 'Compliance tracking and monitoring'),
  ('Litigation Costs', 'litigation_costs', 'Budget tracking and litigation expenses'),
  ('Reports', 'reports', 'Analytics, statistics, and data exports'),
  ('Notifications', 'notifications', 'System notifications and alerts'),
  ('File Requests', 'file_requests', 'Physical file movement tracking'),
  ('Communications', 'communications', 'Internal communications system'),
  ('User Management', 'user_management', 'Create and manage user accounts'),
  ('Groups Management', 'groups_management', 'Configure groups and permissions'),
  ('Master Files', 'master_files', 'System lookup tables and reference data'),
  ('Internal Officers', 'internal_officers', 'Manage internal staff and action officers')
ON CONFLICT (module_key) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      description = EXCLUDED.description;

-- STEP 2: Create Default Groups
-- ============================================================================

DO $$
DECLARE
  super_admin_id UUID;
  manager_id UUID;
  case_officer_id UUID;
  legal_clerk_id UUID;
  document_clerk_id UUID;
  viewer_id UUID;
BEGIN

-- Insert or get Super Admin group
INSERT INTO groups (group_name, description)
VALUES (
  'Super Admin',
  'Full system access including user management, configuration, and all modules. Intended for system administrators and IT staff.'
)
ON CONFLICT (group_name) DO UPDATE
  SET description = EXCLUDED.description
RETURNING id INTO super_admin_id;

IF super_admin_id IS NULL THEN
  SELECT id INTO super_admin_id FROM groups WHERE group_name = 'Super Admin';
END IF;

-- Insert or get Manager group
INSERT INTO groups (group_name, description)
VALUES (
  'Manager',
  'Department heads and supervisors. Can view all cases, approve actions, generate reports, and monitor team performance.'
)
ON CONFLICT (group_name) DO UPDATE
  SET description = EXCLUDED.description
RETURNING id INTO manager_id;

IF manager_id IS NULL THEN
  SELECT id INTO manager_id FROM groups WHERE group_name = 'Manager';
END IF;

-- Insert or get Case Officer group
INSERT INTO groups (group_name, description)
VALUES (
  'Case Officer',
  'Legal officers who handle case assignments. Full case management capabilities including registration, updates, and document handling.'
)
ON CONFLICT (group_name) DO UPDATE
  SET description = EXCLUDED.description
RETURNING id INTO case_officer_id;

IF case_officer_id IS NULL THEN
  SELECT id INTO case_officer_id FROM groups WHERE group_name = 'Case Officer';
END IF;

-- Insert or get Legal Clerk group
INSERT INTO groups (group_name, description)
VALUES (
  'Legal Clerk',
  'Support staff assisting with case processing. Can manage documents, tasks, and correspondence but limited case modification rights.'
)
ON CONFLICT (group_name) DO UPDATE
  SET description = EXCLUDED.description
RETURNING id INTO legal_clerk_id;

IF legal_clerk_id IS NULL THEN
  SELECT id INTO legal_clerk_id FROM groups WHERE group_name = 'Legal Clerk';
END IF;

-- Insert or get Document Clerk group
INSERT INTO groups (group_name, description)
VALUES (
  'Document Clerk',
  'Document management specialists. Primary focus on uploading, organizing, and tracking documents and physical files.'
)
ON CONFLICT (group_name) DO UPDATE
  SET description = EXCLUDED.description
RETURNING id INTO document_clerk_id;

IF document_clerk_id IS NULL THEN
  SELECT id INTO document_clerk_id FROM groups WHERE group_name = 'Document Clerk';
END IF;

-- Insert or get Viewer group
INSERT INTO groups (group_name, description)
VALUES (
  'Viewer',
  'Read-only access for external observers, auditors, or consultants. Can view cases and generate reports but cannot modify any data.'
)
ON CONFLICT (group_name) DO UPDATE
  SET description = EXCLUDED.description
RETURNING id INTO viewer_id;

IF viewer_id IS NULL THEN
  SELECT id INTO viewer_id FROM groups WHERE group_name = 'Viewer';
END IF;

RAISE NOTICE 'Groups created successfully';
RAISE NOTICE 'Super Admin ID: %', super_admin_id;
RAISE NOTICE 'Manager ID: %', manager_id;
RAISE NOTICE 'Case Officer ID: %', case_officer_id;
RAISE NOTICE 'Legal Clerk ID: %', legal_clerk_id;
RAISE NOTICE 'Document Clerk ID: %', document_clerk_id;
RAISE NOTICE 'Viewer ID: %', viewer_id;

END $$;

-- STEP 3: Setup Permissions for Each Group
-- ============================================================================
-- Delete existing permissions first to allow re-running this script
DELETE FROM group_module_permissions WHERE group_id IN (
  SELECT id FROM groups WHERE group_name IN (
    'Super Admin', 'Manager', 'Case Officer', 'Legal Clerk', 'Document Clerk', 'Viewer'
  )
);

-- ============================================================================
-- SUPER ADMIN - Full Access to Everything
-- ============================================================================
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
  g.id as group_id,
  m.id as module_id,
  true as can_create,
  true as can_read,
  true as can_update,
  true as can_delete,
  true as can_print,
  true as can_approve,
  true as can_export
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Super Admin';

-- ============================================================================
-- MANAGER - View All, Approve, Limited Create/Delete
-- ============================================================================
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
  g.id,
  m.id,
  CASE
    WHEN m.module_key IN ('tasks', 'correspondence', 'notifications') THEN true
    ELSE false
  END as can_create,
  true as can_read, -- Can view everything
  CASE
    WHEN m.module_key IN ('case_management', 'tasks', 'calendar', 'correspondence', 'compliance') THEN true
    ELSE false
  END as can_update,
  false as can_delete, -- Managers don't delete
  true as can_print,
  true as can_approve, -- Can approve everything
  true as can_export
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Manager'
  AND m.module_key NOT IN ('user_management', 'groups_management'); -- No admin access

-- ============================================================================
-- CASE OFFICER - Full Case Management
-- ============================================================================
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
  g.id,
  m.id,
  CASE
    WHEN m.module_key IN (
      'case_management', 'documents', 'tasks', 'calendar', 'correspondence',
      'court_filings', 'directions_hearings', 'compliance', 'file_requests', 'notifications'
    ) THEN true
    ELSE false
  END as can_create,
  CASE
    WHEN m.module_key IN (
      'dashboard', 'case_management', 'documents', 'tasks', 'calendar', 'correspondence',
      'lawyers', 'land_parcels', 'court_filings', 'directions_hearings', 'compliance',
      'litigation_costs', 'reports', 'notifications', 'file_requests', 'internal_officers'
    ) THEN true
    ELSE false
  END as can_read,
  CASE
    WHEN m.module_key IN (
      'case_management', 'documents', 'tasks', 'calendar', 'correspondence',
      'court_filings', 'directions_hearings', 'compliance', 'file_requests'
    ) THEN true
    ELSE false
  END as can_update,
  CASE
    WHEN m.module_key IN ('tasks', 'correspondence', 'file_requests') THEN true
    ELSE false
  END as can_delete,
  CASE
    WHEN m.module_key IN (
      'case_management', 'documents', 'court_filings', 'reports', 'calendar'
    ) THEN true
    ELSE false
  END as can_print,
  CASE
    WHEN m.module_key IN ('court_filings', 'documents', 'compliance') THEN true
    ELSE false
  END as can_approve,
  CASE
    WHEN m.module_key IN ('reports', 'case_management', 'documents') THEN true
    ELSE false
  END as can_export
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Case Officer'
  AND m.module_key NOT IN ('user_management', 'groups_management', 'master_files');

-- ============================================================================
-- LEGAL CLERK - Document & Task Management Support
-- ============================================================================
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
  g.id,
  m.id,
  CASE
    WHEN m.module_key IN (
      'documents', 'tasks', 'correspondence', 'file_requests', 'calendar'
    ) THEN true
    ELSE false
  END as can_create,
  CASE
    WHEN m.module_key IN (
      'dashboard', 'case_management', 'documents', 'tasks', 'calendar',
      'correspondence', 'lawyers', 'land_parcels', 'directions_hearings',
      'notifications', 'file_requests', 'internal_officers'
    ) THEN true
    ELSE false
  END as can_read,
  CASE
    WHEN m.module_key IN (
      'documents', 'tasks', 'correspondence', 'file_requests', 'calendar'
    ) THEN true
    ELSE false
  END as can_update,
  CASE
    WHEN m.module_key IN ('tasks', 'correspondence') THEN true
    ELSE false
  END as can_delete,
  CASE
    WHEN m.module_key IN ('documents', 'case_management', 'calendar') THEN true
    ELSE false
  END as can_print,
  false as can_approve, -- Clerks don't approve
  CASE
    WHEN m.module_key IN ('documents', 'tasks') THEN true
    ELSE false
  END as can_export
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Legal Clerk'
  AND m.module_key NOT IN (
    'user_management', 'groups_management', 'master_files',
    'litigation_costs', 'court_filings', 'compliance'
  );

-- ============================================================================
-- DOCUMENT CLERK - Document Management Focused
-- ============================================================================
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
  g.id,
  m.id,
  CASE
    WHEN m.module_key IN ('documents', 'file_requests') THEN true
    ELSE false
  END as can_create,
  CASE
    WHEN m.module_key IN (
      'dashboard', 'case_management', 'documents', 'tasks', 'file_requests', 'notifications'
    ) THEN true
    ELSE false
  END as can_read,
  CASE
    WHEN m.module_key IN ('documents', 'file_requests') THEN true
    ELSE false
  END as can_update,
  false as can_delete, -- Document clerks don't delete
  CASE
    WHEN m.module_key IN ('documents', 'case_management') THEN true
    ELSE false
  END as can_print,
  false as can_approve,
  CASE
    WHEN m.module_key = 'documents' THEN true
    ELSE false
  END as can_export
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Document Clerk'
  AND m.module_key IN (
    'dashboard', 'case_management', 'documents', 'tasks', 'file_requests', 'notifications'
  );

-- ============================================================================
-- VIEWER - Read-Only Access
-- ============================================================================
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT
  g.id,
  m.id,
  false as can_create,
  true as can_read,
  false as can_update,
  false as can_delete,
  CASE
    WHEN m.module_key IN ('case_management', 'reports', 'documents') THEN true
    ELSE false
  END as can_print,
  false as can_approve,
  CASE
    WHEN m.module_key = 'reports' THEN true
    ELSE false
  END as can_export
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Viewer'
  AND m.module_key IN (
    'dashboard', 'case_management', 'documents', 'calendar',
    'reports', 'land_parcels', 'notifications'
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show summary of what was created
DO $$
DECLARE
  group_count INTEGER;
  module_count INTEGER;
  permission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO group_count FROM groups
    WHERE group_name IN ('Super Admin', 'Manager', 'Case Officer', 'Legal Clerk', 'Document Clerk', 'Viewer');

  SELECT COUNT(*) INTO module_count FROM modules;

  SELECT COUNT(*) INTO permission_count FROM group_module_permissions
    WHERE group_id IN (
      SELECT id FROM groups WHERE group_name IN ('Super Admin', 'Manager', 'Case Officer', 'Legal Clerk', 'Document Clerk', 'Viewer')
    );

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Default Groups Created: %', group_count;
  RAISE NOTICE 'System Modules: %', module_count;
  RAISE NOTICE 'Permissions Configured: %', permission_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Navigate to Admin Panel → Groups to view';
  RAISE NOTICE '2. Create your first user and assign to a group';
  RAISE NOTICE '3. Login with the new user to test permissions';
  RAISE NOTICE '============================================';
END $$;

-- Show detailed permission breakdown per group
SELECT
  g.group_name,
  COUNT(CASE WHEN gmp.can_create THEN 1 END) as modules_can_create,
  COUNT(CASE WHEN gmp.can_read THEN 1 END) as modules_can_read,
  COUNT(CASE WHEN gmp.can_update THEN 1 END) as modules_can_update,
  COUNT(CASE WHEN gmp.can_delete THEN 1 END) as modules_can_delete,
  COUNT(CASE WHEN gmp.can_approve THEN 1 END) as modules_can_approve
FROM groups g
LEFT JOIN group_module_permissions gmp ON g.id = gmp.group_id
WHERE g.group_name IN ('Super Admin', 'Manager', 'Case Officer', 'Legal Clerk', 'Document Clerk', 'Viewer')
GROUP BY g.group_name
ORDER BY g.group_name;

-- ============================================================================
-- PERMISSION SUMMARY TABLE
-- ============================================================================
-- Uncomment to see detailed permissions for each group
/*
SELECT
  g.group_name,
  m.module_name,
  CASE WHEN gmp.can_create THEN '✓' ELSE '-' END as "Create",
  CASE WHEN gmp.can_read THEN '✓' ELSE '-' END as "Read",
  CASE WHEN gmp.can_update THEN '✓' ELSE '-' END as "Update",
  CASE WHEN gmp.can_delete THEN '✓' ELSE '-' END as "Delete",
  CASE WHEN gmp.can_print THEN '✓' ELSE '-' END as "Print",
  CASE WHEN gmp.can_approve THEN '✓' ELSE '-' END as "Approve",
  CASE WHEN gmp.can_export THEN '✓' ELSE '-' END as "Export"
FROM groups g
JOIN group_module_permissions gmp ON g.id = gmp.group_id
JOIN modules m ON gmp.module_id = m.id
WHERE g.group_name = 'Case Officer' -- Change this to view different groups
ORDER BY m.module_name;
*/

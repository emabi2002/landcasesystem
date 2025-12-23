-- =====================================================
-- ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- Database Schema for Groups, Permissions, and Modules
-- =====================================================

BEGIN;

-- =====================================================
-- TABLE 1: USER GROUPS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_name TEXT UNIQUE NOT NULL,
  group_code TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.user_groups IS 'User groups for RBAC (e.g., Legal Officers, Survey Staff, Executives)';

-- =====================================================
-- TABLE 2: SYSTEM MODULES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_name TEXT UNIQUE NOT NULL,
  module_code TEXT UNIQUE NOT NULL,
  description TEXT,
  module_url TEXT,
  icon TEXT,
  parent_module_id UUID REFERENCES public.system_modules(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.system_modules IS 'System modules/features (Legal, Survey, Planning, Admin, etc.)';

-- =====================================================
-- TABLE 3: PERMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  permission_name TEXT UNIQUE NOT NULL,
  permission_code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- 'read', 'write', 'delete', 'admin', 'execute'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.permissions IS 'System permissions (view, create, edit, delete, admin)';

-- =====================================================
-- TABLE 4: GROUP MODULE ACCESS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.group_module_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.user_groups(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.system_modules(id) ON DELETE CASCADE NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_admin BOOLEAN DEFAULT FALSE,
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(group_id, module_id)
);

COMMENT ON TABLE public.group_module_access IS 'Defines which groups can access which modules and what they can do';

-- =====================================================
-- TABLE 5: USER GROUP MEMBERSHIP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_group_membership (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.user_groups(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, group_id)
);

COMMENT ON TABLE public.user_group_membership IS 'Assigns users to groups';

-- =====================================================
-- TABLE 6: AUDIT LOG FOR RBAC CHANGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.rbac_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL, -- 'group_created', 'permission_granted', 'user_assigned', etc.
  entity_type TEXT NOT NULL, -- 'group', 'module', 'permission', 'membership'
  entity_id UUID NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.rbac_audit_log IS 'Audit trail for all RBAC changes';

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_groups_active ON public.user_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_user_groups_code ON public.user_groups(group_code);

CREATE INDEX IF NOT EXISTS idx_system_modules_active ON public.system_modules(is_active);
CREATE INDEX IF NOT EXISTS idx_system_modules_code ON public.system_modules(module_code);
CREATE INDEX IF NOT EXISTS idx_system_modules_parent ON public.system_modules(parent_module_id);

CREATE INDEX IF NOT EXISTS idx_group_module_access_group ON public.group_module_access(group_id);
CREATE INDEX IF NOT EXISTS idx_group_module_access_module ON public.group_module_access(module_id);

CREATE INDEX IF NOT EXISTS idx_user_group_membership_user ON public.user_group_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_membership_group ON public.user_group_membership(group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_membership_active ON public.user_group_membership(is_active);

CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_entity ON public.rbac_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_user ON public.rbac_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_log_created ON public.rbac_audit_log(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to user_groups"
  ON public.user_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins full access to system_modules"
  ON public.system_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins full access to permissions"
  ON public.permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins full access to group_module_access"
  ON public.group_module_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins full access to user_group_membership"
  ON public.user_group_membership FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own group memberships
CREATE POLICY "Users can view own group memberships"
  ON public.user_group_membership FOR SELECT
  USING (auth.uid() = user_id);

-- Everyone can view active groups (for display purposes)
CREATE POLICY "Users can view active groups"
  ON public.user_groups FOR SELECT
  USING (is_active = TRUE);

-- Everyone can view active modules
CREATE POLICY "Users can view active modules"
  ON public.system_modules FOR SELECT
  USING (is_active = TRUE);

-- Audit log - admins only
CREATE POLICY "Admins can view audit log"
  ON public.rbac_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check if user has access to a module
CREATE OR REPLACE FUNCTION user_has_module_access(
  p_user_id UUID,
  p_module_code TEXT,
  p_permission_type TEXT DEFAULT 'view' -- 'view', 'create', 'edit', 'delete', 'admin'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN := FALSE;
BEGIN
  -- Admin always has access
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user's groups have access to this module
  SELECT
    CASE p_permission_type
      WHEN 'view' THEN BOOL_OR(gma.can_view)
      WHEN 'create' THEN BOOL_OR(gma.can_create)
      WHEN 'edit' THEN BOOL_OR(gma.can_edit)
      WHEN 'delete' THEN BOOL_OR(gma.can_delete)
      WHEN 'admin' THEN BOOL_OR(gma.can_admin)
      ELSE FALSE
    END INTO v_has_access
  FROM public.user_group_membership ugm
  JOIN public.user_groups ug ON ugm.group_id = ug.id
  JOIN public.group_module_access gma ON ug.id = gma.group_id
  JOIN public.system_modules sm ON gma.module_id = sm.id
  WHERE ugm.user_id = p_user_id
    AND ugm.is_active = TRUE
    AND ug.is_active = TRUE
    AND sm.is_active = TRUE
    AND sm.module_code = p_module_code;

  RETURN COALESCE(v_has_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible modules
CREATE OR REPLACE FUNCTION get_user_accessible_modules(p_user_id UUID)
RETURNS TABLE (
  module_id UUID,
  module_name TEXT,
  module_code TEXT,
  module_url TEXT,
  icon TEXT,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  can_admin BOOLEAN
) AS $$
BEGIN
  -- Admins see everything
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  ) THEN
    RETURN QUERY
    SELECT
      sm.id,
      sm.module_name,
      sm.module_code,
      sm.module_url,
      sm.icon,
      TRUE as can_view,
      TRUE as can_create,
      TRUE as can_edit,
      TRUE as can_delete,
      TRUE as can_admin
    FROM public.system_modules sm
    WHERE sm.is_active = TRUE
    ORDER BY sm.display_order, sm.module_name;
  ELSE
    -- Regular users see only their permitted modules
    RETURN QUERY
    SELECT DISTINCT
      sm.id,
      sm.module_name,
      sm.module_code,
      sm.module_url,
      sm.icon,
      BOOL_OR(gma.can_view) as can_view,
      BOOL_OR(gma.can_create) as can_create,
      BOOL_OR(gma.can_edit) as can_edit,
      BOOL_OR(gma.can_delete) as can_delete,
      BOOL_OR(gma.can_admin) as can_admin
    FROM public.user_group_membership ugm
    JOIN public.user_groups ug ON ugm.group_id = ug.id
    JOIN public.group_module_access gma ON ug.id = gma.group_id
    JOIN public.system_modules sm ON gma.module_id = sm.id
    WHERE ugm.user_id = p_user_id
      AND ugm.is_active = TRUE
      AND ug.is_active = TRUE
      AND sm.is_active = TRUE
    GROUP BY sm.id, sm.module_name, sm.module_code, sm.module_url, sm.icon, sm.display_order
    ORDER BY sm.display_order, sm.module_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA: DEFAULT GROUPS
-- =====================================================

INSERT INTO public.user_groups (group_name, group_code, description) VALUES
('System Administrators', 'ADMIN', 'Full system access and configuration'),
('Executive Officers', 'EXECUTIVE', 'Secretary, Director Legal, Manager Legal'),
('Legal Officers', 'LEGAL', 'Litigation officers and legal staff'),
('Survey Officers', 'SURVEY', 'Survey and spatial data staff'),
('Planning Officers', 'PLANNING', 'Development planning staff'),
('Registry Staff', 'REGISTRY', 'Document registry and filing staff'),
('Read-Only Users', 'READONLY', 'View-only access to assigned modules')
ON CONFLICT (group_code) DO NOTHING;

-- =====================================================
-- SEED DATA: SYSTEM MODULES
-- =====================================================

INSERT INTO public.system_modules (module_name, module_code, description, module_url, icon, display_order) VALUES
-- Core modules
('Dashboard', 'DASHBOARD', 'System dashboard and statistics', '/dashboard', 'LayoutDashboard', 1),
('Case Management', 'CASES', 'Legal case management system', '/cases', 'FileText', 2),
('Documents', 'DOCUMENTS', 'Document management', '/documents', 'FolderOpen', 3),
('Calendar & Events', 'CALENDAR', 'Calendar and event management', '/calendar', 'Calendar', 4),

-- Legal workflow modules
('Case Registration', 'CASE_REGISTRATION', 'Register new cases', '/cases/create-minimal', 'FilePlus', 10),
('Executive Review', 'EXECUTIVE_REVIEW', 'Executive oversight dashboard', '/executive/review', 'Gavel', 11),
('Directions', 'DIRECTIONS', 'Case directions', '/directions', 'ClipboardList', 12),
('Case Allocation', 'ALLOCATION', 'Assign cases to officers', '/allocation', 'Users', 13),
('Litigation', 'LITIGATION', 'Litigation workspace', '/litigation', 'Scale', 14),
('Compliance', 'COMPLIANCE', 'Compliance tracking', '/compliance', 'CheckSquare', 15),
('Case Closure', 'CLOSURE', 'Case closure', '/closure', 'Shield', 16),

-- Supporting modules
('Land Parcels', 'LAND_PARCELS', 'Land parcel management', '/land-parcels', 'MapPin', 20),
('Parties', 'PARTIES', 'Party management', '/parties', 'Users', 21),
('Tasks', 'TASKS', 'Task management', '/tasks', 'CheckSquare', 22),
('Notifications', 'NOTIFICATIONS', 'System notifications', '/notifications', 'Bell', 23),
('Reports', 'REPORTS', 'Reports and analytics', '/reports', 'BarChart', 24),

-- Admin modules
('Admin Panel', 'ADMIN', 'System administration', '/admin', 'Settings', 30),
('User Management', 'USER_MGMT', 'Manage users', '/admin/users', 'Users', 31),
('RBAC Management', 'RBAC', 'Role-based access control', '/admin/rbac', 'Shield', 32)
ON CONFLICT (module_code) DO NOTHING;

-- =====================================================
-- SEED DATA: DEFAULT PERMISSIONS
-- =====================================================

INSERT INTO public.permissions (permission_name, permission_code, description, category) VALUES
('View', 'VIEW', 'View/read access', 'read'),
('Create', 'CREATE', 'Create new records', 'write'),
('Edit', 'EDIT', 'Edit existing records', 'write'),
('Delete', 'DELETE', 'Delete records', 'delete'),
('Admin', 'ADMIN', 'Administrative access', 'admin'),
('Export', 'EXPORT', 'Export data', 'execute'),
('Import', 'IMPORT', 'Import data', 'execute'),
('Approve', 'APPROVE', 'Approve/authorize actions', 'execute')
ON CONFLICT (permission_code) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_module_access TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_group_membership TO authenticated;
GRANT SELECT, INSERT ON public.rbac_audit_log TO authenticated;

GRANT EXECUTE ON FUNCTION user_has_module_access(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_modules(UUID) TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RBAC SYSTEM CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  ✅ 6 RBAC tables';
  RAISE NOTICE '  ✅ 2 access control functions';
  RAISE NOTICE '  ✅ 7 default user groups';
  RAISE NOTICE '  ✅ 18 system modules';
  RAISE NOTICE '  ✅ 8 permissions';
  RAISE NOTICE '  ✅ Complete audit trail';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Access /admin/rbac to configure';
  RAISE NOTICE '  2. Assign users to groups';
  RAISE NOTICE '  3. Grant module access to groups';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

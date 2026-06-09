-- =============================================================================
-- RBAC (Role-Based Access Control) Database Schema
-- =============================================================================
-- This schema implements enterprise-grade permission management for the
-- DLPP Legal Case Management System
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. GROUPS TABLE
-- -----------------------------------------------------------------------------
-- Groups represent roles in the system (e.g., Super Admin, Case Officer, Auditor)

-- =============================================================================
-- CLEAN INSTALL: Drop all existing RBAC objects if they exist
-- =============================================================================
-- Note: We drop in reverse dependency order to avoid conflicts

-- Step 1: Drop tables (CASCADE will automatically drop dependent triggers and policies)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.group_module_permissions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;

-- Step 2: Drop functions (after tables since tables may reference them)
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission(UUID, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create groups table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_groups_name ON public.groups(group_name);

-- -----------------------------------------------------------------------------
-- 2. MODULES TABLE
-- -----------------------------------------------------------------------------
-- Modules represent distinct features/sections of the application
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(100) NOT NULL,
    module_key VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    route VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for module_key lookups
CREATE INDEX IF NOT EXISTS idx_modules_key ON public.modules(module_key);

-- -----------------------------------------------------------------------------
-- 3. GROUP_MODULE_PERMISSIONS TABLE (CORE RBAC TABLE)
-- -----------------------------------------------------------------------------
-- This table defines what each group can do in each module
CREATE TABLE public.group_module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_print BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, module_id)
);

-- Add indexes for faster permission checks
CREATE INDEX IF NOT EXISTS idx_group_module_perms_group ON public.group_module_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_module_perms_module ON public.group_module_permissions(module_id);

-- -----------------------------------------------------------------------------
-- 4. USER_GROUPS TABLE (Many-to-Many Relationship)
-- -----------------------------------------------------------------------------
-- Maps users to their assigned groups
CREATE TABLE public.user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, group_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_groups_user ON public.user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group ON public.user_groups(group_id);

-- -----------------------------------------------------------------------------
-- 5. AUDIT_LOGS TABLE
-- -----------------------------------------------------------------------------
-- Tracks all user actions for compliance and security
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'print', 'export', 'approve')),
    record_id UUID,
    record_type VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_logged_at ON public.audit_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module_id);

-- -----------------------------------------------------------------------------
-- 6. SEED DEFAULT GROUPS
-- -----------------------------------------------------------------------------
INSERT INTO public.groups (group_name, description) VALUES
    ('Super Admin', 'Full system access with all permissions'),
    ('Department Admin', 'Administrative access within department scope'),
    ('Case Officer', 'Manage and process legal cases'),
    ('Legal Officer', 'Handle litigation and legal matters'),
    ('Data Entry Clerk', 'Basic data entry capabilities'),
    ('Auditor', 'Read-only access for audit and compliance'),
    ('Manager', 'Managerial oversight and approval rights'),
    ('Reception', 'Case registration and initial intake')
ON CONFLICT (group_name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. SEED DEFAULT MODULES
-- -----------------------------------------------------------------------------
INSERT INTO public.modules (module_name, module_key, description, icon, route) VALUES
    ('Dashboard', 'dashboard', 'Main dashboard and analytics', 'LayoutDashboard', '/dashboard'),
    ('Case Registration', 'case_registration', 'Register new cases', 'FileText', '/cases/create-minimal'),
    ('Case Management', 'case_management', 'Manage all cases', 'FolderOpen', '/cases'),
    ('Directions', 'directions', 'Secretary/Director instructions', 'ClipboardList', '/directions'),
    ('Case Allocation', 'case_allocation', 'Assign cases to officers', 'Users', '/allocation'),
    ('Litigation', 'litigation', 'Litigation and filings management', 'Scale', '/litigation'),
    ('Compliance Tracking', 'compliance_tracking', 'Track compliance requirements', 'CheckSquare', '/compliance'),
    ('Case Closure', 'case_closure', 'Close completed cases', 'Shield', '/closure'),
    ('Calendar', 'calendar', 'Events and deadlines', 'Calendar', '/calendar'),
    ('Tasks', 'tasks', 'Task management', 'ListTodo', '/tasks'),
    ('Documents', 'documents', 'Document repository', 'FileText', '/documents'),
    ('Land Parcels', 'land_parcels', 'Land parcel information', 'MapPin', '/land-parcels'),
    ('Communications', 'communications', 'Communication logs', 'MessageSquare', '/communications'),
    ('Correspondence', 'correspondence', 'Incoming/outgoing correspondence', 'Mail', '/correspondence'),
    ('File Requests', 'file_requests', 'File movement tracking', 'FileSearch', '/file-requests'),
    ('Lawyers', 'lawyers', 'External lawyer management', 'Users', '/lawyers'),
    ('Filings', 'filings', 'Court filings', 'FileText', '/filings'),
    ('Litigation Costs', 'litigation_costs', 'Financial tracking', 'DollarSign', '/litigation-costs'),
    ('Reports', 'reports', 'Generate reports', 'BarChart3', '/reports'),
    ('Notifications', 'notifications', 'System notifications', 'Bell', '/notifications'),
    ('User Management', 'user_management', 'Manage system users', 'UserCog', '/admin/users'),
    ('Group Management', 'group_management', 'Manage user groups and permissions', 'Settings', '/admin/groups'),
    ('System Administration', 'system_admin', 'System configuration', 'Settings', '/admin')
ON CONFLICT (module_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. SEED SUPER ADMIN PERMISSIONS (Full Access)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    super_admin_id UUID;
    module_record RECORD;
BEGIN
    -- Get Super Admin group ID
    SELECT id INTO super_admin_id FROM public.groups WHERE group_name = 'Super Admin';

    -- Grant all permissions to Super Admin for all modules
    FOR module_record IN SELECT id FROM public.modules LOOP
        INSERT INTO public.group_module_permissions (
            group_id, module_id,
            can_create, can_read, can_update, can_delete,
            can_print, can_approve, can_export
        ) VALUES (
            super_admin_id, module_record.id,
            TRUE, TRUE, TRUE, TRUE,
            TRUE, TRUE, TRUE
        ) ON CONFLICT (group_id, module_id) DO NOTHING;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read groups and modules (for UI display)
CREATE POLICY "Allow read access to groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow read access to modules" ON public.modules FOR SELECT USING (true);

-- Policy: Users can read their own group assignments
CREATE POLICY "Users can read their own groups" ON public.user_groups
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can read permissions for their groups
CREATE POLICY "Users can read their group permissions" ON public.group_module_permissions
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.user_groups WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can read their own audit logs
CREATE POLICY "Users can read their own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only admins can modify RBAC tables (implement via service role)
CREATE POLICY "Only service role can modify groups" ON public.groups
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can modify modules" ON public.modules
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can modify permissions" ON public.group_module_permissions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can modify user groups" ON public.user_groups
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- 10. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to check if user has specific permission for a module
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_module_key VARCHAR,
    p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_groups ug
        JOIN public.group_module_permissions gmp ON ug.group_id = gmp.group_id
        JOIN public.modules m ON gmp.module_id = m.id
        WHERE ug.user_id = p_user_id
        AND m.module_key = p_module_key
        AND (
            (p_action = 'create' AND gmp.can_create = TRUE) OR
            (p_action = 'read' AND gmp.can_read = TRUE) OR
            (p_action = 'update' AND gmp.can_update = TRUE) OR
            (p_action = 'delete' AND gmp.can_delete = TRUE) OR
            (p_action = 'print' AND gmp.can_print = TRUE) OR
            (p_action = 'approve' AND gmp.can_approve = TRUE) OR
            (p_action = 'export' AND gmp.can_export = TRUE)
        )
    ) INTO has_perm;

    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    module_key VARCHAR,
    module_name VARCHAR,
    can_create BOOLEAN,
    can_read BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    can_print BOOLEAN,
    can_approve BOOLEAN,
    can_export BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.module_key,
        m.module_name,
        BOOL_OR(gmp.can_create) as can_create,
        BOOL_OR(gmp.can_read) as can_read,
        BOOL_OR(gmp.can_update) as can_update,
        BOOL_OR(gmp.can_delete) as can_delete,
        BOOL_OR(gmp.can_print) as can_print,
        BOOL_OR(gmp.can_approve) as can_approve,
        BOOL_OR(gmp.can_export) as can_export
    FROM public.user_groups ug
    JOIN public.group_module_permissions gmp ON ug.group_id = gmp.group_id
    JOIN public.modules m ON gmp.module_id = m.id
    WHERE ug.user_id = p_user_id
    GROUP BY m.module_key, m.module_name
    ORDER BY m.module_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 11. TRIGGERS FOR UPDATED_AT
-- -----------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_module_permissions_updated_at BEFORE UPDATE ON public.group_module_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- SCHEMA CREATION COMPLETE
-- -----------------------------------------------------------------------------
-- Run this script in your Supabase SQL Editor to create the RBAC system
-- After running, you can manage groups, modules, and permissions through the admin UI
-- -----------------------------------------------------------------------------

-- ============================================
-- ROLE-BASED ACCESS CONTROL SYSTEM
-- ============================================
-- This script adds role-based permissions to users table
-- and creates the necessary infrastructure
-- ============================================

-- Add role column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN role TEXT DEFAULT 'officer'
    CHECK (role IN ('executive', 'manager', 'lawyer', 'officer', 'admin'));
    
    RAISE NOTICE '✅ Added role column to users table';
  ELSE
    RAISE NOTICE 'ℹ️  Role column already exists';
  END IF;
END $$;

-- Create roles reference table
CREATE TABLE IF NOT EXISTS public.system_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  role_key TEXT UNIQUE NOT NULL,
  role_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.system_roles IS 'System roles and their permissions configuration';

-- Insert role definitions
INSERT INTO public.system_roles (role_key, role_name, description, permissions) VALUES
  ('executive', 'Executive Management', 'See dashboard and comment on directions (Step 2)', 
   '{"canAccessReception": false, "canAccessDirections": true, "canCommentDirections": true, "canAccessRegistration": false, "canAccessOfficerActions": false, "canAccessExternalFilings": false, "canAccessCompliance": false, "canAccessClosure": false, "canAccessPartiesLawyers": false, "canAccessAdmin": false, "canViewAllCases": true, "canCreateCase": false}'::jsonb),
  
  ('manager', 'Manager', 'Full access to all modules',
   '{"canAccessReception": true, "canAccessDirections": true, "canCommentDirections": true, "canAccessRegistration": true, "canAccessOfficerActions": true, "canAccessExternalFilings": true, "canAccessCompliance": true, "canAccessClosure": true, "canAccessPartiesLawyers": true, "canAccessAdmin": false, "canViewAllCases": true, "canCreateCase": true}'::jsonb),
  
  ('lawyer', 'Lawyer / Legal Officer', 'Step 3 through case closure',
   '{"canAccessReception": false, "canAccessDirections": false, "canCommentDirections": false, "canAccessRegistration": true, "canAccessOfficerActions": true, "canAccessExternalFilings": true, "canAccessCompliance": true, "canAccessClosure": true, "canAccessPartiesLawyers": true, "canAccessAdmin": false, "canViewAllCases": true, "canCreateCase": true}'::jsonb),
  
  ('officer', 'Officer / Registry Clerk', 'Step 1 - Document reception only',
   '{"canAccessReception": true, "canAccessDirections": false, "canCommentDirections": false, "canAccessRegistration": false, "canAccessOfficerActions": false, "canAccessExternalFilings": false, "canAccessCompliance": false, "canAccessClosure": false, "canAccessPartiesLawyers": false, "canAccessAdmin": false, "canViewAllCases": true, "canCreateCase": true}'::jsonb),
  
  ('admin', 'System Administrator', 'Full system access + user management',
   '{"canAccessReception": true, "canAccessDirections": true, "canCommentDirections": true, "canAccessRegistration": true, "canAccessOfficerActions": true, "canAccessExternalFilings": true, "canAccessCompliance": true, "canAccessClosure": true, "canAccessPartiesLawyers": true, "canAccessAdmin": true, "canViewAllCases": true, "canCreateCase": true}'::jsonb)

ON CONFLICT (role_key) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Enable RLS on system_roles
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for system_roles
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.system_roles;
CREATE POLICY "Allow all for authenticated users" ON public.system_roles
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create audit log table for role changes
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

COMMENT ON TABLE public.user_role_audit IS 'Audit trail for user role changes';

-- Enable RLS on audit table
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for audit table
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_role_audit;
CREATE POLICY "Allow all for authenticated users" ON public.user_role_audit
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create function to log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.user_role_audit (user_id, old_role, new_role, changed_by)
    VALUES (NEW.id, OLD.role, NEW.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS trigger_log_role_change ON public.users;
CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- Create function to check user permission
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_permissions JSONB;
BEGIN
  -- Get user's role
  SELECT role INTO v_role
  FROM public.users
  WHERE id = p_user_id;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get role's permissions
  SELECT permissions INTO v_permissions
  FROM public.system_roles
  WHERE role_key = v_role;

  IF v_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check specific permission
  RETURN (v_permissions->>p_permission)::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_permission IS 'Check if user has specific permission based on their role';

-- Create function to get user's full permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_role TEXT;
  v_permissions JSONB;
BEGIN
  -- Get user's role
  SELECT role INTO v_role
  FROM public.users
  WHERE id = p_user_id;

  IF v_role IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;

  -- Get role's permissions
  SELECT permissions INTO v_permissions
  FROM public.system_roles
  WHERE role_key = v_role;

  RETURN COALESCE(v_permissions, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user based on their role';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ROLE-BASED ACCESS CONTROL READY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'ROLES CREATED:';
  RAISE NOTICE '  1. Executive Management - Dashboard + Directions (Step 2)';
  RAISE NOTICE '  2. Manager - Full access to all modules';
  RAISE NOTICE '  3. Lawyer/Legal Officer - Steps 3-7 (Registration to Closure)';
  RAISE NOTICE '  4. Officer/Registry Clerk - Step 1 (Document Reception)';
  RAISE NOTICE '  5. System Administrator - Full access + user management';
  RAISE NOTICE '';
  RAISE NOTICE 'FEATURES:';
  RAISE NOTICE '  ✅ Role column added to users table';
  RAISE NOTICE '  ✅ System roles table created';
  RAISE NOTICE '  ✅ Audit trail for role changes';
  RAISE NOTICE '  ✅ Permission checking functions';
  RAISE NOTICE '  ✅ RLS policies enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '  1. Assign roles to existing users';
  RAISE NOTICE '  2. Create new users with roles via admin panel';
  RAISE NOTICE '  3. Implement role checks in workflow modules';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

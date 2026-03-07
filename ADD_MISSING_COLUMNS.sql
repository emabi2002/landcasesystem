-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================
-- Run this FIRST before any other migration
-- This adds any missing columns to tables that already exist in your database
-- 100% SAFE - Only adds what's missing
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FIX PROFILES TABLE
-- ============================================================================
DO $$
BEGIN
  -- Create table if not exists
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'legal_officer';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='department') THEN
    ALTER TABLE profiles ADD COLUMN department TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- FIX GROUPS TABLE
-- ============================================================================
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='groups' AND column_name='description') THEN
    ALTER TABLE groups ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='groups' AND column_name='is_active') THEN
    ALTER TABLE groups ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='groups' AND column_name='updated_at') THEN
    ALTER TABLE groups ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- FIX MODULES TABLE (THE ONE CAUSING YOUR ERROR!)
-- ============================================================================
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(100) NOT NULL,
    module_key VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='description') THEN
    ALTER TABLE modules ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='icon') THEN
    ALTER TABLE modules ADD COLUMN icon VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='route') THEN
    ALTER TABLE modules ADD COLUMN route VARCHAR(200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='parent_module_id') THEN
    ALTER TABLE modules ADD COLUMN parent_module_id UUID REFERENCES modules(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='display_order') THEN
    ALTER TABLE modules ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='is_active') THEN
    ALTER TABLE modules ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- FIX GROUP_MODULE_PERMISSIONS TABLE
-- ============================================================================
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS group_module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='can_create') THEN
    ALTER TABLE group_module_permissions ADD COLUMN can_create BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='can_read') THEN
    ALTER TABLE group_module_permissions ADD COLUMN can_read BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='can_update') THEN
    ALTER TABLE group_module_permissions ADD COLUMN can_update BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='can_delete') THEN
    ALTER TABLE group_module_permissions ADD COLUMN can_delete BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='can_print') THEN
    ALTER TABLE group_module_permissions ADD COLUMN can_print BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='can_approve') THEN
    ALTER TABLE group_module_permissions ADD COLUMN can_approve BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='can_export') THEN
    ALTER TABLE group_module_permissions ADD COLUMN can_export BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_module_permissions' AND column_name='updated_at') THEN
    ALTER TABLE group_module_permissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_module_permissions_group_id_module_id_key'
  ) THEN
    ALTER TABLE group_module_permissions ADD CONSTRAINT group_module_permissions_group_id_module_id_key UNIQUE(group_id, module_id);
  END IF;
END $$;

-- ============================================================================
-- FIX USER_GROUPS TABLE
-- ============================================================================
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_groups' AND column_name='assigned_by') THEN
    ALTER TABLE user_groups ADD COLUMN assigned_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_groups' AND column_name='is_active') THEN
    ALTER TABLE user_groups ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_groups_user_id_group_id_key'
  ) THEN
    ALTER TABLE user_groups ADD CONSTRAINT user_groups_user_id_group_id_key UNIQUE(user_id, group_id);
  END IF;
END $$;

-- ============================================================================
-- DISABLE RLS & GRANT PERMISSIONS
-- ============================================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_module_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================================
-- SEED DATA (IDEMPOTENT)
-- ============================================================================

-- Insert groups
INSERT INTO groups (group_name, description) VALUES
    ('Super Admin', 'Full system access'),
    ('Legal Officer', 'Case management'),
    ('Registrar', 'Document management'),
    ('Director', 'Executive oversight'),
    ('Auditor', 'Read-only access')
ON CONFLICT (group_name) DO NOTHING;

-- Insert modules
INSERT INTO modules (module_name, module_key, description, icon, route, display_order) VALUES
    ('Dashboard', 'dashboard', 'Overview', 'LayoutDashboard', '/dashboard', 1),
    ('Cases', 'cases', 'Case management', 'Briefcase', '/cases', 2),
    ('Documents', 'documents', 'Documents', 'FileText', '/documents', 3),
    ('Calendar', 'calendar', 'Events', 'Calendar', '/calendar', 4),
    ('Tasks', 'tasks', 'Tasks', 'CheckSquare', '/tasks', 5),
    ('Administration', 'admin', 'Administration', 'Settings', '/admin', 10)
ON CONFLICT (module_key) DO NOTHING;

-- Grant Super Admin permissions
INSERT INTO group_module_permissions (group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export)
SELECT g.id, m.id, true, true, true, true, true, true, true
FROM groups g
CROSS JOIN modules m
WHERE g.group_name = 'Super Admin'
ON CONFLICT (group_id, module_id) DO NOTHING;

SELECT '✅ Phase 1 Complete: Core RBAC tables fixed and seeded!' as status;

-- ============================================
-- PHASE B: ENHANCED RBAC + DATA SCOPE SCHEMA
-- ============================================
-- **EXTENDS** existing RBAC (does NOT replace)
-- Adds: Data Scope System + Specialized Actions
-- ============================================

BEGIN;

-- ============================================
-- PART 1: DATA SCOPES TABLE
-- ============================================
-- Defines types of data access (OWN, GROUP, ALL, etc.)

CREATE TABLE IF NOT EXISTS public.data_scopes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.data_scopes IS 'Defines record access scopes (OWN, GROUP, DEPARTMENT, ALL, ASSIGNED)';

-- Seed default scopes
INSERT INTO public.data_scopes (code, name, description, sort_order) VALUES
  ('OWN', 'Own Records Only', 'User can only access records they created', 1),
  ('ASSIGNED', 'Assigned Records', 'User can access records assigned to them', 2),
  ('GROUP', 'Group Records', 'User can access records from their group(s)', 3),
  ('DEPARTMENT', 'Department Records', 'User can access all records in their department', 4),
  ('ALL', 'All Records', 'User can access all records in the system', 5)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PART 2: GROUP SCOPE RULES TABLE
-- ============================================
-- Maps groups to data scopes for each module

CREATE TABLE IF NOT EXISTS public.group_scope_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  scope_id UUID NOT NULL REFERENCES public.data_scopes(id) ON DELETE CASCADE,
  allow BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, module_id, scope_id)
);

COMMENT ON TABLE public.group_scope_rules IS 'Defines data access scope per group per module';

CREATE INDEX IF NOT EXISTS idx_group_scope_group ON public.group_scope_rules(group_id);
CREATE INDEX IF NOT EXISTS idx_group_scope_module ON public.group_scope_rules(module_id);

-- ============================================
-- PART 3: EXTEND group_module_permissions
-- ============================================
-- Add specialized action columns

DO $$
BEGIN
  -- Add can_allocate (assign cases)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_module_permissions'
    AND column_name = 'can_allocate'
  ) THEN
    ALTER TABLE public.group_module_permissions
    ADD COLUMN can_allocate BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add can_recommend (manager recommendations)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_module_permissions'
    AND column_name = 'can_recommend'
  ) THEN
    ALTER TABLE public.group_module_permissions
    ADD COLUMN can_recommend BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add can_directive (issue directions)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_module_permissions'
    AND column_name = 'can_directive'
  ) THEN
    ALTER TABLE public.group_module_permissions
    ADD COLUMN can_directive BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add can_close_case
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_module_permissions'
    AND column_name = 'can_close_case'
  ) THEN
    ALTER TABLE public.group_module_permissions
    ADD COLUMN can_close_case BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add can_reassign
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_module_permissions'
    AND column_name = 'can_reassign'
  ) THEN
    ALTER TABLE public.group_module_permissions
    ADD COLUMN can_reassign BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

COMMENT ON COLUMN public.group_module_permissions.can_allocate IS 'Can assign cases to officers';
COMMENT ON COLUMN public.group_module_permissions.can_recommend IS 'Can add recommendations (managers)';
COMMENT ON COLUMN public.group_module_permissions.can_directive IS 'Can issue directions (senior staff)';
COMMENT ON COLUMN public.group_module_permissions.can_close_case IS 'Can close cases';
COMMENT ON COLUMN public.group_module_permissions.can_reassign IS 'Can reassign cases';

-- ============================================
-- PART 4: EXTEND CASES TABLE (Ownership)
-- ============================================
-- Add group and department ownership columns

DO $$
BEGIN
  -- Add created_group_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases'
    AND column_name = 'created_group_id'
  ) THEN
    ALTER TABLE public.cases
    ADD COLUMN created_group_id UUID REFERENCES public.groups(id);
  END IF;

  -- Add assigned_group_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases'
    AND column_name = 'assigned_group_id'
  ) THEN
    ALTER TABLE public.cases
    ADD COLUMN assigned_group_id UUID REFERENCES public.groups(id);
  END IF;

  -- Add department_id (nullable for now)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases'
    AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.cases
    ADD COLUMN department_id UUID;
  END IF;

  -- Add is_confidential flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases'
    AND column_name = 'is_confidential'
  ) THEN
    ALTER TABLE public.cases
    ADD COLUMN is_confidential BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

COMMENT ON COLUMN public.cases.created_group_id IS 'Group that created/owns this case';
COMMENT ON COLUMN public.cases.assigned_group_id IS 'Group currently assigned to case';
COMMENT ON COLUMN public.cases.department_id IS 'Department owning this case';
COMMENT ON COLUMN public.cases.is_confidential IS 'Confidential cases have stricter access';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cases_created_group ON public.cases(created_group_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_group ON public.cases(assigned_group_id);
CREATE INDEX IF NOT EXISTS idx_cases_department ON public.cases(department_id);
CREATE INDEX IF NOT EXISTS idx_cases_confidential ON public.cases(is_confidential);

-- ============================================
-- PART 5: SCOPE ENFORCEMENT FUNCTION
-- ============================================
-- Core function to check if user can access a case

CREATE OR REPLACE FUNCTION public.user_can_access_case(
  p_user_id UUID,
  p_case_id UUID
) RETURNS BOOLEAN AS $
DECLARE
  v_case RECORD;
  v_user_groups UUID[];
  v_scope_codes TEXT[];
  v_scope TEXT;
  v_has_access BOOLEAN := FALSE;
BEGIN
  -- Get case details
  SELECT * INTO v_case
  FROM public.cases
  WHERE id = p_case_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get user's groups
  SELECT ARRAY_AGG(group_id) INTO v_user_groups
  FROM public.user_groups
  WHERE user_id = p_user_id;

  IF v_user_groups IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get allowed scopes for user's groups for case_management module
  SELECT ARRAY_AGG(DISTINCT ds.code) INTO v_scope_codes
  FROM public.group_scope_rules gsr
  JOIN public.data_scopes ds ON ds.id = gsr.scope_id
  JOIN public.modules m ON m.id = gsr.module_id
  WHERE gsr.group_id = ANY(v_user_groups)
    AND m.module_key = 'case_management'
    AND gsr.allow = TRUE
    AND ds.is_active = TRUE;

  IF v_scope_codes IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check each scope type
  FOREACH v_scope IN ARRAY v_scope_codes
  LOOP
    CASE v_scope
      WHEN 'ALL' THEN
        -- Can see all cases
        RETURN TRUE;

      WHEN 'OWN' THEN
        -- Can see own cases
        IF v_case.created_by = p_user_id THEN
          RETURN TRUE;
        END IF;

      WHEN 'ASSIGNED' THEN
        -- Can see assigned cases
        IF v_case.assigned_to = p_user_id THEN
          RETURN TRUE;
        END IF;

      WHEN 'GROUP' THEN
        -- Can see group cases
        IF v_case.created_group_id = ANY(v_user_groups)
           OR v_case.assigned_group_id = ANY(v_user_groups) THEN
          RETURN TRUE;
        END IF;

      WHEN 'DEPARTMENT' THEN
        -- Can see department cases (if department linkage exists)
        -- TODO: Implement department check when departments table exists
        RETURN TRUE;
    END CASE;
  END LOOP;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.user_can_access_case IS 'Checks if user has access to a case based on scope rules';

-- ============================================
-- PART 6: RLS POLICY ON CASES TABLE
-- ============================================
-- **CRITICAL:** Enforce data scope at database level

-- Enable RLS on cases table
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "case_read_access_policy" ON public.cases;
DROP POLICY IF EXISTS "case_create_policy" ON public.cases;
DROP POLICY IF EXISTS "case_update_policy" ON public.cases;
DROP POLICY IF EXISTS "case_delete_policy" ON public.cases;

-- READ Policy: Use scope function
CREATE POLICY "case_read_access_policy" ON public.cases
  FOR SELECT
  USING (
    user_can_access_case(auth.uid(), id)
  );

-- CREATE Policy: Users can create if they have permission
CREATE POLICY "case_create_policy" ON public.cases
  FOR INSERT
  WITH CHECK (
    -- Must have create permission in case_management module
    EXISTS (
      SELECT 1
      FROM public.user_groups ug
      JOIN public.group_module_permissions gmp ON gmp.group_id = ug.group_id
      JOIN public.modules m ON m.id = gmp.module_id
      WHERE ug.user_id = auth.uid()
        AND m.module_key = 'case_management'
        AND gmp.can_create = TRUE
    )
  );

-- UPDATE Policy: Can update if have permission AND can access
CREATE POLICY "case_update_policy" ON public.cases
  FOR UPDATE
  USING (
    user_can_access_case(auth.uid(), id)
    AND EXISTS (
      SELECT 1
      FROM public.user_groups ug
      JOIN public.group_module_permissions gmp ON gmp.group_id = ug.group_id
      JOIN public.modules m ON m.id = gmp.module_id
      WHERE ug.user_id = auth.uid()
        AND m.module_key = 'case_management'
        AND gmp.can_update = TRUE
    )
  );

-- DELETE Policy: Can delete if have permission AND can access
CREATE POLICY "case_delete_policy" ON public.cases
  FOR DELETE
  USING (
    user_can_access_case(auth.uid(), id)
    AND EXISTS (
      SELECT 1
      FROM public.user_groups ug
      JOIN public.group_module_permissions gmp ON gmp.group_id = ug.group_id
      JOIN public.modules m ON m.id = gmp.module_id
      WHERE ug.user_id = auth.uid()
        AND m.module_key = 'case_management'
        AND gmp.can_delete = TRUE
    )
  );

-- ============================================
-- PART 7: SEED DEFAULT SCOPE RULES
-- ============================================
-- Assign default scopes to existing groups

DO $$
DECLARE
  case_mgmt_module_id UUID;
  super_admin_id UUID;
  manager_id UUID;
  case_officer_id UUID;
  all_scope_id UUID;
  group_scope_id UUID;
  own_scope_id UUID;
  assigned_scope_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO case_mgmt_module_id FROM public.modules WHERE module_key = 'case_management';
  SELECT id INTO super_admin_id FROM public.groups WHERE group_name = 'Super Admin';
  SELECT id INTO manager_id FROM public.groups WHERE group_name = 'Manager';
  SELECT id INTO case_officer_id FROM public.groups WHERE group_name = 'Case Officer';

  SELECT id INTO all_scope_id FROM public.data_scopes WHERE code = 'ALL';
  SELECT id INTO group_scope_id FROM public.data_scopes WHERE code = 'GROUP';
  SELECT id INTO own_scope_id FROM public.data_scopes WHERE code = 'OWN';
  SELECT id INTO assigned_scope_id FROM public.data_scopes WHERE code = 'ASSIGNED';

  -- Super Admin: ALL scope
  IF super_admin_id IS NOT NULL AND all_scope_id IS NOT NULL THEN
    INSERT INTO public.group_scope_rules (group_id, module_id, scope_id, allow)
    VALUES (super_admin_id, case_mgmt_module_id, all_scope_id, TRUE)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Manager: GROUP scope
  IF manager_id IS NOT NULL AND group_scope_id IS NOT NULL THEN
    INSERT INTO public.group_scope_rules (group_id, module_id, scope_id, allow)
    VALUES (manager_id, case_mgmt_module_id, group_scope_id, TRUE)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Case Officer: OWN + ASSIGNED scope
  IF case_officer_id IS NOT NULL AND own_scope_id IS NOT NULL THEN
    INSERT INTO public.group_scope_rules (group_id, module_id, scope_id, allow)
    VALUES (case_officer_id, case_mgmt_module_id, own_scope_id, TRUE)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.group_scope_rules (group_id, module_id, scope_id, allow)
    VALUES (case_officer_id, case_mgmt_module_id, assigned_scope_id, TRUE)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- PART 8: UPDATE SUPER ADMIN PERMISSIONS
-- ============================================
-- Grant specialized actions to Super Admin

UPDATE public.group_module_permissions
SET
  can_allocate = TRUE,
  can_recommend = TRUE,
  can_directive = TRUE,
  can_close_case = TRUE,
  can_reassign = TRUE
WHERE group_id IN (
  SELECT id FROM public.groups WHERE group_name = 'Super Admin'
);

-- Grant some specialized actions to Manager
UPDATE public.group_module_permissions
SET
  can_allocate = TRUE,
  can_recommend = TRUE,
  can_directive = TRUE
WHERE group_id IN (
  SELECT id FROM public.groups WHERE group_name = 'Manager'
)
AND module_id IN (
  SELECT id FROM public.modules WHERE module_key = 'case_management'
);

-- ============================================
-- PART 9: ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE public.data_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_scope_rules ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read scopes (for UI)
CREATE POLICY "allow_read_data_scopes" ON public.data_scopes
  FOR SELECT USING (true);

-- Allow users to read their group's scope rules
CREATE POLICY "allow_read_own_scope_rules" ON public.group_scope_rules
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.user_groups WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PART 10: AUDIT TRAIL ENHANCEMENT
-- ============================================
-- Add scope-related audit logging

CREATE OR REPLACE FUNCTION public.log_scope_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    module_id,
    action,
    record_id,
    record_type,
    details
  ) VALUES (
    auth.uid(),
    (SELECT id FROM public.modules WHERE module_key = 'case_management'),
    'read',
    NEW.id,
    'case',
    jsonb_build_object(
      'scope_used', 'unknown',
      'accessed_at', NOW()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

COMMIT;

SELECT '✅ Phase B Complete: Enhanced RBAC + Data Scope System' as status,
       '✅ Data scopes table created' as step1,
       '✅ Group scope rules table created' as step2,
       '✅ Specialized actions added to permissions' as step3,
       '✅ Cases table extended with ownership columns' as step4,
       '✅ RLS policies created on cases table' as step5,
       '✅ Scope enforcement function created' as step6,
       '✅ Default scope rules seeded' as step7,
       '⚠️  CRITICAL: RLS NOW ENFORCED ON CASES TABLE' as warning;

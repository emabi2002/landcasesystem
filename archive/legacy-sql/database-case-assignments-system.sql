-- ============================================================================
-- CASE ASSIGNMENTS SYSTEM - Enhanced Assignment Management
-- ============================================================================
-- This script creates the case_assignments table and supporting structures
-- for managing case assignments to litigation officers
--
-- Features:
-- - Prevent duplicate assignments
-- - Track assignment history
-- - Support reassignments with reasons
-- - Store briefing notes
-- - Concurrency protection
-- ============================================================================

-- Step 1: Create case_assignments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS case_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Case and Officer references
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  officer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Assignment details
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reassigned', 'closed')),

  -- Briefing and notes
  briefing_note TEXT,
  assignment_notes TEXT,

  -- Reassignment tracking
  reassignment_reason TEXT,
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id
  ON case_assignments(case_id);

CREATE INDEX IF NOT EXISTS idx_case_assignments_officer
  ON case_assignments(officer_user_id);

CREATE INDEX IF NOT EXISTS idx_case_assignments_status
  ON case_assignments(status);

CREATE INDEX IF NOT EXISTS idx_case_assignments_active
  ON case_assignments(case_id, status)
  WHERE status = 'active';

-- Step 3: Create unique constraint to prevent duplicate active assignments
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_case_assignments_unique_active
  ON case_assignments(case_id)
  WHERE status = 'active' AND ended_at IS NULL;

-- Step 4: Create assignment history table (optional, for audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS case_assignment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES case_assignments(id) ON DELETE CASCADE,

  action TEXT NOT NULL CHECK (action IN ('assigned', 'reassigned', 'closed')),

  from_officer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_officer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  performed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_assignment_history_case
  ON case_assignment_history(case_id);

CREATE INDEX IF NOT EXISTS idx_case_assignment_history_assignment
  ON case_assignment_history(assignment_id);

-- Step 5: Create helper functions
-- ============================================================================

-- Function to get active assignment for a case
CREATE OR REPLACE FUNCTION get_active_assignment(p_case_id UUID)
RETURNS TABLE (
  assignment_id UUID,
  officer_user_id UUID,
  officer_email TEXT,
  assigned_by_user_id UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  briefing_note TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id,
    ca.officer_user_id,
    au.email as officer_email,
    ca.assigned_by_user_id,
    ca.assigned_at,
    ca.briefing_note
  FROM case_assignments ca
  JOIN auth.users au ON ca.officer_user_id = au.id
  WHERE ca.case_id = p_case_id
    AND ca.status = 'active'
    AND ca.ended_at IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get officer workload (count of active cases)
CREATE OR REPLACE FUNCTION get_officer_workload(p_officer_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM case_assignments ca
    WHERE ca.officer_user_id = p_officer_id
      AND ca.status = 'active'
      AND ca.ended_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if case is assigned
CREATE OR REPLACE FUNCTION is_case_assigned(p_case_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM case_assignments
    WHERE case_id = p_case_id
      AND status = 'active'
      AND ended_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_case_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_case_assignments_updated_at
  BEFORE UPDATE ON case_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_case_assignments_updated_at();

-- Step 7: Create view for active assignments with case details
-- ============================================================================

CREATE OR REPLACE VIEW v_active_case_assignments AS
SELECT
  ca.id as assignment_id,
  ca.case_id,
  c.case_reference,
  c.case_title,
  c.case_type,
  c.status as case_status,
  c.priority,
  c.created_at as case_created_at,
  ca.officer_user_id,
  officer.email as officer_email,
  ca.assigned_by_user_id,
  assigner.email as assigned_by_email,
  ca.assigned_at,
  ca.briefing_note,
  ca.assignment_notes,
  EXTRACT(DAY FROM NOW() - ca.assigned_at) as days_assigned
FROM case_assignments ca
JOIN cases c ON ca.case_id = c.id
JOIN auth.users officer ON ca.officer_user_id = officer.id
LEFT JOIN auth.users assigner ON ca.assigned_by_user_id = assigner.id
WHERE ca.status = 'active'
  AND ca.ended_at IS NULL;

-- Step 8: Verification queries
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_assignments') THEN
    RAISE NOTICE '✅ case_assignments table created successfully';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_assignment_history') THEN
    RAISE NOTICE '✅ case_assignment_history table created successfully';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'CASE ASSIGNMENTS SYSTEM READY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables: case_assignments, case_assignment_history';
  RAISE NOTICE 'Functions: get_active_assignment, get_officer_workload, is_case_assigned';
  RAISE NOTICE 'View: v_active_case_assignments';
  RAISE NOTICE '============================================';
END $$;

-- Step 9: Sample data (optional, for testing)
-- ============================================================================

-- Uncomment to insert sample assignments for testing
/*
INSERT INTO case_assignments (
  case_id,
  officer_user_id,
  assigned_by_user_id,
  briefing_note,
  status
)
SELECT
  c.id,
  (SELECT id FROM auth.users WHERE email LIKE '%officer%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
  'Sample assignment for testing purposes',
  'active'
FROM cases c
WHERE c.status != 'closed'
LIMIT 5;
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

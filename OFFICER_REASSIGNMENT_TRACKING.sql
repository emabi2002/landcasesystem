-- ============================================
-- OFFICER REASSIGNMENT TRACKING - ENHANCED
-- ============================================
-- This script enhances the case_assignments table
-- to better track multiple reassignments over time
-- ============================================

-- Create a dedicated reassignment history table
CREATE TABLE IF NOT EXISTS public.officer_reassignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Assignment details
  assignment_date DATE NOT NULL,
  assigned_to TEXT NOT NULL, -- Officer name
  assigned_by TEXT, -- Who made the assignment

  -- Reassignment tracking
  reassignment_number INT NOT NULL DEFAULT 1, -- 1st, 2nd, 3rd reassignment, etc.
  is_current BOOLEAN DEFAULT true, -- Is this the current assignment?

  -- Previous officer (if reassignment)
  previous_officer TEXT,
  reassignment_reason TEXT,

  -- Additional context
  notes TEXT,

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.officer_reassignments IS 'Tracks multiple officer reassignments per case - unlimited reassignments supported';
COMMENT ON COLUMN public.officer_reassignments.reassignment_number IS '1 = initial assignment, 2 = first reassignment, 3 = second reassignment, etc.';
COMMENT ON COLUMN public.officer_reassignments.is_current IS 'TRUE = currently assigned officer, FALSE = historical assignment';

CREATE INDEX IF NOT EXISTS idx_officer_reassignments_case_id ON public.officer_reassignments(case_id);
CREATE INDEX IF NOT EXISTS idx_officer_reassignments_is_current ON public.officer_reassignments(is_current);
CREATE INDEX IF NOT EXISTS idx_officer_reassignments_date ON public.officer_reassignments(assignment_date);

-- Enable RLS
ALTER TABLE public.officer_reassignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.officer_reassignments;
CREATE POLICY "Allow all for authenticated users" ON public.officer_reassignments
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to add a new reassignment
CREATE OR REPLACE FUNCTION add_officer_reassignment(
  p_case_id UUID,
  p_assignment_date DATE,
  p_assigned_to TEXT,
  p_assigned_by TEXT DEFAULT NULL,
  p_reassignment_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_reassignment_id UUID;
  v_previous_officer TEXT;
  v_reassignment_number INT;
BEGIN
  -- Get the current officer (if any)
  SELECT assigned_to, reassignment_number INTO v_previous_officer, v_reassignment_number
  FROM officer_reassignments
  WHERE case_id = p_case_id AND is_current = TRUE
  ORDER BY assignment_date DESC
  LIMIT 1;

  -- Mark all previous assignments as not current
  UPDATE officer_reassignments
  SET is_current = FALSE
  WHERE case_id = p_case_id;

  -- Calculate new reassignment number
  v_reassignment_number := COALESCE(v_reassignment_number, 0) + 1;

  -- Insert new assignment
  INSERT INTO officer_reassignments (
    case_id,
    assignment_date,
    assigned_to,
    assigned_by,
    reassignment_number,
    is_current,
    previous_officer,
    reassignment_reason
  ) VALUES (
    p_case_id,
    p_assignment_date,
    p_assigned_to,
    p_assigned_by,
    v_reassignment_number,
    TRUE,
    v_previous_officer,
    p_reassignment_reason
  )
  RETURNING id INTO v_reassignment_id;

  RETURN v_reassignment_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_officer_reassignment IS 'Adds a new officer assignment/reassignment to a case - handles unlimited reassignments';

-- Function to get reassignment history for a case
CREATE OR REPLACE FUNCTION get_reassignment_history(p_case_id UUID)
RETURNS TABLE (
  assignment_date DATE,
  assigned_to TEXT,
  assigned_by TEXT,
  reassignment_number INT,
  is_current BOOLEAN,
  previous_officer TEXT,
  reassignment_reason TEXT
) AS $$
  SELECT
    assignment_date,
    assigned_to,
    assigned_by,
    reassignment_number,
    is_current,
    previous_officer,
    reassignment_reason
  FROM officer_reassignments
  WHERE case_id = p_case_id
  ORDER BY assignment_date ASC, reassignment_number ASC;
$$ LANGUAGE SQL;

COMMENT ON FUNCTION get_reassignment_history IS 'Returns complete reassignment history for a case in chronological order';

-- Function to get current officer
CREATE OR REPLACE FUNCTION get_current_officer(p_case_id UUID)
RETURNS TEXT AS $$
  SELECT assigned_to
  FROM officer_reassignments
  WHERE case_id = p_case_id AND is_current = TRUE
  ORDER BY assignment_date DESC
  LIMIT 1;
$$ LANGUAGE SQL;

COMMENT ON FUNCTION get_current_officer IS 'Returns the currently assigned officer for a case';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  OFFICER REASSIGNMENT TRACKING READY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FEATURES:';
  RAISE NOTICE '  ✅ Track unlimited reassignments per case';
  RAISE NOTICE '  ✅ Store assignment date for each reassignment';
  RAISE NOTICE '  ✅ Track who assigned and who was assigned';
  RAISE NOTICE '  ✅ Maintain complete history';
  RAISE NOTICE '  ✅ Know current vs historical officers';
  RAISE NOTICE '';
  RAISE NOTICE 'USAGE:';
  RAISE NOTICE '  -- Add first assignment';
  RAISE NOTICE '  SELECT add_officer_reassignment(';
  RAISE NOTICE '    case_id,';
  RAISE NOTICE '    ''2022-01-01''::DATE,';
  RAISE NOTICE '    ''John Smith''';
  RAISE NOTICE '  );';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Add reassignment';
  RAISE NOTICE '  SELECT add_officer_reassignment(';
  RAISE NOTICE '    case_id,';
  RAISE NOTICE '    ''2023-03-21''::DATE,';
  RAISE NOTICE '    ''Don Rake'',';
  RAISE NOTICE '    ''Manager'',';
  RAISE NOTICE '    ''Workload rebalancing''';
  RAISE NOTICE '  );';
  RAISE NOTICE '';
  RAISE NOTICE '  -- View history';
  RAISE NOTICE '  SELECT * FROM get_reassignment_history(case_id);';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

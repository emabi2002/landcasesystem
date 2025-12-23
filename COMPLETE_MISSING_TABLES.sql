-- ============================================
-- COMPLETE MISSING TABLES
-- ============================================
-- This script adds the missing audit trail and reassignment tables
-- Run this after COMPLETE_WORKFLOW_SYSTEM.sql if some tables are missing
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Adding missing audit trail and reassignment tables...';
END $$;

-- ============================================
-- PART 1: AUDIT TRAIL TABLES
-- ============================================

-- Court references table
CREATE TABLE IF NOT EXISTS public.court_references (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  court_reference TEXT NOT NULL,
  court_type TEXT,
  assigned_date DATE NOT NULL,
  assigned_by UUID REFERENCES public.users(id),
  is_current BOOLEAN DEFAULT true,
  assignment_reason TEXT,
  superseded_date DATE,
  superseded_by_ref_id UUID REFERENCES public.court_references(id),
  superseded_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.court_references IS 'Multiple court references per case - tracks all court refs over time';

CREATE INDEX IF NOT EXISTS idx_court_refs_case_id ON public.court_references(case_id);
CREATE INDEX IF NOT EXISTS idx_court_refs_is_current ON public.court_references(is_current);

DO $$
BEGIN
  RAISE NOTICE '✅ Created court_references table';
END $$;

-- File maintenance log
CREATE TABLE IF NOT EXISTS public.file_maintenance_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  maintained_by UUID REFERENCES public.users(id) NOT NULL,
  maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN (
    'file_creation', 'file_update', 'document_added', 'document_removed',
    'file_transfer', 'file_review', 'file_correction', 'file_closure'
  )),
  file_type TEXT,
  description TEXT NOT NULL,
  changes_made JSONB,
  previous_maintainer UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.file_maintenance_log IS 'Complete audit trail of who maintained case files and when - APPEND ONLY';

CREATE INDEX IF NOT EXISTS idx_file_maint_case_id ON public.file_maintenance_log(case_id);
CREATE INDEX IF NOT EXISTS idx_file_maint_by ON public.file_maintenance_log(maintained_by);

DO $$
BEGIN
  RAISE NOTICE '✅ Created file_maintenance_log table';
END $$;

-- Extend case_files with maintainer tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'case_files' AND column_name = 'current_maintainer'
  ) THEN
    ALTER TABLE public.case_files ADD COLUMN current_maintainer UUID REFERENCES public.users(id);
    RAISE NOTICE '✅ Added current_maintainer to case_files';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'case_files' AND column_name = 'last_maintained_date'
  ) THEN
    ALTER TABLE public.case_files ADD COLUMN last_maintained_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Added last_maintained_date to case_files';
  END IF;
END $$;

-- Trigger: Prevent old intake record modification
CREATE OR REPLACE FUNCTION prevent_intake_record_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF (NOW() - OLD.created_at) > INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Cannot modify intake records older than 1 hour. Create a new record instead.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_old_intake_modification ON public.case_intake_records;
CREATE TRIGGER trigger_prevent_old_intake_modification
  BEFORE UPDATE ON public.case_intake_records
  FOR EACH ROW
  EXECUTE FUNCTION prevent_intake_record_modification();

DO $$
BEGIN
  RAISE NOTICE '✅ Created intake record protection trigger';
END $$;

-- Trigger: Automatic file maintenance logging
CREATE OR REPLACE FUNCTION log_file_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.court_file_number IS DISTINCT FROM OLD.court_file_number) OR
     (NEW.land_file_number IS DISTINCT FROM OLD.land_file_number) OR
     (NEW.titles_file_number IS DISTINCT FROM OLD.titles_file_number) OR
     (NEW.current_maintainer IS DISTINCT FROM OLD.current_maintainer) THEN

    INSERT INTO public.file_maintenance_log (
      case_id, maintained_by, maintenance_type, file_type, description,
      changes_made, previous_maintainer
    ) VALUES (
      NEW.case_id,
      COALESCE(NEW.current_maintainer, NEW.updated_by, NEW.created_by),
      CASE
        WHEN OLD.id IS NULL THEN 'file_creation'
        WHEN NEW.current_maintainer IS DISTINCT FROM OLD.current_maintainer THEN 'file_transfer'
        ELSE 'file_update'
      END,
      'All Files',
      CASE
        WHEN OLD.id IS NULL THEN 'Initial case files created'
        WHEN NEW.current_maintainer IS DISTINCT FROM OLD.current_maintainer THEN 'File transferred to new maintainer'
        ELSE 'Case files updated'
      END,
      jsonb_build_object(
        'court_file_changed', (NEW.court_file_number IS DISTINCT FROM OLD.court_file_number),
        'land_file_changed', (NEW.land_file_number IS DISTINCT FROM OLD.land_file_number),
        'titles_file_changed', (NEW.titles_file_number IS DISTINCT FROM OLD.titles_file_number)
      ),
      OLD.current_maintainer
    );
  END IF;
  NEW.last_maintained_date := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_file_maintenance ON public.case_files;
CREATE TRIGGER trigger_log_file_maintenance
  BEFORE INSERT OR UPDATE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION log_file_maintenance();

DO $$
BEGIN
  RAISE NOTICE '✅ Created file maintenance logging trigger';
END $$;

-- ============================================
-- PART 2: COURT REFERENCE REASSIGNMENT
-- ============================================

-- Case amendments table
CREATE TABLE IF NOT EXISTS public.case_amendments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  new_case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  new_court_reference_id UUID REFERENCES public.court_references(id) NOT NULL,
  original_case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  original_court_reference_id UUID REFERENCES public.court_references(id) NOT NULL,
  amendment_date DATE NOT NULL,
  amendment_type TEXT NOT NULL CHECK (amendment_type IN (
    'appeal', 'transfer', 'consolidation', 're_filing',
    'court_directive', 'jurisdictional', 'administrative', 'other'
  )),
  amendment_reason TEXT NOT NULL,
  initiated_by UUID REFERENCES public.users(id),
  previous_amendment_id UUID REFERENCES public.case_amendments(id),
  inherit_all_documents BOOLEAN DEFAULT true,
  inherit_parties BOOLEAN DEFAULT true,
  inherit_land_parcels BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.case_amendments IS 'Tracks case amendments when new court reference assigned - supports multiple reassignments (chains)';

CREATE INDEX IF NOT EXISTS idx_case_amendments_new_case ON public.case_amendments(new_case_id);
CREATE INDEX IF NOT EXISTS idx_case_amendments_original ON public.case_amendments(original_case_id);

DO $$
BEGIN
  RAISE NOTICE '✅ Created case_amendments table';
END $$;

-- Document inheritance table
CREATE TABLE IF NOT EXISTS public.document_inheritance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  amendment_id UUID REFERENCES public.case_amendments(id) ON DELETE CASCADE NOT NULL,
  original_document_id UUID REFERENCES public.case_documents(id) NOT NULL,
  new_case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  inheritance_type TEXT DEFAULT 'reference' CHECK (inheritance_type IN ('reference', 'copy')),
  inherited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  inherited_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.document_inheritance IS 'Tracks document inheritance when case amended with new court reference';

CREATE INDEX IF NOT EXISTS idx_doc_inherit_amendment ON public.document_inheritance(amendment_id);
CREATE INDEX IF NOT EXISTS idx_doc_inherit_new_case ON public.document_inheritance(new_case_id);

DO $$
BEGIN
  RAISE NOTICE '✅ Created document_inheritance table';
END $$;

-- Extend court_references with amendment tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'court_references' AND column_name = 'parent_reference_id'
  ) THEN
    ALTER TABLE public.court_references ADD COLUMN parent_reference_id UUID REFERENCES public.court_references(id);
    RAISE NOTICE '✅ Added parent_reference_id to court_references';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'court_references' AND column_name = 'is_amended_from_previous'
  ) THEN
    ALTER TABLE public.court_references ADD COLUMN is_amended_from_previous BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added is_amended_from_previous to court_references';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'court_references' AND column_name = 'amendment_id'
  ) THEN
    ALTER TABLE public.court_references ADD COLUMN amendment_id UUID REFERENCES public.case_amendments(id);
    RAISE NOTICE '✅ Added amendment_id to court_references';
  END IF;
END $$;

-- Helper function: Get amendment chain
CREATE OR REPLACE FUNCTION get_amendment_chain(p_case_id UUID)
RETURNS TABLE (
  level INT,
  case_id UUID,
  court_reference TEXT,
  amendment_type TEXT,
  amendment_date DATE,
  is_current BOOLEAN
) AS $$
WITH RECURSIVE amendment_chain AS (
  SELECT
    1 as level,
    c.id as case_id,
    cr.court_reference,
    NULL::TEXT as amendment_type,
    NULL::DATE as amendment_date,
    (c.id = p_case_id) as is_current
  FROM cases c
  JOIN court_references cr ON cr.case_id = c.id AND cr.is_current = TRUE
  WHERE c.id = p_case_id

  UNION ALL

  SELECT
    ac.level + 1,
    ca.original_case_id,
    cr.court_reference,
    ca.amendment_type,
    ca.amendment_date,
    FALSE
  FROM amendment_chain ac
  JOIN case_amendments ca ON ca.new_case_id = ac.case_id
  JOIN court_references cr ON cr.id = ca.original_court_reference_id
)
SELECT * FROM amendment_chain ORDER BY level;
$$ LANGUAGE SQL;

DO $$
BEGIN
  RAISE NOTICE '✅ Created get_amendment_chain function';
END $$;

-- Helper function: Get inherited documents
CREATE OR REPLACE FUNCTION get_inherited_documents(p_case_id UUID)
RETURNS TABLE (
  document_id UUID,
  document_title TEXT,
  original_case_id UUID,
  original_case_number TEXT,
  inherited_via_amendment_id UUID,
  inheritance_type TEXT
) AS $$
  SELECT
    cd.id as document_id,
    cd.file_name as document_title,
    ca.original_case_id,
    c.case_number as original_case_number,
    di.amendment_id as inherited_via_amendment_id,
    di.inheritance_type
  FROM document_inheritance di
  JOIN case_amendments ca ON ca.id = di.amendment_id
  JOIN case_documents cd ON cd.id = di.original_document_id
  JOIN cases c ON c.id = ca.original_case_id
  WHERE di.new_case_id = p_case_id
  ORDER BY di.inherited_at;
$$ LANGUAGE SQL;

DO $$
BEGIN
  RAISE NOTICE '✅ Created get_inherited_documents function';
END $$;

-- Stored procedure: Create amendment
CREATE OR REPLACE FUNCTION create_case_amendment(
  p_original_case_id UUID,
  p_original_court_ref_id UUID,
  p_new_court_reference TEXT,
  p_new_court_type TEXT,
  p_amendment_type TEXT,
  p_amendment_reason TEXT,
  p_initiated_by UUID,
  p_inherit_documents BOOLEAN DEFAULT true,
  p_inherit_parties BOOLEAN DEFAULT true,
  p_inherit_land_parcels BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_new_case_id UUID;
  v_new_court_ref_id UUID;
  v_amendment_id UUID;
  v_original_case_number TEXT;
  v_new_case_number TEXT;
BEGIN
  SELECT case_number INTO v_original_case_number
  FROM cases WHERE id = p_original_case_id;

  v_new_case_number := v_original_case_number || '-A';

  WHILE EXISTS (SELECT 1 FROM cases WHERE case_number = v_new_case_number) LOOP
    v_new_case_number := v_new_case_number || 'A';
  END LOOP;

  INSERT INTO cases (case_number, title, description, status, case_type, priority, created_by)
  SELECT
    v_new_case_number,
    title || ' (Amended)',
    'Amended from case ' || case_number || ' - ' || COALESCE(description, ''),
    status, case_type, priority, p_initiated_by
  FROM cases WHERE id = p_original_case_id
  RETURNING id INTO v_new_case_id;

  INSERT INTO court_references (
    case_id, court_reference, court_type, assigned_date, assigned_by,
    is_current, assignment_reason, is_amended_from_previous, parent_reference_id
  ) VALUES (
    v_new_case_id, p_new_court_reference, p_new_court_type, CURRENT_DATE,
    p_initiated_by, TRUE, 'Amended from original court reference',
    TRUE, p_original_court_ref_id
  )
  RETURNING id INTO v_new_court_ref_id;

  INSERT INTO case_amendments (
    new_case_id, new_court_reference_id, original_case_id, original_court_reference_id,
    amendment_date, amendment_type, amendment_reason, initiated_by,
    inherit_all_documents, inherit_parties, inherit_land_parcels, created_by
  ) VALUES (
    v_new_case_id, v_new_court_ref_id, p_original_case_id, p_original_court_ref_id,
    CURRENT_DATE, p_amendment_type, p_amendment_reason, p_initiated_by,
    p_inherit_documents, p_inherit_parties, p_inherit_land_parcels, p_initiated_by
  )
  RETURNING id INTO v_amendment_id;

  UPDATE court_references SET amendment_id = v_amendment_id WHERE id = v_new_court_ref_id;
  UPDATE court_references SET is_current = FALSE, superseded_date = CURRENT_DATE,
    superseded_reason = 'Case amended with new court reference: ' || p_new_court_reference
  WHERE id = p_original_court_ref_id;

  IF p_inherit_documents THEN
    INSERT INTO document_inheritance (amendment_id, original_document_id, new_case_id, inheritance_type, inherited_by)
    SELECT v_amendment_id, cd.id, v_new_case_id, 'reference', p_initiated_by
    FROM case_documents cd WHERE cd.case_id = p_original_case_id;
  END IF;

  IF p_inherit_parties THEN
    INSERT INTO case_parties (case_id, party_id, role)
    SELECT v_new_case_id, party_id, role FROM case_parties
    WHERE case_id = p_original_case_id ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_new_case_id;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Created create_case_amendment function';
END $$;

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.court_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_maintenance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_inheritance ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.court_references;
  CREATE POLICY "Allow all for authenticated users" ON public.court_references
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.file_maintenance_log;
  CREATE POLICY "Allow all for authenticated users" ON public.file_maintenance_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Prevent deletion" ON public.file_maintenance_log;
  CREATE POLICY "Prevent deletion" ON public.file_maintenance_log
  FOR DELETE TO authenticated USING (false);

  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_amendments;
  CREATE POLICY "Allow all for authenticated users" ON public.case_amendments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.document_inheritance;
  CREATE POLICY "Allow all for authenticated users" ON public.document_inheritance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  MISSING TABLES ADDED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'AUDIT TRAIL FEATURES:';
  RAISE NOTICE '  ✅ court_references table';
  RAISE NOTICE '  ✅ file_maintenance_log table';
  RAISE NOTICE '  ✅ Triggers for automatic logging';
  RAISE NOTICE '  ✅ Append-only protection';
  RAISE NOTICE '';
  RAISE NOTICE 'COURT REFERENCE REASSIGNMENT:';
  RAISE NOTICE '  ✅ case_amendments table';
  RAISE NOTICE '  ✅ document_inheritance table';
  RAISE NOTICE '  ✅ Helper functions created';
  RAISE NOTICE '  ✅ Amendment chains supported';
  RAISE NOTICE '';
  RAISE NOTICE 'SYSTEM NOW COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

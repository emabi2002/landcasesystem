-- ============================================
-- COURT REFERENCE REASSIGNMENT MODULE
-- ============================================
-- Requirements:
-- 1. Prompt: "New case or amended case with new court reference?"
-- 2. If amended: Link to original court reference/case
-- 3. Reference original documents but with new details
-- 4. Can happen multiple times (chain of reassignments)
-- ============================================

-- ============================================
-- ENHANCEMENT 1: CASE AMENDMENTS TABLE
-- ============================================

-- Tracks when a case is amended with a new court reference
CREATE TABLE IF NOT EXISTS public.case_amendments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- The NEW case/court reference being created
  new_case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  new_court_reference_id UUID REFERENCES public.court_references(id) NOT NULL,

  -- The ORIGINAL case/court reference being amended
  original_case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  original_court_reference_id UUID REFERENCES public.court_references(id) NOT NULL,

  -- Amendment details
  amendment_date DATE NOT NULL,
  amendment_type TEXT NOT NULL CHECK (amendment_type IN (
    'appeal',              -- Case appealed to higher court
    'transfer',            -- Case transferred to different court
    'consolidation',       -- Case consolidated with others
    're_filing',           -- Case re-filed with corrections
    'court_directive',     -- Court ordered new reference
    'jurisdictional',      -- Changed due to jurisdiction
    'administrative',      -- Administrative reference change
    'other'
  )),
  amendment_reason TEXT NOT NULL,

  -- Who initiated the amendment
  initiated_by UUID REFERENCES public.users(id),

  -- Is this part of a chain?
  previous_amendment_id UUID REFERENCES public.case_amendments(id),

  -- Document inheritance
  inherit_all_documents BOOLEAN DEFAULT true,
  inherit_parties BOOLEAN DEFAULT true,
  inherit_land_parcels BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.case_amendments IS 'Tracks case amendments when new court reference assigned - supports multiple reassignments (chains)';
COMMENT ON COLUMN public.case_amendments.new_case_id IS 'The NEW case entry created with new court reference';
COMMENT ON COLUMN public.case_amendments.original_case_id IS 'The ORIGINAL case being amended';
COMMENT ON COLUMN public.case_amendments.previous_amendment_id IS 'Links to previous amendment in chain (if this is 3rd, 4th, etc amendment)';
COMMENT ON COLUMN public.case_amendments.inherit_all_documents IS 'TRUE = new case references all documents from original';

CREATE INDEX IF NOT EXISTS idx_case_amendments_new_case ON public.case_amendments(new_case_id);
CREATE INDEX IF NOT EXISTS idx_case_amendments_original ON public.case_amendments(original_case_id);
CREATE INDEX IF NOT EXISTS idx_case_amendments_chain ON public.case_amendments(previous_amendment_id);

-- ============================================
-- ENHANCEMENT 2: EXTEND court_references TABLE
-- ============================================

DO $$
BEGIN
  -- Add parent reference tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'court_references' AND column_name = 'parent_reference_id'
  ) THEN
    ALTER TABLE public.court_references
    ADD COLUMN parent_reference_id UUID REFERENCES public.court_references(id);
  END IF;

  -- Add amendment tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'court_references' AND column_name = 'is_amended_from_previous'
  ) THEN
    ALTER TABLE public.court_references
    ADD COLUMN is_amended_from_previous BOOLEAN DEFAULT false;
  END IF;

  -- Add amendment ID link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'court_references' AND column_name = 'amendment_id'
  ) THEN
    ALTER TABLE public.court_references
    ADD COLUMN amendment_id UUID REFERENCES public.case_amendments(id);
  END IF;

  RAISE NOTICE 'Extended court_references table with amendment tracking';
END $$;

COMMENT ON COLUMN public.court_references.parent_reference_id IS 'Links to the court reference this was amended from (if applicable)';
COMMENT ON COLUMN public.court_references.is_amended_from_previous IS 'TRUE if this reference was created by amending a previous case';
COMMENT ON COLUMN public.court_references.amendment_id IS 'Links to the case_amendments record that created this reference';

-- ============================================
-- ENHANCEMENT 3: DOCUMENT INHERITANCE TRACKING
-- ============================================

-- Tracks which documents are inherited from original case
CREATE TABLE IF NOT EXISTS public.document_inheritance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- The amendment that caused inheritance
  amendment_id UUID REFERENCES public.case_amendments(id) ON DELETE CASCADE NOT NULL,

  -- Original document
  original_document_id UUID REFERENCES public.case_documents(id) NOT NULL,

  -- New case where document is inherited
  new_case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Was document copied or just referenced?
  inheritance_type TEXT DEFAULT 'reference' CHECK (inheritance_type IN (
    'reference',  -- Just references original (doesn't copy)
    'copy'        -- Creates copy in new case
  )),

  -- Audit
  inherited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  inherited_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.document_inheritance IS 'Tracks document inheritance when case amended with new court reference';
COMMENT ON COLUMN public.document_inheritance.inheritance_type IS 'reference = points to original, copy = duplicates to new case';

CREATE INDEX IF NOT EXISTS idx_doc_inherit_amendment ON public.document_inheritance(amendment_id);
CREATE INDEX IF NOT EXISTS idx_doc_inherit_new_case ON public.document_inheritance(new_case_id);
CREATE INDEX IF NOT EXISTS idx_doc_inherit_original_doc ON public.document_inheritance(original_document_id);

-- ============================================
-- ENHANCEMENT 4: HELPER FUNCTIONS
-- ============================================

-- Function: Get complete amendment chain for a case
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
  -- Start with the given case
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

  -- Recursively find all previous amendments
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
SELECT * FROM amendment_chain
ORDER BY level;
$$ LANGUAGE SQL;

COMMENT ON FUNCTION get_amendment_chain(UUID) IS
'Returns complete amendment chain showing how case evolved through reassignments';

-- Function: Get all inherited documents for a case
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
    cd.title as document_title,
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

COMMENT ON FUNCTION get_inherited_documents(UUID) IS
'Returns all documents inherited from original cases when case was amended';

-- ============================================
-- ENHANCEMENT 5: STORED PROCEDURE FOR AMENDMENT
-- ============================================

-- Procedure: Amend case with new court reference
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
  -- Get original case number
  SELECT case_number INTO v_original_case_number
  FROM cases WHERE id = p_original_case_id;

  -- Generate new case number (append amendment marker)
  v_new_case_number := v_original_case_number || '-A';

  -- Check if this case number already exists, increment if needed
  WHILE EXISTS (SELECT 1 FROM cases WHERE case_number = v_new_case_number) LOOP
    v_new_case_number := v_new_case_number || 'A';
  END LOOP;

  -- Create new case entry (linked to original)
  INSERT INTO cases (
    case_number,
    title,
    description,
    status,
    case_type,
    priority,
    created_by
  )
  SELECT
    v_new_case_number,
    title || ' (Amended)',
    'Amended from case ' || case_number || ' - ' || COALESCE(description, ''),
    status,
    case_type,
    priority,
    p_initiated_by
  FROM cases WHERE id = p_original_case_id
  RETURNING id INTO v_new_case_id;

  -- Create new court reference
  INSERT INTO court_references (
    case_id,
    court_reference,
    court_type,
    assigned_date,
    assigned_by,
    is_current,
    assignment_reason,
    is_amended_from_previous,
    parent_reference_id
  ) VALUES (
    v_new_case_id,
    p_new_court_reference,
    p_new_court_type,
    CURRENT_DATE,
    p_initiated_by,
    TRUE,
    'Amended from original court reference',
    TRUE,
    p_original_court_ref_id
  )
  RETURNING id INTO v_new_court_ref_id;

  -- Create amendment record
  INSERT INTO case_amendments (
    new_case_id,
    new_court_reference_id,
    original_case_id,
    original_court_reference_id,
    amendment_date,
    amendment_type,
    amendment_reason,
    initiated_by,
    inherit_all_documents,
    inherit_parties,
    inherit_land_parcels,
    created_by
  ) VALUES (
    v_new_case_id,
    v_new_court_ref_id,
    p_original_case_id,
    p_original_court_ref_id,
    CURRENT_DATE,
    p_amendment_type,
    p_amendment_reason,
    p_initiated_by,
    p_inherit_documents,
    p_inherit_parties,
    p_inherit_land_parcels,
    p_initiated_by
  )
  RETURNING id INTO v_amendment_id;

  -- Update court reference with amendment link
  UPDATE court_references
  SET amendment_id = v_amendment_id
  WHERE id = v_new_court_ref_id;

  -- Mark original court reference as superseded
  UPDATE court_references
  SET
    is_current = FALSE,
    superseded_date = CURRENT_DATE,
    superseded_reason = 'Case amended with new court reference: ' || p_new_court_reference
  WHERE id = p_original_court_ref_id;

  -- Inherit documents if requested
  IF p_inherit_documents THEN
    INSERT INTO document_inheritance (
      amendment_id,
      original_document_id,
      new_case_id,
      inheritance_type,
      inherited_by
    )
    SELECT
      v_amendment_id,
      cd.id,
      v_new_case_id,
      'reference',
      p_initiated_by
    FROM case_documents cd
    WHERE cd.case_id = p_original_case_id;
  END IF;

  -- Inherit parties if requested
  IF p_inherit_parties THEN
    INSERT INTO case_parties (case_id, party_id, role)
    SELECT v_new_case_id, party_id, role
    FROM case_parties
    WHERE case_id = p_original_case_id
    ON CONFLICT DO NOTHING;
  END IF;

  -- Inherit land parcels if requested (if table exists)
  IF p_inherit_land_parcels AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'land_parcels'
  ) THEN
    EXECUTE format(
      'INSERT INTO land_parcels (case_id, parcel_number, location, notes)
       SELECT %L, parcel_number, location, notes || '' (Inherited from %s)''
       FROM land_parcels WHERE case_id = %L',
      v_new_case_id, v_original_case_number, p_original_case_id
    );
  END IF;

  -- Log in case history
  INSERT INTO case_history (case_id, action, description)
  VALUES (
    v_new_case_id,
    'Case Created via Amendment',
    'Case amended from ' || v_original_case_number || ' with new court reference ' || p_new_court_reference
  );

  INSERT INTO case_history (case_id, action, description)
  VALUES (
    p_original_case_id,
    'Case Amended',
    'Case amended with new court reference ' || p_new_court_reference || ' → New case: ' || v_new_case_number
  );

  RETURN v_new_case_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_case_amendment IS
'Creates amended case with new court reference, links to original, optionally inherits documents/parties/land';

-- ============================================
-- ENHANCEMENT 6: VALIDATION FUNCTION
-- ============================================

-- Function: Check if case can be amended
CREATE OR REPLACE FUNCTION can_amend_case(p_case_id UUID)
RETURNS TABLE (
  can_amend BOOLEAN,
  reason TEXT
) AS $$
  SELECT
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM cases WHERE id = p_case_id) THEN FALSE
      WHEN EXISTS (SELECT 1 FROM cases WHERE id = p_case_id AND status = 'closed') THEN FALSE
      ELSE TRUE
    END as can_amend,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM cases WHERE id = p_case_id) THEN 'Case not found'
      WHEN EXISTS (SELECT 1 FROM cases WHERE id = p_case_id AND status = 'closed') THEN 'Cannot amend closed cases'
      ELSE 'Case can be amended'
    END as reason;
$$ LANGUAGE SQL;

-- ============================================
-- ENHANCEMENT 7: ENABLE RLS
-- ============================================

ALTER TABLE public.case_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_inheritance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.case_amendments;
CREATE POLICY "Allow all for authenticated users" ON public.case_amendments
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.document_inheritance;
CREATE POLICY "Allow all for authenticated users" ON public.document_inheritance
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  COURT REFERENCE REASSIGNMENT MODULE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW FEATURES:';
  RAISE NOTICE '';
  RAISE NOTICE '1. CASE AMENDMENTS:';
  RAISE NOTICE '   ✅ case_amendments table created';
  RAISE NOTICE '   ✅ Track new case linked to original';
  RAISE NOTICE '   ✅ Support multiple reassignments (chains)';
  RAISE NOTICE '   ✅ Track amendment type and reason';
  RAISE NOTICE '';
  RAISE NOTICE '2. DOCUMENT INHERITANCE:';
  RAISE NOTICE '   ✅ document_inheritance table created';
  RAISE NOTICE '   ✅ Track inherited documents';
  RAISE NOTICE '   ✅ Reference or copy documents';
  RAISE NOTICE '';
  RAISE NOTICE '3. COURT REFERENCE LINKING:';
  RAISE NOTICE '   ✅ court_references extended';
  RAISE NOTICE '   ✅ parent_reference_id tracks lineage';
  RAISE NOTICE '   ✅ amendment_id links to amendment record';
  RAISE NOTICE '';
  RAISE NOTICE '4. HELPER FUNCTIONS:';
  RAISE NOTICE '   ✅ get_amendment_chain() - View full history';
  RAISE NOTICE '   ✅ get_inherited_documents() - See inherited docs';
  RAISE NOTICE '   ✅ create_case_amendment() - Create amendment';
  RAISE NOTICE '   ✅ can_amend_case() - Validate before amending';
  RAISE NOTICE '';
  RAISE NOTICE 'USAGE:';
  RAISE NOTICE '  -- Create amendment';
  RAISE NOTICE '  SELECT create_case_amendment(';
  RAISE NOTICE '    original_case_id,';
  RAISE NOTICE '    original_court_ref_id,';
  RAISE NOTICE '    ''NEW-REF-123/2024'',';
  RAISE NOTICE '    ''Supreme Court'',';
  RAISE NOTICE '    ''appeal'',';
  RAISE NOTICE '    ''Case appealed to Supreme Court'',';
  RAISE NOTICE '    user_id';
  RAISE NOTICE '  );';
  RAISE NOTICE '';
  RAISE NOTICE '  -- View amendment chain';
  RAISE NOTICE '  SELECT * FROM get_amendment_chain(case_id);';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

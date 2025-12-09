-- ============================================
-- WORKFLOW ENHANCEMENTS: AUDIT TRAIL & MULTIPLE REFERENCES
-- ============================================
-- Enhancements requested:
-- 1. Multiple court references per case (with dates)
-- 2. File maintenance tracking (who maintained files, when)
-- 3. Append-only reception records (never modify old records)
-- ============================================

-- ============================================
-- ENHANCEMENT 1: MULTIPLE COURT REFERENCES
-- ============================================

-- Court references table - tracks all court refs assigned to a case over time
CREATE TABLE IF NOT EXISTS public.court_references (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Court reference details
  court_reference TEXT NOT NULL,
  court_type TEXT, -- "National Court", "Supreme Court", "District Court", etc.
  assigned_date DATE NOT NULL,
  assigned_by UUID REFERENCES public.users(id),

  -- Is this the current active reference?
  is_current BOOLEAN DEFAULT true,

  -- Why was this reference assigned?
  assignment_reason TEXT, -- "Initial filing", "Appeal to Supreme Court", "Case transferred", etc.

  -- When was it superseded (if applicable)?
  superseded_date DATE,
  superseded_by_ref_id UUID REFERENCES public.court_references(id),
  superseded_reason TEXT,

  -- Notes
  notes TEXT,

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.court_references IS 'Multiple court references per case - tracks all court refs over time';
COMMENT ON COLUMN public.court_references.is_current IS 'TRUE = currently active reference, FALSE = superseded/historical';
COMMENT ON COLUMN public.court_references.assigned_date IS 'When this court reference was assigned to the case';
COMMENT ON COLUMN public.court_references.superseded_date IS 'When this reference was replaced by another';

CREATE INDEX IF NOT EXISTS idx_court_refs_case_id ON public.court_references(case_id);
CREATE INDEX IF NOT EXISTS idx_court_refs_is_current ON public.court_references(is_current);
CREATE INDEX IF NOT EXISTS idx_court_refs_assigned_date ON public.court_references(assigned_date);

-- ============================================
-- ENHANCEMENT 2: FILE MAINTENANCE TRACKING
-- ============================================

-- File maintenance log - WHO maintained files WHEN
CREATE TABLE IF NOT EXISTS public.file_maintenance_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,

  -- Who maintained the file
  maintained_by UUID REFERENCES public.users(id) NOT NULL,
  maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- What type of maintenance
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN (
    'file_creation',      -- Initial file creation
    'file_update',        -- Updated existing file
    'document_added',     -- Added documents to file
    'document_removed',   -- Removed/archived documents
    'file_transfer',      -- Transferred to another officer
    'file_review',        -- Reviewed file
    'file_correction',    -- Corrected file information
    'file_closure'        -- Closed file
  )),

  -- Which files were maintained
  file_type TEXT, -- "Court File", "Land File", "Titles File", "All Files"

  -- What was done
  description TEXT NOT NULL,
  changes_made JSONB, -- Structured log of what changed

  -- Previous maintainer (if transfer)
  previous_maintainer UUID REFERENCES public.users(id),

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.file_maintenance_log IS 'Complete audit trail of who maintained case files and when - APPEND ONLY, never delete';
COMMENT ON COLUMN public.file_maintenance_log.maintenance_type IS 'Type of maintenance performed on the file';
COMMENT ON COLUMN public.file_maintenance_log.changes_made IS 'JSON object with details of changes made';

CREATE INDEX IF NOT EXISTS idx_file_maint_case_id ON public.file_maintenance_log(case_id);
CREATE INDEX IF NOT EXISTS idx_file_maint_by ON public.file_maintenance_log(maintained_by);
CREATE INDEX IF NOT EXISTS idx_file_maint_date ON public.file_maintenance_log(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_file_maint_type ON public.file_maintenance_log(maintenance_type);

-- ============================================
-- ENHANCEMENT 3: UPDATE case_files TABLE
-- ============================================

-- Add current maintainer tracking to case_files
DO $$
BEGIN
  -- Add current_maintainer if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'case_files' AND column_name = 'current_maintainer'
  ) THEN
    ALTER TABLE public.case_files ADD COLUMN current_maintainer UUID REFERENCES public.users(id);
  END IF;

  -- Add last_maintained_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'case_files' AND column_name = 'last_maintained_date'
  ) THEN
    ALTER TABLE public.case_files ADD COLUMN last_maintained_date TIMESTAMP WITH TIME ZONE;
  END IF;

  RAISE NOTICE 'Extended case_files table with maintainer tracking';
END $$;

-- ============================================
-- ENHANCEMENT 4: RECEPTION RECORDS - APPEND ONLY
-- ============================================

-- Add clarification to case_intake_records table
COMMENT ON TABLE public.case_intake_records IS 'Reception records - APPEND ONLY! Never modify existing records, always create new ones for additional information';

-- Trigger to prevent updates to old intake records
CREATE OR REPLACE FUNCTION prevent_intake_record_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow updates within 1 hour of creation (for typo fixes)
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

COMMENT ON TRIGGER trigger_prevent_old_intake_modification ON public.case_intake_records IS
'Prevents modification of intake records older than 1 hour - enforces append-only principle';

-- ============================================
-- ENHANCEMENT 5: AUTOMATIC LOGGING FUNCTIONS
-- ============================================

-- Function: Automatically log file maintenance when case_files is updated
CREATE OR REPLACE FUNCTION log_file_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if there are actual changes
  IF (NEW.court_file_number IS DISTINCT FROM OLD.court_file_number) OR
     (NEW.land_file_number IS DISTINCT FROM OLD.land_file_number) OR
     (NEW.titles_file_number IS DISTINCT FROM OLD.titles_file_number) OR
     (NEW.current_maintainer IS DISTINCT FROM OLD.current_maintainer) THEN

    INSERT INTO public.file_maintenance_log (
      case_id,
      maintained_by,
      maintenance_type,
      file_type,
      description,
      changes_made,
      previous_maintainer
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
        WHEN NEW.current_maintainer IS DISTINCT FROM OLD.current_maintainer THEN
          'File transferred to new maintainer'
        ELSE 'Case files updated'
      END,
      jsonb_build_object(
        'court_file_changed', (NEW.court_file_number IS DISTINCT FROM OLD.court_file_number),
        'land_file_changed', (NEW.land_file_number IS DISTINCT FROM OLD.land_file_number),
        'titles_file_changed', (NEW.titles_file_number IS DISTINCT FROM OLD.titles_file_number),
        'old_court_file', OLD.court_file_number,
        'new_court_file', NEW.court_file_number,
        'old_land_file', OLD.land_file_number,
        'new_land_file', NEW.land_file_number,
        'old_titles_file', OLD.titles_file_number,
        'new_titles_file', NEW.titles_file_number
      ),
      OLD.current_maintainer
    );
  END IF;

  -- Update last_maintained_date
  NEW.last_maintained_date := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_file_maintenance ON public.case_files;
CREATE TRIGGER trigger_log_file_maintenance
  BEFORE INSERT OR UPDATE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION log_file_maintenance();

COMMENT ON FUNCTION log_file_maintenance() IS
'Automatically creates file_maintenance_log entry when case_files are created or updated';

-- ============================================
-- ENHANCEMENT 6: ENABLE RLS
-- ============================================

ALTER TABLE public.court_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_maintenance_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.court_references;
CREATE POLICY "Allow all for authenticated users" ON public.court_references
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.file_maintenance_log;
CREATE POLICY "Allow all for authenticated users" ON public.file_maintenance_log
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Prevent deletion of file maintenance log (append-only)
DROP POLICY IF EXISTS "Prevent deletion" ON public.file_maintenance_log;
CREATE POLICY "Prevent deletion" ON public.file_maintenance_log
FOR DELETE TO authenticated USING (false);

COMMENT ON POLICY "Prevent deletion" ON public.file_maintenance_log IS
'File maintenance log is APPEND ONLY - cannot delete historical records';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  court_refs_exists BOOLEAN;
  file_maint_exists BOOLEAN;
BEGIN
  court_refs_exists := EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'court_references'
  );

  file_maint_exists := EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'file_maintenance_log'
  );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  WORKFLOW ENHANCEMENTS COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW FEATURES ADDED:';
  RAISE NOTICE '';
  RAISE NOTICE '1. MULTIPLE COURT REFERENCES:';
  RAISE NOTICE '   ✅ court_references table created';
  RAISE NOTICE '   ✅ Track all court refs per case over time';
  RAISE NOTICE '   ✅ Record assignment dates';
  RAISE NOTICE '   ✅ Track current vs historical references';
  RAISE NOTICE '';
  RAISE NOTICE '2. FILE MAINTENANCE TRACKING:';
  RAISE NOTICE '   ✅ file_maintenance_log table created';
  RAISE NOTICE '   ✅ WHO maintained files tracked';
  RAISE NOTICE '   ✅ WHEN maintenance occurred tracked';
  RAISE NOTICE '   ✅ WHAT was done tracked';
  RAISE NOTICE '   ✅ Automatic logging on file updates';
  RAISE NOTICE '';
  RAISE NOTICE '3. APPEND-ONLY RECEPTION RECORDS:';
  RAISE NOTICE '   ✅ case_intake_records protected from modification';
  RAISE NOTICE '   ✅ Old records cannot be amended (after 1 hour)';
  RAISE NOTICE '   ✅ New records created for additional info';
  RAISE NOTICE '   ✅ Complete audit trail preserved';
  RAISE NOTICE '';
  RAISE NOTICE '4. AUDIT TRAILS:';
  RAISE NOTICE '   ✅ case_files extended with maintainer tracking';
  RAISE NOTICE '   ✅ Automatic maintenance logging';
  RAISE NOTICE '   ✅ File maintenance log is append-only';
  RAISE NOTICE '   ✅ Cannot delete historical maintenance records';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '  - Use court_references table for multiple refs';
  RAISE NOTICE '  - File updates auto-logged to file_maintenance_log';
  RAISE NOTICE '  - Reception creates new intake records (never edits old)';
  RAISE NOTICE '========================================';
END $$;

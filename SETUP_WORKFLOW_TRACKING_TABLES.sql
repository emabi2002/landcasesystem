-- ============================================
-- WORKFLOW TRACKING TABLES SETUP
-- ============================================
-- This script creates the workflow tracking tables
-- and optionally populates them with sample data
-- linked to your existing normalized cases
-- ============================================

-- STEP 1: Create External Lawyers Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.external_lawyers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  lawyer_type TEXT CHECK (lawyer_type IN ('sol_gen', 'private', 'other')) DEFAULT 'private',
  contact_email TEXT,
  contact_phone TEXT,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.external_lawyers IS 'External lawyers (opposing counsel, Sol Gen officers)';

-- STEP 2: Create Incoming Correspondence Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.incoming_correspondence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference_number TEXT NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  source TEXT NOT NULL,
  received_date DATE NOT NULL,
  subject TEXT NOT NULL,
  acknowledgement_sent BOOLEAN DEFAULT false,
  acknowledgement_date DATE,
  acknowledgement_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'processed', 'filed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.incoming_correspondence IS 'Incoming correspondence and documents tracking';

CREATE INDEX IF NOT EXISTS idx_correspondence_case_id ON public.incoming_correspondence(case_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_status ON public.incoming_correspondence(status);

-- STEP 3: Create Directions Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.directions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  direction_number TEXT NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  issued_date DATE NOT NULL,
  subject TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date DATE,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.directions IS 'Ministerial and departmental directions tracking';

CREATE INDEX IF NOT EXISTS idx_directions_case_id ON public.directions(case_id);
CREATE INDEX IF NOT EXISTS idx_directions_status ON public.directions(status);
CREATE INDEX IF NOT EXISTS idx_directions_assigned_to ON public.directions(assigned_to);

-- STEP 4: Create Filings Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.filings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  filing_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prepared_date DATE,
  submission_date DATE,
  filing_number TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'prepared', 'submitted', 'filed', 'rejected')),
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.filings IS 'Court filings and submissions tracking';

CREATE INDEX IF NOT EXISTS idx_filings_case_id ON public.filings(case_id);
CREATE INDEX IF NOT EXISTS idx_filings_status ON public.filings(status);

-- STEP 5: Create Communications Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')) NOT NULL,
  party_type TEXT,
  party_name TEXT,
  subject TEXT NOT NULL,
  communication_date DATE NOT NULL,
  response_required BOOLEAN DEFAULT false,
  response_status TEXT DEFAULT 'not_required' CHECK (response_status IN ('not_required', 'pending', 'responded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.communications IS 'All case communications tracking';

CREATE INDEX IF NOT EXISTS idx_communications_case_id ON public.communications(case_id);
CREATE INDEX IF NOT EXISTS idx_communications_direction ON public.communications(direction);

-- STEP 6: Create File Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.file_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL,
  file_type TEXT NOT NULL,
  requested_from TEXT NOT NULL,
  request_date DATE NOT NULL,
  required_by_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'not_available')),
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE public.file_requests IS 'Land file and title search requests';

CREATE INDEX IF NOT EXISTS idx_file_requests_case_id ON public.file_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_file_requests_status ON public.file_requests(status);

-- STEP 7: Enable RLS on all tables
-- ============================================

ALTER TABLE public.external_lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_requests ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS Policies (Allow all authenticated users)
-- ============================================

-- External Lawyers Policies
CREATE POLICY "Allow all for external_lawyers" ON public.external_lawyers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Correspondence Policies
CREATE POLICY "Allow all for incoming_correspondence" ON public.incoming_correspondence FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Directions Policies
CREATE POLICY "Allow all for directions" ON public.directions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Filings Policies
CREATE POLICY "Allow all for filings" ON public.filings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Communications Policies
CREATE POLICY "Allow all for communications" ON public.communications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- File Requests Policies
CREATE POLICY "Allow all for file_requests" ON public.file_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STEP 9: Create sample data for external lawyers
-- ============================================

INSERT INTO public.external_lawyers (name, organization, lawyer_type, contact_email, contact_phone, notes)
VALUES
  ('John Smith', 'Solicitor General Office', 'sol_gen', 'jsmith@solgen.gov.pg', '+675 123 4567', 'Primary Sol Gen contact for land cases'),
  ('Mary Johnson', 'Solicitor General Office', 'sol_gen', 'mjohnson@solgen.gov.pg', '+675 123 4568', 'Handles constitutional matters'),
  ('David Lee', 'Lee & Associates', 'private', 'dlee@leelaw.com.pg', '+675 234 5678', 'Often represents private land claimants'),
  ('Sarah Williams', 'Williams Legal Services', 'private', 'swilliams@williamslaw.com.pg', '+675 345 6789', 'Corporate and land law specialist'),
  ('Robert Brown', 'Brown Chambers', 'private', 'rbrown@brownchambers.com.pg', '+675 456 7890', 'Frequent opposing counsel')
ON CONFLICT DO NOTHING;

-- STEP 10: Create sample correspondence linked to existing cases
-- ============================================
-- This creates sample correspondence entries for the first 5 cases

DO $$
DECLARE
  case_rec RECORD;
  counter INT := 0;
BEGIN
  FOR case_rec IN
    SELECT id, case_number FROM public.cases ORDER BY created_at DESC LIMIT 5
  LOOP
    counter := counter + 1;

    INSERT INTO public.incoming_correspondence (
      reference_number,
      case_id,
      document_type,
      source,
      received_date,
      subject,
      acknowledgement_sent,
      status
    ) VALUES (
      'CORR-2025-' || LPAD(counter::TEXT, 4, '0'),
      case_rec.id,
      CASE counter % 4
        WHEN 0 THEN 'Writ of Summons'
        WHEN 1 THEN 'Notice of Motion'
        WHEN 2 THEN 'Statement of Claim'
        ELSE 'Affidavit'
      END,
      CASE counter % 3
        WHEN 0 THEN 'National Court'
        WHEN 1 THEN 'Private Law Firm'
        ELSE 'Solicitor General'
      END,
      CURRENT_DATE - (counter * 10 || ' days')::INTERVAL,
      'Re: ' || case_rec.case_number || ' - Legal proceedings',
      counter % 2 = 0,
      CASE counter % 2
        WHEN 0 THEN 'acknowledged'
        ELSE 'pending'
      END
    );
  END LOOP;
END $$;

-- STEP 11: Create sample directions
-- ============================================

DO $$
DECLARE
  case_rec RECORD;
  counter INT := 0;
BEGIN
  FOR case_rec IN
    SELECT id, case_number FROM public.cases ORDER BY created_at DESC LIMIT 5
  LOOP
    counter := counter + 1;

    INSERT INTO public.directions (
      direction_number,
      case_id,
      source,
      issued_date,
      subject,
      priority,
      due_date,
      assigned_to,
      status
    ) VALUES (
      'DIR-2025-' || LPAD(counter::TEXT, 4, '0'),
      case_rec.id,
      CASE counter % 2
        WHEN 0 THEN 'Minister for Lands'
        ELSE 'Secretary DLPP'
      END,
      CURRENT_DATE - (counter * 5 || ' days')::INTERVAL,
      'Action required: ' || case_rec.case_number,
      CASE counter % 3
        WHEN 0 THEN 'urgent'
        WHEN 1 THEN 'high'
        ELSE 'normal'
      END,
      CURRENT_DATE + (counter * 7 || ' days')::INTERVAL,
      CASE counter % 3
        WHEN 0 THEN 'DLPP Legal Officer'
        WHEN 1 THEN 'Provincial Lands Officer'
        ELSE 'Senior Legal Counsel'
      END,
      CASE counter % 3
        WHEN 0 THEN 'in_progress'
        WHEN 1 THEN 'pending'
        ELSE 'completed'
      END
    );
  END LOOP;
END $$;

-- STEP 12: Create sample communications
-- ============================================

DO $$
DECLARE
  case_rec RECORD;
  counter INT := 0;
BEGIN
  FOR case_rec IN
    SELECT id, case_number FROM public.cases ORDER BY created_at DESC LIMIT 5
  LOOP
    counter := counter + 1;

    INSERT INTO public.communications (
      case_id,
      communication_type,
      direction,
      party_type,
      party_name,
      subject,
      communication_date,
      response_required,
      response_status
    ) VALUES (
      case_rec.id,
      CASE counter % 4
        WHEN 0 THEN 'Phone Call'
        WHEN 1 THEN 'Email'
        WHEN 2 THEN 'Letter'
        ELSE 'Meeting'
      END,
      CASE counter % 2
        WHEN 0 THEN 'incoming'
        ELSE 'outgoing'
      END,
      CASE counter % 3
        WHEN 0 THEN 'opposing_lawyer'
        WHEN 1 THEN 'court'
        ELSE 'party'
      END,
      CASE counter % 3
        WHEN 0 THEN 'Smith & Associates'
        WHEN 1 THEN 'National Court Registry'
        ELSE 'John Doe'
      END,
      'Re: ' || case_rec.case_number || ' - Case update',
      CURRENT_DATE - (counter * 3 || ' days')::INTERVAL,
      counter % 2 = 0,
      CASE counter % 2
        WHEN 0 THEN 'pending'
        ELSE 'not_required'
      END
    );
  END LOOP;
END $$;

-- STEP 13: Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  WORKFLOW TRACKING TABLES CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  ✅ external_lawyers';
  RAISE NOTICE '  ✅ incoming_correspondence';
  RAISE NOTICE '  ✅ directions';
  RAISE NOTICE '  ✅ filings';
  RAISE NOTICE '  ✅ communications';
  RAISE NOTICE '  ✅ file_requests';
  RAISE NOTICE '';
  RAISE NOTICE 'Sample data created:';
  RAISE NOTICE '  ✅ 5 external lawyers';
  RAISE NOTICE '  ✅ 5 correspondence entries (linked to recent cases)';
  RAISE NOTICE '  ✅ 5 directions (linked to recent cases)';
  RAISE NOTICE '  ✅ 5 communications (linked to recent cases)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Go to Correspondence page - see sample data!';
  RAISE NOTICE '  2. Go to Directions page - see sample directions!';
  RAISE NOTICE '  3. Go to Communications page - see sample comms!';
  RAISE NOTICE '  4. Go to Lawyers page - see sample lawyers!';
  RAISE NOTICE '  5. Add more entries as your workflow continues!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

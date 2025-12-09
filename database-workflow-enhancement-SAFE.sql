-- DLPP Case Management System - Workflow Enhancement (SAFE VERSION)
-- This version checks for existing objects before creating them
-- Safe to run multiple times without errors

-- Add new columns to cases table (only if they don't exist)
DO $$
BEGIN
    -- Check and add columns one by one
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'dlpp_role') THEN
        ALTER TABLE public.cases ADD COLUMN dlpp_role TEXT CHECK (dlpp_role IN ('defendant', 'plaintiff')) DEFAULT 'defendant';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'track_number') THEN
        ALTER TABLE public.cases ADD COLUMN track_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'proceeding_filed_date') THEN
        ALTER TABLE public.cases ADD COLUMN proceeding_filed_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'documents_served_date') THEN
        ALTER TABLE public.cases ADD COLUMN documents_served_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'court_documents_type') THEN
        ALTER TABLE public.cases ADD COLUMN court_documents_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'matter_type') THEN
        ALTER TABLE public.cases ADD COLUMN matter_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'returnable_date') THEN
        ALTER TABLE public.cases ADD COLUMN returnable_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'returnable_type') THEN
        ALTER TABLE public.cases ADD COLUMN returnable_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'division_responsible') THEN
        ALTER TABLE public.cases ADD COLUMN division_responsible TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'allegations') THEN
        ALTER TABLE public.cases ADD COLUMN allegations TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'reliefs_sought') THEN
        ALTER TABLE public.cases ADD COLUMN reliefs_sought TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'opposing_lawyer_name') THEN
        ALTER TABLE public.cases ADD COLUMN opposing_lawyer_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'sol_gen_officer') THEN
        ALTER TABLE public.cases ADD COLUMN sol_gen_officer TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'dlpp_action_officer') THEN
        ALTER TABLE public.cases ADD COLUMN dlpp_action_officer TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'officer_assigned_date') THEN
        ALTER TABLE public.cases ADD COLUMN officer_assigned_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'assignment_footnote') THEN
        ALTER TABLE public.cases ADD COLUMN assignment_footnote TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'section5_notice') THEN
        ALTER TABLE public.cases ADD COLUMN section5_notice BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'land_description') THEN
        ALTER TABLE public.cases ADD COLUMN land_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'zoning') THEN
        ALTER TABLE public.cases ADD COLUMN zoning TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'survey_plan_no') THEN
        ALTER TABLE public.cases ADD COLUMN survey_plan_no TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'lease_type') THEN
        ALTER TABLE public.cases ADD COLUMN lease_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'lease_commencement_date') THEN
        ALTER TABLE public.cases ADD COLUMN lease_commencement_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'lease_expiration_date') THEN
        ALTER TABLE public.cases ADD COLUMN lease_expiration_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'parties_description') THEN
        ALTER TABLE public.cases ADD COLUMN parties_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cases' AND column_name = 'court_file_number') THEN
        ALTER TABLE public.cases ADD COLUMN court_file_number TEXT;
    END IF;
END $$;

-- Create Court Orders table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.court_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  court_reference TEXT NOT NULL,
  parties_to_proceeding TEXT,
  order_date DATE NOT NULL,
  terms TEXT NOT NULL,
  conclusion_grounds TEXT,
  document_url TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add auto_created column to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'events' AND column_name = 'auto_created') THEN
        ALTER TABLE public.events ADD COLUMN auto_created BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create function to automatically create calendar event with 3-day alert for returnable dates
CREATE OR REPLACE FUNCTION auto_create_returnable_date_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create event if returnable_date is set and not null
  IF NEW.returnable_date IS NOT NULL THEN
    -- Delete old auto-created events for this case if returnable date changed
    IF TG_OP = 'UPDATE' AND OLD.returnable_date IS DISTINCT FROM NEW.returnable_date THEN
      DELETE FROM public.events
      WHERE case_id = NEW.id
        AND auto_created = true
        AND event_type = 'hearing';
    END IF;

    -- Insert new event
    INSERT INTO public.events (
      case_id,
      event_type,
      title,
      description,
      event_date,
      location,
      auto_created,
      created_by
    ) VALUES (
      NEW.id,
      'hearing',
      COALESCE(NEW.returnable_type, 'Returnable Date') || ' - ' || NEW.case_number,
      'Case: ' || NEW.title || '. Matter type: ' || COALESCE(NEW.matter_type, 'N/A') || '. Alert set for 3 days before.',
      NEW.returnable_date,
      'Court',
      true,
      NEW.created_by
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_create_returnable_event ON public.cases;
CREATE TRIGGER trigger_auto_create_returnable_event
  AFTER INSERT OR UPDATE OF returnable_date ON public.cases
  FOR EACH ROW
  WHEN (NEW.returnable_date IS NOT NULL)
  EXECUTE FUNCTION auto_create_returnable_date_event();

-- Create function to check returnable date alerts
CREATE OR REPLACE FUNCTION check_returnable_date_alerts()
RETURNS TABLE(
  case_id UUID,
  case_number TEXT,
  title TEXT,
  returnable_date TIMESTAMP WITH TIME ZONE,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.case_number,
    c.title,
    c.returnable_date,
    EXTRACT(DAY FROM c.returnable_date - NOW())::INTEGER as days_until
  FROM public.cases c
  WHERE c.returnable_date IS NOT NULL
    AND c.returnable_date > NOW()
    AND c.returnable_date <= NOW() + INTERVAL '3 days'
    AND c.status NOT IN ('closed', 'settled')
  ORDER BY c.returnable_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for cases with upcoming returnable dates
CREATE OR REPLACE VIEW cases_with_upcoming_returnable_dates AS
SELECT
  c.id,
  c.case_number,
  c.title,
  c.dlpp_role,
  c.status,
  c.returnable_date,
  c.returnable_type,
  c.matter_type,
  c.assigned_officer_id,
  c.dlpp_action_officer,
  EXTRACT(DAY FROM c.returnable_date - NOW())::INTEGER as days_until,
  CASE
    WHEN c.returnable_date <= NOW() + INTERVAL '3 days' THEN true
    ELSE false
  END as alert_needed
FROM public.cases c
WHERE c.returnable_date IS NOT NULL
  AND c.returnable_date > NOW()
  AND c.status NOT IN ('closed', 'settled')
ORDER BY c.returnable_date ASC;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cases_returnable_date ON public.cases(returnable_date) WHERE returnable_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_dlpp_role ON public.cases(dlpp_role);
CREATE INDEX IF NOT EXISTS idx_cases_track_number ON public.cases(track_number);
CREATE INDEX IF NOT EXISTS idx_cases_matter_type ON public.cases(matter_type);
CREATE INDEX IF NOT EXISTS idx_court_orders_case_id ON public.court_orders(case_id);

-- Enable RLS on court_orders if not already enabled
ALTER TABLE public.court_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view all court orders" ON public.court_orders;
CREATE POLICY "Users can view all court orders" ON public.court_orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert court orders" ON public.court_orders;
CREATE POLICY "Authenticated users can insert court orders" ON public.court_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own court orders" ON public.court_orders;
CREATE POLICY "Users can update their own court orders" ON public.court_orders
  FOR UPDATE USING (uploaded_by = auth.uid());

-- Grant permissions
GRANT SELECT ON cases_with_upcoming_returnable_dates TO authenticated;
GRANT ALL ON public.court_orders TO authenticated;
GRANT EXECUTE ON FUNCTION check_returnable_date_alerts() TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.court_orders IS 'Court orders registered as per STEP 5 of the workflow';
COMMENT ON COLUMN public.cases.dlpp_role IS 'Whether DLPP is defendant/respondent or plaintiff/applicant';
COMMENT ON COLUMN public.cases.returnable_date IS 'Date for directions hearing, substantive hearing, pre-trial conference, trial, mediation, etc.';
COMMENT ON COLUMN public.cases.section5_notice IS 'Applicable for cases where DLPP is defendant/respondent';
COMMENT ON COLUMN public.cases.parties_description IS 'Parties to the proceedings (Item 2)';
COMMENT ON COLUMN public.cases.court_file_number IS 'Court reference number (Item 1)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Workflow enhancement completed successfully!';
  RAISE NOTICE '✅ All columns added to cases table';
  RAISE NOTICE '✅ Court orders table created';
  RAISE NOTICE '✅ Automatic calendar event triggers activated';
  RAISE NOTICE '✅ Returnable date alert system ready';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your DLPP Legal CMS is now fully operational!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to your Legal CMS and login';
  RAISE NOTICE '2. Click Cases → Register New Case';
  RAISE NOTICE '3. Try the comprehensive 17-item workflow form';
  RAISE NOTICE '4. Set a returnable date and check the Calendar';
END $$;

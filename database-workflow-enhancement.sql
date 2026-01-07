-- DLPP Case Management System - Workflow Enhancement
-- This script adds all fields required by the workflow documents
-- Run this in your Supabase SQL Editor AFTER the main schema

-- Add new columns to cases table to match workflow requirements
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS dlpp_role TEXT CHECK (dlpp_role IN ('defendant', 'plaintiff')) DEFAULT 'defendant';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS track_number TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS proceeding_filed_date DATE;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS documents_served_date DATE;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS court_documents_type TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS matter_type TEXT; -- tort, compensation claim, fraud, judicial review, etc.
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS returnable_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS returnable_type TEXT; -- directions hearing, substantive hearing, pre-trial conference, trial, mediation
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS division_responsible TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS allegations TEXT; -- legal issues / cause of action
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS reliefs_sought TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS opposing_lawyer_name TEXT; -- Plaintiff's or Defendant's lawyer
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS sol_gen_officer TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS dlpp_action_officer TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS officer_assigned_date DATE;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS assignment_footnote TEXT; -- footnote from manager and supervisor
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS section5_notice BOOLEAN DEFAULT false; -- For defendant cases
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS case_origin TEXT DEFAULT 'other'; -- Already exists in some versions

-- Add columns for land description details
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS land_description TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS zoning TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS survey_plan_no TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS lease_type TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS lease_commencement_date DATE;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS lease_expiration_date DATE;

-- Update case_type to include more specific matter types
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_case_type_check;
ALTER TABLE public.cases ADD CONSTRAINT cases_case_type_check
  CHECK (case_type IN ('tort', 'compensation_claim', 'fraud', 'judicial_review', 'dispute', 'court_matter', 'title_claim', 'administrative_review', 'other'));

-- Create Court Orders table for STEP 5 of the workflow
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

-- Create function to send alerts 3 days before returnable date
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

-- Create function to automatically create calendar event with 3-day alert for returnable dates
CREATE OR REPLACE FUNCTION auto_create_returnable_date_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create event if returnable_date is set and not null
  IF NEW.returnable_date IS NOT NULL THEN
    INSERT INTO public.events (
      case_id,
      event_type,
      title,
      description,
      event_date,
      location,
      auto_created
    ) VALUES (
      NEW.id,
      'hearing',
      COALESCE(NEW.returnable_type, 'Returnable Date') || ' - ' || NEW.case_number,
      'Case: ' || NEW.title || '. Matter type: ' || COALESCE(NEW.matter_type, 'N/A') || '. Alert set for 3 days before.',
      NEW.returnable_date,
      'Court',
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for returnable date events
DROP TRIGGER IF EXISTS trigger_auto_create_returnable_event ON public.cases;
CREATE TRIGGER trigger_auto_create_returnable_event
  AFTER INSERT OR UPDATE OF returnable_date ON public.cases
  FOR EACH ROW
  WHEN (NEW.returnable_date IS NOT NULL)
  EXECUTE FUNCTION auto_create_returnable_date_event();

-- Add auto_created column to events table if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;

-- Create view for cases needing alerts
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
CREATE INDEX IF NOT EXISTS idx_court_orders_case_id ON public.court_orders(case_id);

-- Grant necessary permissions
GRANT SELECT ON cases_with_upcoming_returnable_dates TO authenticated;
GRANT ALL ON public.court_orders TO authenticated;
GRANT EXECUTE ON FUNCTION check_returnable_date_alerts() TO authenticated;

-- Add RLS policies for court_orders
ALTER TABLE public.court_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all court orders" ON public.court_orders
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert court orders" ON public.court_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own court orders" ON public.court_orders
  FOR UPDATE USING (uploaded_by = auth.uid());

COMMENT ON TABLE public.court_orders IS 'Court orders registered as per STEP 5 of the workflow';
COMMENT ON COLUMN public.cases.dlpp_role IS 'Whether DLPP is defendant/respondent or plaintiff/applicant';
COMMENT ON COLUMN public.cases.returnable_date IS 'Date for directions hearing, substantive hearing, pre-trial conference, trial, mediation, etc.';
COMMENT ON COLUMN public.cases.section5_notice IS 'Applicable for cases where DLPP is defendant/respondent';

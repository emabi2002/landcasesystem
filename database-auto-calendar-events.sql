-- DLPP Legal Case Management System - Automatic Calendar Events
-- Run this in your Supabase SQL Editor to enable auto-creation of calendar events

-- ============================================================
-- 1. ADD FIRST HEARING DATE FIELD TO CASES TABLE
-- ============================================================

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS first_hearing_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.cases.first_hearing_date IS 'Date/time of first scheduled hearing - auto-creates calendar event';

-- ============================================================
-- 2. FUNCTION: Auto-create event when case is registered
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_case_event()
RETURNS TRIGGER AS $$
DECLARE
  v_event_title TEXT;
  v_event_description TEXT;
  v_location TEXT;
BEGIN
  -- Build event title
  v_event_title := 'Case Registered: ' || NEW.case_number;

  -- Build event description
  v_event_description := 'Case Title: ' || COALESCE(NEW.title, 'Untitled') || E'\n' ||
                          'Case Type: ' || COALESCE(NEW.case_type, 'other') || E'\n' ||
                          'Status: ' || COALESCE(NEW.status, 'under_review') || E'\n' ||
                          'Priority: ' || COALESCE(NEW.priority, 'medium');

  -- Use region or default location
  v_location := COALESCE(NEW.region, 'DLPP Headquarters');

  -- Create the calendar event
  INSERT INTO public.events (
    case_id,
    event_type,
    title,
    description,
    event_date,
    location,
    created_by
  ) VALUES (
    NEW.id,
    'other',
    v_event_title,
    v_event_description,
    NEW.created_at,
    v_location,
    NEW.created_by
  );

  -- Log in case history
  INSERT INTO public.case_history (
    case_id,
    action,
    description,
    performed_by
  ) VALUES (
    NEW.id,
    'Calendar Event Created',
    'Case registration automatically added to calendar',
    NEW.created_by
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. FUNCTION: Auto-create event for first hearing
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_hearing_event()
RETURNS TRIGGER AS $$
DECLARE
  v_event_title TEXT;
  v_event_description TEXT;
  v_event_exists BOOLEAN;
BEGIN
  -- Only proceed if first_hearing_date is set and not null
  IF NEW.first_hearing_date IS NOT NULL THEN

    -- Check if hearing event already exists for this case
    SELECT EXISTS(
      SELECT 1 FROM public.events
      WHERE case_id = NEW.id
      AND event_type = 'hearing'
      AND title LIKE 'First Hearing:%'
    ) INTO v_event_exists;

    -- Only create if it doesn't exist yet
    IF NOT v_event_exists THEN
      -- Build event title
      v_event_title := 'First Hearing: ' || NEW.case_number;

      -- Build event description
      v_event_description := 'First hearing for case: ' || COALESCE(NEW.title, 'Untitled') || E'\n' ||
                              'Case Number: ' || NEW.case_number || E'\n' ||
                              'Case Type: ' || COALESCE(NEW.case_type, 'other');

      -- Create the hearing event
      INSERT INTO public.events (
        case_id,
        event_type,
        title,
        description,
        event_date,
        location,
        created_by
      ) VALUES (
        NEW.id,
        'hearing',
        v_event_title,
        v_event_description,
        NEW.first_hearing_date,
        COALESCE(NEW.region, 'Court House'),
        COALESCE(NEW.created_by, auth.uid())
      );

      -- Log in case history
      INSERT INTO public.case_history (
        case_id,
        action,
        description,
        performed_by
      ) VALUES (
        NEW.id,
        'First Hearing Scheduled',
        'First hearing date set and added to calendar: ' || TO_CHAR(NEW.first_hearing_date, 'DD Mon YYYY HH24:MI'),
        COALESCE(NEW.created_by, auth.uid())
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. FUNCTION: Auto-create event for important status changes
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_status_change_event()
RETURNS TRIGGER AS $$
DECLARE
  v_event_title TEXT;
  v_event_description TEXT;
  v_old_status TEXT;
  v_new_status TEXT;
BEGIN
  -- Only trigger on UPDATE, not INSERT
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    v_old_status := UPPER(REPLACE(OLD.status, '_', ' '));
    v_new_status := UPPER(REPLACE(NEW.status, '_', ' '));

    -- Only create events for important status changes
    IF NEW.status IN ('in_court', 'judgment', 'closed', 'settled') THEN

      -- Build event title
      v_event_title := 'Status Changed: ' || NEW.case_number || ' - ' || v_new_status;

      -- Build event description
      v_event_description := 'Case status changed from ' || v_old_status || ' to ' || v_new_status || E'\n' ||
                              'Case: ' || COALESCE(NEW.title, 'Untitled') || E'\n' ||
                              'Case Number: ' || NEW.case_number;

      -- Create the status change event
      INSERT INTO public.events (
        case_id,
        event_type,
        title,
        description,
        event_date,
        location,
        created_by
      ) VALUES (
        NEW.id,
        'other',
        v_event_title,
        v_event_description,
        NOW(),
        COALESCE(NEW.region, 'DLPP Headquarters'),
        auth.uid()
      );

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. CREATE TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS auto_create_case_calendar_event ON public.cases;
DROP TRIGGER IF EXISTS auto_create_hearing_calendar_event ON public.cases;
DROP TRIGGER IF EXISTS auto_create_status_calendar_event ON public.cases;

-- Trigger for case registration event (runs on INSERT only)
CREATE TRIGGER auto_create_case_calendar_event
  AFTER INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_case_event();

-- Trigger for first hearing event (runs on INSERT and UPDATE)
CREATE TRIGGER auto_create_hearing_calendar_event
  AFTER INSERT OR UPDATE OF first_hearing_date ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_hearing_event();

-- Trigger for status change event (runs on UPDATE only)
CREATE TRIGGER auto_create_status_calendar_event
  AFTER UPDATE OF status ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_status_change_event();

-- ============================================================
-- 6. ENHANCED CALENDAR VIEW WITH CASE DETAILS
-- ============================================================

CREATE OR REPLACE VIEW calendar_events_with_cases AS
SELECT
  e.id,
  e.case_id,
  e.event_type,
  e.title,
  e.description,
  e.event_date,
  e.location,
  e.reminder_sent,
  e.created_at,

  -- Case details
  c.case_number,
  c.title as case_title,
  c.status as case_status,
  c.priority as case_priority,
  c.region,

  -- Assigned officer
  p.full_name as assigned_officer_name,
  p.email as assigned_officer_email,

  -- Calculated fields
  EXTRACT(DAY FROM (e.event_date - NOW())) as days_until_event,
  CASE
    WHEN e.event_date < NOW() THEN true
    ELSE false
  END as is_past,
  CASE
    WHEN DATE(e.event_date) = CURRENT_DATE THEN true
    ELSE false
  END as is_today,
  CASE
    WHEN e.event_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN true
    ELSE false
  END as is_this_week

FROM public.events e
JOIN public.cases c ON e.case_id = c.id
LEFT JOIN public.profiles p ON c.assigned_officer_id = p.id
ORDER BY e.event_date ASC;

COMMENT ON VIEW calendar_events_with_cases IS 'Enhanced calendar view with case details and calculated date fields';

-- ============================================================
-- 7. GRANT PERMISSIONS
-- ============================================================

-- Allow authenticated users to select from the view
GRANT SELECT ON calendar_events_with_cases TO authenticated;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ AUTO CALENDAR EVENTS SYSTEM INSTALLED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features activated:';
  RAISE NOTICE '  ✓ Auto-create event on case registration';
  RAISE NOTICE '  ✓ Auto-create event for first hearing';
  RAISE NOTICE '  ✓ Auto-create event on important status changes';
  RAISE NOTICE '  ✓ Enhanced calendar view created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update case registration form to include first_hearing_date field';
  RAISE NOTICE '  2. Create a test case and check the calendar';
  RAISE NOTICE '  3. Verify events appear automatically';
  RAISE NOTICE '';
  RAISE NOTICE 'Test query:';
  RAISE NOTICE '  SELECT * FROM calendar_events_with_cases WHERE is_this_week = true;';
END $$;

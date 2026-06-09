-- =====================================================
-- ENHANCED NOTIFICATION & ALERT SYSTEM
-- =====================================================

-- Add email preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_frequency TEXT CHECK (notification_frequency IN ('realtime', 'daily', 'weekly')) DEFAULT 'realtime';

-- Enhanced notifications table (if not exists, otherwise alter)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND schemaname = 'public') THEN
    CREATE TABLE public.notifications (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
      notification_type TEXT CHECK (notification_type IN (
        'new_case_assigned',
        'case_status_changed',
        'upcoming_event',
        'event_today',
        'task_overdue',
        'task_due_soon',
        'new_comment',
        'new_document',
        'new_filing',
        'compliance_deadline',
        'direction_assigned',
        'case_closure',
        'other'
      )) NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
      read BOOLEAN DEFAULT false,
      read_at TIMESTAMP WITH TIME ZONE,
      action_url TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );

    CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
    CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE read = false;
    CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
  END IF;
END $$;

-- Email queue table for sending emails
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_name TEXT,
  cc_emails TEXT[],
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  attachments JSONB, -- Array of {filename, url, size}

  -- Status
  status TEXT CHECK (status IN ('pending', 'sending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- References
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_case_id ON public.email_queue(case_id);

-- =====================================================
-- AUTOMATED NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_case_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, case_id, notification_type, title, message, priority, action_url
  ) VALUES (
    p_user_id, p_case_id, p_type, p_title, p_message, p_priority, p_action_url
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on case assignment
CREATE OR REPLACE FUNCTION notify_case_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_case_number TEXT;
BEGIN
  IF NEW.assigned_officer_id IS NOT NULL AND
     (OLD.assigned_officer_id IS NULL OR OLD.assigned_officer_id != NEW.assigned_officer_id) THEN

    SELECT case_number INTO v_case_number FROM public.cases WHERE id = NEW.id;

    PERFORM create_notification(
      NEW.assigned_officer_id,
      NEW.id,
      'new_case_assigned',
      'New Case Assigned',
      'You have been assigned to case: ' || v_case_number || ' - ' || NEW.title,
      'high',
      '/cases/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for case assignment
DROP TRIGGER IF EXISTS case_assignment_notification ON public.cases;
CREATE TRIGGER case_assignment_notification
  AFTER INSERT OR UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION notify_case_assignment();

-- Function to notify on upcoming events (run daily via cron/edge function)
CREATE OR REPLACE FUNCTION notify_upcoming_events()
RETURNS void AS $$
DECLARE
  v_event RECORD;
  v_case RECORD;
  v_days_until INTEGER;
BEGIN
  FOR v_event IN
    SELECT e.*, c.case_number, c.title, c.assigned_officer_id
    FROM public.events e
    JOIN public.cases c ON e.case_id = c.id
    WHERE e.event_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND e.reminder_sent = false
  LOOP
    v_days_until := EXTRACT(DAY FROM v_event.event_date - NOW());

    IF v_event.assigned_officer_id IS NOT NULL THEN
      PERFORM create_notification(
        v_event.assigned_officer_id,
        v_event.case_id,
        CASE
          WHEN v_days_until = 0 THEN 'event_today'
          ELSE 'upcoming_event'
        END,
        CASE
          WHEN v_days_until = 0 THEN 'Event Today!'
          ELSE 'Upcoming Event in ' || v_days_until || ' days'
        END,
        v_event.title || ' for case ' || v_event.case_number,
        CASE
          WHEN v_days_until <= 1 THEN 'urgent'
          WHEN v_days_until <= 3 THEN 'high'
          ELSE 'medium'
        END,
        '/calendar'
      );

      -- Mark reminder as sent
      UPDATE public.events SET reminder_sent = true WHERE id = v_event.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on overdue tasks
CREATE OR REPLACE FUNCTION notify_overdue_tasks()
RETURNS void AS $$
DECLARE
  v_task RECORD;
BEGIN
  FOR v_task IN
    SELECT t.*, c.case_number, c.title
    FROM public.tasks t
    JOIN public.cases c ON t.case_id = c.id
    WHERE t.status IN ('pending', 'in_progress')
      AND t.due_date < NOW()
      AND t.assigned_to IS NOT NULL
  LOOP
    PERFORM create_notification(
      v_task.assigned_to,
      v_task.case_id,
      'task_overdue',
      'Task Overdue!',
      'Task "' || v_task.title || '" for case ' || v_task.case_number || ' is overdue',
      'urgent',
      '/tasks'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on new comments
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_case RECORD;
BEGIN
  SELECT case_number, title, assigned_officer_id INTO v_case
  FROM public.cases WHERE id = NEW.case_id;

  -- Notify assigned officer if comment is by someone else
  IF v_case.assigned_officer_id IS NOT NULL AND v_case.assigned_officer_id != NEW.created_by THEN
    PERFORM create_notification(
      v_case.assigned_officer_id,
      NEW.case_id,
      'new_comment',
      'New Comment on Case',
      'New comment added to case: ' || v_case.case_number,
      CASE WHEN NEW.is_important THEN 'high' ELSE 'medium' END,
      '/cases/' || NEW.case_id
    );
  END IF;

  -- Notify mentioned users
  IF NEW.mentioned_users IS NOT NULL THEN
    FOR i IN 1..array_length(NEW.mentioned_users, 1) LOOP
      IF NEW.mentioned_users[i] != NEW.created_by THEN
        PERFORM create_notification(
          NEW.mentioned_users[i],
          NEW.case_id,
          'new_comment',
          'You were mentioned in a comment',
          'You were mentioned in a comment on case: ' || v_case.case_number,
          'high',
          '/cases/' || NEW.case_id
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Enable notifications
-- =====================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- COMPLETED
-- =====================================================

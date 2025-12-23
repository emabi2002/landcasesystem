-- =====================================================
-- NOTIFICATIONS AND COMMENTS SYSTEM
-- Schema for automatic alerts and case commentary
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- NOTIFICATIONS TABLE
-- Stores all system notifications for users
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'case_created',
    'case_updated',
    'comment_added',
    'task_assigned',
    'deadline_approaching',
    'status_changed',
    'document_uploaded',
    'general'
  )) DEFAULT 'general',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_required BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON public.notifications(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (triggered by functions/app)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CASE COMMENTS TABLE
-- Stores commentary, advice, and input on cases
-- =====================================================

CREATE TABLE IF NOT EXISTS public.case_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  comment_type TEXT CHECK (comment_type IN (
    'commentary',
    'advice',
    'input',
    'general'
  )) DEFAULT 'general',
  is_private BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES public.case_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  edited BOOLEAN DEFAULT FALSE
);

-- Indexes for case_comments
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_user_id ON public.case_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_created_at ON public.case_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_comments_type ON public.case_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_case_comments_parent ON public.case_comments(parent_comment_id);

-- RLS Policies for case_comments
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

-- Users can view public comments and their own private comments
CREATE POLICY "Users can view case comments"
  ON public.case_comments
  FOR SELECT
  USING (
    NOT is_private
    OR auth.uid() = user_id
    OR auth.uid() IN (
      SELECT created_by FROM public.cases WHERE id = case_id
    )
  );

-- Users can insert comments
CREATE POLICY "Users can insert comments"
  ON public.case_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.case_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.case_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically mark notifications as read after 30 days
CREATE OR REPLACE FUNCTION auto_expire_notifications()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.notifications
  SET read = TRUE, read_at = NOW()
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = FALSE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up old notifications
CREATE TRIGGER trigger_auto_expire_notifications
  AFTER INSERT ON public.notifications
  EXECUTE FUNCTION auto_expire_notifications();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.edited = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on comment edits
CREATE TRIGGER trigger_update_comment_timestamp
  BEFORE UPDATE ON public.case_comments
  FOR EACH ROW
  WHEN (OLD.comment IS DISTINCT FROM NEW.comment)
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- NOTIFICATION SUMMARY VIEW
-- Convenient view for notification counts
-- =====================================================

CREATE OR REPLACE VIEW user_notification_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE read = FALSE) as unread_count,
  COUNT(*) FILTER (WHERE read = FALSE AND priority = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE read = FALSE AND priority = 'high') as high_priority_count,
  COUNT(*) FILTER (WHERE read = FALSE AND action_required = TRUE) as action_required_count,
  COUNT(*) as total_count,
  MAX(created_at) as latest_notification_at
FROM public.notifications
GROUP BY user_id;

-- =====================================================
-- CASE COMMENTS SUMMARY VIEW
-- Convenient view for comment counts per case
-- =====================================================

CREATE OR REPLACE VIEW case_comment_summary AS
SELECT
  case_id,
  COUNT(*) as total_comments,
  COUNT(*) FILTER (WHERE comment_type = 'commentary') as commentary_count,
  COUNT(*) FILTER (WHERE comment_type = 'advice') as advice_count,
  COUNT(*) FILTER (WHERE comment_type = 'input') as input_count,
  COUNT(*) FILTER (WHERE is_private = TRUE) as private_count,
  MAX(created_at) as latest_comment_at
FROM public.case_comments
GROUP BY case_id;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_comments TO authenticated;
GRANT SELECT ON user_notification_summary TO authenticated;
GRANT SELECT ON case_comment_summary TO authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

COMMENT ON TABLE public.notifications IS 'System notifications for users including alerts, updates, and action items';
COMMENT ON TABLE public.case_comments IS 'Commentary, advice, and input provided by users on cases';
COMMENT ON COLUMN public.notifications.action_required IS 'Whether the notification requires user action';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional data stored as JSON (case details, sender info, etc.)';
COMMENT ON COLUMN public.case_comments.comment_type IS 'Type of feedback: commentary, advice, input, or general';
COMMENT ON COLUMN public.case_comments.is_private IS 'Private comments visible only to case creator and admins';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these to test the schema

-- Check notifications table
-- SELECT * FROM public.notifications LIMIT 5;

-- Check case comments table
-- SELECT * FROM public.case_comments LIMIT 5;

-- Check notification summary
-- SELECT * FROM user_notification_summary;

-- Check comment summary
-- SELECT * FROM case_comment_summary;

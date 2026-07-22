-- =====================================================
-- CASE COMMENTS/NOTES SYSTEM
-- Add this to your Supabase database
-- =====================================================

-- Case Comments Table
CREATE TABLE IF NOT EXISTS public.case_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT CHECK (comment_type IN (
    'note',
    'update',
    'decision',
    'instruction',
    'observation',
    'other'
  )) DEFAULT 'note',
  is_important BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Metadata
  mentioned_users UUID[], -- Array of user IDs mentioned
  attachments JSONB, -- Links to related documents

  -- Soft delete
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_created_by ON public.case_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_case_comments_created_at ON public.case_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_case_comments_important ON public.case_comments(is_important) WHERE is_important = true;

-- Enable RLS
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view comments"
  ON public.case_comments FOR SELECT TO authenticated
  USING (deleted = false);

CREATE POLICY "Authenticated users can add comments"
  ON public.case_comments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own comments"
  ON public.case_comments FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_case_comments_updated_at
  BEFORE UPDATE ON public.case_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log comment in case history
CREATE OR REPLACE FUNCTION log_case_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.deleted THEN
    INSERT INTO public.case_history (case_id, action, description, performed_by)
    VALUES (
      NEW.case_id,
      'Comment Added',
      CASE
        WHEN NEW.is_important THEN '⭐ Important: ' || LEFT(NEW.comment_text, 100)
        ELSE LEFT(NEW.comment_text, 100)
      END,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log comments
CREATE TRIGGER case_comment_history_trigger
  AFTER INSERT ON public.case_comments
  FOR EACH ROW EXECUTE FUNCTION log_case_comment();

-- =====================================================
-- CASE DURATION TRACKING VIEW
-- Calculate how long cases have been open
-- =====================================================

CREATE OR REPLACE VIEW case_duration_stats AS
SELECT
  c.id,
  c.case_number,
  c.title,
  c.status,
  c.created_at,
  c.closure_date,
  CASE
    WHEN c.closure_date IS NOT NULL THEN
      EXTRACT(DAY FROM (c.closure_date - c.created_at))
    ELSE
      EXTRACT(DAY FROM (NOW() - c.created_at))
  END as days_open,
  CASE
    WHEN c.closure_date IS NOT NULL THEN 'Closed'
    WHEN EXTRACT(DAY FROM (NOW() - c.created_at)) > 365 THEN 'Over 1 year'
    WHEN EXTRACT(DAY FROM (NOW() - c.created_at)) > 180 THEN '6-12 months'
    WHEN EXTRACT(DAY FROM (NOW() - c.created_at)) > 90 THEN '3-6 months'
    WHEN EXTRACT(DAY FROM (NOW() - c.created_at)) > 30 THEN '1-3 months'
    ELSE 'Under 1 month'
  END as age_category
FROM public.cases c;

-- =====================================================
-- COMPLETED
-- =====================================================

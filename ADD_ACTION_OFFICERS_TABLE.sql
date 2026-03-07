-- ============================================
-- INTERNAL OFFICERS LOOKUP TABLE (ENHANCED)
-- ============================================
-- For managing internal DLPP officers and staff
-- Administrators can add, edit, and manage officers
-- ============================================

CREATE TABLE IF NOT EXISTS public.action_officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  office_location TEXT,
  employee_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

-- Insert default action officers with full details
INSERT INTO public.action_officers (name, title, department, display_order) VALUES
  ('Senior Legal Officer - Litigation', 'Senior Legal Officer', 'Legal Services Division', 1),
  ('Action Officer - Litigation', 'Action Officer', 'Legal Services Division', 2),
  ('Legal Officer', 'Legal Officer', 'Legal Services Division', 3),
  ('Para-Legal Officer', 'Para-Legal Officer', 'Legal Services Division', 4),
  ('Assistant Legal Officer', 'Assistant Legal Officer', 'Legal Services Division', 5),
  ('Case Officer', 'Case Officer', 'Legal Services Division', 6),
  ('Senior Legal Officer - Land', 'Senior Legal Officer', 'Lands Division', 7),
  ('Senior Legal Officer - Planning', 'Senior Legal Officer', 'Physical Planning Division', 8),
  ('Manager Legal Services', 'Manager', 'Legal Services Division', 9),
  ('Director Legal Services', 'Director', 'Legal Services Division', 10)
ON CONFLICT (employee_id) WHERE employee_id IS NOT NULL DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_action_officers_active ON public.action_officers(is_active);
CREATE INDEX IF NOT EXISTS idx_action_officers_department ON public.action_officers(department);
CREATE INDEX IF NOT EXISTS idx_action_officers_name ON public.action_officers(name);

-- DISABLE RLS for development
ALTER TABLE public.action_officers DISABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_action_officers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_action_officers_updated_at ON public.action_officers;
CREATE TRIGGER trigger_action_officers_updated_at
  BEFORE UPDATE ON public.action_officers
  FOR EACH ROW
  EXECUTE FUNCTION update_action_officers_updated_at();

-- Refresh schema
NOTIFY pgrst, 'reload schema';

SELECT 'SUCCESS: Enhanced action_officers table created with full officer management!' as result;

-- ============================================
-- CASE STATUS AND PRIORITY LOOKUP TABLES
-- ============================================

-- CASE STATUSES
CREATE TABLE IF NOT EXISTS public.case_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'gray',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

INSERT INTO public.case_statuses (name, code, description, color, display_order) VALUES
  ('Registered', 'registered', 'Case registered and awaiting assignment', 'blue', 1),
  ('Assigned', 'assigned', 'Case assigned to action officer', 'purple', 2),
  ('Under Review', 'under_review', 'Case under review by legal team', 'yellow', 3),
  ('In Progress', 'in_progress', 'Active litigation in progress', 'orange', 4),
  ('Directions', 'directions', 'Awaiting court directions', 'indigo', 5),
  ('In Court', 'in_court', 'Matter currently in court', 'blue', 6),
  ('Hearing Scheduled', 'hearing_scheduled', 'Hearing date set', 'cyan', 7),
  ('Mediation', 'mediation', 'In mediation process', 'purple', 8),
  ('Tribunal', 'tribunal', 'Before tribunal', 'violet', 9),
  ('Judgment', 'judgment', 'Judgment delivered', 'indigo', 10),
  ('Compliance', 'compliance', 'Monitoring compliance with order', 'amber', 11),
  ('Settlement', 'settlement', 'Settlement negotiations', 'green', 12),
  ('Settled', 'settled', 'Matter settled', 'green', 13),
  ('Closed', 'closed', 'Case closed', 'gray', 14),
  ('Archived', 'archived', 'Case archived', 'slate', 15),
  ('On Hold', 'on_hold', 'Case on hold', 'red', 16),
  ('Withdrawn', 'withdrawn', 'Case withdrawn', 'gray', 17),
  ('Dismissed', 'dismissed', 'Case dismissed', 'gray', 18)
ON CONFLICT (name) DO NOTHING;

-- PRIORITY LEVELS
CREATE TABLE IF NOT EXISTS public.priority_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'gray',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

INSERT INTO public.priority_levels (name, code, description, color, display_order) VALUES
  ('Urgent', 'urgent', 'Requires immediate attention - court date within 7 days', 'red', 1),
  ('High', 'high', 'High priority - court date within 30 days', 'orange', 2),
  ('Medium', 'medium', 'Standard priority', 'yellow', 3),
  ('Low', 'low', 'Low priority - no urgent deadlines', 'green', 4),
  ('Routine', 'routine', 'Routine matter', 'blue', 5)
ON CONFLICT (name) DO NOTHING;

-- DISABLE RLS
ALTER TABLE public.case_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_levels DISABLE ROW LEVEL SECURITY;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

SELECT 'SUCCESS: Case status and priority lookup tables created!' as result;

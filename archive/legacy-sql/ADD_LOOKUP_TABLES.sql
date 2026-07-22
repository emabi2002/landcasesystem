-- ============================================
-- LOOKUP TABLES FOR DROPDOWNS
-- ============================================
-- These tables allow admins to add new options
-- to dropdown lists in the application
-- ============================================

-- MATTER TYPES (Type of Matter)
CREATE TABLE IF NOT EXISTS public.matter_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Insert default matter types
INSERT INTO public.matter_types (name, description, display_order) VALUES
  ('Tort', 'Civil wrong causing harm or loss', 1),
  ('Compensation', 'Claims for compensation', 2),
  ('Fraud', 'Fraudulent activities related to land', 3),
  ('Trespass', 'Unauthorized entry on land', 4),
  ('Boundary Dispute', 'Disputes over land boundaries', 5),
  ('Title Dispute', 'Disputes over land ownership', 6),
  ('Lease Dispute', 'Disputes related to lease agreements', 7),
  ('Eviction', 'Eviction proceedings', 8),
  ('Injunction', 'Injunctive relief matters', 9),
  ('Judicial Review', 'Review of administrative decisions', 10),
  ('Appeal', 'Appeals from lower courts', 11),
  ('Other', 'Other matter types', 99)
ON CONFLICT (name) DO NOTHING;

-- CASE CATEGORIES
CREATE TABLE IF NOT EXISTS public.case_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Insert default case categories
INSERT INTO public.case_categories (name, description, display_order) VALUES
  ('Civil', 'Civil litigation matters', 1),
  ('Criminal', 'Criminal prosecution matters', 2),
  ('Administrative', 'Administrative law matters', 3),
  ('Constitutional', 'Constitutional law matters', 4),
  ('Commercial', 'Commercial disputes', 5),
  ('Land Court', 'Land Court specific matters', 6),
  ('National Court', 'National Court matters', 7),
  ('Supreme Court', 'Supreme Court matters', 8),
  ('Mediation', 'Mediation proceedings', 9),
  ('Arbitration', 'Arbitration proceedings', 10),
  ('Other', 'Other categories', 99)
ON CONFLICT (name) DO NOTHING;

-- HEARING TYPES (Type of Hearing)
CREATE TABLE IF NOT EXISTS public.hearing_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Insert default hearing types
INSERT INTO public.hearing_types (name, description, display_order) VALUES
  ('Directions Hearing', 'Procedural directions from court', 1),
  ('Substantive Hearing', 'Hearing on the merits', 2),
  ('Pre-Trial Conference', 'Pre-trial preparation meeting', 3),
  ('Trial', 'Full trial hearing', 4),
  ('Mention', 'Brief court mention', 5),
  ('Status Conference', 'Case status review', 6),
  ('Motion Hearing', 'Hearing on filed motions', 7),
  ('Mediation', 'Mediation session', 8),
  ('Settlement Conference', 'Settlement discussions', 9),
  ('Judgment', 'Judgment delivery', 10),
  ('Appeal Hearing', 'Appeal proceedings', 11),
  ('Urgent/Ex-Parte', 'Urgent applications', 12),
  ('Other', 'Other hearing types', 99)
ON CONFLICT (name) DO NOTHING;

-- ORDER TYPES (for Court Orders)
CREATE TABLE IF NOT EXISTS public.order_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Insert default order types
INSERT INTO public.order_types (name, code, description, display_order) VALUES
  ('Default Judgment', 'default_judgment', 'Judgment when defendant fails to respond', 1),
  ('Summary Judgment', 'summary_judgment', 'Judgment without full trial', 2),
  ('Final Judgment', 'final_judgment', 'Final court decision', 3),
  ('Consent Order', 'consent_order', 'Order by agreement of parties', 4),
  ('Dismissal', 'dismissal', 'Case dismissed', 5),
  ('Dismissed - Want of Prosecution', 'dismissed_want_prosecution', 'Dismissed for failure to prosecute', 6),
  ('Dismissed - Incompetent', 'dismissed_incompetent', 'Dismissed as incompetent', 7),
  ('Settlement', 'settlement', 'Settlement agreement', 8),
  ('Appeal Granted', 'appeal_granted', 'Appeal allowed', 9),
  ('Appeal Dismissed', 'appeal_dismissed', 'Appeal rejected', 10),
  ('Interlocutory Order', 'interlocutory', 'Interim order', 11),
  ('Directions Order', 'directions', 'Procedural directions', 12),
  ('Other', 'other', 'Other order types', 99)
ON CONFLICT (name) DO NOTHING;

-- DISABLE RLS for development
ALTER TABLE public.matter_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_types DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matter_types_active ON public.matter_types(is_active);
CREATE INDEX IF NOT EXISTS idx_case_categories_active ON public.case_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_hearing_types_active ON public.hearing_types(is_active);
CREATE INDEX IF NOT EXISTS idx_order_types_active ON public.order_types(is_active);

SELECT 'SUCCESS: Lookup tables created with default values!' as result;

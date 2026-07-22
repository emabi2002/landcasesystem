-- ============================================
-- ADDITIONAL LOOKUP TABLES
-- ============================================
-- Lease Types, Divisions, Regions, Lawyers, Sol Gen Officers
-- ============================================

-- LEASE TYPES
CREATE TABLE IF NOT EXISTS public.lease_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

INSERT INTO public.lease_types (name, description, display_order) VALUES
  ('State Lease', 'Land leased from the State', 1),
  ('Customary Land', 'Land held under customary tenure', 2),
  ('Freehold', 'Freehold title', 3),
  ('Special Agricultural Business Lease', 'SABL', 4),
  ('Urban Development Lease', 'UDL', 5),
  ('Business Lease', 'Commercial business lease', 6),
  ('Residential Lease', 'Residential purposes', 7),
  ('Agricultural Lease', 'Agricultural purposes', 8),
  ('Pastoral Lease', 'Pastoral/grazing purposes', 9),
  ('Mining Lease', 'Mining operations', 10),
  ('Other', 'Other lease types', 99)
ON CONFLICT (name) DO NOTHING;

-- DIVISIONS (DLPP Divisions)
CREATE TABLE IF NOT EXISTS public.divisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

INSERT INTO public.divisions (name, code, description, display_order) VALUES
  ('Legal Services Division', 'LSD', 'Legal matters and litigation', 1),
  ('Lands Division', 'LD', 'Land administration', 2),
  ('Physical Planning Division', 'PPD', 'Urban and physical planning', 3),
  ('Survey and Mapping Division', 'SMD', 'Surveying and mapping', 4),
  ('Valuation Division', 'VD', 'Property valuation', 5),
  ('Land Registration Division', 'LRD', 'Title registration', 6),
  ('Customary Land Division', 'CLD', 'Customary land matters', 7),
  ('Corporate Services Division', 'CSD', 'Corporate and admin services', 8),
  ('Policy and Planning Division', 'PAPD', 'Policy development', 9),
  ('Other', 'OTH', 'Other divisions', 99)
ON CONFLICT (name) DO NOTHING;

-- REGIONS
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

INSERT INTO public.regions (name, code, description, display_order) VALUES
  ('National Capital District', 'NCD', 'Port Moresby', 1),
  ('Central', 'CPL', 'Central Province', 2),
  ('Gulf', 'GPV', 'Gulf Province', 3),
  ('Western', 'WPV', 'Western Province', 4),
  ('Milne Bay', 'MBP', 'Milne Bay Province', 5),
  ('Oro (Northern)', 'NPV', 'Northern Province', 6),
  ('Southern Highlands', 'SHP', 'Southern Highlands Province', 7),
  ('Hela', 'HLA', 'Hela Province', 8),
  ('Western Highlands', 'WHP', 'Western Highlands Province', 9),
  ('Jiwaka', 'JWK', 'Jiwaka Province', 10),
  ('Chimbu (Simbu)', 'CPV', 'Chimbu Province', 11),
  ('Eastern Highlands', 'EHP', 'Eastern Highlands Province', 12),
  ('Morobe', 'MPV', 'Morobe Province', 13),
  ('Madang', 'MPG', 'Madang Province', 14),
  ('East Sepik', 'ESP', 'East Sepik Province', 15),
  ('West Sepik (Sandaun)', 'WSP', 'Sandaun Province', 16),
  ('Enga', 'EPV', 'Enga Province', 17),
  ('New Ireland', 'NIP', 'New Ireland Province', 18),
  ('East New Britain', 'ENB', 'East New Britain Province', 19),
  ('West New Britain', 'WNB', 'West New Britain Province', 20),
  ('Manus', 'MNS', 'Manus Province', 21),
  ('Bougainville', 'ABG', 'Autonomous Region of Bougainville', 22),
  ('Other', 'OTH', 'Other regions', 99)
ON CONFLICT (name) DO NOTHING;

-- LAWYERS (External lawyers/firms)
CREATE TABLE IF NOT EXISTS public.lawyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  firm TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

INSERT INTO public.lawyers (name, firm, display_order) VALUES
  ('Allens Linklaters', 'Allens Linklaters PNG', 1),
  ('Ashurst PNG', 'Ashurst', 2),
  ('Blake Dawson', 'Blake Dawson Waldron', 3),
  ('Corrs Chambers Westgarth', 'Corrs PNG', 4),
  ('Dentons PNG', 'Dentons', 5),
  ('Gadens Lawyers', 'Gadens PNG', 6),
  ('Norton Rose Fulbright', 'Norton Rose', 7),
  ('Pacific Legal Group', 'PLG', 8),
  ('Posman Kua Aisi Lawyers', 'PKA Lawyers', 9),
  ('Warner Shand Lawyers', 'Warner Shand', 10),
  ('Young & Williams Lawyers', 'Young & Williams', 11),
  ('Other', 'Other', 99)
ON CONFLICT (name) DO NOTHING;

-- SOL GEN OFFICERS (Solicitor General's Office)
CREATE TABLE IF NOT EXISTS public.sol_gen_officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT,
  department TEXT DEFAULT 'Office of Solicitor General',
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

INSERT INTO public.sol_gen_officers (name, title, display_order) VALUES
  ('Solicitor General', 'Solicitor General', 1),
  ('Deputy Solicitor General', 'Deputy Solicitor General', 2),
  ('Principal Legal Officer', 'Principal Legal Officer', 3),
  ('Senior Legal Officer', 'Senior Legal Officer', 4),
  ('Legal Officer', 'Legal Officer', 5),
  ('State Solicitor', 'State Solicitor', 6),
  ('Other', 'Other Officer', 99)
ON CONFLICT (name) DO NOTHING;

-- DISABLE RLS for development
ALTER TABLE public.lease_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sol_gen_officers DISABLE ROW LEVEL SECURITY;

SELECT 'SUCCESS: Additional lookup tables created!' as result;

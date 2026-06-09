-- ============================================
-- COURT ORDERS & CASE CLOSURES TABLES
-- ============================================
-- Run this script in Supabase SQL Editor to enable
-- Court Order registration and Case Closure features
-- ============================================

-- ============================================
-- PART 1: COURT ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.court_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  court_reference TEXT NOT NULL,
  order_date DATE NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'judgment',
  judge_name TEXT,
  parties_to_proceeding TEXT,
  terms TEXT NOT NULL,
  conclusion_grounds TEXT,
  outcome TEXT,
  document_url TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_court_orders_case_id ON public.court_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_court_orders_order_date ON public.court_orders(order_date);

-- ============================================
-- PART 2: CASE CLOSURES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_closures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL UNIQUE,
  closure_status TEXT NOT NULL,
  closure_date DATE NOT NULL,
  final_outcome TEXT NOT NULL,
  outcome_summary TEXT,
  archive_location TEXT,
  closure_notes TEXT,
  closed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_case_closures_case_id ON public.case_closures(case_id);
CREATE INDEX IF NOT EXISTS idx_case_closures_closure_date ON public.case_closures(closure_date);

-- ============================================
-- PART 3: ENABLE RLS WITH PERMISSIVE POLICIES
-- ============================================

ALTER TABLE public.court_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_closures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for court_orders" ON public.court_orders;
DROP POLICY IF EXISTS "Allow all for case_closures" ON public.case_closures;

-- Create permissive policies
CREATE POLICY "Allow all for court_orders" ON public.court_orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for case_closures" ON public.case_closures
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DONE
-- ============================================
SELECT 'SUCCESS: court_orders and case_closures tables created!' as result;

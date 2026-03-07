-- ============================================
-- FIX RLS POLICIES - GRANT ACCESS
-- ============================================
-- Run this in Supabase SQL Editor to fix access issues
-- ============================================

-- DISABLE RLS FOR DEVELOPMENT (Fastest Solution)
-- Uncomment this section if you want to completely disable RLS

ALTER TABLE IF EXISTS public.cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.land_parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.court_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_closures DISABLE ROW LEVEL SECURITY;

-- Communications and related
ALTER TABLE IF EXISTS public.communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.correspondence DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.file_requests DISABLE ROW LEVEL SECURITY;

-- Cost tracking
ALTER TABLE IF EXISTS public.litigation_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cost_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cost_alerts DISABLE ROW LEVEL SECURITY;

-- Compliance
ALTER TABLE IF EXISTS public.compliance_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compliance_recommendations DISABLE ROW LEVEL SECURITY;

-- Workflow and tracking
ALTER TABLE IF EXISTS public.directions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.filings DISABLE ROW LEVEL SECURITY;

-- Lookup tables (already disabled but ensuring)
ALTER TABLE IF EXISTS public.matter_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hearing_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lease_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.divisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lawyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sol_gen_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.case_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.priority_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.action_officers DISABLE ROW LEVEL SECURITY;

-- User and permission tables
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_permissions DISABLE ROW LEVEL SECURITY;

-- Additional tables
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events DISABLE ROW LEVEL SECURITY;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'SUCCESS: RLS disabled for all tables - access granted!' as result;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify RLS is disabled

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'cases', 'parties', 'documents', 'tasks', 'events',
        'land_parcels', 'case_history', 'profiles'
    )
ORDER BY tablename;

-- Expected result: rls_enabled should be 'false' for all tables

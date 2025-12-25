-- QUICK FIX: Disable RLS on land_parcels table
-- Run this in Supabase SQL Editor

-- Disable RLS on land_parcels
ALTER TABLE land_parcels DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON land_parcels TO authenticated;
GRANT ALL ON land_parcels TO anon;

-- Verify it worked
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '❌ STILL ENABLED' ELSE '✅ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'land_parcels';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Land parcels RLS disabled!';
  RAISE NOTICE '✅ Try adding a land parcel again';
END $$;

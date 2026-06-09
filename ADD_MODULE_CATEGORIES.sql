-- ============================================================================
-- Add Module Categories Feature
-- ============================================================================
-- This script adds a category column to the modules table and categorizes
-- existing modules for better organization in the admin interface
--
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Step 1: Add category column to modules table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules' AND column_name = 'category'
  ) THEN
    ALTER TABLE modules ADD COLUMN category TEXT DEFAULT 'case_management';
    RAISE NOTICE 'Added category column to modules table';
  ELSE
    RAISE NOTICE 'Category column already exists';
  END IF;
END $$;

-- Step 2: Update existing modules with appropriate categories
UPDATE modules SET category = 'case_management' WHERE module_key IN (
  'case_management',
  'case_registration',
  'case_allocation',
  'case_closure',
  'cases'
);

UPDATE modules SET category = 'documents' WHERE module_key IN (
  'documents',
  'file_requests'
);

UPDATE modules SET category = 'communications' WHERE module_key IN (
  'correspondence',
  'notifications',
  'communications'
);

UPDATE modules SET category = 'legal' WHERE module_key IN (
  'court_filings',
  'lawyers',
  'compliance',
  'directions_hearings'
);

UPDATE modules SET category = 'finance' WHERE module_key IN (
  'litigation_costs'
);

UPDATE modules SET category = 'reporting' WHERE module_key IN (
  'reports',
  'dashboard'
);

UPDATE modules SET category = 'administration' WHERE module_key IN (
  'user_management',
  'groups_management',
  'master_files',
  'internal_officers',
  'admin',
  'modules'
);

UPDATE modules SET category = 'property' WHERE module_key IN (
  'land_parcels'
);

-- Update any other modules to workflow category
UPDATE modules SET category = 'case_management' WHERE module_key IN (
  'tasks',
  'calendar'
);

-- Step 3: Verification
DO $$
DECLARE
  category_counts TEXT;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MODULE CATEGORIZATION COMPLETE';
  RAISE NOTICE '============================================';

  -- Show count per category
  FOR category_counts IN
    SELECT category || ': ' || COUNT(*) || ' modules'
    FROM modules
    GROUP BY category
    ORDER BY category
  LOOP
    RAISE NOTICE '%', category_counts;
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Modules: %', (SELECT COUNT(*) FROM modules);
  RAISE NOTICE '============================================';
END $$;

-- Step 4: Show modules by category
SELECT
  category,
  module_name,
  module_key
FROM modules
ORDER BY category, module_name;

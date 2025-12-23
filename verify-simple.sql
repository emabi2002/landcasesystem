-- SIMPLE VERIFICATION - Shows everything in one result
-- Run this to see your migration status

SELECT
  column_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'cases' AND information_schema.columns.column_name = checks.column_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES
    ('dlpp_role'),
    ('track_number'),
    ('proceeding_filed_date'),
    ('documents_served_date'),
    ('court_documents_type'),
    ('matter_type'),
    ('returnable_date'),
    ('returnable_type'),
    ('division_responsible'),
    ('allegations'),
    ('reliefs_sought'),
    ('opposing_lawyer_name'),
    ('sol_gen_officer'),
    ('dlpp_action_officer'),
    ('officer_assigned_date'),
    ('assignment_footnote'),
    ('section5_notice'),
    ('land_description'),
    ('zoning'),
    ('survey_plan_no'),
    ('lease_type'),
    ('lease_commencement_date'),
    ('lease_expiration_date'),
    ('parties_description'),
    ('court_file_number')
) AS checks(column_name)
ORDER BY column_name;

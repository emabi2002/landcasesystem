-- remove_temporary_closed_matters_closure_insert_compatibility.sql
-- Run only after EM verifies the historical Closed Matters import completed successfully.
-- Safety: Removes only the temporary compatibility trigger/function. Does not modify data.

drop trigger if exists trg_skip_legacy_closed_matters_closure_insert
  on public.case_closures;

drop function if exists public.skip_legacy_closed_matters_closure_insert();

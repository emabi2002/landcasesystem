-- cleanup_development_seed.sql
-- Purpose: Remove development/test seed data. DEVELOPMENT/STAGING ONLY.
-- Safety: Requires explicit confirmation to avoid accidental production execution.
--
-- Usage:
--   set app.confirm_dev_cleanup = 'YES_I_AM_IN_DEVELOPMENT';
--   \i supabase/seed/cleanup_development_seed.sql

do $$
begin
  if current_setting('app.confirm_dev_cleanup', true) is distinct from 'YES_I_AM_IN_DEVELOPMENT' then
    raise exception 'Refusing to run development cleanup without confirmation. Set app.confirm_dev_cleanup.';
  end if;

  delete from public.regions where name like 'TEST_%';
  delete from public.divisions where name like 'TEST_%';
  -- Remove any obviously test cases if created during development.
  delete from public.cases where case_number like 'TEST_%' or title like 'TEST_%';
end;
$$;

-- Validation query:
-- select count(*) from public.regions where name like 'TEST_%';

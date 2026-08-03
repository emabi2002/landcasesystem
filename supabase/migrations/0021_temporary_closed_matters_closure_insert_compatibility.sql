-- 0021_temporary_closed_matters_closure_insert_compatibility.sql
-- Purpose: Temporary production compatibility for the saved historical Closed Matters import.
-- Safety: Does not modify or delete data. Does not disable RLS. Only skips obsolete
-- case_closures rows for the historical import marker so cases can be created/updated.

create or replace function public.skip_legacy_closed_matters_closure_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.closure_type = 'Historical Closed Matters register import' then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_skip_legacy_closed_matters_closure_insert
  on public.case_closures;

create trigger trg_skip_legacy_closed_matters_closure_insert
before insert on public.case_closures
for each row
execute function public.skip_legacy_closed_matters_closure_insert();

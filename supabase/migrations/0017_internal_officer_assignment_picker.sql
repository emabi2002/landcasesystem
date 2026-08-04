-- 0017_internal_officer_assignment_picker.sql
-- Purpose: Support assigning cases to internal lawyers/action officers stored in action_officers.
-- Safety: Forward-only and additive. Does not delete existing records.

create or replace function public.add_column_if_missing(p_table text, p_column text, p_definition text)
returns void
language plpgsql
as $$
begin
  if to_regclass(format('public.%I', p_table)) is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table
      and column_name = p_column
  ) then
    execute format('alter table public.%I add column %I %s', p_table, p_column, p_definition);
  end if;
end;
$$;

select public.add_column_if_missing('action_officers', 'title', 'text');
select public.add_column_if_missing('action_officers', 'department', 'text');
select public.add_column_if_missing('action_officers', 'division', 'text');
select public.add_column_if_missing('action_officers', 'email', 'text');
select public.add_column_if_missing('action_officers', 'phone', 'text');
select public.add_column_if_missing('action_officers', 'employee_id', 'text');
select public.add_column_if_missing('action_officers', 'office_location', 'text');
select public.add_column_if_missing('action_officers', 'notes', 'text');
select public.add_column_if_missing('action_officers', 'employment_status', 'text not null default ''active''');
select public.add_column_if_missing('action_officers', 'profile_id', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('action_officers', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('action_officers', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('action_officers', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');

update public.action_officers
set department = coalesce(department, division),
    title = coalesce(title, 'Action Officer'),
    employment_status = case when is_active then coalesce(nullif(employment_status, ''), 'active') else 'inactive' end
where department is null
   or title is null
   or employment_status is null
   or employment_status = '';

select public.add_column_if_missing('cases', 'assigned_action_officer_id', 'uuid references public.action_officers(id) on delete set null');
select public.add_column_if_missing('case_assignments', 'action_officer_id', 'uuid references public.action_officers(id) on delete set null');

create index if not exists action_officers_active_idx on public.action_officers (is_active, employment_status);
create index if not exists action_officers_name_lower_idx on public.action_officers (lower(name));

do $
begin
  begin
    create unique index if not exists action_officers_email_unique_idx
      on public.action_officers (lower(email))
      where email is not null and btrim(email) <> '';
  exception when others then
    raise notice 'Duplicate action officer emails exist; creating non-unique email lookup index instead: %', sqlerrm;
    create index if not exists action_officers_email_lookup_idx
      on public.action_officers (lower(email))
      where email is not null and btrim(email) <> '';
  end;

  begin
    create unique index if not exists action_officers_employee_id_unique_idx
      on public.action_officers (employee_id)
      where employee_id is not null and btrim(employee_id) <> '';
  exception when others then
    raise notice 'Duplicate action officer employee IDs exist; creating non-unique employee lookup index instead: %', sqlerrm;
    create index if not exists action_officers_employee_id_lookup_idx
      on public.action_officers (employee_id)
      where employee_id is not null and btrim(employee_id) <> '';
  end;

  begin
    create unique index if not exists action_officers_profile_id_unique_idx
      on public.action_officers (profile_id)
      where profile_id is not null;
  exception when others then
    raise notice 'Duplicate action officer profile IDs exist; creating non-unique profile lookup index instead: %', sqlerrm;
    create index if not exists action_officers_profile_id_lookup_idx
      on public.action_officers (profile_id)
      where profile_id is not null;
  end;
end;
$;

create index if not exists cases_assigned_action_officer_idx on public.cases (assigned_action_officer_id);
create index if not exists case_assignments_action_officer_idx on public.case_assignments (action_officer_id);

create or replace function public.set_action_officers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  new.department = coalesce(new.department, new.division);
  new.division = coalesce(new.division, new.department);
  new.employment_status = coalesce(nullif(new.employment_status, ''), case when new.is_active then 'active' else 'inactive' end);
  new.is_active = new.employment_status = 'active';
  return new;
end;
$$;

drop trigger if exists trg_action_officers_updated_at on public.action_officers;
create trigger trg_action_officers_updated_at
before insert or update on public.action_officers
for each row execute function public.set_action_officers_updated_at();

drop function if exists public.add_column_if_missing(text, text, text);

-- Validation query:
-- select column_name from information_schema.columns where table_schema = 'public' and table_name in ('action_officers','cases','case_assignments') order by table_name, ordinal_position;

-- 0018_multi_case_officer_assignments.sql
-- Purpose: Allow one case to have multiple current internal/action officers.
-- Safety: Forward-only. Does not delete existing assignment history.

-- Remove the old one-current-assignment-per-case rule.
drop trigger if exists trg_close_previous_case_assignments on public.case_assignments;
drop trigger if exists trg_case_assignments_10_close_previous on public.case_assignments;
drop index if exists public.case_assignments_one_current_idx;

-- Keep the function name available for legacy references, but make it a no-op.
create or replace function public.close_previous_case_assignments()
returns trigger
language plpgsql
as $$
begin
  return new;
end;
$$;

-- Keep compatibility fields synchronized, but do not close other current officers.
create or replace function public.sync_case_assignment_fields()
returns trigger
language plpgsql
as $$
begin
  new.assigned_officer_id = coalesce(new.assigned_officer_id, new.assigned_to);
  new.assigned_to = coalesce(new.assigned_to, new.assigned_officer_id);
  new.assigned_by_user_id = coalesce(new.assigned_by_user_id, new.assigned_by, auth.uid());
  new.assigned_by = coalesce(new.assigned_by, new.assigned_by_user_id);
  new.created_by = coalesce(new.created_by, new.assigned_by_user_id, auth.uid());
  new.updated_by = coalesce(auth.uid(), new.updated_by, new.created_by);
  new.remarks = coalesce(new.remarks, new.instructions);
  new.instructions = coalesce(new.instructions, new.remarks);

  if coalesce(new.status, 'active') = 'active'
     and new.ended_at is null
     and new.completed_at is null
     and (new.assigned_officer_id is not null or new.action_officer_id is not null) then
    new.is_current = true;
    new.status = 'active';
  end if;

  if new.is_current then
    new.status = 'active';
    new.ended_at = null;
    new.completed_at = null;
  elsif new.ended_at is not null and new.status = 'active' then
    new.status = 'completed';
  end if;

  return new;
end;
$$;

-- If duplicate current rows already exist for the same case/officer, keep the newest
-- current row and close the older duplicates before adding uniqueness guards.
with duplicate_action_assignments as (
  select id,
         row_number() over (partition by case_id, action_officer_id order by assigned_at desc, created_at desc, id desc) as rn
  from public.case_assignments
  where is_current = true
    and action_officer_id is not null
)
update public.case_assignments ca
set is_current = false,
    status = 'completed',
    ended_at = coalesce(ca.ended_at, timezone('utc', now())),
    completed_at = coalesce(ca.completed_at, timezone('utc', now()))
from duplicate_action_assignments d
where ca.id = d.id
  and d.rn > 1;

with duplicate_profile_assignments as (
  select id,
         row_number() over (partition by case_id, assigned_officer_id order by assigned_at desc, created_at desc, id desc) as rn
  from public.case_assignments
  where is_current = true
    and assigned_officer_id is not null
)
update public.case_assignments ca
set is_current = false,
    status = 'completed',
    ended_at = coalesce(ca.ended_at, timezone('utc', now())),
    completed_at = coalesce(ca.completed_at, timezone('utc', now()))
from duplicate_profile_assignments d
where ca.id = d.id
  and d.rn > 1;

-- Prevent the same current officer from being assigned twice to the same case,
-- while allowing several different officers to be current on one case.
create unique index if not exists case_assignments_one_current_action_officer_idx
  on public.case_assignments (case_id, action_officer_id)
  where is_current = true and action_officer_id is not null;

create unique index if not exists case_assignments_one_current_profile_officer_idx
  on public.case_assignments (case_id, assigned_officer_id)
  where is_current = true and assigned_officer_id is not null;

-- Validation query:
-- select indexname, indexdef from pg_indexes where schemaname='public' and tablename='case_assignments' and indexname like 'case_assignments_one_current%';

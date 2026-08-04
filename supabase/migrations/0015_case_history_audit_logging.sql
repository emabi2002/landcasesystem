-- 0015_case_history_audit_logging.sql
-- Purpose: Preserve complete case history and system-wide audit records for all material case lifecycle changes.
-- Dependencies: 0001 through 0014
-- Safety: Forward-only and additive. Does not delete existing legal case records.

create or replace function public.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if p_value is null or btrim(p_value) = '' then
    return null;
  end if;

  return p_value::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.jsonb_changed_fields(p_old jsonb, p_new jsonb)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(key order by key), array[]::text[])
  from (
    select key from jsonb_object_keys(coalesce(p_old, '{}'::jsonb)) as old_keys(key)
    union
    select key from jsonb_object_keys(coalesce(p_new, '{}'::jsonb)) as new_keys(key)
  ) keys
  where (coalesce(p_old, '{}'::jsonb) -> key) is distinct from (coalesce(p_new, '{}'::jsonb) -> key);
$$;

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

-- Strengthen central audit log shape while retaining existing columns for compatibility.
select public.add_column_if_missing('audit_logs', 'user_full_name', 'text');
select public.add_column_if_missing('audit_logs', 'user_role', 'text');
select public.add_column_if_missing('audit_logs', 'officer_id', 'text');
select public.add_column_if_missing('audit_logs', 'table_name', 'text');
select public.add_column_if_missing('audit_logs', 'case_id', 'uuid references public.cases(id) on delete set null');
select public.add_column_if_missing('audit_logs', 'old_data', 'jsonb');
select public.add_column_if_missing('audit_logs', 'new_data', 'jsonb');
select public.add_column_if_missing('audit_logs', 'changed_fields', 'text[]');
select public.add_column_if_missing('audit_logs', 'session_id', 'text');
select public.add_column_if_missing('audit_logs', 'workstation', 'text');
select public.add_column_if_missing('audit_logs', 'source_module', 'text');
select public.add_column_if_missing('audit_logs', 'reason', 'text');
select public.add_column_if_missing('audit_logs', 'metadata', 'jsonb not null default ''{}''::jsonb');

create index if not exists audit_logs_case_idx on public.audit_logs (case_id, created_at desc);
create index if not exists audit_logs_table_record_idx on public.audit_logs (table_name, record_id);

-- If this migration is rerun after a partial/previous application, temporarily remove
-- append-only guards before metadata backfills. They are recreated later in this file.
do $$
begin
  if to_regclass('public.case_history') is not null then
    drop trigger if exists trg_case_history_no_update on public.case_history;
    drop trigger if exists trg_case_history_no_delete on public.case_history;
  end if;
end;
$$;

-- Strengthen case history into a readable business timeline with field-level old/new values.
select public.add_column_if_missing('case_history', 'activity_type', 'text');
select public.add_column_if_missing('case_history', 'entity_type', 'text');
select public.add_column_if_missing('case_history', 'entity_id', 'text');
select public.add_column_if_missing('case_history', 'field_name', 'text');
select public.add_column_if_missing('case_history', 'old_value', 'jsonb');
select public.add_column_if_missing('case_history', 'new_value', 'jsonb');
select public.add_column_if_missing('case_history', 'old_values', 'jsonb');
select public.add_column_if_missing('case_history', 'new_values', 'jsonb');
select public.add_column_if_missing('case_history', 'changed_fields', 'text[]');
select public.add_column_if_missing('case_history', 'performed_by_officer_id', 'text');
select public.add_column_if_missing('case_history', 'source_module', 'text');
select public.add_column_if_missing('case_history', 'reason', 'text');

update public.case_history
set performed_by = coalesce(performed_by, created_by)
where performed_by is null
  and created_by is not null;

create index if not exists case_history_case_created_idx on public.case_history (case_id, created_at desc);
create index if not exists case_history_activity_idx on public.case_history (activity_type);

-- Add actor ownership and modification columns to case-related tables where they are missing.
select public.add_column_if_missing('cases', 'last_change_reason', 'text');
select public.add_column_if_missing('parties', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('parties', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('parties', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('land_parcels', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('land_parcels', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('land_parcels', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('documents', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('documents', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('documents', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('tasks', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('events', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('communications', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('communications', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('communications', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('file_requests', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('filings', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('court_orders', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('compliance_tracking', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('compliance_tracking', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('compliance_tracking', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('case_closures', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('case_closures', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('case_closures', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('case_closures', 'closure_status', 'text');
select public.add_column_if_missing('case_closures', 'final_outcome', 'text');
select public.add_column_if_missing('case_closures', 'archive_location', 'text');
select public.add_column_if_missing('case_closures', 'compliance_completed', 'boolean not null default false');
select public.add_column_if_missing('case_closures', 'documents_archived', 'boolean not null default false');
select public.add_column_if_missing('case_closures', 'costs_finalized', 'boolean not null default false');
select public.add_column_if_missing('case_closures', 'judgment_registered', 'boolean not null default false');
select public.add_column_if_missing('incoming_correspondence', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('incoming_correspondence', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('incoming_correspondence', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('directions', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('external_lawyers', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('external_lawyers', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('external_lawyers', 'updated_at', 'timestamptz not null default timezone(''utc'', now())');
select public.add_column_if_missing('search_warrants', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('section5_notices', 'updated_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('section_160_applications', 'updated_by', 'uuid references public.profiles(id) on delete set null');

-- Enrich assignment history without replacing the existing canonical columns.
select public.add_column_if_missing('case_assignments', 'assigned_officer_id', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('case_assignments', 'assigned_by_user_id', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('case_assignments', 'previous_officer_id', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('case_assignments', 'assignment_reason', 'text');
select public.add_column_if_missing('case_assignments', 'ended_at', 'timestamptz');
select public.add_column_if_missing('case_assignments', 'is_current', 'boolean not null default false');
select public.add_column_if_missing('case_assignments', 'remarks', 'text');
select public.add_column_if_missing('case_assignments', 'created_by', 'uuid references public.profiles(id) on delete set null');
select public.add_column_if_missing('case_assignments', 'updated_by', 'uuid references public.profiles(id) on delete set null');

update public.case_assignments
set assigned_officer_id = coalesce(assigned_officer_id, assigned_to),
    assigned_by_user_id = coalesce(assigned_by_user_id, assigned_by),
    created_by = coalesce(created_by, assigned_by),
    remarks = coalesce(remarks, instructions)
where assigned_officer_id is null
   or assigned_by_user_id is null
   or created_by is null
   or remarks is null;

update public.case_assignments
set is_current = false
where is_current = true;

with ranked as (
  select id,
         row_number() over (partition by case_id order by assigned_at desc, created_at desc, id desc) as rn
  from public.case_assignments
  where status = 'active'
    and coalesce(ended_at, completed_at) is null
)
update public.case_assignments ca
set is_current = ranked.rn = 1,
    status = case when ranked.rn = 1 then 'active' else 'completed' end,
    ended_at = case when ranked.rn = 1 then null else coalesce(ca.ended_at, ca.completed_at, timezone('utc', now())) end,
    completed_at = case when ranked.rn = 1 then ca.completed_at else coalesce(ca.completed_at, ca.ended_at, timezone('utc', now())) end
from ranked
where ranked.id = ca.id;

create unique index if not exists case_assignments_one_current_idx
  on public.case_assignments (case_id)
  where is_current = true;

create index if not exists case_assignments_current_case_idx on public.case_assignments (case_id, is_current);

-- Keep assignment compatibility columns synchronized and ensure a single active assignment per case.
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
  new.updated_by = coalesce(auth.uid(), new.updated_by);
  new.remarks = coalesce(new.remarks, new.instructions);
  new.instructions = coalesce(new.instructions, new.remarks);

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

create or replace function public.close_previous_case_assignments()
returns trigger
language plpgsql
as $$
begin
  if new.is_current then
    update public.case_assignments
    set is_current = false,
        status = case when status = 'active' then 'completed' else status end,
        ended_at = coalesce(ended_at, new.assigned_at, timezone('utc', now())),
        completed_at = coalesce(completed_at, new.assigned_at, timezone('utc', now())),
        updated_by = coalesce(new.created_by, new.assigned_by_user_id, auth.uid())
    where case_id = new.case_id
      and id <> new.id
      and is_current = true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_case_assignment_fields on public.case_assignments;
drop trigger if exists trg_case_assignments_00_sync_fields on public.case_assignments;
create trigger trg_case_assignments_00_sync_fields
before insert or update on public.case_assignments
for each row execute function public.sync_case_assignment_fields();

drop trigger if exists trg_close_previous_case_assignments on public.case_assignments;
drop trigger if exists trg_case_assignments_10_close_previous on public.case_assignments;
create trigger trg_case_assignments_10_close_previous
before insert or update of is_current, status on public.case_assignments
for each row execute function public.close_previous_case_assignments();

-- Generic actor attribution for tables that contain both created_by and updated_by.
create or replace function public.set_actor_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = coalesce(new.created_by, auth.uid());
    new.updated_by = coalesce(new.updated_by, new.created_by, auth.uid());
  elsif tg_op = 'UPDATE' then
    new.updated_by = coalesce(auth.uid(), new.updated_by, old.updated_by);
  end if;

  return new;
end;
$$;

-- Generic modifier attribution for tables that only contain updated_by.
create or replace function public.set_updated_by_column()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.updated_by = coalesce(new.updated_by, auth.uid());
  elsif tg_op = 'UPDATE' then
    new.updated_by = coalesce(auth.uid(), new.updated_by, old.updated_by);
  end if;

  return new;
end;
$$;

do $$
declare
  t text;
  has_created_by boolean;
  has_updated_by boolean;
  actor_tables text[] := array[
    'cases','parties','land_parcels','documents','case_assignments','tasks','events','communications',
    'file_requests','filings','court_orders','compliance_tracking','case_closures','incoming_correspondence',
    'directions','external_lawyers','search_warrants','section5_notices','section_160_applications'
  ];
begin
  foreach t in array actor_tables loop
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'created_by') into has_created_by;
    select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'updated_by') into has_updated_by;

    execute format('drop trigger if exists trg_%I_actor_columns on public.%I;', t, t);
    execute format('drop trigger if exists trg_%I_updated_by on public.%I;', t, t);

    if has_created_by and has_updated_by then
      execute format('create trigger trg_%I_actor_columns before insert or update on public.%I for each row execute function public.set_actor_columns();', t, t);
    elsif has_updated_by then
      execute format('create trigger trg_%I_updated_by before insert or update on public.%I for each row execute function public.set_updated_by_column();', t, t);
    end if;
  end loop;
end;
$$;

-- Populate case_history actor fields on insert; history remains append-only.
create or replace function public.set_case_history_actor()
returns trigger
language plpgsql
as $$
begin
  new.performed_by = coalesce(new.performed_by, new.created_by, auth.uid());
  new.created_by = coalesce(new.created_by, new.performed_by, auth.uid());
  return new;
end;
$$;

drop trigger if exists trg_case_history_actor on public.case_history;
create trigger trg_case_history_actor
before insert on public.case_history
for each row execute function public.set_case_history_actor();

create or replace function public.prevent_case_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'case_history is append-only';
end;
$$;

drop trigger if exists trg_case_history_no_update on public.case_history;
create trigger trg_case_history_no_update
before update on public.case_history
for each row execute function public.prevent_case_history_mutation();

drop trigger if exists trg_case_history_no_delete on public.case_history;
create trigger trg_case_history_no_delete
before delete on public.case_history
for each row execute function public.prevent_case_history_mutation();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_changed text[];
  v_actor uuid;
  v_actor_name text;
  v_actor_role text;
  v_actor_officer text;
  v_case_id uuid;
  v_record_id text;
  v_reason text;
  v_action text;
  v_source text;
begin
  v_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_changed := case
    when tg_op = 'INSERT' then public.jsonb_changed_fields(null, v_new)
    when tg_op = 'DELETE' then public.jsonb_changed_fields(v_old, null)
    else public.jsonb_changed_fields(v_old, v_new)
  end;

  if tg_op = 'UPDATE' and coalesce(array_length(v_changed, 1), 0) = 0 then
    return new;
  end if;

  v_actor := coalesce(
    public.try_uuid(nullif(current_setting('request.jwt.claim.sub', true), '')),
    auth.uid(),
    public.try_uuid(coalesce(v_new ->> 'updated_by', v_new ->> 'created_by', v_new ->> 'uploaded_by', v_new ->> 'closed_by')),
    public.try_uuid(coalesce(v_old ->> 'updated_by', v_old ->> 'created_by', v_old ->> 'uploaded_by', v_old ->> 'closed_by'))
  );

  select p.full_name, coalesce(p.legacy_role, p.job_title), p.employee_id
  into v_actor_name, v_actor_role, v_actor_officer
  from public.profiles p
  where p.id = v_actor;

  v_record_id := coalesce(v_new ->> 'id', v_old ->> 'id');
  v_case_id := case
    when tg_table_name = 'cases' then public.try_uuid(coalesce(v_new ->> 'id', v_old ->> 'id'))
    else public.try_uuid(coalesce(v_new ->> 'case_id', v_old ->> 'case_id'))
  end;
  v_reason := coalesce(v_new ->> 'last_change_reason', v_new ->> 'change_reason', v_old ->> 'last_change_reason', v_old ->> 'change_reason');
  v_action := lower(tg_op);
  v_source := coalesce(nullif(current_setting('app.source_module', true), ''), tg_table_name);

  insert into public.audit_logs (
    user_id,
    user_full_name,
    user_role,
    officer_id,
    action,
    record_type,
    record_id,
    table_name,
    case_id,
    old_data,
    new_data,
    changed_fields,
    details,
    source_module,
    reason,
    metadata
  ) values (
    v_actor,
    v_actor_name,
    v_actor_role,
    v_actor_officer,
    v_action,
    tg_table_name,
    v_record_id,
    tg_table_name,
    v_case_id,
    v_old,
    v_new,
    v_changed,
    jsonb_build_object(
      'operation', tg_op,
      'table_name', tg_table_name,
      'record_id', v_record_id,
      'case_id', v_case_id,
      'changed_fields', v_changed
    ),
    v_source,
    v_reason,
    jsonb_build_object('trigger', 'audit_row_change')
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.log_case_activity_from_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_changed text[];
  v_actor uuid;
  v_case_id uuid;
  v_record_id text;
  v_reason text;
  v_action text;
  v_description text;
  v_old_label text;
  v_new_label text;
  v_field text;
begin
  v_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_changed := case
    when tg_op = 'INSERT' then public.jsonb_changed_fields(null, v_new)
    when tg_op = 'DELETE' then public.jsonb_changed_fields(v_old, null)
    else public.jsonb_changed_fields(v_old, v_new)
  end;

  if tg_op = 'UPDATE' and coalesce(array_length(v_changed, 1), 0) = 0 then
    return new;
  end if;

  v_case_id := case
    when tg_table_name = 'cases' then public.try_uuid(coalesce(v_new ->> 'id', v_old ->> 'id'))
    else public.try_uuid(coalesce(v_new ->> 'case_id', v_old ->> 'case_id'))
  end;

  if v_case_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  v_actor := coalesce(
    auth.uid(),
    public.try_uuid(coalesce(v_new ->> 'updated_by', v_new ->> 'created_by', v_new ->> 'uploaded_by', v_new ->> 'closed_by')),
    public.try_uuid(coalesce(v_old ->> 'updated_by', v_old ->> 'created_by', v_old ->> 'uploaded_by', v_old ->> 'closed_by'))
  );
  v_record_id := coalesce(v_new ->> 'id', v_old ->> 'id');
  v_reason := coalesce(v_new ->> 'last_change_reason', v_new ->> 'change_reason', v_old ->> 'last_change_reason', v_old ->> 'change_reason');
  v_field := case when coalesce(array_length(v_changed, 1), 0) = 1 then v_changed[1] else null end;

  if tg_table_name = 'cases' then
    if tg_op = 'INSERT' then
      v_action := 'Case Created';
      v_description := format('Case %s was opened.', coalesce(v_new ->> 'case_number', v_record_id));
    elsif tg_op = 'DELETE' then
      v_action := 'Case Deleted';
      v_description := format('Case %s was deleted.', coalesce(v_old ->> 'case_number', v_record_id));
    elsif 'assigned_officer_id' = any(v_changed) then
      select coalesce(full_name, email, old.id::text) into v_old_label from public.profiles old where old.id = public.try_uuid(v_old ->> 'assigned_officer_id');
      select coalesce(full_name, email, new.id::text) into v_new_label from public.profiles new where new.id = public.try_uuid(v_new ->> 'assigned_officer_id');
      v_action := 'Officer Reassigned';
      v_description := format('Case reassigned from %s to %s.', coalesce(v_old_label, 'Unassigned'), coalesce(v_new_label, 'Unassigned'));
    elsif 'status' = any(v_changed) then
      v_action := 'Status Changed';
      v_description := format('Status changed from "%s" to "%s".', coalesce(v_old ->> 'status', 'blank'), coalesce(v_new ->> 'status', 'blank'));
    elsif 'workflow_state' = any(v_changed) then
      v_action := 'Stage Changed';
      v_description := format('Stage changed from "%s" to "%s".', coalesce(v_old ->> 'workflow_state', 'blank'), coalesce(v_new ->> 'workflow_state', 'blank'));
    else
      v_action := 'Case Information Updated';
      v_description := format('Case information updated. Changed fields: %s.', array_to_string(v_changed, ', '));
    end if;
  else
    v_action := case
      when tg_op = 'INSERT' then initcap(replace(tg_table_name, '_', ' ')) || ' Added'
      when tg_op = 'DELETE' then initcap(replace(tg_table_name, '_', ' ')) || ' Removed'
      else initcap(replace(tg_table_name, '_', ' ')) || ' Updated'
    end;
    v_description := case
      when tg_op = 'INSERT' then format('A %s record was added to the case.', replace(tg_table_name, '_', ' '))
      when tg_op = 'DELETE' then format('A %s record was removed from the case.', replace(tg_table_name, '_', ' '))
      else format('A %s record was updated. Changed fields: %s.', replace(tg_table_name, '_', ' '), array_to_string(v_changed, ', '))
    end;
  end if;

  insert into public.case_history (
    case_id,
    action,
    activity_type,
    entity_type,
    entity_id,
    field_name,
    old_value,
    new_value,
    old_values,
    new_values,
    changed_fields,
    description,
    workflow_state_from,
    workflow_state_to,
    performed_by,
    created_by,
    source_module,
    reason,
    metadata
  ) values (
    v_case_id,
    v_action,
    lower(replace(v_action, ' ', '_')),
    tg_table_name,
    v_record_id,
    v_field,
    case when v_field is null then null else v_old -> v_field end,
    case when v_field is null then null else v_new -> v_field end,
    v_old,
    v_new,
    v_changed,
    case when v_reason is not null and v_reason <> '' then v_description || ' Reason: ' || v_reason else v_description end,
    case when tg_table_name = 'cases' then v_old ->> 'workflow_state' else null end,
    case when tg_table_name = 'cases' then v_new ->> 'workflow_state' else null end,
    v_actor,
    v_actor,
    tg_table_name,
    v_reason,
    jsonb_build_object('operation', tg_op, 'table_name', tg_table_name, 'record_id', v_record_id)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  t text;
  audited_tables text[] := array[
    'cases','parties','land_parcels','documents','tasks','events','case_assignments','communications',
    'file_requests','filings','compliance_tracking','court_orders','case_closures','incoming_correspondence',
    'directions','external_lawyers','search_warrants','section5_notices','section_160_applications','litigation_costs'
  ];
begin
  foreach t in array audited_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('drop trigger if exists trg_%I_audit on public.%I;', t, t);
      execute format('create trigger trg_%I_audit after insert or update or delete on public.%I for each row execute function public.audit_row_change();', t, t);

      execute format('drop trigger if exists trg_%I_case_activity on public.%I;', t, t);
      if t = 'cases' or exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'case_id') then
        execute format('create trigger trg_%I_case_activity after insert or update or delete on public.%I for each row execute function public.log_case_activity_from_row_change();', t, t);
      end if;
    end if;
  end loop;
end;
$$;

-- Harden RLS: history and audit records are append-only/read-restricted through normal application access.
alter table public.case_history enable row level security;
drop policy if exists case_history_update on public.case_history;
drop policy if exists case_history_delete on public.case_history;
drop policy if exists case_history_select on public.case_history;
create policy case_history_select on public.case_history
  for select to authenticated using (public.can_access_case(case_id, 'read'));
drop policy if exists case_history_insert on public.case_history;
create policy case_history_insert on public.case_history
  for insert to authenticated with check (public.can_access_case(case_id, 'read'));

alter table public.case_assignments enable row level security;
drop policy if exists case_assignments_update on public.case_assignments;
drop policy if exists case_assignments_delete on public.case_assignments;
drop policy if exists case_assignments_select on public.case_assignments;
create policy case_assignments_select on public.case_assignments
  for select to authenticated using (public.can_access_case(case_id, 'read'));
drop policy if exists case_assignments_insert on public.case_assignments;
create policy case_assignments_insert on public.case_assignments
  for insert to authenticated with check (public.can_access_case(case_id, 'update'));
create policy case_assignments_update on public.case_assignments
  for update to authenticated using (public.can_access_case(case_id, 'update')) with check (public.can_access_case(case_id, 'update'));

alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated with check (auth.uid() is not null and user_id = auth.uid());
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated using (public.current_user_has_permission('audit_trail', 'read'));

-- Publish case history/assignment/audit changes for live UI refresh where realtime is enabled.
do $$
begin
  begin
    alter publication supabase_realtime add table public.case_history;
  exception when duplicate_object then null; when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.case_assignments;
  exception when duplicate_object then null; when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.audit_logs;
  exception when duplicate_object then null; when undefined_object then null;
  end;
end;
$$;

drop function if exists public.add_column_if_missing(text, text, text);

-- Validation query:
-- select count(*) from public.case_history;
-- select count(*) from public.audit_logs;
-- select case_id, count(*) from public.case_assignments where is_current group by case_id having count(*) > 1;

-- Rollback guidance:
-- This migration is designed for production preservation. Do not drop history or audit data.
-- If a trigger must be disabled for controlled maintenance, document the maintenance window and re-enable it immediately.

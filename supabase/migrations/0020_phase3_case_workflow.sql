-- 0020_phase3_case_workflow.sql
-- Purpose: Phase 3 transactional case registration, numbering, workflow transitions, assignments,
-- filing workflow, automatic calendar events, idempotency, notifications, audit and history controls.
-- Safety: Forward-only. No production data cleanup. Does not disable RLS.

create sequence if not exists public.case_number_sequence;

alter table public.cases add column if not exists registration_metadata jsonb not null default '{}'::jsonb;
alter table public.cases add column if not exists registration_idempotency_key uuid;
create unique index if not exists cases_registration_idempotency_key_key
  on public.cases (registration_idempotency_key)
  where registration_idempotency_key is not null;

create table if not exists public.operation_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  record_type text,
  record_id uuid,
  response jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (idempotency_key, user_id, operation)
);
alter table public.operation_idempotency_keys enable row level security;
drop policy if exists operation_idempotency_keys_self_read on public.operation_idempotency_keys;
create policy operation_idempotency_keys_self_read on public.operation_idempotency_keys
  for select to authenticated using (user_id = auth.uid() or public.current_user_is_admin());

alter table public.events add column if not exists source_type text;
alter table public.events add column if not exists source_id uuid;
alter table public.events add column if not exists source_key text;
create unique index if not exists events_auto_source_key_unique
  on public.events (source_type, source_id, source_key)
  where auto_created = true and source_type is not null and source_id is not null and source_key is not null;

alter table public.case_history add column if not exists previous_state text;
alter table public.case_history add column if not exists new_state text;
alter table public.case_history add column if not exists comment text;
alter table public.case_assignments add column if not exists reassignment_reason text;

alter table public.filings add column if not exists submitted_by uuid references public.profiles(id) on delete set null;
alter table public.filings add column if not exists submitted_at timestamptz;
alter table public.filings add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.filings add column if not exists reviewed_at timestamptz;
alter table public.filings add column if not exists review_comment text;
alter table public.filings add column if not exists court_reference text;

create or replace function public.prevent_case_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'case_history is append-only';
end;
$$;

drop trigger if exists trg_case_history_no_update on public.case_history;
create trigger trg_case_history_no_update before update on public.case_history
for each row execute function public.prevent_case_history_mutation();

drop trigger if exists trg_case_history_no_delete on public.case_history;
create trigger trg_case_history_no_delete before delete on public.case_history
for each row execute function public.prevent_case_history_mutation();

create or replace function public.prevent_direct_workflow_state_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.workflow_state is distinct from new.workflow_state
     and current_setting('app.workflow_transition', true) is distinct from 'allowed' then
    raise exception 'workflow_state must be changed through approved workflow RPCs';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cases_workflow_guard on public.cases;
create trigger trg_cases_workflow_guard before update of workflow_state on public.cases
for each row execute function public.prevent_direct_workflow_state_update();

create or replace function public.is_valid_case_workflow_state(p_state text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select upper(coalesce(p_state, '')) = any (array[
    'REGISTERED','ASSIGNED','REGISTRATION_COMPLETED','DRAFTING','UNDER_REVIEW',
    'APPROVED_FOR_FILING','FILED','COMPLIANCE','READY_FOR_CLOSURE','CLOSED'
  ]);
$$;

create or replace function public.case_status_for_workflow_state(p_state text)
returns text
language sql
immutable
set search_path = public
as $$
  select case upper(coalesce(p_state, ''))
    when 'REGISTERED' then 'registered'
    when 'ASSIGNED' then 'assigned'
    when 'REGISTRATION_COMPLETED' then 'in_progress'
    when 'DRAFTING' then 'in_progress'
    when 'UNDER_REVIEW' then 'under_review'
    when 'APPROVED_FOR_FILING' then 'approved_for_filing'
    when 'FILED' then 'filed'
    when 'COMPLIANCE' then 'compliance'
    when 'READY_FOR_CLOSURE' then 'ready_for_closure'
    when 'CLOSED' then 'closed'
    else 'under_review'
  end;
$$;

create or replace function public.required_permission_for_workflow_transition(p_from text, p_to text)
returns table(module_key text, action text)
language sql
stable
set search_path = public
as $$
  select * from (values
    ('REGISTERED','ASSIGNED','allocation','update'),
    ('ASSIGNED','REGISTRATION_COMPLETED','cases','update'),
    ('REGISTRATION_COMPLETED','DRAFTING','filings','create'),
    ('DRAFTING','UNDER_REVIEW','filings','update'),
    ('UNDER_REVIEW','DRAFTING','filings','approve'),
    ('UNDER_REVIEW','APPROVED_FOR_FILING','filings','approve'),
    ('APPROVED_FOR_FILING','FILED','filings','update'),
    ('FILED','COMPLIANCE','compliance','update'),
    ('COMPLIANCE','READY_FOR_CLOSURE','compliance','update'),
    ('READY_FOR_CLOSURE','CLOSED','cases','approve')
  ) as t(from_state, to_state, module_key, action)
  where from_state = upper(coalesce(p_from, '')) and to_state = upper(coalesce(p_to, ''));
$$;

create or replace function public.generate_case_number()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_year text := to_char(timezone('Pacific/Port_Moresby', now()), 'YYYY');
  v_next bigint;
begin
  v_next := nextval('public.case_number_sequence');
  return format('DLPP-%s-%s', v_year, lpad(v_next::text, 6, '0'));
end;
$$;

create or replace function public.add_audit_log(
  p_user_id uuid,
  p_action text,
  p_record_type text,
  p_record_id text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(user_id, action, record_type, record_id, details)
  values (p_user_id, p_action, p_record_type, p_record_id, coalesce(p_details, '{}'::jsonb));
end;
$$;

create or replace function public.add_case_history(
  p_case_id uuid,
  p_action text,
  p_description text,
  p_previous_state text default null,
  p_new_state text default null,
  p_comment text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_performed_by uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.case_history(
    case_id, action, description, workflow_state_from, workflow_state_to,
    previous_state, new_state, comment, metadata, performed_by, created_by
  ) values (
    p_case_id, p_action, p_description, p_previous_state, p_new_state,
    p_previous_state, p_new_state, p_comment, coalesce(p_metadata, '{}'::jsonb), p_performed_by, p_performed_by
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.create_case_notification(
  p_user_id uuid,
  p_case_id uuid,
  p_title text,
  p_message text,
  p_type text default 'case_update',
  p_priority text default 'normal',
  p_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null then return null; end if;
  insert into public.notifications(user_id, case_id, title, message, type, priority, link)
  values (p_user_id, p_case_id, left(p_title, 180), left(p_message, 400), coalesce(p_type, 'case_update'), coalesce(p_priority, 'normal'), coalesce(p_link, '/cases/' || p_case_id::text))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.upsert_case_auto_event(
  p_case_id uuid,
  p_source_key text,
  p_event_type text,
  p_title text,
  p_event_date timestamptz,
  p_description text default null,
  p_location text default null,
  p_assigned_to uuid default null,
  p_created_by uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_case_id is null or p_source_key is null or p_event_date is null then return null; end if;

  insert into public.events(case_id, event_type, title, description, event_date, location, assigned_to, reminder_date, auto_created, source_type, source_id, source_key, created_by, status)
  values (p_case_id, upper(p_event_type), left(p_title, 180), p_description, p_event_date, p_location, p_assigned_to, p_event_date - interval '2 days', true, 'case', p_case_id, p_source_key, p_created_by, 'scheduled')
  on conflict (source_type, source_id, source_key) where auto_created = true and source_type is not null and source_id is not null and source_key is not null
  do update set event_type = excluded.event_type, title = excluded.title, description = excluded.description, event_date = excluded.event_date, location = excluded.location, assigned_to = excluded.assigned_to, reminder_date = excluded.reminder_date, status = 'scheduled', updated_at = timezone('utc', now())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.transition_case_workflow(p_case_id uuid, p_target_state text, p_comment text default null, p_metadata jsonb default '{}'::jsonb)
returns table(case_id uuid, previous_state text, new_state text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases%rowtype;
  v_target text := upper(coalesce(p_target_state, ''));
  v_required record;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_valid_case_workflow_state(v_target) then raise exception 'UNSUPPORTED_WORKFLOW_STATE'; end if;

  select * into v_case from public.cases where id = p_case_id for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;
  if not public.can_access_case(p_case_id, 'update') then raise exception 'CASE_ACCESS_DENIED'; end if;

  select * into v_required from public.required_permission_for_workflow_transition(v_case.workflow_state, v_target) limit 1;
  if v_required.module_key is null then raise exception 'INVALID_WORKFLOW_TRANSITION'; end if;
  if not public.user_has_permission_internal(v_uid, v_required.module_key, v_required.action) then raise exception 'WORKFLOW_PERMISSION_DENIED'; end if;
  if v_target = 'ASSIGNED' and v_case.assigned_officer_id is null then raise exception 'ASSIGNMENT_REQUIRED'; end if;
  if v_target = 'DRAFTING' and v_case.workflow_state = 'UNDER_REVIEW' and nullif(trim(coalesce(p_comment, '')), '') is null then raise exception 'RETURN_COMMENT_REQUIRED'; end if;
  if v_target = 'CLOSED' and (v_case.closure_type is null or v_case.closure_date is null or nullif(trim(coalesce(v_case.closure_notes, '')), '') is null) then raise exception 'CLOSURE_VALIDATION_FAILED'; end if;

  perform set_config('app.workflow_transition', 'allowed', true);
  update public.cases set workflow_state = v_target, status = public.case_status_for_workflow_state(v_target), updated_by = v_uid, updated_at = timezone('utc', now()) where id = p_case_id;

  perform public.add_case_history(p_case_id, 'case.workflow_transitioned', format('Workflow transitioned from %s to %s', v_case.workflow_state, v_target), v_case.workflow_state, v_target, p_comment, coalesce(p_metadata, '{}'::jsonb), v_uid);
  perform public.add_audit_log(v_uid, 'case.workflow_transitioned', 'case', p_case_id::text, jsonb_build_object('previous_state', v_case.workflow_state, 'new_state', v_target) || coalesce(p_metadata, '{}'::jsonb));

  case_id := p_case_id; previous_state := v_case.workflow_state; new_state := v_target; return next;
end;
$$;

create or replace function public.assign_case(p_case_id uuid, p_officer_id uuid, p_reason text default null, p_instructions text default null)
returns table(case_id uuid, assignment_id uuid, workflow_state text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases%rowtype;
  v_officer public.profiles%rowtype;
  v_previous_assignment public.case_assignments%rowtype;
  v_assignment_id uuid;
  v_was_reassignment boolean := false;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.user_has_permission_internal(v_uid, 'allocation', 'update') then raise exception 'ASSIGNMENT_PERMISSION_DENIED'; end if;
  select * into v_case from public.cases where id = p_case_id for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;
  if not public.can_access_case(p_case_id, 'update') then raise exception 'CASE_ACCESS_DENIED'; end if;
  select * into v_officer from public.profiles where id = p_officer_id and active = true;
  if not found then raise exception 'OFFICER_NOT_FOUND_OR_INACTIVE'; end if;

  select * into v_previous_assignment from public.case_assignments where case_id = p_case_id and status = 'active' order by assigned_at desc limit 1 for update;
  v_was_reassignment := found and v_previous_assignment.assigned_to is distinct from p_officer_id;
  if v_was_reassignment and nullif(trim(coalesce(p_reason, '')), '') is null then raise exception 'REASSIGNMENT_REASON_REQUIRED'; end if;
  if found then update public.case_assignments set status = 'superseded', completed_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = v_previous_assignment.id; end if;

  insert into public.case_assignments(case_id, assigned_to, assigned_by, assignment_type, instructions, status, reassignment_reason)
  values (p_case_id, p_officer_id, v_uid, case when found then 'reassignment' else 'initial' end, p_instructions, 'active', p_reason)
  returning id into v_assignment_id;

  perform set_config('app.workflow_transition', 'allowed', true);
  update public.cases set assigned_officer_id = p_officer_id, workflow_state = case when workflow_state = 'REGISTERED' then 'ASSIGNED' else workflow_state end, status = case when workflow_state = 'REGISTERED' then 'assigned' else status end, updated_by = v_uid, updated_at = timezone('utc', now()) where id = p_case_id returning * into v_case;

  perform public.add_case_history(p_case_id, case when v_was_reassignment then 'case.reassigned' else 'case.assigned' end, case when v_was_reassignment then 'Case reassigned' else 'Case assigned' end, null, case when v_case.workflow_state = 'ASSIGNED' then 'ASSIGNED' else null end, p_reason, jsonb_build_object('assignment_id', v_assignment_id, 'assigned_to', p_officer_id), v_uid);
  perform public.add_audit_log(v_uid, case when v_was_reassignment then 'case.reassigned' else 'case.assigned' end, 'case', p_case_id::text, jsonb_build_object('assignment_id', v_assignment_id, 'assigned_to', p_officer_id, 'previous_assignee', v_previous_assignment.assigned_to));
  perform public.create_case_notification(p_officer_id, p_case_id, 'Case assigned', 'A case has been assigned to you.', 'case_assignment', 'normal', '/cases/' || p_case_id::text);
  if v_was_reassignment then perform public.create_case_notification(v_previous_assignment.assigned_to, p_case_id, 'Case reassigned', 'A case previously assigned to you has been reassigned.', 'case_assignment', 'normal', '/cases/' || p_case_id::text); end if;

  case_id := p_case_id; assignment_id := v_assignment_id; workflow_state := v_case.workflow_state; return next;
end;
$$;

create or replace function public.register_case(p_registration jsonb, p_idempotency_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.operation_idempotency_keys%rowtype;
  v_case_id uuid;
  v_case_number text;
  v_title text;
  v_workflow_state text := 'REGISTERED';
  v_officer_id uuid;
  v_returnable timestamptz;
  v_first_hearing timestamptz;
  v_response jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_idempotency_key is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if not public.user_has_permission_internal(v_uid, 'cases', 'create') then raise exception 'CASE_CREATE_PERMISSION_DENIED'; end if;

  select * into v_existing from public.operation_idempotency_keys where idempotency_key = p_idempotency_key and user_id = v_uid and operation = 'case.register' for update;
  if found and v_existing.response is not null then return v_existing.response; end if;
  if not found then insert into public.operation_idempotency_keys(idempotency_key, user_id, operation, record_type) values (p_idempotency_key, v_uid, 'case.register', 'case'); end if;

  v_case_number := public.generate_case_number();
  v_title := coalesce(nullif(trim(coalesce(p_registration->>'title', '')), ''), 'Case ' || v_case_number);
  v_officer_id := nullif(p_registration->>'assigned_officer_id', '')::uuid;
  v_returnable := nullif(p_registration->>'returnable_date', '')::timestamptz;
  v_first_hearing := nullif(p_registration->>'first_hearing_date', '')::timestamptz;

  insert into public.cases(case_number, title, description, status, workflow_state, priority, case_type, matter_type, region, court_file_number, track_number, case_origin, dlpp_role, division_responsible, returnable_date, first_hearing_date, created_by, updated_by, registration_metadata, registration_idempotency_key)
  values (v_case_number, v_title, nullif(trim(coalesce(p_registration->>'description', '')), ''), 'registered', 'REGISTERED', coalesce(nullif(trim(coalesce(p_registration->>'priority', '')), ''), 'medium'), nullif(trim(coalesce(p_registration->>'case_type', '')), ''), nullif(trim(coalesce(p_registration->>'matter_type', '')), ''), nullif(trim(coalesce(p_registration->>'region', '')), ''), nullif(trim(coalesce(p_registration->>'court_file_number', '')), ''), nullif(trim(coalesce(p_registration->>'track_number', '')), ''), nullif(trim(coalesce(p_registration->>'case_origin', '')), ''), nullif(trim(coalesce(p_registration->>'dlpp_role', '')), ''), nullif(trim(coalesce(p_registration->>'division_responsible', '')), ''), v_returnable::date, v_first_hearing::date, v_uid, v_uid, coalesce(p_registration, '{}'::jsonb) - 'user_id' - 'case_number', p_idempotency_key)
  returning id into v_case_id;

  insert into public.parties(case_id, name, role, party_type, contact_info) values (v_case_id, 'Department of Lands & Physical Planning', coalesce(nullif(p_registration->>'dlpp_role', ''), 'defendant'), 'government_entity', jsonb_build_object('department', 'DLPP', 'division', p_registration->>'division_responsible'));
  if nullif(trim(coalesce(p_registration->>'opposing_party_name', p_registration->>'parties_description', '')), '') is not null then
    insert into public.parties(case_id, name, role, party_type, contact_info) values (v_case_id, left(nullif(trim(coalesce(p_registration->>'opposing_party_name', p_registration->>'parties_description')), ''), 300), case when p_registration->>'dlpp_role' = 'plaintiff' then 'defendant' else 'plaintiff' end, 'external_party', jsonb_build_object('lawyer', p_registration->>'opposing_lawyer_name'));
  end if;
  if nullif(trim(coalesce(p_registration->>'land_description', '')), '') is not null then
    insert into public.land_parcels(case_id, parcel_number, location, notes) values (v_case_id, coalesce(nullif(trim(coalesce(p_registration->>'survey_plan_no', '')), ''), 'N/A'), nullif(trim(coalesce(p_registration->>'region', '')), ''), left(p_registration->>'land_description', 2000));
  end if;

  perform public.add_case_history(v_case_id, 'case.created', 'Case registered', null, 'REGISTERED', null, jsonb_build_object('case_number', v_case_number), v_uid);
  perform public.add_audit_log(v_uid, 'case.created', 'case', v_case_id::text, jsonb_build_object('case_number', v_case_number));
  if v_returnable is not null then perform public.upsert_case_auto_event(v_case_id, 'returnable_date', 'RETURNABLE_DATE', 'Returnable date - ' || v_case_number, v_returnable, 'Automatically created from case registration.', 'Court', v_officer_id, v_uid); end if;
  if v_first_hearing is not null then perform public.upsert_case_auto_event(v_case_id, 'first_hearing', 'FIRST_HEARING', 'First hearing - ' || v_case_number, v_first_hearing, 'Automatically created from case registration.', 'Court', v_officer_id, v_uid); end if;
  if v_officer_id is not null then perform * from public.assign_case(v_case_id, v_officer_id, null, p_registration->>'assignment_notes'); v_workflow_state := 'ASSIGNED'; end if;

  v_response := jsonb_build_object('case_id', v_case_id, 'case_number', v_case_number, 'workflow_state', v_workflow_state, 'warnings', '[]'::jsonb);
  update public.operation_idempotency_keys set record_id = v_case_id, response = v_response where idempotency_key = p_idempotency_key and user_id = v_uid and operation = 'case.register';
  return v_response;
end;
$$;

create or replace function public.create_case_filing(p_case_id uuid, p_filing jsonb, p_idempotency_key uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases%rowtype;
  v_filing_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.user_has_permission_internal(v_uid, 'filings', 'create') then raise exception 'FILING_CREATE_PERMISSION_DENIED'; end if;
  select * into v_case from public.cases where id = p_case_id for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;
  if not public.can_access_case(p_case_id, 'update') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if v_case.assigned_officer_id is not null and v_case.assigned_officer_id is distinct from v_uid and not public.user_has_permission_internal(v_uid, 'filings', 'approve') then raise exception 'NOT_ASSIGNED_TO_CASE'; end if;
  if v_case.workflow_state not in ('REGISTRATION_COMPLETED','DRAFTING') then raise exception 'INVALID_WORKFLOW_FOR_FILING_CREATE'; end if;

  insert into public.filings(case_id, filing_type, filing_title, filing_subtype, title, description, draft_file_url, draft_uploaded_by, draft_uploaded_at, status, created_by)
  values (p_case_id, nullif(trim(coalesce(p_filing->>'filing_type', '')), ''), nullif(trim(coalesce(p_filing->>'filing_title', p_filing->>'title', '')), ''), nullif(trim(coalesce(p_filing->>'filing_subtype', '')), ''), nullif(trim(coalesce(p_filing->>'title', p_filing->>'filing_title', '')), ''), nullif(trim(coalesce(p_filing->>'description', '')), ''), nullif(trim(coalesce(p_filing->>'draft_file_url', '')), ''), v_uid, timezone('utc', now()), 'DRAFTING', v_uid)
  returning id into v_filing_id;

  if v_case.workflow_state = 'REGISTRATION_COMPLETED' then
    perform set_config('app.workflow_transition', 'allowed', true);
    update public.cases set workflow_state = 'DRAFTING', status = public.case_status_for_workflow_state('DRAFTING'), updated_by = v_uid, updated_at = timezone('utc', now()) where id = p_case_id;
  end if;
  perform public.add_case_history(p_case_id, 'filing.created', 'Draft filing created', v_case.workflow_state, 'DRAFTING', null, jsonb_build_object('filing_id', v_filing_id), v_uid);
  perform public.add_audit_log(v_uid, 'filing.created', 'filing', v_filing_id::text, jsonb_build_object('case_id', p_case_id));
  return jsonb_build_object('filing_id', v_filing_id, 'case_id', p_case_id, 'workflow_state', 'DRAFTING');
end;
$$;

create or replace function public.submit_filings_for_review(p_case_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases%rowtype;
  v_count integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.user_has_permission_internal(v_uid, 'filings', 'update') then raise exception 'FILING_SUBMIT_PERMISSION_DENIED'; end if;
  select * into v_case from public.cases where id = p_case_id for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;
  if v_case.workflow_state <> 'DRAFTING' then raise exception 'CASE_NOT_IN_DRAFTING'; end if;
  if v_case.assigned_officer_id is not null and v_case.assigned_officer_id is distinct from v_uid and not public.user_has_permission_internal(v_uid, 'filings', 'approve') then raise exception 'NOT_ASSIGNED_TO_CASE'; end if;

  update public.filings set status = 'UNDER_REVIEW', submitted_by = v_uid, submitted_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where case_id = p_case_id and status in ('draft','prepared','DRAFTING') and coalesce(nullif(file_url, ''), nullif(draft_file_url, '')) is not null and coalesce(file_url, draft_file_url) <> '#';
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'NO_SUBMITTABLE_FILING_WITH_DOCUMENT'; end if;

  perform set_config('app.workflow_transition', 'allowed', true);
  update public.cases set workflow_state = 'UNDER_REVIEW', status = public.case_status_for_workflow_state('UNDER_REVIEW'), updated_by = v_uid, updated_at = timezone('utc', now()) where id = p_case_id;
  perform public.add_case_history(p_case_id, 'filing.submitted', 'Filing submitted for review', 'DRAFTING', 'UNDER_REVIEW', null, jsonb_build_object('filing_count', v_count), v_uid);
  perform public.add_audit_log(v_uid, 'filing.submitted', 'case', p_case_id::text, jsonb_build_object('filing_count', v_count));
  insert into public.notifications(user_id, case_id, title, message, type, priority, link)
  select distinct ug.user_id, p_case_id, 'Filing submitted for review', 'A filing is ready for review.', 'filing_review', 'normal', '/cases/' || p_case_id::text
  from public.user_groups ug join public.group_module_permissions gmp on gmp.group_id = ug.group_id join public.modules m on m.id = gmp.module_id
  where ug.is_active and m.module_key = 'filings' and gmp.can_approve and ug.user_id <> v_uid;
  return jsonb_build_object('case_id', p_case_id, 'filing_count', v_count, 'workflow_state', 'UNDER_REVIEW');
end;
$$;

create or replace function public.review_case_filing(p_filing_id uuid, p_action text, p_comment text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_filing public.filings%rowtype;
  v_case public.cases%rowtype;
  v_target_case_state text;
  v_target_filing_status text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.user_has_permission_internal(v_uid, 'filings', 'approve') then raise exception 'FILING_REVIEW_PERMISSION_DENIED'; end if;
  select * into v_filing from public.filings where id = p_filing_id for update;
  if not found then raise exception 'FILING_NOT_FOUND'; end if;
  if upper(v_filing.status) <> 'UNDER_REVIEW' then raise exception 'FILING_NOT_UNDER_REVIEW'; end if;
  if v_filing.submitted_by is not null and v_filing.submitted_by = v_uid then raise exception 'SELF_APPROVAL_NOT_ALLOWED'; end if;
  select * into v_case from public.cases where id = v_filing.case_id for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;
  if lower(p_action) = 'approve' then v_target_case_state := 'APPROVED_FOR_FILING'; v_target_filing_status := 'APPROVED_FOR_FILING';
  elsif lower(p_action) in ('return','return_for_correction') then if nullif(trim(coalesce(p_comment, '')), '') is null then raise exception 'REVIEW_COMMENT_REQUIRED'; end if; v_target_case_state := 'DRAFTING'; v_target_filing_status := 'DRAFTING';
  else raise exception 'UNSUPPORTED_REVIEW_ACTION'; end if;
  update public.filings set status = v_target_filing_status, reviewed_by = v_uid, reviewed_at = timezone('utc', now()), review_comment = p_comment, updated_at = timezone('utc', now()) where id = p_filing_id;
  perform set_config('app.workflow_transition', 'allowed', true);
  update public.cases set workflow_state = v_target_case_state, status = public.case_status_for_workflow_state(v_target_case_state), updated_by = v_uid, updated_at = timezone('utc', now()) where id = v_case.id;
  perform public.add_case_history(v_case.id, case when v_target_case_state = 'DRAFTING' then 'filing.returned' else 'filing.approved' end, case when v_target_case_state = 'DRAFTING' then 'Filing returned for correction' else 'Filing approved for filing' end, 'UNDER_REVIEW', v_target_case_state, p_comment, jsonb_build_object('filing_id', p_filing_id), v_uid);
  perform public.add_audit_log(v_uid, case when v_target_case_state = 'DRAFTING' then 'filing.returned' else 'filing.approved' end, 'filing', p_filing_id::text, jsonb_build_object('case_id', v_case.id));
  perform public.create_case_notification(v_filing.submitted_by, v_case.id, case when v_target_case_state = 'DRAFTING' then 'Filing returned' else 'Filing approved' end, case when v_target_case_state = 'DRAFTING' then 'A filing was returned for correction.' else 'A filing was approved for filing.' end, 'filing_review', 'normal', '/cases/' || v_case.id::text);
  return jsonb_build_object('filing_id', p_filing_id, 'case_id', v_case.id, 'workflow_state', v_target_case_state, 'filing_status', v_target_filing_status);
end;
$$;

create or replace function public.mark_filing_filed(p_filing_id uuid, p_court_filing_date date, p_court_reference text default null, p_file_url text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_filing public.filings%rowtype;
  v_case public.cases%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.user_has_permission_internal(v_uid, 'filings', 'update') then raise exception 'FILING_UPDATE_PERMISSION_DENIED'; end if;
  if p_court_filing_date is null then raise exception 'COURT_FILING_DATE_REQUIRED'; end if;
  select * into v_filing from public.filings where id = p_filing_id for update;
  if not found then raise exception 'FILING_NOT_FOUND'; end if;
  if upper(v_filing.status) <> 'APPROVED_FOR_FILING' then raise exception 'FILING_NOT_APPROVED'; end if;
  select * into v_case from public.cases where id = v_filing.case_id for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;
  update public.filings set status = 'FILED', court_filing_date = p_court_filing_date, court_reference = p_court_reference, file_url = coalesce(nullif(p_file_url, ''), file_url), updated_at = timezone('utc', now()) where id = p_filing_id;
  perform set_config('app.workflow_transition', 'allowed', true);
  update public.cases set workflow_state = 'FILED', status = public.case_status_for_workflow_state('FILED'), updated_by = v_uid, updated_at = timezone('utc', now()) where id = v_case.id;
  perform public.add_case_history(v_case.id, 'filing.filed', 'Filing recorded as filed', 'APPROVED_FOR_FILING', 'FILED', p_court_reference, jsonb_build_object('filing_id', p_filing_id, 'court_filing_date', p_court_filing_date), v_uid);
  perform public.add_audit_log(v_uid, 'filing.filed', 'filing', p_filing_id::text, jsonb_build_object('case_id', v_case.id));
  perform public.create_case_notification(v_case.assigned_officer_id, v_case.id, 'Filing recorded as filed', 'A filing has been recorded as filed.', 'filing_filed', 'normal', '/cases/' || v_case.id::text);
  return jsonb_build_object('filing_id', p_filing_id, 'case_id', v_case.id, 'workflow_state', 'FILED');
end;
$$;

create or replace function public.close_case(p_case_id uuid, p_closure jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_case public.cases%rowtype;
  v_closure_id uuid;
  v_blocking_tasks integer := 0;
  v_open_compliance integer := 0;
  v_unfiled_approved integer := 0;
  v_closure_type text := nullif(trim(coalesce(p_closure->>'closure_type', p_closure->>'closure_status', '')), '');
  v_closure_date date := nullif(p_closure->>'closure_date', '')::date;
  v_closure_notes text := nullif(trim(coalesce(p_closure->>'closure_notes', '')), '');
  v_outcome_summary text := nullif(trim(coalesce(p_closure->>'outcome_summary', p_closure->>'final_outcome', '')), '');
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.user_has_permission_internal(v_uid, 'cases', 'approve') then raise exception 'CASE_CLOSE_PERMISSION_DENIED'; end if;
  if v_closure_type is null or v_closure_date is null or v_closure_notes is null then raise exception 'CLOSURE_VALIDATION_FAILED'; end if;

  select * into v_case from public.cases where id = p_case_id for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;
  if not public.can_access_case(p_case_id, 'update') then raise exception 'CASE_ACCESS_DENIED'; end if;
  if v_case.workflow_state <> 'READY_FOR_CLOSURE' then raise exception 'CASE_NOT_READY_FOR_CLOSURE'; end if;

  select count(*) into v_blocking_tasks
  from public.tasks
  where case_id = p_case_id
    and status <> 'completed'
    and coalesce(priority, '') in ('urgent', 'critical', 'high');
  if v_blocking_tasks > 0 then raise exception 'CLOSURE_BLOCKED_BY_ACTIVE_TASKS'; end if;

  select count(*) into v_open_compliance
  from public.compliance_tracking
  where case_id = p_case_id
    and compliance_status not in ('completed', 'closed', 'not_required');
  if v_open_compliance > 0 then raise exception 'CLOSURE_BLOCKED_BY_COMPLIANCE'; end if;

  select count(*) into v_unfiled_approved
  from public.filings
  where case_id = p_case_id
    and status in ('APPROVED_FOR_FILING', 'UNDER_REVIEW', 'DRAFTING', 'draft', 'prepared', 'under_review');
  if v_unfiled_approved > 0 then raise exception 'CLOSURE_BLOCKED_BY_FILINGS'; end if;

  perform set_config('app.workflow_transition', 'allowed', true);
  update public.cases
    set closure_type = v_closure_type,
        closure_date = v_closure_date,
        closure_notes = v_closure_notes,
        workflow_state = 'CLOSED',
        status = public.case_status_for_workflow_state('CLOSED'),
        updated_by = v_uid,
        updated_at = timezone('utc', now())
    where id = p_case_id
    returning * into v_case;

  insert into public.case_closures(case_id, closed_by, closure_date, closure_notes, closure_type, outcome_summary)
  values (p_case_id, v_uid, v_closure_date, v_closure_notes, v_closure_type, v_outcome_summary)
  returning id into v_closure_id;

  perform public.add_case_history(p_case_id, 'case.closed', 'Case closed', 'READY_FOR_CLOSURE', 'CLOSED', v_closure_notes, jsonb_build_object('closure_id', v_closure_id, 'closure_type', v_closure_type), v_uid);
  perform public.add_audit_log(v_uid, 'case.closed', 'case', p_case_id::text, jsonb_build_object('closure_id', v_closure_id, 'closure_type', v_closure_type));
  perform public.create_case_notification(v_case.assigned_officer_id, p_case_id, 'Case closed', 'A case has been closed.', 'case_closed', 'normal', '/cases/' || p_case_id::text);

  return jsonb_build_object('case_id', p_case_id, 'closure_id', v_closure_id, 'workflow_state', 'CLOSED');
end;
$$;

revoke all on function public.generate_case_number() from public;
revoke all on function public.add_audit_log(uuid, text, text, text, jsonb) from public;
revoke all on function public.add_case_history(uuid, text, text, text, text, text, jsonb, uuid) from public;
revoke all on function public.create_case_notification(uuid, uuid, text, text, text, text, text) from public;
revoke all on function public.upsert_case_auto_event(uuid, text, text, text, timestamptz, text, text, uuid, uuid) from public;
revoke all on function public.transition_case_workflow(uuid, text, text, jsonb) from public;
revoke all on function public.assign_case(uuid, uuid, text, text) from public;
revoke all on function public.register_case(jsonb, uuid) from public;
revoke all on function public.create_case_filing(uuid, jsonb, uuid) from public;
revoke all on function public.submit_filings_for_review(uuid) from public;
revoke all on function public.review_case_filing(uuid, text, text) from public;
revoke all on function public.mark_filing_filed(uuid, date, text, text) from public;
revoke all on function public.close_case(uuid, jsonb) from public;

grant execute on function public.transition_case_workflow(uuid, text, text, jsonb) to authenticated;
grant execute on function public.assign_case(uuid, uuid, text, text) to authenticated;
grant execute on function public.register_case(jsonb, uuid) to authenticated;
grant execute on function public.create_case_filing(uuid, jsonb, uuid) to authenticated;
grant execute on function public.submit_filings_for_review(uuid) to authenticated;
grant execute on function public.review_case_filing(uuid, text, text) to authenticated;
grant execute on function public.mark_filing_filed(uuid, date, text, text) to authenticated;
grant execute on function public.close_case(uuid, jsonb) to authenticated;

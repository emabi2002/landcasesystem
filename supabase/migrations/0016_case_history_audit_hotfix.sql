-- 0016_case_history_audit_hotfix.sql
-- Purpose: Hotfix audit immutability and assignment-history behavior after migration 0015.
-- Safety: Forward-only. Does not delete case, history, assignment, or audit records.

create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;

drop trigger if exists trg_audit_logs_no_update on public.audit_logs;
create trigger trg_audit_logs_no_update
before update on public.audit_logs
for each row execute function public.prevent_audit_mutation();

drop trigger if exists trg_audit_logs_no_delete on public.audit_logs;
create trigger trg_audit_logs_no_delete
before delete on public.audit_logs
for each row execute function public.prevent_audit_mutation();

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
     and new.assigned_officer_id is not null then
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

-- Validation query:
-- select tgname from pg_trigger where tgname in ('trg_audit_logs_no_update','trg_audit_logs_no_delete','trg_case_assignments_00_sync_fields','trg_case_assignments_10_close_previous');

-- Fix officer reassignment activity logging alias bug.
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
      select coalesce(p.full_name, p.email, p.id::text) into v_old_label from public.profiles p where p.id = public.try_uuid(v_old ->> 'assigned_officer_id');
      select coalesce(p.full_name, p.email, p.id::text) into v_new_label from public.profiles p where p.id = public.try_uuid(v_new ->> 'assigned_officer_id');
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


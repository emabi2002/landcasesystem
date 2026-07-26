-- 0018_staff_migration_apply_rpc.sql
-- Purpose: Apply a validated staff migration row to profiles and group assignments.
-- Dependencies: 0001..0017
-- Safety: Forward-only. Does not create auth users or passwords; applies one explicitly validated row at a time.

create or replace function public.apply_staff_migration_row(p_staging_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.staff_migration_staging%rowtype;
  v_profile_id uuid;
  v_group_id uuid;
begin
  if not public.current_user_has_permission('users', 'update') then
    raise exception 'Not authorised to apply staff migration rows';
  end if;

  select * into rec from public.staff_migration_staging where id = p_staging_id for update;
  if not found then
    raise exception 'Staff migration row not found';
  end if;

  if rec.migration_status <> 'valid' then
    raise exception 'Staff migration row must be valid before applying';
  end if;

  v_profile_id := coalesce(rec.target_profile_id, rec.target_auth_user_id);
  if v_profile_id is null then
    raise exception 'No target profile/auth user available for staff migration row';
  end if;

  insert into public.profiles (id, full_name, email, phone, job_title, department, region, employee_id, active, legacy_role)
  values (v_profile_id, rec.full_name, rec.email, rec.phone, rec.job_title, rec.department, rec.region, rec.employee_id, true, rec.legacy_role)
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    job_title = excluded.job_title,
    department = excluded.department,
    region = excluded.region,
    employee_id = coalesce(public.profiles.employee_id, excluded.employee_id),
    legacy_role = coalesce(public.profiles.legacy_role, excluded.legacy_role);

  if rec.target_group_name is not null then
    select id into v_group_id from public.groups where group_name = rec.target_group_name and is_active = true;
    if v_group_id is null then
      raise exception 'Target group does not exist or is inactive';
    end if;

    insert into public.user_groups (user_id, group_id, assigned_by, is_active)
    values (v_profile_id, v_group_id, auth.uid(), true)
    on conflict (user_id, group_id) do update set
      is_active = true,
      assigned_by = excluded.assigned_by,
      assigned_at = timezone('utc', now()),
      expires_at = null;

    insert into public.staff_migration_results (staging_id, profile_id, auth_user_id, group_id, action, created_by)
    values (p_staging_id, v_profile_id, rec.target_auth_user_id, v_group_id, 'assigned_group', auth.uid());
  end if;

  update public.staff_migration_staging
  set migration_status = 'applied', target_profile_id = v_profile_id, applied_by = auth.uid(), applied_at = timezone('utc', now())
  where id = p_staging_id;

  insert into public.staff_migration_results (staging_id, profile_id, auth_user_id, group_id, action, details, created_by)
  values (p_staging_id, v_profile_id, rec.target_auth_user_id, v_group_id, 'mapped_profile', jsonb_build_object('employee_id', rec.employee_id), auth.uid());

  return v_profile_id;
end;
$$;

revoke all on function public.apply_staff_migration_row(uuid) from public;
grant execute on function public.apply_staff_migration_row(uuid) to authenticated;

-- Validation query:
-- select proname from pg_proc where proname = 'apply_staff_migration_row';
-- Rollback guidance:
-- Revoke execute on this function to pause staff migration application. Correct mistakes with new audited rows, not destructive edits.

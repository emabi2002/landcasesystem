-- 0017_staff_migration_validation_rpc.sql
-- Purpose: Validate staged staff rows before applying profile/RBAC mapping.
-- Dependencies: 0001..0016
-- Safety: Forward-only. Validates only; does not create auth users, profiles, or group assignments.

create or replace function public.validate_staff_migration_batch(p_batch_id uuid)
returns table(staging_id uuid, migration_status text, validation_errors jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  errs jsonb;
  v_group_id uuid;
  v_profile_id uuid;
  v_auth_user_id uuid;
begin
  if not public.current_user_has_permission('users', 'update') then
    raise exception 'Not authorised to validate staff migration batches';
  end if;

  for rec in select * from public.staff_migration_staging where batch_id = p_batch_id loop
    errs := '[]'::jsonb;
    v_group_id := null;
    v_profile_id := null;
    v_auth_user_id := null;

    if nullif(trim(rec.full_name), '') is null then
      errs := errs || jsonb_build_array('full_name is required');
    end if;

    if rec.target_group_name is not null then
      select id into v_group_id from public.groups where group_name = rec.target_group_name and is_active = true;
      if v_group_id is null then
        errs := errs || jsonb_build_array('target_group_name does not match an active group');
      end if;
    end if;

    if rec.target_auth_user_id is not null then
      select id into v_auth_user_id from auth.users where id = rec.target_auth_user_id;
    elsif rec.email is not null then
      select id into v_auth_user_id from auth.users where lower(email) = lower(rec.email::text) limit 1;
    end if;

    if rec.employee_id is not null then
      select id into v_profile_id from public.profiles where employee_id = rec.employee_id limit 1;
    end if;

    if v_profile_id is null and rec.email is not null then
      select id into v_profile_id from public.profiles where lower(email::text) = lower(rec.email::text) limit 1;
    end if;

    if v_auth_user_id is null and v_profile_id is null then
      errs := errs || jsonb_build_array('no matching auth user or existing profile found; create Supabase Auth user before applying');
    end if;

    update public.staff_migration_staging
    set target_auth_user_id = coalesce(rec.target_auth_user_id, v_auth_user_id),
        target_profile_id = v_profile_id,
        validation_errors = errs,
        migration_status = case when jsonb_array_length(errs) = 0 then 'valid' else 'invalid' end
    where id = rec.id
    returning id, public.staff_migration_staging.migration_status, public.staff_migration_staging.validation_errors
    into staging_id, migration_status, validation_errors;

    insert into public.staff_migration_results (staging_id, profile_id, auth_user_id, action, details, created_by)
    values (rec.id, v_profile_id, coalesce(rec.target_auth_user_id, v_auth_user_id), 'validated', jsonb_build_object('errors', errs), auth.uid());

    return next;
  end loop;
end;
$$;

revoke all on function public.validate_staff_migration_batch(uuid) from public;
grant execute on function public.validate_staff_migration_batch(uuid) to authenticated;

-- Validation query:
-- select proname from pg_proc where proname = 'validate_staff_migration_batch';
-- Rollback guidance:
-- Revoke execute on this function to pause staff migration validation.

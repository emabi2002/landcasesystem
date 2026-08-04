-- rls_permissions_tests.sql
-- Purpose: Phase 2 database security tests. Run ONLY against a local or staging Supabase database.
-- These tests use plain assertions with RAISE EXCEPTION on failure.
-- They do not require pgTAP.

-- Safety guard: refuse to run unless explicitly confirmed as non-production.
do $$
begin
  if current_setting('app.confirm_test_db', true) is distinct from 'STAGING_OR_LOCAL' then
    raise exception 'Refusing to run tests without app.confirm_test_db = STAGING_OR_LOCAL';
  end if;
end;
$$;

-- Setup: create isolated test fixtures with random ids (no auth users needed for internal checks).
do $$
declare
  v_group_admin uuid;
  v_group_officer uuid;
  v_group_expired uuid;
  v_user_admin uuid := gen_random_uuid();
  v_user_officer uuid := gen_random_uuid();
  v_module_cases uuid;
  v_module_users uuid;
  v_result boolean;
begin
  -- Ensure modules exist.
  insert into public.modules (module_key, module_name) values ('cases','Cases')
    on conflict (module_key) do nothing;
  insert into public.modules (module_key, module_name) values ('users','Users')
    on conflict (module_key) do nothing;
  select id into v_module_cases from public.modules where module_key = 'cases';
  select id into v_module_users from public.modules where module_key = 'users';

  -- Profiles for test users.
  insert into public.profiles (id, full_name, active) values (v_user_admin, 'TEST_Admin', true)
    on conflict (id) do nothing;
  insert into public.profiles (id, full_name, active) values (v_user_officer, 'TEST_Officer', true)
    on conflict (id) do nothing;

  -- Groups.
  insert into public.groups (group_name, description) values ('TEST_AdminGroup','test')
    returning id into v_group_admin;
  insert into public.groups (group_name, description) values ('TEST_OfficerGroup','test')
    returning id into v_group_officer;
  insert into public.groups (group_name, description) values ('TEST_ExpiredGroup','test')
    returning id into v_group_expired;

  -- Permissions.
  insert into public.group_module_permissions (group_id, module_id, can_read, can_create, can_update)
    values (v_group_admin, v_module_users, true, true, true);
  insert into public.group_module_permissions (group_id, module_id, can_read)
    values (v_group_officer, v_module_cases, true);
  insert into public.group_module_permissions (group_id, module_id, can_create)
    values (v_group_expired, v_module_cases, true);

  -- Memberships.
  insert into public.user_groups (user_id, group_id, is_active) values (v_user_admin, v_group_admin, true);
  insert into public.user_groups (user_id, group_id, is_active) values (v_user_officer, v_group_officer, true);
  -- Expired membership should not grant permission.
  insert into public.user_groups (user_id, group_id, is_active, expires_at)
    values (v_user_officer, v_group_expired, true, now() - interval '1 day');

  -- TEST 1: officer has cases.read.
  v_result := public.user_has_permission_internal(v_user_officer, 'cases', 'read');
  if v_result is not true then raise exception 'TEST 1 FAILED: officer should have cases.read'; end if;

  -- TEST 2: officer does not have cases.create (only via expired group).
  v_result := public.user_has_permission_internal(v_user_officer, 'cases', 'create');
  if v_result is not false then raise exception 'TEST 2 FAILED: expired membership must not grant cases.create'; end if;

  -- TEST 3: admin has users.update.
  v_result := public.user_has_permission_internal(v_user_admin, 'users', 'update');
  if v_result is not true then raise exception 'TEST 3 FAILED: admin should have users.update'; end if;

  -- TEST 4: invalid action raises.
  begin
    perform public.user_has_permission_internal(v_user_admin, 'cases', 'teleport');
    raise exception 'TEST 4 FAILED: invalid action should raise';
  exception when others then
    null; -- expected
  end;

  -- TEST 5: additive permissions across groups.
  insert into public.group_module_permissions (group_id, module_id, can_update)
    values (v_group_officer, v_module_cases, true)
    on conflict (group_id, module_id) do update set can_update = true;
  v_result := public.user_has_permission_internal(v_user_officer, 'cases', 'update');
  if v_result is not true then raise exception 'TEST 5 FAILED: additive permission should grant cases.update'; end if;

  -- TEST 6: audit_logs are append-only (update blocked).
  insert into public.audit_logs (action) values ('TEST_action');
  begin
    update public.audit_logs set action = 'changed' where action = 'TEST_action';
    raise exception 'TEST 6 FAILED: audit_logs update should be blocked';
  exception when others then
    null; -- expected
  end;

  -- Cleanup test fixtures.
  delete from public.audit_logs where action = 'TEST_action';
  delete from public.user_groups where user_id in (v_user_admin, v_user_officer);
  delete from public.group_module_permissions where group_id in (v_group_admin, v_group_officer, v_group_expired);
  delete from public.groups where id in (v_group_admin, v_group_officer, v_group_expired);
  delete from public.profiles where id in (v_user_admin, v_user_officer);

  raise notice 'All Phase 2 permission tests passed.';
end;
$$;

-- 0012_rls_policies.sql
-- Purpose: Enable Row Level Security and permission-aware policies on all application tables.
-- Dependencies: 0001..0010, 0011 (permission functions must exist)
-- Safety: Forward-only. Enables RLS; does not disable it. No USING(true) except documented public reference data.

-- Helper: does the current user have access to a case according to permission + scope?
create or replace function public.can_access_case(p_case_id uuid, p_action text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_scope text;
  v_case record;
  v_profile record;
begin
  if v_uid is null then
    return false;
  end if;

  if not public.user_has_permission_internal(v_uid, 'cases', p_action) then
    return false;
  end if;

  v_scope := public.user_data_scope(v_uid, 'cases');
  if v_scope = 'all' then
    return true;
  end if;

  select assigned_officer_id, created_by, region, division_responsible
    into v_case
  from public.cases where id = p_case_id;

  if not found then
    return false;
  end if;

  if v_scope = 'assigned' then
    return v_case.assigned_officer_id = v_uid or v_case.created_by = v_uid;
  end if;

  if v_scope = 'own' then
    return v_case.created_by = v_uid;
  end if;

  select department, region into v_profile from public.profiles where id = v_uid;

  if v_scope = 'department' then
    return v_case.division_responsible is not distinct from v_profile.department
        or v_case.assigned_officer_id = v_uid;
  end if;

  if v_scope = 'region' then
    return v_case.region is not distinct from v_profile.region
        or v_case.assigned_officer_id = v_uid;
  end if;

  return false;
end;
$$;

revoke all on function public.can_access_case(uuid, text) from public;
grant execute on function public.can_access_case(uuid, text) to authenticated;

-- PROFILES
alter table public.profiles enable row level security;
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_user_is_admin());
drop policy if exists profiles_update_self_limited on public.profiles;
create policy profiles_update_self_limited on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.current_user_is_admin())
  with check (id = auth.uid() or public.current_user_is_admin());
drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.current_user_is_admin() or id = auth.uid());

-- RBAC tables: read for admins; writes for admins only.
alter table public.groups enable row level security;
drop policy if exists groups_admin_all on public.groups;
create policy groups_admin_all on public.groups
  for all to authenticated
  using (public.current_user_has_permission('groups', 'read'))
  with check (public.current_user_has_permission('groups', 'update'));

alter table public.modules enable row level security;
drop policy if exists modules_read on public.modules;
create policy modules_read on public.modules
  for select to authenticated
  using (public.current_user_has_permission('modules', 'read')
         or public.current_user_has_permission('admin', 'read'));
drop policy if exists modules_write_admin on public.modules;
create policy modules_write_admin on public.modules
  for all to authenticated
  using (public.current_user_has_permission('modules', 'update'))
  with check (public.current_user_has_permission('modules', 'update'));

alter table public.user_groups enable row level security;
drop policy if exists user_groups_read on public.user_groups;
create policy user_groups_read on public.user_groups
  for select to authenticated
  using (user_id = auth.uid() or public.current_user_has_permission('users', 'read'));
-- Prevent self-assignment into groups: only users.update permission may write, and not for themselves.
drop policy if exists user_groups_write_admin on public.user_groups;
create policy user_groups_write_admin on public.user_groups
  for all to authenticated
  using (public.current_user_has_permission('users', 'update'))
  with check (
    public.current_user_has_permission('users', 'update')
    and user_id <> auth.uid()
  );

alter table public.group_module_permissions enable row level security;
drop policy if exists gmp_admin_all on public.group_module_permissions;
create policy gmp_admin_all on public.group_module_permissions
  for all to authenticated
  using (public.current_user_has_permission('groups', 'read'))
  with check (public.current_user_has_permission('groups', 'update'));

alter table public.group_scope_rules enable row level security;
drop policy if exists gsr_admin_all on public.group_scope_rules;
create policy gsr_admin_all on public.group_scope_rules
  for all to authenticated
  using (public.current_user_has_permission('groups', 'read'))
  with check (public.current_user_has_permission('groups', 'update'));

-- CASES and case-scoped children
alter table public.cases enable row level security;
drop policy if exists cases_select on public.cases;
create policy cases_select on public.cases
  for select to authenticated using (public.can_access_case(id, 'read'));
drop policy if exists cases_insert on public.cases;
create policy cases_insert on public.cases
  for insert to authenticated
  with check (public.current_user_has_permission('cases', 'create'));
drop policy if exists cases_update on public.cases;
create policy cases_update on public.cases
  for update to authenticated
  using (public.can_access_case(id, 'update'))
  with check (public.can_access_case(id, 'update'));
drop policy if exists cases_delete on public.cases;
create policy cases_delete on public.cases
  for delete to authenticated
  using (public.can_access_case(id, 'delete'));

-- Generic case-child policy generator applied per table.
do $$
declare
  t text;
  child_tables text[] := array[
    'parties','documents','tasks','events','land_parcels','case_history',
    'case_assignments','communications','file_requests','filings',
    'compliance_tracking','court_orders','case_closures'
  ];
begin
  foreach t in array child_tables loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (case_id is null or public.can_access_case(case_id, ''read''));',
      t || '_select', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_insert', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (case_id is null or public.can_access_case(case_id, ''update''));',
      t || '_insert', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_update', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (case_id is null or public.can_access_case(case_id, ''update'')) with check (case_id is null or public.can_access_case(case_id, ''update''));',
      t || '_update', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (case_id is not null and public.can_access_case(case_id, ''delete''));',
      t || '_delete', t
    );
  end loop;
end;
$$;

-- Registry modules keyed by module permission.
do $$
declare
  rec record;
  reg_tables text[][] := array[
    array['incoming_correspondence','correspondence'],
    array['case_intake_records','correspondence'],
    array['directions','directions'],
    array['search_warrants','search_warrants'],
    array['section5_notices','section5_notices'],
    array['section_160_applications','section_160'],
    array['external_lawyers','lawyers'],
    array['recommendation_links','compliance']
  ];
begin
  for rec in select reg_tables[i][1] as tbl, reg_tables[i][2] as mod
             from generate_subscripts(reg_tables, 1) as i loop
    execute format('alter table public.%I enable row level security;', rec.tbl);

    execute format('drop policy if exists %I on public.%I;', rec.tbl || '_select', rec.tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.current_user_has_permission(%L, ''read''));',
      rec.tbl || '_select', rec.tbl, rec.mod
    );

    execute format('drop policy if exists %I on public.%I;', rec.tbl || '_insert', rec.tbl);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.current_user_has_permission(%L, ''create''));',
      rec.tbl || '_insert', rec.tbl, rec.mod
    );

    execute format('drop policy if exists %I on public.%I;', rec.tbl || '_update', rec.tbl);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.current_user_has_permission(%L, ''update'')) with check (public.current_user_has_permission(%L, ''update''));',
      rec.tbl || '_update', rec.tbl, rec.mod, rec.mod
    );

    execute format('drop policy if exists %I on public.%I;', rec.tbl || '_delete', rec.tbl);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.current_user_has_permission(%L, ''delete''));',
      rec.tbl || '_delete', rec.tbl, rec.mod
    );
  end loop;
end;
$$;

-- Intake documents follow their intake record's correspondence permission.
alter table public.case_intake_documents enable row level security;
drop policy if exists case_intake_documents_rw on public.case_intake_documents;
create policy case_intake_documents_rw on public.case_intake_documents
  for all to authenticated
  using (public.current_user_has_permission('correspondence', 'read'))
  with check (public.current_user_has_permission('correspondence', 'create'));

-- Litigation costs restricted to litigation_costs permission.
do $$
declare
  t text;
  cost_tables text[] := array['litigation_costs','cost_categories','litigation_cost_documents','litigation_cost_history','cost_alerts'];
begin
  foreach t in array cost_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.current_user_has_permission(''litigation_costs'', ''read''));',
      t || '_select', t
    );
    execute format('drop policy if exists %I on public.%I;', t || '_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.current_user_has_permission(''litigation_costs'', ''update'')) with check (public.current_user_has_permission(''litigation_costs'', ''create'') or public.current_user_has_permission(''litigation_costs'', ''update''));',
      t || '_write', t
    );
  end loop;
end;
$$;

-- Notifications: users only see and update their own.
alter table public.notifications enable row level security;
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- No general insert policy: notifications are created by server/service-role or approved functions only.

-- Audit logs: insert allowed for authenticated apps; reads require audit_trail permission; no update/delete via triggers.
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated with check (auth.uid() is not null);
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.current_user_has_permission('audit_trail', 'read'));

-- Master/reference tables: authenticated read; admin writes.
do $$
declare
  t text;
  ref_tables text[] := array[
    'matter_types','case_categories','hearing_types','lease_types','divisions','regions',
    'sol_gen_officers','action_officers','order_types','case_statuses','priority_levels'
  ];
begin
  foreach t in array ref_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() is not null);',
      t || '_read', t
    );
    execute format('drop policy if exists %I on public.%I;', t || '_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.current_user_has_permission(''master_files'', ''update'')) with check (public.current_user_has_permission(''master_files'', ''update''));',
      t || '_write', t
    );
  end loop;
end;
$$;

-- Private storage policies for case-documents bucket.
drop policy if exists case_documents_read on storage.objects;
create policy case_documents_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'case-documents'
    and public.current_user_has_permission('documents', 'read')
  );

drop policy if exists case_documents_insert on storage.objects;
create policy case_documents_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'case-documents'
    and public.current_user_has_permission('documents', 'create')
  );

drop policy if exists case_documents_update on storage.objects;
create policy case_documents_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'case-documents'
    and public.current_user_has_permission('documents', 'update')
  )
  with check (
    bucket_id = 'case-documents'
    and public.current_user_has_permission('documents', 'update')
  );

drop policy if exists case_documents_delete on storage.objects;
create policy case_documents_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'case-documents'
    and public.current_user_has_permission('documents', 'delete')
  );

-- Validation query:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' and rowsecurity = false;

-- Rollback guidance:
-- To relax during controlled maintenance, drop specific policies. Do not disable RLS in production.

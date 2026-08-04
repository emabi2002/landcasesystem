-- manual_security_fix_yvnkyjnwvylrweyzvibs.sql
-- Purpose: Manual testing-environment security fix for Supabase project yvnkyjnwvylrweyzvibs.
-- Run this in Supabase Dashboard > project yvnkyjnwvylrweyzvibs > SQL Editor.
-- Do NOT run this against another project.
-- Updated: skips live database views/non-table relations when enabling RLS.

-- Safety pre-flight: show the connected Supabase project ref.
-- Confirm this returns yvnkyjnwvylrweyzvibs before continuing.
select current_setting('app.settings.project_ref', true) as expected_project_ref;

-- Step 1: Remove the legacy overloaded permission RPC that causes PostgREST PGRST203.
drop function if exists public.user_has_permission(uuid, character varying, character varying);

-- 0011_rpc_functions.sql
-- Purpose: Canonical permission RPC functions and helpers.
-- Dependencies: 0001, 0002, 0003
-- Safety: Forward-only. SECURITY DEFINER used only where required, with fixed search_path.

-- Internal helper: is the given user an authorised administrator (users.read via any active group)?
create or replace function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_groups ug
    join public.group_module_permissions gmp on gmp.group_id = ug.group_id
    join public.modules m on m.id = gmp.module_id
    join public.groups g on g.id = ug.group_id
    where ug.user_id = p_user_id
      and ug.is_active
      and (ug.expires_at is null or ug.expires_at > now())
      and g.is_active
      and m.is_active
      and m.module_key = 'users'
      and gmp.can_read
  );
$$;

-- Safe policy wrapper: is the current authenticated user an authorised administrator?
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.is_admin_user(auth.uid());
$$;

-- Internal helper: does user have a functional permission for a module/action?
create or replace function public.user_has_permission_internal(
  p_user_id uuid,
  p_module_key text,
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
begin
  if not public.is_valid_permission_action(p_action) then
    raise exception 'Invalid permission action: %', p_action;
  end if;

  execute format(
    'select exists (
       select 1
       from public.user_groups ug
       join public.group_module_permissions gmp on gmp.group_id = ug.group_id
       join public.modules m on m.id = gmp.module_id
       join public.groups g on g.id = ug.group_id
       where ug.user_id = $1
         and ug.is_active
         and (ug.expires_at is null or ug.expires_at > now())
         and g.is_active
         and m.is_active
         and m.module_key = $2
         and gmp.%I = true
     )', 'can_' || p_action
  )
  into v_allowed
  using p_user_id, p_module_key;

  return coalesce(v_allowed, false);
end;
$$;

-- Safe policy wrapper: check a permission only for the current authenticated user.
create or replace function public.current_user_has_permission(
  p_module_key text,
  p_action text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and public.user_has_permission_internal(auth.uid(), p_module_key, p_action);
$$;

-- Public: check a permission. Callers may check their own permissions; admins may check anyone.
create or replace function public.user_has_permission(
  p_user_id uuid,
  p_module_key text,
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_valid_permission_action(p_action) then
    raise exception 'Invalid permission action: %', p_action;
  end if;

  if auth.uid() is not null
     and p_user_id is distinct from auth.uid()
     and not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorised to inspect another user''s permissions';
  end if;

  return public.user_has_permission_internal(p_user_id, p_module_key, p_action);
end;
$$;

-- Public: check if a user has an action on any of several modules.
create or replace function public.user_has_any_permission(
  p_user_id uuid,
  p_module_keys text[],
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if not public.is_valid_permission_action(p_action) then
    raise exception 'Invalid permission action: %', p_action;
  end if;

  if auth.uid() is not null
     and p_user_id is distinct from auth.uid()
     and not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorised to inspect another user''s permissions';
  end if;

  foreach v_key in array p_module_keys loop
    if public.user_has_permission_internal(p_user_id, v_key, p_action) then
      return true;
    end if;
  end loop;

  return false;
end;
$$;

-- Public: return the effective permission matrix for a user.
create or replace function public.get_user_permissions(p_user_id uuid)
returns table (
  module_key text,
  module_name text,
  can_create boolean,
  can_read boolean,
  can_update boolean,
  can_delete boolean,
  can_print boolean,
  can_approve boolean,
  can_export boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and p_user_id is distinct from auth.uid()
     and not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorised to inspect another user''s permissions';
  end if;

  return query
    select
      m.module_key,
      m.module_name,
      bool_or(gmp.can_create) as can_create,
      bool_or(gmp.can_read) as can_read,
      bool_or(gmp.can_update) as can_update,
      bool_or(gmp.can_delete) as can_delete,
      bool_or(gmp.can_print) as can_print,
      bool_or(gmp.can_approve) as can_approve,
      bool_or(gmp.can_export) as can_export
    from public.user_groups ug
    join public.groups g on g.id = ug.group_id
    join public.group_module_permissions gmp on gmp.group_id = ug.group_id
    join public.modules m on m.id = gmp.module_id
    where ug.user_id = p_user_id
      and ug.is_active
      and (ug.expires_at is null or ug.expires_at > now())
      and g.is_active
      and m.is_active
    group by m.module_key, m.module_name;
end;
$$;

-- Data scope: return the broadest scope a user has for a module/action.
create or replace function public.user_data_scope(
  p_user_id uuid,
  p_module_key text
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when bool_or(gsr.scope = 'all') then 'all'
        when bool_or(gsr.scope = 'region') then 'region'
        when bool_or(gsr.scope = 'department') then 'department'
        when bool_or(gsr.scope = 'assigned') then 'assigned'
        else 'own'
      end
      from public.user_groups ug
      join public.group_scope_rules gsr on gsr.group_id = ug.group_id
      join public.modules m on m.id = gsr.module_id
      where ug.user_id = p_user_id
        and ug.is_active
        and (ug.expires_at is null or ug.expires_at > now())
        and m.module_key = p_module_key
    ),
    'own'
  );
$$;

-- Lock down execution rights.
revoke all on function public.is_admin_user(uuid) from public;
revoke all on function public.user_has_permission_internal(uuid, text, text) from public;
revoke all on function public.user_has_permission(uuid, text, text) from public;
revoke all on function public.user_has_any_permission(uuid, text[], text) from public;
revoke all on function public.get_user_permissions(uuid) from public;
revoke all on function public.user_data_scope(uuid, text) from public;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_has_permission(text, text) from public;

grant execute on function public.user_has_permission(uuid, text, text) to authenticated;
grant execute on function public.user_has_any_permission(uuid, text[], text) to authenticated;
grant execute on function public.get_user_permissions(uuid) to authenticated;
grant execute on function public.user_data_scope(uuid, text) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_has_permission(text, text) to authenticated;

-- Validation query:
-- select public.user_has_permission(auth.uid(), 'dashboard', 'read');

-- Rollback guidance:
-- Drop public functions before internal helpers. Re-grant only to intended roles when reintroducing.


select '0011_rpc_functions applied' as status;

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
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t
        and c.relkind in ('r', 'p')
    ) then
      raise notice 'Skipping RLS for missing or non-table relation: %', t;
      continue;
    end if;

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
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = rec.tbl
        and c.relkind in ('r', 'p')
    ) then
      raise notice 'Skipping RLS for missing or non-table relation: %', rec.tbl;
      continue;
    end if;

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
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t
        and c.relkind in ('r', 'p')
    ) then
      raise notice 'Skipping RLS for missing or non-table relation: %', t;
      continue;
    end if;

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
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t
        and c.relkind in ('r', 'p')
    ) then
      raise notice 'Skipping RLS for missing or non-table relation: %', t;
      continue;
    end if;

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


-- Step 3: Verification queries.
select 'RLS policy migration completed. Review the result sets below.' as status;

-- Confirm only one user_has_permission overload remains.
select p.oid::regprocedure as user_has_permission_signature
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'user_has_permission'
order by 1;

-- Confirm key tables have RLS enabled.
select relname, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('cases','parties','profiles','documents','groups','user_groups','modules','group_module_permissions')
order by relname;

-- Show any skipped cost relation kind. If litigation_cost_documents is v, it is a view and cannot have table RLS.
select c.relname, c.relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('litigation_cost_documents','cost_documents');

-- Simulate anonymous role. Expected result: either all counts are 0 OR permission denied.
begin;
set local role anon;
select 'cases' as table_name, count(*) from public.cases
union all select 'parties', count(*) from public.parties
union all select 'profiles', count(*) from public.profiles
union all select 'documents', count(*) from public.documents
union all select 'groups', count(*) from public.groups
union all select 'user_groups', count(*) from public.user_groups;
rollback;

-- Emergency anonymous-access lockdown for Supabase project yvnkyjnwvylrweyzvibs.
-- Run in Supabase SQL Editor for project yvnkyjnwvylrweyzvibs only.
-- Purpose: remove legacy anon/PUBLIC grants and policies after canonical RLS policies have been applied.

select current_setting('app.settings.project_ref', true) as expected_project_ref;

-- Defense in depth: unauthenticated visitors should not have direct public-schema access.
revoke all privileges on schema public from anon;
grant usage on schema public to authenticated;

-- Prevent future public tables from automatically becoming anonymously accessible.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from public;

-- Remove direct anon/PUBLIC grants and drop policies that apply to anon/PUBLIC.
do $$
declare
  table_name text;
  policy_record record;
  target_tables text[] := array[
    'profiles',
    'groups',
    'modules',
    'user_groups',
    'group_module_permissions',
    'group_scope_rules',
    'cases',
    'parties',
    'documents',
    'tasks',
    'events',
    'land_parcels',
    'case_history',
    'case_assignments',
    'communications',
    'file_requests',
    'filings',
    'compliance_tracking',
    'court_orders',
    'case_closures',
    'incoming_correspondence',
    'case_intake_records',
    'case_intake_documents',
    'directions',
    'search_warrants',
    'section5_notices',
    'section_160_applications',
    'external_lawyers',
    'recommendation_links',
    'litigation_costs',
    'cost_categories',
    'litigation_cost_documents',
    'litigation_cost_history',
    'cost_alerts',
    'notifications',
    'audit_logs',
    'matter_types',
    'case_categories',
    'hearing_types',
    'lease_types',
    'divisions',
    'regions',
    'sol_gen_officers',
    'action_officers',
    'order_types',
    'case_statuses',
    'priority_levels'
  ];
begin
  foreach table_name in array target_tables loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relkind in ('r', 'p')
    ) then
      raise notice 'Skipping missing or non-table relation: %', table_name;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all privileges on table public.%I from anon', table_name);
    execute format('revoke all privileges on table public.%I from public', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);

    for policy_record in
      select p.polname
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and (
          0 = any(p.polroles)
          or exists (
            select 1
            from unnest(p.polroles) as role_oid
            join pg_roles r on r.oid = role_oid
            where r.rolname = 'anon'
          )
        )
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.polname, table_name);
      raise notice 'Dropped anon/PUBLIC policy %.%', table_name, policy_record.polname;
    end loop;
  end loop;
end $$;

-- Verification 1: show remaining anon/PUBLIC grants on the most sensitive tables. Expected: zero rows.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'PUBLIC')
  and table_name in ('cases','parties','profiles','documents','groups','user_groups','modules','group_module_permissions')
order by table_name, grantee, privilege_type;

-- Verification 2: show policies still applying to anon/PUBLIC on sensitive tables. Expected: zero rows.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('cases','parties','profiles','documents','groups','user_groups','modules','group_module_permissions')
  and ('public' = any(roles) or 'anon' = any(roles))
order by tablename, policyname;

-- Verification 3: all key relations should have RLS enabled.
select relname, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('cases','parties','profiles','documents','groups','user_groups','modules','group_module_permissions')
order by relname;

-- Verification 4: anonymous simulation. Expected: either permission denied or all counts = 0.
begin;
set local role anon;
select 'cases' as table_name, count(*) from public.cases
union all select 'parties', count(*) from public.parties
union all select 'profiles', count(*) from public.profiles
union all select 'documents', count(*) from public.documents
union all select 'groups', count(*) from public.groups
union all select 'user_groups', count(*) from public.user_groups
union all select 'modules', count(*) from public.modules
union all select 'group_module_permissions', count(*) from public.group_module_permissions;
rollback;

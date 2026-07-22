-- development_seed.sql
-- Purpose: Development/staging seed data ONLY. Never run in production.
-- Safety: No real credentials, no real legal matters, no personal data.
-- This seed does not create auth users. Create auth users via Supabase Auth, then assign groups.

-- Canonical modules.
insert into public.modules (module_key, module_name, category, route, display_order)
values
  ('dashboard','Dashboard','core','/dashboard',1),
  ('cases','Cases','core','/cases',2),
  ('allocation','Allocation','workflow','/cases/assignments',3),
  ('directions','Directions','workflow','/directions',4),
  ('compliance','Compliance','workflow','/compliance',5),
  ('notifications','Notifications','core','/notifications',6),
  ('section5_notices','Section 5 Notices','registers','/section5-notices',7),
  ('section_160','Section 160 Applications','registers','/section-160',8),
  ('search_warrants','Search Warrants','registers','/search-warrants',9),
  ('calendar','Calendar','core','/calendar',10),
  ('tasks','Tasks','core','/tasks',11),
  ('documents','Documents','core','/documents',12),
  ('land_parcels','Land Parcels','core','/land-parcels',13),
  ('correspondence','Correspondence','workflow','/correspondence',14),
  ('communications','Communications','workflow','/communications',15),
  ('file_requests','File Requests','workflow','/file-requests',16),
  ('lawyers','Lawyers','core','/lawyers',17),
  ('filings','Filings','workflow','/filings',18),
  ('litigation_costs','Litigation Costs','finance','/litigation-costs',19),
  ('reports','Reports','core','/reports',20),
  ('audit_trail','Audit Trail','admin','/audit',21),
  ('master_files','Master Files','admin','/admin/master-files',22),
  ('internal_officers','Internal Officers','admin','/admin/internal-officers',23),
  ('users','Users','admin','/admin/users',24),
  ('groups','Groups','admin','/admin/groups',25),
  ('modules','Modules','admin','/admin/modules',26),
  ('admin','Administration','admin','/admin',27)
on conflict (module_key) do update
set module_name = excluded.module_name,
    category = excluded.category,
    route = excluded.route,
    display_order = excluded.display_order;

-- System groups.
insert into public.groups (group_name, description, is_system_group)
values
  ('Super Admin','Full administrative access', true),
  ('Case Officer','Handles assigned cases', true),
  ('Auditor','Read-only audit access', true)
on conflict (group_name) do nothing;

-- Super Admin: full permissions on every module.
insert into public.group_module_permissions (
  group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export
)
select g.id, m.id, true, true, true, true, true, true, true
from public.groups g
cross join public.modules m
where g.group_name = 'Super Admin'
on conflict (group_id, module_id) do update
set can_create = true, can_read = true, can_update = true, can_delete = true,
    can_print = true, can_approve = true, can_export = true;

-- Super Admin: all scope on cases.
insert into public.group_scope_rules (group_id, module_id, scope)
select g.id, m.id, 'all'
from public.groups g
join public.modules m on m.module_key = 'cases'
where g.group_name = 'Super Admin'
on conflict (group_id, module_id) do update set scope = 'all';

-- Case Officer: read/create/update core case modules; assigned scope on cases.
insert into public.group_module_permissions (
  group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export
)
select g.id, m.id, true, true, true, false, true, false, false
from public.groups g
join public.modules m on m.module_key in (
  'dashboard','cases','tasks','events','calendar','documents','communications',
  'directions','file_requests','filings','compliance','notifications'
)
where g.group_name = 'Case Officer'
on conflict (group_id, module_id) do nothing;

insert into public.group_scope_rules (group_id, module_id, scope)
select g.id, m.id, 'assigned'
from public.groups g
join public.modules m on m.module_key = 'cases'
where g.group_name = 'Case Officer'
on conflict (group_id, module_id) do update set scope = 'assigned';

-- Auditor: read-only audit + read cases with all scope.
insert into public.group_module_permissions (
  group_id, module_id, can_create, can_read, can_update, can_delete, can_print, can_approve, can_export
)
select g.id, m.id, false, true, false, false, true, false, true
from public.groups g
join public.modules m on m.module_key in ('audit_trail','cases','reports','dashboard')
where g.group_name = 'Auditor'
on conflict (group_id, module_id) do nothing;

insert into public.group_scope_rules (group_id, module_id, scope)
select g.id, m.id, 'all'
from public.groups g
join public.modules m on m.module_key = 'cases'
where g.group_name = 'Auditor'
on conflict (group_id, module_id) do update set scope = 'all';

-- TEST reference data (clearly fictional).
insert into public.regions (name) values ('TEST_Highlands'),('TEST_Momase'),('TEST_Southern')
on conflict (name) do nothing;
insert into public.divisions (name) values ('TEST_Legal'),('TEST_Compliance')
on conflict (name) do nothing;

-- Cleanup guidance is in supabase/seed/cleanup_development_seed.sql

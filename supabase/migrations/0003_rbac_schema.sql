-- 0003_rbac_schema.sql
-- Purpose: Canonical group/module RBAC and data-scope tables.
-- Dependencies: 0001, 0002
-- Safety: Forward-only. Additive. No destructive operations.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  description text,
  is_system_group boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists groups_group_name_key on public.groups (group_name);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  module_name text not null,
  description text,
  category text,
  route text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists modules_module_key_key on public.modules (module_key);

create table if not exists public.user_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  is_active boolean not null default true
);

create unique index if not exists user_groups_user_group_key
  on public.user_groups (user_id, group_id);

create index if not exists user_groups_user_active_idx
  on public.user_groups (user_id) where is_active;

create table if not exists public.group_module_permissions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  can_create boolean not null default false,
  can_read boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_print boolean not null default false,
  can_approve boolean not null default false,
  can_export boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists group_module_permissions_group_module_key
  on public.group_module_permissions (group_id, module_id);

create table if not exists public.group_scope_rules (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  scope text not null default 'own',
  department text,
  region text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint group_scope_rules_scope_check check (public.is_valid_data_scope(scope))
);

-- Existing UAT databases may already have public.group_scope_rules from earlier setup.
-- Add canonical columns forward-only before deduplication and indexing.
alter table public.group_scope_rules add column if not exists scope text not null default 'own';
alter table public.group_scope_rules add column if not exists department text;
alter table public.group_scope_rules add column if not exists region text;
alter table public.group_scope_rules add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.group_scope_rules add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- Older UAT schemas may have an obsolete required scope_id column.
-- Canonical Phase 2 uses group_scope_rules.scope, so scope_id must not block canonical inserts.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'group_scope_rules'
      and column_name = 'scope_id'
  ) then
    alter table public.group_scope_rules alter column scope_id drop not null;
  end if;
end;
$$;

-- Existing UAT databases may contain duplicate scope rules from earlier setup.
-- Archive duplicates, then keep the most permissive/latest row per group/module before adding the unique index.
create table if not exists public.group_scope_rules_dedup_archive (
  archived_at timestamptz not null default timezone('utc', now()),
  id uuid,
  group_id uuid,
  module_id uuid,
  scope text,
  department text,
  region text,
  created_at timestamptz,
  updated_at timestamptz,
  archive_reason text not null
);

with ranked_scope_rules as (
  select
    gsr.*,
    row_number() over (
      partition by group_id, module_id
      order by
        case scope
          when 'all' then 5
          when 'region' then 4
          when 'department' then 3
          when 'assigned' then 2
          when 'own' then 1
          else 0
        end desc,
        updated_at desc nulls last,
        created_at desc nulls last,
        id desc
    ) as rn
  from public.group_scope_rules gsr
)
insert into public.group_scope_rules_dedup_archive (
  id, group_id, module_id, scope, department, region, created_at, updated_at, archive_reason
)
select
  id, group_id, module_id, scope, department, region, created_at, updated_at,
  'duplicate group/module scope rule removed before canonical unique index'
from ranked_scope_rules
where rn > 1;

with ranked_scope_rules as (
  select
    id,
    row_number() over (
      partition by group_id, module_id
      order by
        case scope
          when 'all' then 5
          when 'region' then 4
          when 'department' then 3
          when 'assigned' then 2
          when 'own' then 1
          else 0
        end desc,
        updated_at desc nulls last,
        created_at desc nulls last,
        id desc
    ) as rn
  from public.group_scope_rules
)
delete from public.group_scope_rules gsr
using ranked_scope_rules ranked
where gsr.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists group_scope_rules_group_module_key
  on public.group_scope_rules (group_id, module_id);

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists trg_modules_updated_at on public.modules;
create trigger trg_modules_updated_at before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists trg_gmp_updated_at on public.group_module_permissions;
create trigger trg_gmp_updated_at before update on public.group_module_permissions
for each row execute function public.set_updated_at();

drop trigger if exists trg_gsr_updated_at on public.group_scope_rules;
create trigger trg_gsr_updated_at before update on public.group_scope_rules
for each row execute function public.set_updated_at();

-- Validation query:
-- select
--   (select count(*) from public.groups) as groups,
--   (select count(*) from public.modules) as modules,
--   (select count(*) from public.group_module_permissions) as permissions;

-- Rollback guidance:
-- Drop child tables (group_scope_rules, group_module_permissions, user_groups) before groups/modules.

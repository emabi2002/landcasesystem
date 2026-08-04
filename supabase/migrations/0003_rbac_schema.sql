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

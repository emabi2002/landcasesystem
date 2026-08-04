-- 0010_indexes_constraints_and_triggers.sql
-- Purpose: Master/reference tables and cross-cutting constraints/indexes.
-- Dependencies: 0001..0009
-- Safety: Forward-only. Additive.

-- Master/reference lookup tables used by SelectWithAdd and reports.
create table if not exists public.matter_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists matter_types_name_key on public.matter_types (name);

create table if not exists public.case_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists case_categories_name_key on public.case_categories (name);

create table if not exists public.hearing_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists hearing_types_name_key on public.hearing_types (name);

create table if not exists public.lease_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists lease_types_name_key on public.lease_types (name);

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists divisions_name_key on public.divisions (name);

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists regions_name_key on public.regions (name);

create table if not exists public.sol_gen_officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists sol_gen_officers_name_key on public.sol_gen_officers (name);

create table if not exists public.action_officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  division text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists action_officers_name_key on public.action_officers (name);

create table if not exists public.order_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists order_types_name_key on public.order_types (name);

create table if not exists public.case_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists case_statuses_code_key on public.case_statuses (code);

create table if not exists public.priority_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists priority_levels_code_key on public.priority_levels (code);

create table if not exists public.case_closures (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  closure_type text,
  closure_date date,
  outcome_summary text,
  closure_notes text,
  closed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists case_closures_case_idx on public.case_closures (case_id);

drop trigger if exists trg_case_closures_updated_at on public.case_closures;
create trigger trg_case_closures_updated_at before update on public.case_closures
for each row execute function public.set_updated_at();

-- Guard closure integrity where feasible.
alter table public.cases
  drop constraint if exists cases_closure_state_check;
alter table public.cases
  add constraint cases_closure_state_check
  check (
    closure_date is null
    or closure_type is not null
  );

-- Validation query:
-- select
--   (select count(*) from public.regions) as regions,
--   (select count(*) from public.divisions) as divisions,
--   (select count(*) from public.case_statuses) as statuses;

-- Rollback guidance:
-- Drop constraint cases_closure_state_check to relax closure validation if required during controlled rollback.

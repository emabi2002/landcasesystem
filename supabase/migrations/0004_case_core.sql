-- 0004_case_core.sql
-- Purpose: Canonical cases table and core related tables.
-- Dependencies: 0001, 0002, 0003
-- Safety: Forward-only. Creates tables if missing. No destructive operations.

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null,
  title text not null,
  description text,
  case_type text,
  matter_type text,
  status text not null default 'under_review',
  workflow_state text not null default 'REGISTERED',
  priority text default 'medium',
  region text,
  court_file_number text,
  track_number text,
  case_origin text,
  dlpp_role text,
  assigned_officer_id uuid references public.profiles(id) on delete set null,
  division_responsible text,
  first_hearing_date date,
  returnable_date date,
  closure_type text,
  closure_date date,
  closure_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cases_case_number_key on public.cases (case_number);
create index if not exists cases_status_idx on public.cases (status);
create index if not exists cases_workflow_state_idx on public.cases (workflow_state);
create index if not exists cases_assigned_officer_idx on public.cases (assigned_officer_id);
create index if not exists cases_region_idx on public.cases (region);
create index if not exists cases_created_at_idx on public.cases (created_at desc);
create index if not exists cases_returnable_date_idx on public.cases (returnable_date);

drop trigger if exists trg_cases_updated_at on public.cases;
create trigger trg_cases_updated_at before update on public.cases
for each row execute function public.set_updated_at();

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  name text not null,
  party_type text not null,
  role text not null,
  contact_info jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists parties_case_idx on public.parties (case_id);

create table if not exists public.land_parcels (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  parcel_number text not null,
  location text,
  coordinates jsonb,
  area_sqm numeric,
  survey_plan_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists land_parcels_case_idx on public.land_parcels (case_id);

create table if not exists public.case_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  action text not null,
  description text,
  workflow_state_from text,
  workflow_state_to text,
  metadata jsonb,
  performed_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists case_history_case_idx on public.case_history (case_id);

create table if not exists public.case_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  assignment_type text,
  instructions text,
  status text not null default 'active',
  assigned_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists case_assignments_case_idx on public.case_assignments (case_id);
create index if not exists case_assignments_assignee_idx on public.case_assignments (assigned_to);

drop trigger if exists trg_case_assignments_updated_at on public.case_assignments;
create trigger trg_case_assignments_updated_at before update on public.case_assignments
for each row execute function public.set_updated_at();

-- Validation query:
-- select (select count(*) from public.cases) as cases, (select count(*) from public.parties) as parties;

-- Rollback guidance:
-- Drop child tables before public.cases. Never use DROP TABLE ... CASCADE on legal case records in production.

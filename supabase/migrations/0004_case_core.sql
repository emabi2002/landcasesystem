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

-- Existing UAT databases may already have public.cases from earlier setup.
-- Add canonical columns forward-only before indexes/triggers.
alter table public.cases add column if not exists case_number text;
alter table public.cases add column if not exists title text;
alter table public.cases add column if not exists description text;
alter table public.cases add column if not exists case_type text;
alter table public.cases add column if not exists matter_type text;
alter table public.cases add column if not exists status text not null default 'under_review';
alter table public.cases add column if not exists workflow_state text not null default 'REGISTERED';
alter table public.cases add column if not exists priority text default 'medium';
alter table public.cases add column if not exists region text;
alter table public.cases add column if not exists court_file_number text;
alter table public.cases add column if not exists track_number text;
alter table public.cases add column if not exists case_origin text;
alter table public.cases add column if not exists dlpp_role text;
alter table public.cases add column if not exists assigned_officer_id uuid references public.profiles(id) on delete set null;
alter table public.cases add column if not exists division_responsible text;
alter table public.cases add column if not exists first_hearing_date date;
alter table public.cases add column if not exists returnable_date date;
alter table public.cases add column if not exists closure_type text;
alter table public.cases add column if not exists closure_date date;
alter table public.cases add column if not exists closure_notes text;
alter table public.cases add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.cases add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.cases add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.cases add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- Preserve old rows while making the canonical fields usable.
update public.cases set case_number = coalesce(case_number, id::text) where case_number is null;
update public.cases set title = coalesce(title, case_number, id::text) where title is null;
update public.cases set status = coalesce(status, 'under_review') where status is null;
update public.cases set workflow_state = coalesce(workflow_state, 'REGISTERED') where workflow_state is null;

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
  case_id uuid not null references public.cases(id) on delete restrict,
  name text not null,
  party_type text not null,
  role text not null,
  contact_info jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.parties add column if not exists case_id uuid references public.cases(id) on delete restrict;
alter table public.parties add column if not exists name text;
alter table public.parties add column if not exists party_type text;
alter table public.parties add column if not exists role text;
alter table public.parties add column if not exists contact_info jsonb;
alter table public.parties add column if not exists created_at timestamptz not null default timezone('utc', now());
create index if not exists parties_case_idx on public.parties (case_id);

create table if not exists public.land_parcels (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  parcel_number text not null,
  location text,
  coordinates jsonb,
  area_sqm numeric,
  survey_plan_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.land_parcels add column if not exists case_id uuid references public.cases(id) on delete restrict;
alter table public.land_parcels add column if not exists parcel_number text;
alter table public.land_parcels add column if not exists location text;
alter table public.land_parcels add column if not exists coordinates jsonb;
alter table public.land_parcels add column if not exists area_sqm numeric;
alter table public.land_parcels add column if not exists survey_plan_url text;
alter table public.land_parcels add column if not exists notes text;
alter table public.land_parcels add column if not exists created_at timestamptz not null default timezone('utc', now());
create index if not exists land_parcels_case_idx on public.land_parcels (case_id);

create table if not exists public.case_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  action text not null,
  description text,
  workflow_state_from text,
  workflow_state_to text,
  metadata jsonb,
  performed_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.case_history add column if not exists case_id uuid references public.cases(id) on delete restrict;
alter table public.case_history add column if not exists action text;
alter table public.case_history add column if not exists description text;
alter table public.case_history add column if not exists workflow_state_from text;
alter table public.case_history add column if not exists workflow_state_to text;
alter table public.case_history add column if not exists metadata jsonb;
alter table public.case_history add column if not exists performed_by uuid references public.profiles(id) on delete set null;
alter table public.case_history add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.case_history add column if not exists created_at timestamptz not null default timezone('utc', now());
create index if not exists case_history_case_idx on public.case_history (case_id);

create table if not exists public.case_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
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
alter table public.case_assignments add column if not exists case_id uuid references public.cases(id) on delete restrict;
alter table public.case_assignments add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
alter table public.case_assignments add column if not exists assigned_by uuid references public.profiles(id) on delete set null;
alter table public.case_assignments add column if not exists assignment_type text;
alter table public.case_assignments add column if not exists instructions text;
alter table public.case_assignments add column if not exists status text not null default 'active';
alter table public.case_assignments add column if not exists assigned_at timestamptz not null default timezone('utc', now());
alter table public.case_assignments add column if not exists completed_at timestamptz;
alter table public.case_assignments add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.case_assignments add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists case_assignments_case_idx on public.case_assignments (case_id);
create index if not exists case_assignments_assignee_idx on public.case_assignments (assigned_to);

drop trigger if exists trg_case_assignments_updated_at on public.case_assignments;
create trigger trg_case_assignments_updated_at before update on public.case_assignments
for each row execute function public.set_updated_at();

-- Validation query:
-- select (select count(*) from public.cases) as cases, (select count(*) from public.parties) as parties;

-- Rollback guidance:
-- Drop child tables before public.cases. Never use DROP TABLE ... CASCADE on legal case records in production.

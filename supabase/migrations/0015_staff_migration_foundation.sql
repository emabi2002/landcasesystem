-- 0015_staff_migration_foundation.sql
-- Purpose: Staff migration staging and audit support for mapping real staff to Supabase Auth, profiles, and RBAC groups.
-- Dependencies: 0001..0014
-- Safety: Forward-only. No passwords, no auth-user creation, no automatic production data changes.

create table if not exists public.staff_migration_batches (
  id uuid primary key default gen_random_uuid(),
  batch_name text not null,
  source_description text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default timezone('utc', now()),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  status text not null default 'draft' check (status in ('draft','validated','approved','applied','rejected')),
  notes text
);
create unique index if not exists staff_migration_batches_batch_name_key on public.staff_migration_batches (batch_name);

create table if not exists public.staff_migration_staging (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.staff_migration_batches(id) on delete restrict,
  source_row_number integer,
  employee_id text,
  full_name text not null,
  email citext,
  phone text,
  job_title text,
  department text,
  region text,
  legacy_role text,
  target_group_name text,
  target_auth_user_id uuid references auth.users(id) on delete set null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  migration_status text not null default 'pending' check (migration_status in ('pending','valid','invalid','applied','skipped')),
  validation_errors jsonb not null default '[]'::jsonb,
  applied_by uuid references public.profiles(id) on delete set null,
  applied_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists staff_migration_staging_batch_idx on public.staff_migration_staging (batch_id);
create index if not exists staff_migration_staging_employee_idx on public.staff_migration_staging (employee_id) where employee_id is not null;
create index if not exists staff_migration_staging_email_idx on public.staff_migration_staging (email) where email is not null;
create index if not exists staff_migration_staging_status_idx on public.staff_migration_staging (migration_status);

drop trigger if exists trg_staff_migration_staging_updated_at on public.staff_migration_staging;
create trigger trg_staff_migration_staging_updated_at before update on public.staff_migration_staging
for each row execute function public.set_updated_at();

create table if not exists public.staff_migration_results (
  id uuid primary key default gen_random_uuid(),
  staging_id uuid not null references public.staff_migration_staging(id) on delete restrict,
  profile_id uuid references public.profiles(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  action text not null check (action in ('validated','mapped_profile','assigned_group','skipped','failed')),
  details jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists staff_migration_results_staging_idx on public.staff_migration_results (staging_id);

-- Validation query:
-- select count(*) from public.staff_migration_batches;
-- Rollback guidance:
-- Do not delete applied staff migration results. If a staged row is wrong, mark it skipped/rejected and create a correcting row.

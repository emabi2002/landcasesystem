-- 0002_identity_and_profiles.sql
-- Purpose: Establish canonical application profile identity linked to auth.users.
-- Dependencies: 0001_extensions_and_helpers.sql
-- Safety: Forward-only. Creates table/trigger if missing. No destructive operations.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email citext,
  phone text,
  job_title text,
  department text,
  region text,
  employee_id text,
  active boolean not null default true,
  -- legacy_role is retained only for migration mapping and must not be used for authorization.
  legacy_role text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_employee_id_key
  on public.profiles (employee_id)
  where employee_id is not null;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-provision a profile after an auth user is created.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Keep profile email synchronized with auth email changes.
create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_email_change on auth.users;
create trigger trg_on_auth_user_email_change
after update on auth.users
for each row execute function public.handle_auth_user_email_change();

-- Validation query:
-- select count(*) as profile_count from public.profiles;

-- Rollback guidance:
-- Drop triggers trg_on_auth_user_created, trg_on_auth_user_email_change before dropping functions.
-- Do not drop public.profiles in production without a validated data-preservation plan.

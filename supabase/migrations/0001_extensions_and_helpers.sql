-- 0001_extensions_and_helpers.sql
-- Purpose: Install safe extensions and shared helper functions used by later migrations.
-- Dependencies: Supabase PostgreSQL project with auth schema available.
-- Safety: Forward-only, idempotent, no business data, no destructive operations.

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.is_valid_permission_action(p_action text)
returns boolean
language sql
immutable
as $$
  select p_action in ('create','read','update','delete','print','approve','export');
$$;

create or replace function public.is_valid_data_scope(p_scope text)
returns boolean
language sql
immutable
as $$
  select p_scope in ('own','assigned','department','region','all');
$$;

-- Validation query:
-- select public.is_valid_permission_action('read') as action_ok, public.is_valid_data_scope('assigned') as scope_ok;

-- Rollback guidance:
-- These helpers are depended on by later migrations. Do not remove until all dependent objects are removed.

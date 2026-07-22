-- 0011_rpc_functions.sql
-- Purpose: Canonical permission RPC functions and helpers.
-- Dependencies: 0001, 0002, 0003
-- Safety: Forward-only. SECURITY DEFINER used only where required, with fixed search_path.

-- Internal helper: is the given user an authorised administrator (users.read via any active group)?
create or replace function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_groups ug
    join public.group_module_permissions gmp on gmp.group_id = ug.group_id
    join public.modules m on m.id = gmp.module_id
    join public.groups g on g.id = ug.group_id
    where ug.user_id = p_user_id
      and ug.is_active
      and (ug.expires_at is null or ug.expires_at > now())
      and g.is_active
      and m.is_active
      and m.module_key = 'users'
      and gmp.can_read
  );
$$;

-- Safe policy wrapper: is the current authenticated user an authorised administrator?
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.is_admin_user(auth.uid());
$$;

-- Internal helper: does user have a functional permission for a module/action?
create or replace function public.user_has_permission_internal(
  p_user_id uuid,
  p_module_key text,
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
begin
  if not public.is_valid_permission_action(p_action) then
    raise exception 'Invalid permission action: %', p_action;
  end if;

  execute format(
    'select exists (
       select 1
       from public.user_groups ug
       join public.group_module_permissions gmp on gmp.group_id = ug.group_id
       join public.modules m on m.id = gmp.module_id
       join public.groups g on g.id = ug.group_id
       where ug.user_id = $1
         and ug.is_active
         and (ug.expires_at is null or ug.expires_at > now())
         and g.is_active
         and m.is_active
         and m.module_key = $2
         and gmp.%I = true
     )', 'can_' || p_action
  )
  into v_allowed
  using p_user_id, p_module_key;

  return coalesce(v_allowed, false);
end;
$$;

-- Safe policy wrapper: check a permission only for the current authenticated user.
create or replace function public.current_user_has_permission(
  p_module_key text,
  p_action text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and public.user_has_permission_internal(auth.uid(), p_module_key, p_action);
$$;

-- Public: check a permission. Callers may check their own permissions; admins may check anyone.
create or replace function public.user_has_permission(
  p_user_id uuid,
  p_module_key text,
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_valid_permission_action(p_action) then
    raise exception 'Invalid permission action: %', p_action;
  end if;

  if auth.uid() is not null
     and p_user_id is distinct from auth.uid()
     and not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorised to inspect another user''s permissions';
  end if;

  return public.user_has_permission_internal(p_user_id, p_module_key, p_action);
end;
$$;

-- Public: check if a user has an action on any of several modules.
create or replace function public.user_has_any_permission(
  p_user_id uuid,
  p_module_keys text[],
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if not public.is_valid_permission_action(p_action) then
    raise exception 'Invalid permission action: %', p_action;
  end if;

  if auth.uid() is not null
     and p_user_id is distinct from auth.uid()
     and not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorised to inspect another user''s permissions';
  end if;

  foreach v_key in array p_module_keys loop
    if public.user_has_permission_internal(p_user_id, v_key, p_action) then
      return true;
    end if;
  end loop;

  return false;
end;
$$;

-- Public: return the effective permission matrix for a user.
create or replace function public.get_user_permissions(p_user_id uuid)
returns table (
  module_key text,
  module_name text,
  can_create boolean,
  can_read boolean,
  can_update boolean,
  can_delete boolean,
  can_print boolean,
  can_approve boolean,
  can_export boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and p_user_id is distinct from auth.uid()
     and not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorised to inspect another user''s permissions';
  end if;

  return query
    select
      m.module_key,
      m.module_name,
      bool_or(gmp.can_create) as can_create,
      bool_or(gmp.can_read) as can_read,
      bool_or(gmp.can_update) as can_update,
      bool_or(gmp.can_delete) as can_delete,
      bool_or(gmp.can_print) as can_print,
      bool_or(gmp.can_approve) as can_approve,
      bool_or(gmp.can_export) as can_export
    from public.user_groups ug
    join public.groups g on g.id = ug.group_id
    join public.group_module_permissions gmp on gmp.group_id = ug.group_id
    join public.modules m on m.id = gmp.module_id
    where ug.user_id = p_user_id
      and ug.is_active
      and (ug.expires_at is null or ug.expires_at > now())
      and g.is_active
      and m.is_active
    group by m.module_key, m.module_name;
end;
$$;

-- Data scope: return the broadest scope a user has for a module/action.
create or replace function public.user_data_scope(
  p_user_id uuid,
  p_module_key text
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when bool_or(gsr.scope = 'all') then 'all'
        when bool_or(gsr.scope = 'region') then 'region'
        when bool_or(gsr.scope = 'department') then 'department'
        when bool_or(gsr.scope = 'assigned') then 'assigned'
        else 'own'
      end
      from public.user_groups ug
      join public.group_scope_rules gsr on gsr.group_id = ug.group_id
      join public.modules m on m.id = gsr.module_id
      where ug.user_id = p_user_id
        and ug.is_active
        and (ug.expires_at is null or ug.expires_at > now())
        and m.module_key = p_module_key
    ),
    'own'
  );
$$;

-- Lock down execution rights.
revoke all on function public.is_admin_user(uuid) from public;
revoke all on function public.user_has_permission_internal(uuid, text, text) from public;
revoke all on function public.user_has_permission(uuid, text, text) from public;
revoke all on function public.user_has_any_permission(uuid, text[], text) from public;
revoke all on function public.get_user_permissions(uuid) from public;
revoke all on function public.user_data_scope(uuid, text) from public;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_has_permission(text, text) from public;

grant execute on function public.user_has_permission(uuid, text, text) to authenticated;
grant execute on function public.user_has_any_permission(uuid, text[], text) to authenticated;
grant execute on function public.get_user_permissions(uuid) to authenticated;
grant execute on function public.user_data_scope(uuid, text) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_has_permission(text, text) to authenticated;

-- Validation query:
-- select public.user_has_permission(auth.uid(), 'dashboard', 'read');

-- Rollback guidance:
-- Drop public functions before internal helpers. Re-grant only to intended roles when reintroducing.

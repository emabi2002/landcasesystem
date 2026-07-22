-- 0014_app_rpc_functions.sql
-- Purpose: Application RPC functions referenced by API routes.
-- Dependencies: 0007
-- Safety: Forward-only. SECURITY DEFINER with fixed search_path where required.

-- Generate a unique intake serial number: DLPP-DOC-YYYY-NNN
create or replace function public.generate_intake_serial_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text := to_char(timezone('utc', now()), 'YYYY');
  v_count integer;
  v_serial text;
begin
  select count(*) + 1 into v_count
  from public.case_intake_records
  where internal_serial_number like 'DLPP-DOC-' || v_year || '-%';

  v_serial := 'DLPP-DOC-' || v_year || '-' || lpad(v_count::text, 3, '0');
  return v_serial;
end;
$$;

revoke all on function public.generate_intake_serial_number() from public;
grant execute on function public.generate_intake_serial_number() to authenticated;

-- Link a compliance recommendation to a legal case.
create or replace function public.link_recommendation_to_case(
  p_legal_case_id uuid,
  p_recommendation_id text,
  p_link_type text default 'supporting_reference',
  p_link_context text default null,
  p_snapshot_data jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.user_has_permission_internal(auth.uid(), 'compliance', 'update') then
    raise exception 'Not authorised to link recommendations';
  end if;

  insert into public.recommendation_links (
    legal_case_id, recommendation_id, link_type, link_context, snapshot_data, created_by
  ) values (
    p_legal_case_id, p_recommendation_id, p_link_type, p_link_context, p_snapshot_data, auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.link_recommendation_to_case(uuid, text, text, text, jsonb) from public;
grant execute on function public.link_recommendation_to_case(uuid, text, text, text, jsonb) to authenticated;

-- Unlink (soft) a compliance recommendation from a case.
create or replace function public.unlink_recommendation_from_case(
  p_link_id uuid,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.user_has_permission_internal(auth.uid(), 'compliance', 'update') then
    raise exception 'Not authorised to unlink recommendations';
  end if;

  update public.recommendation_links
  set is_active = false,
      link_context = coalesce(p_reason, link_context)
  where id = p_link_id;

  return found;
end;
$$;

revoke all on function public.unlink_recommendation_from_case(uuid, text) from public;
grant execute on function public.unlink_recommendation_from_case(uuid, text) to authenticated;

-- Validation query:
-- select public.generate_intake_serial_number();

-- Rollback guidance:
-- Drop these functions in a controlled rollback; ensure API routes have fallbacks.

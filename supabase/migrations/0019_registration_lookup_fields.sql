-- 0019_registration_lookup_fields.sql
-- Purpose: Convert New Case Registration zoning and DLPP action officer fields to database-backed lookup references.
-- Safety: Forward-only and additive. Does not delete existing case or lookup data.

create table if not exists public.zoning_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id) on delete set null
);

create unique index if not exists zoning_types_name_lower_key on public.zoning_types (lower(btrim(name)));
create index if not exists zoning_types_active_idx on public.zoning_types (is_active, status, display_order);

insert into public.zoning_types (name, description, status, is_active, display_order)
values
  ('Residential', 'Land used primarily for housing and residential purposes.', 'active', true, 10),
  ('Commercial', 'Land used for shops, offices, services, and commercial activity.', 'active', true, 20),
  ('Industrial', 'Land used for manufacturing, warehousing, and industrial activity.', 'active', true, 30),
  ('Agricultural', 'Land used for farming, agriculture, or rural production.', 'active', true, 40),
  ('Institutional', 'Land used for public institutions, schools, churches, hospitals, or government facilities.', 'active', true, 50),
  ('Special Purpose', 'Land reserved for a special or restricted public/private purpose.', 'active', true, 60),
  ('Mixed Use', 'Land approved for a combination of compatible uses.', 'active', true, 70)
on conflict (lower(btrim(name))) do nothing;

create or replace function public.set_zoning_types_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  new.name = btrim(new.name);
  new.status = lower(coalesce(nullif(btrim(new.status), ''), case when new.is_active then 'active' else 'inactive' end));
  new.is_active = new.status = 'active';
  return new;
end;
$$;

drop trigger if exists trg_zoning_types_updated_at on public.zoning_types;
create trigger trg_zoning_types_updated_at
before insert or update on public.zoning_types
for each row execute function public.set_zoning_types_updated_at();

alter table public.zoning_types enable row level security;
drop policy if exists zoning_types_select on public.zoning_types;
create policy zoning_types_select on public.zoning_types
  for select to authenticated using (true);
drop policy if exists zoning_types_insert on public.zoning_types;
create policy zoning_types_insert on public.zoning_types
  for insert to authenticated with check (
    public.current_user_has_permission('master_files', 'create')
    or public.current_user_has_permission('cases', 'create')
  );
drop policy if exists zoning_types_update on public.zoning_types;
create policy zoning_types_update on public.zoning_types
  for update to authenticated using (
    public.current_user_has_permission('master_files', 'update')
    or public.current_user_has_permission('cases', 'update')
  ) with check (
    public.current_user_has_permission('master_files', 'update')
    or public.current_user_has_permission('cases', 'update')
  );

create or replace function public.add_column_if_missing(p_table text, p_column text, p_definition text)
returns void
language plpgsql
as $$
begin
  if to_regclass(format('public.%I', p_table)) is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table
      and column_name = p_column
  ) then
    execute format('alter table public.%I add column %I %s', p_table, p_column, p_definition);
  end if;
end;
$$;

select public.add_column_if_missing('cases', 'zoning_type_id', 'uuid references public.zoning_types(id) on delete set null');
select public.add_column_if_missing('cases', 'dlpp_action_officer_id', 'uuid references public.action_officers(id) on delete set null');

create index if not exists cases_zoning_type_idx on public.cases (zoning_type_id);
create index if not exists cases_dlpp_action_officer_idx on public.cases (dlpp_action_officer_id);

drop function if exists public.add_column_if_missing(text, text, text);

notify pgrst, 'reload schema';

-- Validation query:
-- select count(*) from public.zoning_types;
-- select column_name from information_schema.columns where table_schema='public' and table_name='cases' and column_name in ('zoning_type_id','dlpp_action_officer_id');

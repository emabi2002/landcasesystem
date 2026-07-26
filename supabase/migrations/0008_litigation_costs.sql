-- 0008_litigation_costs.sql
-- Purpose: Canonical litigation cost tables.
-- Dependencies: 0001, 0004
-- Safety: Forward-only. Additive.

create table if not exists public.cost_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  category_group text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.cost_categories add column if not exists code text;
alter table public.cost_categories add column if not exists name text;
alter table public.cost_categories add column if not exists description text;
alter table public.cost_categories add column if not exists category_group text;
alter table public.cost_categories add column if not exists is_active boolean not null default true;
alter table public.cost_categories add column if not exists display_order integer not null default 0;
alter table public.cost_categories add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.cost_categories add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists cost_categories_code_key on public.cost_categories (code);

drop trigger if exists trg_cost_categories_updated_at on public.cost_categories;
create trigger trg_cost_categories_updated_at before update on public.cost_categories
for each row execute function public.set_updated_at();

create table if not exists public.litigation_costs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  category_id uuid references public.cost_categories(id) on delete set null,
  cost_type text not null,
  amount numeric not null default 0,
  currency text not null default 'PGK',
  date_incurred date not null default (timezone('utc', now()))::date,
  date_paid date,
  payment_status text not null default 'unpaid',
  amount_paid numeric not null default 0,
  responsible_unit text,
  responsible_authority text,
  approved_by uuid references public.profiles(id) on delete set null,
  description text,
  reference_number text,
  payee_name text,
  payee_type text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.litigation_costs add column if not exists case_id uuid references public.cases(id) on delete restrict;
alter table public.litigation_costs add column if not exists category_id uuid references public.cost_categories(id) on delete set null;
alter table public.litigation_costs add column if not exists cost_type text;
alter table public.litigation_costs add column if not exists amount numeric not null default 0;
alter table public.litigation_costs add column if not exists currency text not null default 'PGK';
alter table public.litigation_costs add column if not exists date_incurred date not null default (timezone('utc', now()))::date;
alter table public.litigation_costs add column if not exists date_paid date;
alter table public.litigation_costs add column if not exists payment_status text not null default 'unpaid';
alter table public.litigation_costs add column if not exists amount_paid numeric not null default 0;
alter table public.litigation_costs add column if not exists responsible_unit text;
alter table public.litigation_costs add column if not exists responsible_authority text;
alter table public.litigation_costs add column if not exists approved_by uuid references public.profiles(id) on delete set null;
alter table public.litigation_costs add column if not exists description text;
alter table public.litigation_costs add column if not exists reference_number text;
alter table public.litigation_costs add column if not exists payee_name text;
alter table public.litigation_costs add column if not exists payee_type text;
alter table public.litigation_costs add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.litigation_costs add column if not exists updated_by uuid references public.profiles(id) on delete set null;
alter table public.litigation_costs add column if not exists is_deleted boolean not null default false;
alter table public.litigation_costs add column if not exists deleted_at timestamptz;
alter table public.litigation_costs add column if not exists deleted_by uuid references public.profiles(id) on delete set null;
alter table public.litigation_costs add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.litigation_costs add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists litigation_costs_case_idx on public.litigation_costs (case_id);
create index if not exists litigation_costs_active_idx on public.litigation_costs (case_id) where is_deleted = false;

drop trigger if exists trg_litigation_costs_updated_at on public.litigation_costs;
create trigger trg_litigation_costs_updated_at before update on public.litigation_costs
for each row execute function public.set_updated_at();

create table if not exists public.cost_documents (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.litigation_costs(id) on delete restrict,
  document_name text not null,
  document_type text,
  file_url text not null,
  file_size bigint,
  mime_type text,
  description text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default timezone('utc', now())
);
alter table public.cost_documents add column if not exists cost_id uuid references public.litigation_costs(id) on delete restrict;
alter table public.cost_documents add column if not exists document_name text;
alter table public.cost_documents add column if not exists document_type text;
alter table public.cost_documents add column if not exists file_url text;
alter table public.cost_documents add column if not exists file_size bigint;
alter table public.cost_documents add column if not exists mime_type text;
alter table public.cost_documents add column if not exists description text;
alter table public.cost_documents add column if not exists uploaded_by uuid references public.profiles(id) on delete set null;
alter table public.cost_documents add column if not exists uploaded_at timestamptz not null default timezone('utc', now());
create index if not exists cost_documents_cost_idx on public.cost_documents (cost_id);

-- Existing UAT databases may have public.litigation_cost_documents as a table.
-- Preserve it by copying compatible rows into public.cost_documents, then renaming it before creating the compatibility view.
do $$
declare
  archive_name text := 'litigation_cost_documents_source_archive';
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'litigation_cost_documents'
      and c.relkind = 'r'
  ) then
    alter table public.litigation_cost_documents add column if not exists id uuid default gen_random_uuid();
    alter table public.litigation_cost_documents add column if not exists cost_id uuid;
    alter table public.litigation_cost_documents add column if not exists document_name text;
    alter table public.litigation_cost_documents add column if not exists document_type text;
    alter table public.litigation_cost_documents add column if not exists file_url text;
    alter table public.litigation_cost_documents add column if not exists file_path text;
    alter table public.litigation_cost_documents add column if not exists file_size bigint;
    alter table public.litigation_cost_documents add column if not exists mime_type text;
    alter table public.litigation_cost_documents add column if not exists description text;
    alter table public.litigation_cost_documents add column if not exists uploaded_by uuid;
    alter table public.litigation_cost_documents add column if not exists uploaded_at timestamptz default timezone('utc', now());

    insert into public.cost_documents (
      id, cost_id, document_name, document_type, file_url, file_size, mime_type, description, uploaded_by, uploaded_at
    )
    select
      lcd.id,
      lcd.cost_id,
      coalesce(nullif(lcd.document_name, ''), 'Migrated cost document'),
      lcd.document_type,
      coalesce(nullif(lcd.file_url, ''), nullif(lcd.file_path, ''), 'missing-storage-path'),
      lcd.file_size,
      lcd.mime_type,
      lcd.description,
      lcd.uploaded_by,
      coalesce(lcd.uploaded_at, timezone('utc', now()))
    from public.litigation_cost_documents lcd
    where lcd.cost_id is not null
      and exists (select 1 from public.litigation_costs lc where lc.id = lcd.cost_id)
    on conflict (id) do nothing;

    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = archive_name
    ) then
      archive_name := archive_name || '_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS');
    end if;

    execute format('alter table public.litigation_cost_documents rename to %I', archive_name);
  end if;
end;
$$;

-- Compatibility view for transitional application reads. New code must use public.cost_documents.
create or replace view public.litigation_cost_documents
with (security_invoker = true) as
select
  id,
  cost_id,
  document_name,
  document_type,
  file_url,
  file_size,
  mime_type,
  description,
  uploaded_by,
  uploaded_at
from public.cost_documents;

create table if not exists public.litigation_cost_history (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.litigation_costs(id) on delete restrict,
  action text not null,
  field_changed text,
  old_value text,
  new_value text,
  change_reason text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default timezone('utc', now()),
  record_snapshot jsonb
);
create index if not exists litigation_cost_history_cost_idx on public.litigation_cost_history (cost_id);

create table if not exists public.cost_alerts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete restrict,
  threshold_amount numeric,
  currency text not null default 'PGK',
  is_active boolean not null default true,
  notify_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists cost_alerts_case_idx on public.cost_alerts (case_id);

drop trigger if exists trg_cost_alerts_updated_at on public.cost_alerts;
create trigger trg_cost_alerts_updated_at before update on public.cost_alerts
for each row execute function public.set_updated_at();

-- Validation query:
-- select (select count(*) from public.litigation_costs) as costs, (select count(*) from public.cost_categories) as categories;

-- Rollback guidance:
-- litigation_costs uses on delete restrict for case_id to protect financial history. Remove dependents first in controlled rollback.

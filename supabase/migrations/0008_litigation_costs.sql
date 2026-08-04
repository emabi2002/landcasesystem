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
create index if not exists litigation_costs_case_idx on public.litigation_costs (case_id);
create index if not exists litigation_costs_active_idx on public.litigation_costs (case_id) where is_deleted = false;

drop trigger if exists trg_litigation_costs_updated_at on public.litigation_costs;
create trigger trg_litigation_costs_updated_at before update on public.litigation_costs
for each row execute function public.set_updated_at();

create table if not exists public.litigation_cost_documents (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.litigation_costs(id) on delete cascade,
  document_name text not null,
  document_type text,
  file_url text not null,
  file_size bigint,
  mime_type text,
  description text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default timezone('utc', now())
);
create index if not exists litigation_cost_documents_cost_idx on public.litigation_cost_documents (cost_id);

create table if not exists public.litigation_cost_history (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.litigation_costs(id) on delete cascade,
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
  case_id uuid references public.cases(id) on delete cascade,
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

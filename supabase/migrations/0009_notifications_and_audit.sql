-- 0009_notifications_and_audit.sql
-- Purpose: Canonical notifications and append-only audit_logs tables.
-- Dependencies: 0001, 0002, 0003, 0004
-- Safety: Forward-only. Additive.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  type text not null default 'case_update',
  title text not null,
  message text not null,
  link text,
  priority text not null default 'normal',
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id);
create index if not exists notifications_user_unread_idx on public.notifications (user_id) where read = false;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  module_id uuid references public.modules(id) on delete set null,
  action text not null,
  record_type text,
  record_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists audit_logs_user_idx on public.audit_logs (user_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- Prevent updates and deletes on audit_logs to keep an append-only trail.
create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;

drop trigger if exists trg_audit_logs_no_update on public.audit_logs;
create trigger trg_audit_logs_no_update
before update on public.audit_logs
for each row execute function public.prevent_audit_mutation();

drop trigger if exists trg_audit_logs_no_delete on public.audit_logs;
create trigger trg_audit_logs_no_delete
before delete on public.audit_logs
for each row execute function public.prevent_audit_mutation();

-- Validation query:
-- select (select count(*) from public.notifications) as notifications, (select count(*) from public.audit_logs) as audit_logs;

-- Rollback guidance:
-- Drop append-only triggers before any controlled maintenance on audit_logs. Never expose audit deletion to ordinary users.

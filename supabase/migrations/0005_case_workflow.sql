-- 0005_case_workflow.sql
-- Purpose: Canonical workflow support tables: tasks and events (canonical calendar).
-- Dependencies: 0001, 0004
-- Safety: Forward-only. events is the canonical calendar table (replaces calendar_events).

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete restrict,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date timestamptz not null,
  status text not null default 'pending',
  priority text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.tasks add column if not exists case_id uuid references public.cases(id) on delete restrict;
alter table public.tasks add column if not exists title text;
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists due_date timestamptz;
alter table public.tasks add column if not exists status text not null default 'pending';
alter table public.tasks add column if not exists priority text;
alter table public.tasks add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.tasks add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists tasks_case_idx on public.tasks (case_id);
create index if not exists tasks_assignee_idx on public.tasks (assigned_to);
create index if not exists tasks_status_idx on public.tasks (status);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

-- Canonical calendar table. All modules must reference public.events.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete restrict,
  event_type text not null,
  title text not null,
  description text,
  event_date timestamptz not null,
  end_date timestamptz,
  location text,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'scheduled',
  reminder_date timestamptz,
  auto_created boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.events add column if not exists case_id uuid references public.cases(id) on delete restrict;
alter table public.events add column if not exists event_type text;
alter table public.events add column if not exists title text;
alter table public.events add column if not exists description text;
alter table public.events add column if not exists event_date timestamptz;
alter table public.events add column if not exists end_date timestamptz;
alter table public.events add column if not exists location text;
alter table public.events add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists status text not null default 'scheduled';
alter table public.events add column if not exists reminder_date timestamptz;
alter table public.events add column if not exists auto_created boolean not null default false;
alter table public.events add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.events add column if not exists updated_at timestamptz not null default timezone('utc', now());
create index if not exists events_case_idx on public.events (case_id);
create index if not exists events_event_date_idx on public.events (event_date);
create index if not exists events_assignee_idx on public.events (assigned_to);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at before update on public.events
for each row execute function public.set_updated_at();

-- Compatibility view for transitional calendar_events consumers during environment cutover.
-- Application code should migrate to public.events directly.
create or replace view public.calendar_events
with (security_invoker = true) as
  select
    id,
    case_id,
    event_type,
    title,
    description,
    event_date,
    location,
    auto_created,
    created_at
  from public.events;

-- Validation query:
-- select (select count(*) from public.tasks) as tasks, (select count(*) from public.events) as events;

-- Rollback guidance:
-- Drop view calendar_events, then tables events/tasks in a controlled rollback.

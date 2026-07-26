-- 0016_staff_migration_rls.sql
-- Purpose: RLS policies for staff migration staging and audit tables.
-- Dependencies: 0001..0015
-- Safety: Forward-only. Enables RLS; does not expose staff data broadly.

alter table public.staff_migration_batches enable row level security;
alter table public.staff_migration_staging enable row level security;
alter table public.staff_migration_results enable row level security;

drop policy if exists staff_migration_batches_admin on public.staff_migration_batches;
create policy staff_migration_batches_admin on public.staff_migration_batches
  for all to authenticated
  using (public.current_user_has_permission('users', 'read'))
  with check (public.current_user_has_permission('users', 'update'));

drop policy if exists staff_migration_staging_admin on public.staff_migration_staging;
create policy staff_migration_staging_admin on public.staff_migration_staging
  for all to authenticated
  using (public.current_user_has_permission('users', 'read'))
  with check (public.current_user_has_permission('users', 'update'));

drop policy if exists staff_migration_results_select_admin on public.staff_migration_results;
create policy staff_migration_results_select_admin on public.staff_migration_results
  for select to authenticated
  using (public.current_user_has_permission('users', 'read'));

-- Results are append-only from approved functions; no direct authenticated insert/update/delete policy.

-- Validation query:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename like 'staff_migration%';
-- Rollback guidance:
-- Drop the specific staff_migration_* policies if access must be revised. Do not disable RLS in production.

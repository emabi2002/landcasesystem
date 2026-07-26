# Phase 3 SQL Editor Guide

Use this guide only for **staging/local first**. Do not run Phase 3 SQL on production until the staging apply and tests pass.

## 1. Confirm the target database

Before running anything, confirm the Supabase project is the intended staging/local database, not live UAT.

Run this safe confirmation query first:

```sql
select
  current_database() as database_name,
  now() as checked_at,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.cases) as cases,
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'supabase_migrations'
      and table_name = 'schema_migrations'
  ) as migration_history_available;
```

If `migration_history_available` is `true`, you may then check the latest recorded migration with:

```sql
select max(version) as latest_migration
from supabase_migrations.schema_migrations;
```

If `migration_history_available` is `false`, that is not by itself a Phase 3 blocker. Some SQL Editor contexts do not expose the Supabase migration-history schema. Continue by validating the actual public schema objects instead.

Expected for the known staging verification project:

- It should not contain live/production legal case data.
- If migration history is visible, latest migration should be at least `0019_secure_group_scope_rules_archive` before Phase 3.

## 2. Confirm Phase 3 is not already applied

Run this object-based check. It works even when `supabase_migrations.schema_migrations` is not visible:

```sql
select
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'register_case'
  ) as register_case_exists,
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'operation_idempotency_keys'
  ) as idempotency_table_exists,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cases'
      and column_name = 'registration_idempotency_key'
  ) as case_registration_idempotency_column_exists;
```

If all three values are `true`, Phase 3 has probably already been applied. Do not paste the migration again unless you are deliberately testing idempotency on staging.

If migration history is visible, you can additionally run:

```sql
select version, name
from supabase_migrations.schema_migrations
where name = '0020_phase3_case_workflow';
```

## 3. Apply Phase 3 migration

Open `supabase/migrations/0020_phase3_case_workflow.sql`, copy the whole file, paste it into SQL Editor and run it.

Do **not** run destructive SQL. Do **not** seed. Do **not** truncate.

### Troubleshooting: `required_permission_for_workflow_transition` return type mismatch

If you see:

```text
ERROR: 42P13: return type mismatch in function declared to return record
DETAIL: Final statement returns too many columns.
CONTEXT: SQL function "required_permission_for_workflow_transition"
```

Make sure your migration file has this function line:

```sql
select module_key, action from (values
```

not:

```sql
select * from (values
```

Then rerun the full Phase 3 migration SQL. The migration is additive/idempotent and can be rerun after this parse error.

## 4. Record migration history manually if using SQL Editor

If you applied through SQL Editor instead of the Supabase migration API, first check whether migration history is available:

```sql
select exists (
  select 1
  from information_schema.tables
  where table_schema = 'supabase_migrations'
    and table_name = 'schema_migrations'
) as migration_history_available;
```

Only if that returns `true`, record the migration after the SQL succeeds:

```sql
insert into supabase_migrations.schema_migrations(version, name, statements)
values (
  '20260726002000',
  '0020_phase3_case_workflow',
  array['Applied manually from supabase/migrations/0020_phase3_case_workflow.sql']
)
on conflict do nothing;
```

If `migration_history_available` is `false`, skip this step and rely on the object validation below.

## 5. Run object validation

```sql
select exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'operation_idempotency_keys'
) as idempotency_table_exists;

select relrowsecurity
from pg_class
where oid = 'public.operation_idempotency_keys'::regclass;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cases'
  and column_name in ('registration_metadata', 'registration_idempotency_key')
order by column_name;

select exists (
  select 1 from pg_class
  where relkind = 'S' and relname = 'case_number_sequence'
) as case_number_sequence_exists;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'events'
  and column_name in ('source_type', 'source_id', 'source_key')
order by column_name;

select exists (
  select 1 from pg_indexes
  where schemaname = 'public'
    and tablename = 'events'
    and indexname = 'events_auto_source_key_unique'
) as auto_event_unique_index_exists;

select tgname
from pg_trigger
where tgname in (
  'trg_case_history_no_update',
  'trg_case_history_no_delete',
  'trg_cases_workflow_guard'
)
order by tgname;

select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'register_case',
    'transition_case_workflow',
    'assign_case',
    'create_case_filing',
    'submit_filings_for_review',
    'review_case_filing',
    'mark_filing_filed',
    'close_case'
  )
order by proname;
```

## 6. Run Phase 3 smoke tests

Open and run:

```text
supabase/tests/phase3_workflow_tests.sql
```

Expected: all boolean columns should return `true`.

## 7. What to send me after you run SQL

Copy/paste:

1. Any SQL error message.
2. The output of object validation.
3. The output of `phase3_workflow_tests.sql`.
4. Whether this was staging/local or live.

Do not run on live production unless staging has passed and you explicitly accept the migration.

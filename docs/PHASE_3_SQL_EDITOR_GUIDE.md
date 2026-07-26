# Phase 3 SQL Editor Guide

Use this guide only for **staging/local first**. Do not run Phase 3 SQL on production until the staging apply and tests pass.

## 1. Confirm the target database

Before running anything, confirm the Supabase project is the intended staging/local database, not live UAT.

Run:

```sql
select
  current_database() as database_name,
  now() as checked_at,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.cases) as cases,
  (select max(version) from supabase_migrations.schema_migrations) as latest_migration;
```

Expected for the known staging verification project:

- Latest migration should be at least `0019_secure_group_scope_rules_archive` before Phase 3.
- It should not contain live/production legal case data.

## 2. Confirm Phase 3 is not already applied

Run:

```sql
select version, name
from supabase_migrations.schema_migrations
where name = '0020_phase3_case_workflow';
```

If this returns a row, do not paste the migration again unless you are deliberately testing idempotency on staging.

## 3. Apply Phase 3 migration

Open `supabase/migrations/0020_phase3_case_workflow.sql`, copy the whole file, paste it into SQL Editor and run it.

Do **not** run destructive SQL. Do **not** seed. Do **not** truncate.

## 4. Record migration history manually if using SQL Editor

If you applied through SQL Editor instead of the Supabase migration API, record the migration only after the SQL succeeds:

```sql
insert into supabase_migrations.schema_migrations(version, name, statements)
values (
  '20260726002000',
  '0020_phase3_case_workflow',
  array['Applied manually from supabase/migrations/0020_phase3_case_workflow.sql']
)
on conflict do nothing;
```

If your `schema_migrations` table has a different shape, skip this and tell me the table columns.

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

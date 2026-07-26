-- phase3_workflow_tests.sql
-- Purpose: Phase 3 workflow/security verification queries for local or staging Supabase only.
-- Do not run against production.

-- 1. Canonical states are recognised.
select public.is_valid_case_workflow_state('REGISTERED') as registered_valid;
select public.is_valid_case_workflow_state('BAD_STATE') = false as bad_state_rejected;

-- 2. Case numbering is sequence-backed and unique across calls.
with generated as (
  select public.generate_case_number() as case_number
  from generate_series(1, 25)
)
select count(*) = count(distinct case_number) as generated_case_numbers_unique
from generated;

-- 3. Required transition permissions are present.
select exists (
  select 1
  from public.required_permission_for_workflow_transition('DRAFTING', 'UNDER_REVIEW')
  where module_key = 'filings' and action = 'update'
) as drafting_submit_permission_defined;

-- 4. Append-only protections are installed.
select exists (
  select 1
  from pg_trigger
  where tgname = 'trg_case_history_no_update'
) as case_history_update_guard_exists;

select exists (
  select 1
  from pg_trigger
  where tgname = 'trg_cases_workflow_guard'
) as workflow_state_guard_exists;

-- 5. Automatic event uniqueness is installed.
select exists (
  select 1
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'events'
    and indexname = 'events_auto_source_key_unique'
) as auto_event_uniqueness_exists;

-- 6. Idempotency table is present.
select exists (
  select 1
  from information_schema.tables
  where table_schema = 'public'
    and table_name = 'operation_idempotency_keys'
) as idempotency_table_exists;

# Phase 2 — Database Consolidation, RBAC and Row Level Security Report

## 1. Branch

`phase-2-database-rbac-consolidation`

## 2. Commit SHAs

- Starting SHA: `e6d0af207c441b0d9571a5d759a8af7730eaf950`
- Ending SHA: pending final commit/review

## 3. Canonical table inventory

Canonical application tables are documented in `docs/CANONICAL_DATABASE_SCHEMA.md` and implemented by ordered migrations in `supabase/migrations/0001` through `0014`.

## 4. Naming-conflict decisions

Documented in `docs/CANONICAL_DATABASE_SCHEMA.md`. Key decisions: `events`, `documents`, `filings`, `parties`, `profiles` over custom users, `user_groups` over `user_roles`, `external_lawyers`, `recommendation_links`, and `cost_documents`.

## 5. Migration files created or maintained

- `0001_extensions_and_helpers.sql`
- `0002_identity_and_profiles.sql`
- `0003_rbac_schema.sql`
- `0004_case_core.sql`
- `0005_case_workflow.sql`
- `0006_documents_and_storage.sql`
- `0007_registry_modules.sql`
- `0008_litigation_costs.sql`
- `0009_notifications_and_audit.sql`
- `0010_indexes_constraints_and_triggers.sql`
- `0011_rpc_functions.sql`
- `0012_rls_policies.sql`
- `0013_realtime_configuration.sql`
- `0014_app_rpc_functions.sql`
- `0015_staff_migration_foundation.sql`
- `0016_staff_migration_rls.sql`
- `0017_staff_migration_validation_rpc.sql`
- `0018_staff_migration_apply_rpc.sql`

## 6. Legacy SQL files archived

Historical scripts are retained in `archive/legacy-sql/`. They were not deleted. The archive README warns that these scripts are historical and must not be run against the new environment.

## 7. RBAC changes

Group/module RBAC is authoritative via `groups`, `modules`, `user_groups`, `group_module_permissions`, and `group_scope_rules`. Permissions are additive across active, unexpired group assignments.

## 8. RLS policies implemented

RLS is enabled across application tables in `0012_rls_policies.sql`. Case-child policies were tightened so rows with `case_id` NULL are not automatically available to authenticated users.

## 9. Data-scope implementation

Case access uses `group_scope_rules` and `user_data_scope` with `own`, `assigned`, `department`, `region`, and `all` scopes.

## 10. Storage-policy implementation

The `case-documents` bucket is private. Application code now stores storage paths and uses signed URLs for secure document access.

## 11. RPC functions

Permission RPCs are defined in `0011_rpc_functions.sql`; app-specific RPCs are in `0014_app_rpc_functions.sql`.

## 12. Staff migration implementation

Staff migration is now a first-class Phase 2 concern:

- `staff_migration_batches` records auditable import batches.
- `staff_migration_staging` holds reviewed staff rows without passwords.
- `staff_migration_results` records validation/application outcomes.
- `validate_staff_migration_batch` checks target auth/profile matches and RBAC group names.
- `apply_staff_migration_row` maps validated staff rows to `profiles` and `user_groups`.
- RLS restricts staging and migration results to authorised user administrators.

Auth accounts are not created automatically by migrations. Staff authentication onboarding remains an explicit admin/user-management step so real passwords and account invitations are never embedded in SQL.

## 13. Application schema alignment

Aligned application references include:

- `case_delegations` replaced with `case_assignments`.
- Legacy `users.role` checks replaced with canonical permission RPC checks.
- `email_queue` writes neutralized because Phase 2 excludes email worker implementation.
- Cost-document code aligned to `cost_documents` and private `case-documents` storage paths.
- Document upload/download paths aligned to private storage and signed URL usage.

## 14. Database test results

SQL tests were updated in `supabase/tests/rls_permissions_tests.sql` to respect append-only audit logs, but were not executed against a staging Supabase database in this session. No production database was used.

## 15. TypeScript, lint, unit-test and build results

- `npm ci`: failed because the repository does not include `package-lock.json` or `npm-shrinkwrap.json`.
- `bun install --frozen-lockfile`: passed with no dependency changes.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 33 existing React hook dependency warnings and 0 errors.
- `npm run test`: passed, 7 test files and 11 tests.
- `npm run build`: passed with existing Edge runtime warnings related to Node.js API use in Edge runtime imports.

## 16. Remaining risks

- Database migrations have not been applied to a staging Supabase instance in this session.
- `database.types.ts` is manually maintained and should be regenerated from the validated staging schema before production migration.
- Production data mapping remains a separate manual approval step.
- Notification creation for register assignment/status changes should be moved to approved server functions or routes before production cutover.

## 17. Manual production migration steps

1. Rotate any exposed Supabase service-role keys and database passwords.
2. Take a full database backup.
3. Take a storage-object backup.
4. Export current tables, row counts, constraints, functions, triggers, RLS policies, and storage policies.
5. Apply migrations to a staging copy.
6. Validate tests and application build against generated staging types.
7. Prepare a row-by-row source-data mapping report.
8. Obtain manual approval and schedule a maintenance window.
9. Apply only approved forward migrations to production.
10. Verify RLS, permissions, critical reads, document access, and audit/notification restrictions.

## 18. Rollback and recovery considerations

Rollback requires restoration from the approved database/storage backups. Do not use destructive rollback SQL against production legal records.

## 19. Deferred to Phase 3

- Transactional case registration redesign
- Full workflow-state engine
- Email delivery worker
- Notification interface redesign
- Full production data migration
- Scheduled exports and additional business modules

## 20. Production safety confirmation

No live production database migration was run and no production deployment was performed during this Phase 2 local remediation work.

# Canonical Database Schema — Phase 2

## Scope and safety

This document records the canonical Phase 2 Supabase database foundation for the land case management system. Phase 2 prepares migrations and application alignment only. It must not be applied automatically to the live production database.

Production migration requires manual approval, a full database backup, a storage-object backup, current table row counts, current RLS policy export, a rollback plan, a maintenance window, and successful staging validation.

## Identity ownership

- `auth.users` is the authoritative authentication identity.
- `profiles` stores application user metadata: `id`, `full_name`, `email`, `phone`, `job_title`, `department`, `employee_id`, `active`, `created_at`, `updated_at`.
- `profiles.id` references `auth.users.id`.
- Passwords are never stored in `profiles` or any custom public user table.
- `profiles.legacy_role` may exist only as source-data migration evidence and must not be used for runtime authorization.
- Users must not self-promote or update protected identity fields.

## Canonical RBAC model

The authoritative permission model is group/module RBAC:

- `groups`
- `modules`
- `user_groups`
- `group_module_permissions`
- `group_scope_rules`

Permissions are additive across active, unexpired group assignments. If any active group grants a permission action for a module, the user receives that action, subject to data scope and RLS. Expired or inactive `user_groups` rows do not grant permissions.

Supported actions are `create`, `read`, `update`, `delete`, `print`, `approve`, and `export`.

Canonical permission RPC functions:

- `get_user_permissions`
- `user_has_permission`
- `user_has_any_permission`
- `current_user_has_permission`
- `user_data_scope`

## Data scopes

Functional permission and record scope are separate. Case access supports:

- `own`
- `assigned`
- `department`
- `region`
- `all`

A user with `cases.read` can only see records allowed by the most permissive active `group_scope_rules` scope. `all` is not implied by a module read permission.

## Canonical modules

The canonical `modules.module_key` values are:

`dashboard`, `cases`, `allocation`, `directions`, `compliance`, `notifications`, `section5_notices`, `section_160`, `search_warrants`, `calendar`, `tasks`, `documents`, `land_parcels`, `correspondence`, `communications`, `file_requests`, `lawyers`, `filings`, `litigation_costs`, `reports`, `audit_trail`, `master_files`, `internal_officers`, `users`, `groups`, `modules`, `admin`.

Sidebar visibility and page guards must use these exact keys. Client-side visibility is not a replacement for server-side authorization or RLS.

## Naming-conflict decisions

| Conflict | Canonical decision |
| --- | --- |
| `events` vs `calendar_events` | `events` is canonical. `calendar_events` may exist only as a security-invoker compatibility view during transition. |
| `case_closure` vs `case_closures` | `case_closures` is the canonical closure event/history table. `cases.closure_*` fields are retained as current summary fields. |
| `case_documents` vs `documents` | `documents` is canonical for case and register document metadata. |
| `case_filings` vs `filings` | `filings` is canonical. |
| `case_parties` vs `parties` | `parties` is canonical for parties linked to cases. |
| `users`, `profiles`, `auth.users` | `auth.users` owns authentication; `profiles` owns app metadata. No public custom password/role user table is canonical. |
| `user_roles` vs `user_groups` | `user_groups` with group/module permissions is canonical. |
| `lawyers` vs `external_lawyers` | `external_lawyers` is canonical; the module key remains `lawyers`. |
| `compliance_recommendations` vs `recommendation_links` | `recommendation_links` is canonical for linking external compliance recommendations to cases. |
| `litigation_cost_documents` vs `cost_documents` | `cost_documents` is canonical; `litigation_cost_documents` may exist only as a security-invoker compatibility view. |

## Canonical application tables

Core and workflow tables:

- `profiles`
- `groups`
- `modules`
- `user_groups`
- `group_module_permissions`
- `group_scope_rules`
- `cases`
- `parties`
- `land_parcels`
- `case_history`
- `case_assignments`
- `tasks`
- `events`
- `documents`
- `incoming_correspondence`
- `case_intake_records`
- `case_intake_documents`
- `directions`
- `communications`
- `file_requests`
- `filings`
- `court_orders`
- `compliance_tracking`
- `recommendation_links`
- `external_lawyers`
- `search_warrants`
- `section5_notices`
- `section_160_applications`
- `cost_categories`
- `litigation_costs`
- `cost_documents`
- `litigation_cost_history`
- `cost_alerts`
- `notifications`
- `audit_logs`

Reference/master tables:

- `matter_types`
- `case_categories`
- `hearing_types`
- `lease_types`
- `divisions`
- `regions`
- `sol_gen_officers`
- `action_officers`
- `order_types`
- `case_statuses`
- `priority_levels`

## Case schema decision

`cases` is the authoritative case table. `case_number` is unique. Assigned, created, and updated users reference `profiles`. Important indexed/search fields include `case_number`, `status`, `workflow_state`, `assigned_officer_id`, `region`, `first_hearing_date`, and `returnable_date`.

Unknown source status and workflow values must be preserved during later data migration mapping rather than deleted or overwritten.

## Calendar schema decision

`events` is the canonical calendar table and supports `case_id`, `event_type`, `title`, `description`, `event_date`, `end_date`, `location`, `assigned_to`, `status`, `reminder_date`, `auto_created`, `created_by`, `created_at`, and `updated_at`.

## Notifications and audit

`notifications` is scoped to each user. Users read and update only their own notifications. Ordinary users cannot create arbitrary notifications for other users.

`audit_logs` is append-only. Ordinary users cannot update or delete audit entries. Audit details must not contain credentials, tokens, passwords, or full legal document contents.

## Storage decision

The canonical Supabase Storage bucket is private:

- `case-documents`

Application code stores private storage paths in database rows and uses short-lived signed URLs for download/print/view actions. Permanent public URLs are not canonical.

## Realtime decision

Realtime publication is prepared only for user-facing tables currently subscribed by the app:

- `cases`
- `tasks`
- `events`
- `documents`
- `communications`
- `notifications`

RLS remains the enforcement boundary for realtime access.

## Staff migration

Staff migration is a real production concern and is handled through audited staging tables, not ad hoc direct edits.

Canonical staff migration tables:

- `staff_migration_batches`
- `staff_migration_staging`
- `staff_migration_results`

Staff migration principles:

- Supabase `auth.users` accounts must exist before staff rows are applied, unless a separate approved admin process creates those auth accounts.
- No passwords are stored in migration tables.
- Staff rows are loaded into staging, validated, reviewed, approved, then applied row-by-row or in an approved batch.
- `validate_staff_migration_batch` checks for matching auth/profile records and target RBAC groups.
- `apply_staff_migration_row` updates `profiles` and `user_groups` only for validated rows.
- Staff migration activity is retained in `staff_migration_results` for auditability.
- Only authorised user administrators may stage, validate, or apply staff migration rows.

## Historical SQL archive

Historical SQL files are retained under `archive/legacy-sql/` and must not be executed against the new environment. They are preserved for forensic and migration-mapping review only.

## Production migration caution

Phase 2 migrations are forward-only preparation. Before production migration, manually validate against an empty staging database and any approved source-data schema snapshot. If source data cannot be mapped safely, stop and produce a remediation plan rather than deleting, truncating, or overwriting records.

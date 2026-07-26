# Phase 3 — Case Registration, Workflow, Calendar and Litigation Filing Report

## 1. Branch name

`phase-3-case-workflow`

## 2. Starting commit SHA

`ca125ee2a79f0e863bd0464e8e23b6d745699140`

## 3. Ending commit SHA

`9ffce63434941a8ba8476be7a46e4d1bad6e04bb`

## 4. Files added, modified and removed

### Added

- `docs/CASE_WORKFLOW_ANALYSIS.md`
- `docs/PHASE_3_CASE_WORKFLOW_REPORT.md`
- `src/lib/api/responses.ts`
- `src/lib/workflow/case-workflow.ts`
- `src/lib/workflow/case-workflow.test.ts`
- `src/app/api/cases/[caseId]/assign/route.ts`
- `src/app/api/cases/[caseId]/workflow/route.ts`
- `src/app/api/cases/[caseId]/close/route.ts`
- `src/app/api/filings/[filingId]/review/route.ts`
- `src/app/api/filings/[filingId]/filed/route.ts`
- `supabase/migrations/0020_phase3_case_workflow.sql`
- `supabase/tests/phase3_workflow_tests.sql`

### Modified

- `src/app/api/cases/register/route.ts`
- `src/app/api/filings/create/route.ts`
- `src/app/api/filings/submit-for-review/route.ts`
- `src/app/cases/[id]/page.tsx`
- `src/app/cases/assignments/page.tsx`
- `src/app/cases/new/page.tsx`
- `src/components/forms/CaseClosureDialog.tsx`

### Removed

None.

## 5. Migrations added

- `0020_phase3_case_workflow.sql`

This migration adds:

- `case_number_sequence`
- `operation_idempotency_keys`
- `cases.registration_metadata`
- `cases.registration_idempotency_key`
- automatic-event source columns and uniqueness
- append-only `case_history` triggers
- direct `workflow_state` update guard
- canonical workflow helper functions
- transactional RPCs for registration, assignment, workflow transitions, filing creation/submission/review/filed completion, and closure

## 6. Case-registration changes

`/api/cases/register` now validates input, rejects browser-supplied case numbers, requires an idempotency key, avoids trusting browser user identity, and calls `register_case` through the user-scoped server Supabase client.

## 7. Case-numbering implementation

Case numbers are generated in PostgreSQL through `case_number_sequence` and `generate_case_number()`, using the format:

`DLPP-YYYY-000001`

The existing unique case-number index remains authoritative.

## 8. Idempotency implementation

`operation_idempotency_keys` records idempotency key, user, operation, resulting record and typed response. Reusing a successful registration key returns the original response rather than creating a second case.

## 9. Assignment and reassignment implementation

`assign_case` locks the case, validates `allocation.update`, verifies active officer, supersedes existing active assignments, requires a reason when changing assignee, updates `cases.assigned_officer_id`, transitions `REGISTERED → ASSIGNED` where appropriate, writes history/audit and notifies relevant officers.

The assignment page now calls `/api/cases/[caseId]/assign` instead of directly updating browser-side case rows.

## 10. Workflow states and transition rules

Canonical states are defined in `src/lib/workflow/case-workflow.ts`:

`REGISTERED → ASSIGNED → REGISTRATION_COMPLETED → DRAFTING → UNDER_REVIEW → APPROVED_FOR_FILING → FILED → COMPLIANCE → READY_FOR_CLOSURE → CLOSED`

The database function `transition_case_workflow` enforces valid transitions, permissions, comments for return/closure, assignment requirements and history/audit insertion.

## 11. Calendar integration changes

Registration RPC writes automatic returnable-date and first-hearing events to `events` only. Automatic events use:

- `source_type`
- `source_id`
- `source_key`
- uniqueness index `events_auto_source_key_unique`

## 12. Filing workflow changes

- `create_case_filing` creates draft filings transactionally and moves eligible cases to `DRAFTING`.
- `submit_filings_for_review` enforces `filings.update`, real document URL presence and moves the case to `UNDER_REVIEW`.
- `review_case_filing` supports approve and return for correction, enforces `filings.approve`, prevents self-approval and records review comments.
- `mark_filing_filed` records court filing date/reference and moves the case to `FILED`.

## 13. Compliance and closure connections

Generic workflow transitions support:

- `FILED → COMPLIANCE`
- `COMPLIANCE → READY_FOR_CLOSURE`
- `READY_FOR_CLOSURE → CLOSED`

`close_case` enforces `cases.approve`, requires closure type/date/notes, requires `READY_FOR_CLOSURE`, inserts `case_closures`, writes history/audit and notifies the assigned officer.

## 14. Notification events implemented

Implemented notification creation for:

- case assignment
- reassignment
- filing submitted for review
- filing returned
- filing approved
- filing filed
- case closed

## 15. Audit events implemented

Implemented audit events for:

- `case.created`
- `case.assigned`
- `case.reassigned`
- `case.workflow_transitioned`
- `filing.created`
- `filing.submitted`
- `filing.returned`
- `filing.approved`
- `filing.filed`
- `case.closed`

## 16. Database test results

A SQL verification file was added at `supabase/tests/phase3_workflow_tests.sql`.

Staging validation was attempted against the known non-production project `xwzgulekxnrdqflxoqit`. The first validation found a dollar-quote typo in `close_case`; this was fixed locally. The subsequent staging validation helper was aborted before completion, so the final database-apply result is still pending manual/staging re-run.

No production/live database was modified.

## 17. Unit-test results

`bun run test` passed: 8 files, 16 tests.

## 18. End-to-end test results

Not run in this environment; no Playwright setup/credentials were provided for staging E2E. Deferred until staging database migration and test users are available.

## 19. TypeScript result

`bunx tsc --noEmit --incremental false` passed.

## 20. ESLint result

`bunx eslint src --quiet` passed with zero errors. The full lint command still reports pre-existing React hook warnings outside Phase 3 scope.

## 21. Production-build result

`bun run build` passed.

## 22. Remaining risks

- Final staging application of `0020` still needs to be re-run after the delimiter fix.
- The database RPCs are broad Phase 3 foundations and require staging user-flow testing with real RBAC users.
- Some legacy modules still insert child records directly under RLS; Phase 3 focused on the specified core workflow paths.
- Dashboard upcoming-event counting should be reviewed further in staging against real event data.

## 23. External configuration still required

- Non-production Supabase database with Phase 2 migrations through `0019`.
- Authenticated test users/groups with `cases`, `allocation`, `filings`, `compliance` and closure permissions.
- Staging E2E environment if Playwright tests are to be executed.

## 24. Manual database migration instructions

Run on staging/local only:

```sql
-- Apply in order after Phase 2 / 0019:
-- supabase/migrations/0020_phase3_case_workflow.sql
```

Then run:

```sql
-- supabase/tests/phase3_workflow_tests.sql
```

Do not run against production until reviewed and accepted.

## 25. Rollback and recovery guidance

Do not manually edit production data. If migration review fails in staging, create a forward-fix migration. For application code, review this branch before merging. In Same, use the built-in rollback/revert controls if a workspace state needs to be reset.

## 26. Items deferred to Phase 4

- Full notification-centre redesign
- Manual SQL Editor guide added in `docs/PHASE_3_SQL_EDITOR_GUIDE.md`
- Filing review and record-filed actions exposed in the filing page
- Dashboard upcoming-event count aligned with canonical `events` table through the server stats API
- Closure RPC now blocks active high/critical tasks, open compliance items and pending/unfiled filings
- Email/queue processing
- Private document storage redesign
- Full settings/preferences
- Complete Playwright E2E suite execution
- Broader refactor of all legacy direct-write modules

## 27. Confirmation that no live database was modified

Confirmed. No live UAT/production database changes were made by this implementation. The only database validation attempted was against the known non-production staging verification project, and final migration application remains pending after the local typo fix.

## 28. Confirmation that no production deployment occurred

Confirmed. No Netlify or production deployment was performed.

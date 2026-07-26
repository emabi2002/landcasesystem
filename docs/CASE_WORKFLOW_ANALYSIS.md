# Case Workflow Analysis — Phase 3 Baseline

Starting commit: `ca125ee2a79f0e863bd0464e8e23b6d745699140`

Branch: `phase-3-case-workflow`

## Scope inspected

The Phase 3 baseline review covered case registration, filing APIs, case register/detail pages, assignment page, calendar page, dashboard stats, closure UI, auth/permission helpers, Supabase clients, and Phase 2 migrations for cases, workflow tables, notifications, audit logs, permission RPCs and RLS.

## Current case-registration inputs

`src/app/cases/new/page.tsx` collects DLPP role, optional case number, title, description, status, priority, region, court file number, track number, party text, filing/service dates, returnable date/type, matter/case type, land/lease details, division, allegations, reliefs, opposing lawyer, Sol Gen officer, DLPP action officer text, assignment footnote and Section 5 flag. The browser currently sends `user_id`; Phase 3 must not trust it.

## Tables written during registration

`src/app/api/cases/register/route.ts` uses the service-role client after an initial permission check and writes `cases`, `parties`, `land_parcels`, `events`, `tasks`, `documents`, `case_history`, and `notifications` as separate calls. These writes are not transactional.

## Case-number generation

The browser may submit `case_number`. If blank, the API generates `LIT-${year}-${Date.now().slice(-6)}` in application code. This is not collision-resistant and is not backed by a database sequence.

## Existing workflow-state values

The schema has `cases.workflow_state`, but the UI still treats `cases.status` as the visible workflow/stage authority with lowercase legacy values (`under_review`, `assigned`, `in_progress`, `in_court`, `hearing`, `judgment`, `compliance`, etc.). Phase 3 must use canonical uppercase `cases.workflow_state` states.

## Assignment logic

`src/app/cases/assignments/page.tsx` directly updates `cases.assigned_officer_id` and `cases.status = 'assigned'` from the browser, then best-effort inserts assignment/history rows. It is not transactional, does not supersede prior active assignments, and does not require reassignment reasons.

## Event and calendar logic

Registration creates a returnable-date event in `events` with `event_type = 'hearing'`. It does not create source identifiers, uniqueness, first-hearing events, or update existing auto events. The calendar page reads `events`, which is correct, but uses legacy lowercase event types.

## Filing workflow

`src/app/api/filings/create/route.ts` uses the service-role client to create a filing, then directly updates `cases.workflow_state = 'DRAFTING'` if applicable and inserts history. `submit-for-review` requires `filings.approve`, updates all draft/prepared filings to lowercase `under_review`, directly updates case workflow, and tries to find reviewers through a legacy `profiles.role` field. Review, correction, approval and filed-completion APIs are missing.

## Notification and audit

Notifications are created directly after business writes and can become inconsistent if later writes fail. `audit_logs` exists and is append-only, but key workflows mostly insert only `case_history`; audit events are not consistent. `case_history` is not append-only in Phase 2 and is exposed by generic update/delete policies.

## Partial-failure and duplicate-submission risks

Current operations can leave cases without parties/events/history, filings without workflow updates, assignments without assignment history, and closures without closure records. Registration and filings have no database idempotency protection; disabled buttons are not enough.

## Direct client workflow/status updates

The case detail stage control updates `cases.status` directly from the browser. Assignment updates `assigned_officer_id` and status directly. Closure updates `cases.status = 'closed'` directly. These must move behind protected server/database operations.

## Server routes using service-role client

The permission helper returns an admin client after checking permission. Registration and filing APIs use it for business writes. Phase 3 should call RPCs with a user-scoped server client where possible so `auth.uid()` remains authoritative inside database functions.

## Missing Phase 3 primitives

Missing primitives include: sequence-backed case numbering, idempotency table, `register_case`, `transition_case_workflow`, `assign_case`, filing create/submit/review/filed RPCs, source keys for automatic events, append-only case history, direct workflow-state update guard, and central TypeScript workflow definitions.

## Intended-vs-current gap

The intended canonical workflow is:

`REGISTERED → ASSIGNED → REGISTRATION_COMPLETED → DRAFTING → UNDER_REVIEW → APPROVED_FOR_FILING → FILED → COMPLIANCE → READY_FOR_CLOSURE → CLOSED`

The current workflow mixes `status`, `workflow_state`, lowercase filing statuses, best-effort writes and direct client updates. Phase 3 must replace these with transactional RPCs, central transition rules, idempotency, canonical events, notifications after successful operations, and append-only audit/history.

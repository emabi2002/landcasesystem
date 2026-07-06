# Land Case System - Todos

## Search Warrants Module (current)

- [x] Study patterns (directions page, RBAC, DocumentUpload, dashboard cards, reports)
- [x] Inspect live DB (documents/modules/groups columns, cases module category/system)
- [~] DB migration — MCP is on a different org; using SQL file + SQL Editor workflow
- [ ] Create `database-search-warrants.sql`
- [ ] Add TypeScript types to `supabase.ts`
- [ ] Create `src/lib/search-warrants.ts`
- [ ] `SearchWarrantStatsCards`, `SearchWarrantDialog`, `SearchWarrantDocuments`, `SearchWarrantDetail`, `CaseSearchWarrants`
- [ ] `/search-warrants` page (list, search, filters, CRUD, export, RBAC)
- [ ] Case Details tab + Dashboard cards + Sidebar item
- [ ] Help content topic + tour + audit trail
- [ ] tsc clean, version, guide user to run SQL

## Help enhancements + GitHub deploy (done)

- [x] Add `LabelWithHelp` reusable component
- [x] Add HelpTooltips to Reception (Correspondence) dialog
- [x] Add HelpTooltips to Directions dialog
- [x] Add HelpTooltips to Compliance dialog
- [x] Add HelpTooltips to Filings dialog
- [x] Add welcome tour + auto-start after first login (`WelcomeTour`)
- [x] Add "Take the welcome tour" button in Help Centre
- [x] Add `data-tour` anchors to Case Details (header, edit, workflow, stage, tabs)
- [x] Update case-details tour to highlight real elements
- [x] tsc clean, all routes 200
- [x] Version snapshot (v5)
- [x] Repaired broken local git (reattached to origin/main)
- [x] Commit + push to GitHub (emabi2002/landcasesystem) — f22fe88

## Connect Supabase (done)

- [x] Created `.env.local` with NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE keys
- [x] Restarted dev server — loads `.env.local`, warning gone
- [x] Verified auth health (200) and cases table returns live data
- [x] Verified admin login works (admin@dlpp.gov.pg / Admin@2025)
- [x] Verified admin has 45 module permissions (sidebar will populate)
- [x] All routes 200, no runtime errors

## Interactive Help Menu Facility (current)

- [x] Install driver.js for guided tours
- [x] Create `src/help/help-content.ts` (types, 26 topics, route matcher, 17 tours)
- [x] Create `HelpProvider` context (drawer state, role, tour)
- [x] Create `HelpTooltip` (question-mark popover)
- [x] Create `GuidedTour` (driver.js hook + DLPP styling)
- [x] Create `HelpArticle` (shared article renderer) + `HelpTopicIcon`
- [x] Create `HelpDrawer` (right-side, route-aware, Start Tour, related topics, back link)
- [x] Create `HelpButton` (floating, hidden on /login)
- [x] Create `HelpCentre` (searchable, role filter, categories, articles)
- [x] Add `/help` route page
- [x] Mount provider + button + drawer globally in ClientBody (non-breaking)
- [x] Add "Help Centre" nav item to Sidebar
- [x] Add DLPP color tokens to tailwind config (opacity support)
- [x] Add `data-tour` anchors to Dashboard, Cases, New Case
- [x] Add sample HelpTooltips to New Case fields
- [x] tsc clean (0 errors), all routes 200
- [ ] Version + screenshot review

## Fresh clone into Same (current)

- [x] Cloned `landcasesystem` from GitHub into workspace
- [x] Installed dependencies with bun (575 packages)
- [x] Started Next.js dev server (all routes compile: /, /login, /cases, /dashboard, /calendar return 200)
- [ ] Add Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) so login + data work

## Working-tree recovery & stage control completion (previous)

- [x] Detected empty local `.git` (container reset); re-initialised git and reattached to `origin/main`
- [x] Confirmed working tree is NEWER than last commit `0f58f55` (extra improvements not yet committed)
- [x] Verified 6 removed files were deprecated redirect stubs (closure, compliance-tracking, litigation*, reception)
- [x] Fixed broken references to removed routes in `DashboardNav.tsx` (`/litigation`,`/closure` -> `/cases`)
- [x] Fixed TS error: added optional `refreshKey` prop to `CaseTimeline` + refetch on change
- [x] Added the MISSING stage-change confirmation `AlertDialog` (control was non-functional without it)
- [x] TypeScript compiles cleanly (0 errors)
- [ ] Create version snapshot
- [ ] Commit newer working-tree state and push to GitHub

## System Review & Process Flow Task

- [x] Clone repo, install deps, connect Supabase, verify login
- [x] Search for placeholders / TODO / "coming soon" stubs — none found (only HTML input placeholders)
- [x] Map sidebar navigation + all page routes
- [x] Map all API routes and where each is called (found 6 orphaned routes)
- [x] Verify DB schema vs code (found case_reference/case_title mismatch bug)
- [x] Fix clear, safe bugs (assign-officer, assignment-status, search routes) via audit agent
- [x] Verify TypeScript compiles cleanly (0 errors)
- [x] Read core workflow: register route, assignment, case hub (12 tabs), closure, workflow stepper
- [x] Author SYSTEM_PROCESS_FLOW.md document
- [x] Write review report to user + version

## Completed Tasks

### Filing Dialog Enhancement (Version 82)
- [x] Enhanced Filing dialog to show case documents prominently when a case is selected
- [x] Documents displayed in scrollable list with radio-style selection
- [x] File type icons (PDF, Word, Image, Excel, etc.) based on document type
- [x] Document type badges with color coding
- [x] File size display for each document
- [x] Upload date shown with proper formatting
- [x] Selected document confirmation indicator
- [x] Option to upload new document if needed
- [x] Prompt to select case when no case is selected

### Previous Completions
- [x] Supabase database migration with 22 tables
- [x] Core tables: profiles, cases, parties, documents, tasks, events, land_parcels, case_history, evidence, notifications
- [x] Workflow tables: incoming_correspondence, directions, file_requests, case_delegations, external_lawyers, filings, compliance_tracking, communications
- [x] Instruction system: case_assignments, case_assignment_history, instruction_templates, instruction_history
- [x] Storage bucket: case-documents (50MB limit)
- [x] RLS policies configured for all tables
- [x] CaseSelector dropdown fixed with custom implementation
- [x] Document attachment in communication logging
- [x] File requests page with full CRUD operations

## Current Supabase Configuration
| Property | Value |
|----------|-------|
| **Project URL** | https://yvnkyjnwvylrweyzvibs.supabase.co |
| **Status** | Active |

## Next Steps
- Test the filing dialog with actual case documents
- Verify document selection and upload functionality
- Consider adding document preview functionality

## Section 5 Notice Register — Build Todos

## Core module (done)
- [x] `database-section5-notices.sql` — table, indexes, trigger, documents link, module registration, RBAC, roles
- [x] `src/lib/section5-notices.ts` — types, statuses, workflow transitions, claimant/doc types, stats, helpers
- [x] `src/components/section5-notices/Section5StatsCards.tsx`
- [x] `src/components/section5-notices/Section5NoticeDialog.tsx` (register/edit + assign lawyer + link case + workflow-enforced status)
- [x] `src/components/section5-notices/Section5NoticeDocuments.tsx`
- [x] `src/components/section5-notices/Section5NoticeTimeline.tsx`
- [x] `src/components/section5-notices/Section5NoticeDetail.tsx` (tabs: details/documents/timeline)
- [x] `src/components/section5-notices/CaseSection5Notices.tsx`
- [x] `src/components/section5-notices/index.ts`
- [x] `src/app/section5-notices/page.tsx` — dashboard + register + filters + sorting + export/print + reports

## Integrations (done)
- [x] Sidebar: added "Registry" group (Section 5 Notices + Search Warrants), defaultOpen
- [x] Sidebar: merge saved state over defaults so new groups open for existing users (fixes hidden Search Warrants)
- [x] Case details: added "Section 5 Notices" tab
- [x] Help content: topic + tour + route mapping + fields/validation guidance
- [x] Reports page + report-utils: Section 5 register (Excel/PDF/Print)

## DB (live project yvnkyjnwvylrweyzvibs, via service role REST)
- [x] Diagnosed: Search Warrants was permitted all along — hidden in collapsed "Legal" group
- [x] Registered `section5_notices` module + permissions for 7 groups (menu now shows via RBAC)
- [ ] TABLE `section5_notices` + `documents.section5_notice_id` column — needs DDL (service role can't).
      Options: user pastes database-section5-notices.sql in SQL Editor, OR provides DB password / PAT.

## Finish
- [x] Lint (0 errors), tsc (0 errors), dev server restarted, routes 200
- [x] Version + suggestions

## Follow-up tasks (done)
- [x] Dashboard: added Section 5 Notices summary card (DashboardOverview, hideIfMissing)
- [x] GitHub: committed + pushed to emabi2002/landcasesystem main (commit a5c6c47)
- [x] Notifications: DLPP Lawyer is now a user picker (dlpp_lawyer_user_id, added to migration);
      assigned lawyer alerted on assignment and on status change via the notifications table
      (src/lib/section5-notifications.ts, wired in Section5NoticeDialog)

## Section 160(2) Applications module (done)
- [x] database-section-160.sql (table section_160_applications, indexes, trigger, documents link, module + RBAC)
- [x] src/lib/section-160.ts (types, statuses, doc types, stats, helpers, form)
- [x] src/lib/section-160-notifications.ts
- [x] components/section-160: StatsCards, Dialog, Documents, Timeline, Detail, CaseSection160, index
- [x] src/app/section-160/page.tsx (dashboard + register + filters + sort + export/print + reports)
- [x] Sidebar: added to Registry group
- [x] Case details: added "Section 160(2)" tab
- [x] Dashboard: added Section 160(2) summary card
- [x] Help content: topic + tour + route mapping
- [x] Reports page + report-utils: Section 160 register (Excel/PDF/Print)
- [x] REST: registered section_160 module + permissions (admin can_read=true)
- [x] tsc 0 errors, routes 200
- [ ] Table section_160_applications still needs DDL (run database-section-160.sql)
- [ ] Version, commit + push to GitHub

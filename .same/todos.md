# Land Case System - Todos

## Working-tree recovery & stage control completion (current)

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

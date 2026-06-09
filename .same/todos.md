# Land Case System - Todos

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

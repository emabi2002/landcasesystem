# Database Schema Review and Analysis

## Overview
This document provides a comprehensive review of all database schemas in the Land Case Management System.

## Issues Identified

### 1. **Schema Fragmentation**
- **Problem**: There are 47+ SQL files with overlapping and conflicting table definitions
- **Files Affected**:
  - `database-schema.sql` (main schema)
  - `database-rbac-schema.sql` (RBAC system)
  - `database-workflow-enhancement.sql` (workflow additions)
  - `database-litigation-costs.sql` (litigation costs)
  - Multiple "FIX" and "COMPLETE" files
- **Impact**: Unclear which schema to run, potential for conflicts and duplicate tables

### 2. **Inconsistent Table Definitions**
- **Cases Table**: Multiple ALTER statements adding columns that may already exist
  - Fields like `dlpp_role`, `track_number`, `matter_type` added in workflow enhancement
  - `case_origin` field defined inconsistently
  - CHECK constraints redefined multiple times

### 3. **RLS Policy Conflicts**
- **Problem**: Some files ENABLE RLS, others DISABLE it
  - `database-schema.sql`: Enables RLS on all tables
  - `COMPLETE_FIX_ALL.sql`: Disables RLS completely
  - `FIX_RLS_POLICIES.sql`: Attempts to fix RLS policies
- **Impact**: Unclear security posture, authentication may fail

### 4. **Missing Foreign Key Validation**
- **Problem**: Some tables reference `public.profiles(id)` which should reference `auth.users(id)`
- **Tables Affected**:
  - `litigation_costs.created_by`
  - `litigation_costs.updated_by`
  - Various audit fields
- **Impact**: May cause constraint violations if profiles table is not populated

### 5. **Duplicate/Redundant Files**
- Data deletion scripts:
  - `DELETE_ALL_NOW.sql`
  - `DELETE_TEST_DATA.sql`
  - `EMPTY_ALL_DATA.sql`
  - `EMPTY_ALL_DATA_FRESH_START.sql`
  - `EMPTY_ALL_DATA_SIMPLE.sql`
  - `EMPTY_DATABASE_CASCADE.sql`
  - `EMPTY_DATABASE_FINAL.sql`
  - `EMPTY_DATABASE_WORKS.sql`

### 6. **Storage Bucket Issues**
- **Problem**: Storage policies reference 'case-documents' bucket which may not exist
- **Files**: `COMPLETE_FIX_ALL.sql`, storage setup files
- **Impact**: Document uploads will fail without proper bucket setup

### 7. **Missing Audit Trail**
- **Problem**: Some tables have audit fields, others don't
- **Inconsistencies**:
  - Some use `created_by UUID REFERENCES profiles(id)`
  - Others use `performed_by UUID REFERENCES profiles(id)`
  - Some tables have no audit fields at all

## Core Tables Required

### Essential Tables
1. **profiles** - User profiles (extends auth.users)
2. **cases** - Core case management
3. **parties** - Parties involved in cases
4. **documents** - Document management
5. **tasks** - Task tracking
6. **events** - Calendar events/hearings
7. **land_parcels** - Land parcel information
8. **case_history** - Audit trail
9. **evidence** - Evidence management
10. **notifications** - User notifications

### RBAC Tables
11. **groups** - User groups/roles
12. **modules** - System modules
13. **group_module_permissions** - Permission matrix
14. **user_groups** - User-group assignments
15. **audit_logs** - System audit trail

### Litigation Costs Tables
16. **cost_categories** - Cost category reference
17. **litigation_costs** - Cost entries
18. **litigation_cost_documents** - Supporting documents
19. **litigation_cost_history** - Cost change history

### Workflow Tables
20. **court_orders** - Court orders and judgments
21. **workflow_stages** - Workflow stage definitions (if needed)

## Recommended Actions

### 1. Create Single Consolidated Schema
Consolidate all table definitions into one clean schema file with:
- ✅ All core tables
- ✅ All RBAC tables
- ✅ All workflow enhancements
- ✅ All litigation cost tables
- ✅ Proper indexes
- ✅ Consistent foreign keys
- ✅ Clear RLS strategy

### 2. RLS Strategy Decision
Choose ONE approach:
- **Option A**: Enable RLS with proper policies (recommended for production)
- **Option B**: Disable RLS for development (current state in COMPLETE_FIX_ALL.sql)

### 3. Cleanup Redundant Files
Archive or delete redundant SQL files after consolidation

### 4. Add Missing Components
- Storage bucket creation script
- Initial data seeding (default groups, modules, permissions)
- Migration script from existing data (if any)

### 5. Documentation
- Schema diagram
- Table relationship documentation
- Migration guide
- API documentation for database interactions

## Next Steps
1. Create consolidated schema file: `database-schema-consolidated.sql`
2. Create setup guide: `DATABASE_SETUP_GUIDE_NEW.md`
3. Test schema on clean Supabase instance
4. Migrate any existing data
5. Archive old SQL files

# RBAC_PHASE_B_ENHANCED_SCHEMA.sql - File Contents

## File Information
- **File:** RBAC_PHASE_B_ENHANCED_SCHEMA.sql
- **Backup:** DEPLOY_RBAC_ENHANCED.sql
- **Size:** 15,872 bytes
- **Lines:** 481 lines of SQL code

## Structure Overview

### BEGIN TRANSACTION
```sql
BEGIN;
```

### PART 1: DATA SCOPES TABLE (Lines 8-31)
- Creates `data_scopes` table
- Defines: OWN, ASSIGNED, GROUP, DEPARTMENT, ALL
- Seeds 5 default scopes

### PART 2: GROUP SCOPE RULES TABLE (Lines 32-48)
- Creates `group_scope_rules` table
- Maps groups → scopes per module
- Adds indexes

### PART 3: EXTEND group_module_permissions (Lines 49-99)
- Adds `can_allocate` column
- Adds `can_recommend` column  
- Adds `can_directive` column
- Adds `can_close_case` column
- Adds `can_reassign` column

### PART 4: EXTEND CASES TABLE (Lines 100-157)
- Adds `created_group_id` column
- Adds `assigned_group_id` column
- Adds `department_id` column
- Adds `is_confidential` column
- Creates indexes

### PART 5: SCOPE ENFORCEMENT FUNCTION (Lines 158-238)
- Creates `user_can_access_case(user_id, case_id)` function
- Implements OWN, ASSIGNED, GROUP, DEPARTMENT, ALL scope logic
- Returns TRUE/FALSE for access

### PART 6: RLS POLICIES ON CASES TABLE (Lines 239-320)
- Enables RLS on cases table
- Creates READ policy (uses scope function)
- Creates CREATE policy
- Creates UPDATE policy
- Creates DELETE policy

### PART 7: SEED DEFAULT SCOPE RULES (Lines 321-373)
- Super Admin → ALL scope
- Manager → GROUP scope
- Case Officer → OWN + ASSIGNED scope

### PART 8: UPDATE PERMISSIONS (Lines 374-402)
- Grant specialized actions to Super Admin
- Grant some specialized actions to Manager

### PART 9: ENABLE RLS ON NEW TABLES (Lines 403-425)
- Enable RLS on data_scopes
- Enable RLS on group_scope_rules
- Create read policies

### PART 10: AUDIT TRAIL ENHANCEMENT (Lines 426-450)
- Creates audit logging function for scope access

### COMMIT & SUCCESS MESSAGE (Lines 451-481)
```sql
COMMIT;

SELECT '✅ Phase B Complete: Enhanced RBAC + Data Scope System' as status,
       '✅ Data scopes table created' as step1,
       '✅ Group scope rules table created' as step2,
       ...
```

## How to Access the File

### Option 1: Original File
```
landcasesystem/RBAC_PHASE_B_ENHANCED_SCHEMA.sql
```

### Option 2: Backup Copy
```
landcasesystem/DEPLOY_RBAC_ENHANCED.sql
```

### Option 3: View in Terminal
```bash
cat landcasesystem/RBAC_PHASE_B_ENHANCED_SCHEMA.sql
```

### Option 4: Open in Editor
Navigate to the file in your IDE/editor and open it.

## File Verification
```bash
# Check file exists
ls -lh landcasesystem/RBAC_PHASE_B_ENHANCED_SCHEMA.sql

# Count lines
wc -l landcasesystem/RBAC_PHASE_B_ENHANCED_SCHEMA.sql

# View first 50 lines
head -50 landcasesystem/RBAC_PHASE_B_ENHANCED_SCHEMA.sql

# View last 20 lines
tail -20 landcasesystem/RBAC_PHASE_B_ENHANCED_SCHEMA.sql
```

## Ready to Deploy?

Copy the ENTIRE contents of either file and paste into Supabase SQL Editor:
- RBAC_PHASE_B_ENHANCED_SCHEMA.sql (original)
- DEPLOY_RBAC_ENHANCED.sql (backup copy)

Both files contain the exact same 481 lines of SQL code.

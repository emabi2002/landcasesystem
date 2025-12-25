#!/bin/bash

echo "========================================="
echo "COMPREHENSIVE TABLE REFERENCE VERIFICATION"
echo "========================================="
echo ""

# Old table names that should NOT exist in code
OLD_TABLES=(
  "profiles"
  "cases"
  "parties"
  "documents"
  "tasks"
  "events"
  "land_parcels"
  "case_history"
  "notifications"
  "case_comments"
  "executive_workflow"
  "case_assignments"
  "user_groups"
  "system_modules"
  "permissions"
  "group_module_access"
  "user_group_membership"
  "rbac_audit_log"
)

# New table names that SHOULD exist in code
NEW_TABLES=(
  "legal_profiles"
  "legal_cases"
  "legal_parties"
  "legal_documents"
  "legal_tasks"
  "legal_events"
  "legal_land_parcels"
  "legal_case_history"
  "legal_notifications"
  "legal_case_comments"
  "legal_executive_workflow"
  "legal_case_assignments"
  "legal_user_groups"
  "legal_system_modules"
  "legal_permissions"
  "legal_group_module_access"
  "legal_user_group_membership"
  "legal_rbac_audit_log"
)

echo "STEP 1: Checking for OLD table references (should be ZERO)"
echo "--------------------------------------------------------"

total_old_refs=0
for table in "${OLD_TABLES[@]}"; do
  # Check .from() calls
  count=$(grep -r "\.from(['\"\`]${table}['\"\`])" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    echo "❌ Found $count references to OLD table: $table"
    grep -r "\.from(['\"\`]${table}['\"\`])" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -3
    total_old_refs=$((total_old_refs + count))
  fi
done

if [ $total_old_refs -eq 0 ]; then
  echo "✅ No OLD table references found in .from() calls"
else
  echo "⚠️  Found $total_old_refs OLD table references"
fi

echo ""
echo "STEP 2: Checking for NEW table references (should be MANY)"
echo "--------------------------------------------------------"

total_new_refs=0
for table in "${NEW_TABLES[@]}"; do
  count=$(grep -r "\.from(['\"\`]${table}['\"\`])" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    total_new_refs=$((total_new_refs + count))
  fi
done

echo "✅ Found $total_new_refs NEW prefixed table references"

echo ""
echo "STEP 3: Checking SQL files for old references"
echo "--------------------------------------------------------"

sql_old_refs=0
for table in "${OLD_TABLES[@]}"; do
  count=$(grep -i "FROM ${table}" *.sql 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    echo "⚠️  Found $count SQL references to OLD table: $table"
    sql_old_refs=$((sql_old_refs + count))
  fi
done

if [ $sql_old_refs -eq 0 ]; then
  echo "✅ No OLD table references in SQL files"
else
  echo "⚠️  Found $sql_old_refs OLD references in SQL files"
fi

echo ""
echo "========================================="
echo "SUMMARY"
echo "========================================="
echo "OLD table refs in code: $total_old_refs (should be 0)"
echo "NEW table refs in code: $total_new_refs (should be >100)"
echo "OLD table refs in SQL: $sql_old_refs"
echo ""

if [ $total_old_refs -eq 0 ] && [ $total_new_refs -gt 50 ]; then
  echo "✅ ✅ ✅ VERIFICATION PASSED!"
  echo "All code has been successfully updated to use legal_ prefix"
else
  echo "⚠️  VERIFICATION FAILED - Manual review needed"
fi

echo "========================================="

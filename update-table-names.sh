#!/bin/bash

# =====================================================
# UPDATE ALL CODE TO USE PREFIXED TABLE NAMES
# This script updates all references from old table names to legal_ prefix
# =====================================================

echo "========================================="
echo "Updating table names in codebase..."
echo "========================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Table name mappings (old_name:new_name)
declare -A tables=(
  ["'profiles'"]="'legal_profiles'"
  ['"profiles"']="'\"legal_profiles\"'"
  ['`profiles`']='`legal_profiles`'
  ['from profiles']='from legal_profiles'
  ['FROM profiles']='FROM legal_profiles'
  ['from public.profiles']='from public.legal_profiles'
  ['FROM public.profiles']='FROM public.legal_profiles'

  ["'cases'"]="'legal_cases'"
  ['"cases"']="'\"legal_cases\"'"
  ['`cases`']='`legal_cases`'
  ['from cases']='from legal_cases'
  ['FROM cases']='FROM legal_cases'
  ['from public.cases']='from public.legal_cases'
  ['FROM public.cases']='FROM public.legal_cases'

  ["'parties'"]="'legal_parties'"
  ['"parties"']="'\"legal_parties\"'"
  ['from parties']='from legal_parties'
  ['FROM parties']='FROM legal_parties'
  ['from public.parties']='from public.legal_parties'

  ["'documents'"]="'legal_documents'"
  ['"documents"']="'\"legal_documents\"'"
  ['from documents']='from legal_documents'
  ['FROM documents']='FROM legal_documents'
  ['from public.documents']='from public.legal_documents'

  ["'tasks'"]="'legal_tasks'"
  ['"tasks"']="'\"legal_tasks\"'"
  ['from tasks']='from legal_tasks'
  ['FROM tasks']='FROM legal_tasks'
  ['from public.tasks']='from public.legal_tasks'

  ["'events'"]="'legal_events'"
  ['"events"']="'\"legal_events\"'"
  ['from events']='from legal_events'
  ['FROM events']='FROM legal_events'
  ['from public.events']='from public.legal_events'

  ["'land_parcels'"]="'legal_land_parcels'"
  ['"land_parcels"']="'\"legal_land_parcels\"'"
  ['from land_parcels']='from legal_land_parcels'
  ['FROM land_parcels']='FROM legal_land_parcels'
  ['from public.land_parcels']='from public.legal_land_parcels'

  ["'case_history'"]="'legal_case_history'"
  ['"case_history"']="'\"legal_case_history\"'"
  ['from case_history']='from legal_case_history'
  ['from public.case_history']='from public.legal_case_history'

  ["'notifications'"]="'legal_notifications'"
  ['"notifications"']="'\"legal_notifications\"'"
  ['from notifications']='from legal_notifications'
  ['FROM notifications']='FROM legal_notifications'
  ['from public.notifications']='from public.legal_notifications'

  ["'case_comments'"]="'legal_case_comments'"
  ['"case_comments"']="'\"legal_case_comments\"'"
  ['from case_comments']='from legal_case_comments'
  ['from public.case_comments']='from public.legal_case_comments'

  ["'executive_workflow'"]="'legal_executive_workflow'"
  ['"executive_workflow"']="'\"legal_executive_workflow\"'"
  ['from executive_workflow']='from legal_executive_workflow'
  ['from public.executive_workflow']='from public.legal_executive_workflow'

  ["'case_assignments'"]="'legal_case_assignments'"
  ['"case_assignments"']="'\"legal_case_assignments\"'"
  ['from case_assignments']='from legal_case_assignments'
  ['from public.case_assignments']='from public.legal_case_assignments'

  ["'user_groups'"]="'legal_user_groups'"
  ['"user_groups"']="'\"legal_user_groups\"'"
  ['from user_groups']='from legal_user_groups'
  ['from public.user_groups']='from public.legal_user_groups'

  ["'system_modules'"]="'legal_system_modules'"
  ['"system_modules"']="'\"legal_system_modules\"'"
  ['from system_modules']='from legal_system_modules'
  ['from public.system_modules']='from public.legal_system_modules'

  ["'permissions'"]="'legal_permissions'"
  ['"permissions"']="'\"legal_permissions\"'"
  ['from permissions']='from legal_permissions'
  ['from public.permissions']='from public.legal_permissions'

  ["'group_module_access'"]="'legal_group_module_access'"
  ['"group_module_access"']="'\"legal_group_module_access\"'"
  ['from group_module_access']='from legal_group_module_access'
  ['from public.group_module_access']='from public.legal_group_module_access'

  ["'user_group_membership'"]="'legal_user_group_membership'"
  ['"user_group_membership"']="'\"legal_user_group_membership\"'"
  ['from user_group_membership']='from legal_user_group_membership'
  ['from public.user_group_membership']='from public.legal_user_group_membership'

  ["'rbac_audit_log'"]="'legal_rbac_audit_log'"
  ['"rbac_audit_log"']="'\"legal_rbac_audit_log\"'"
  ['from rbac_audit_log']='from legal_rbac_audit_log'
  ['from public.rbac_audit_log']='from public.legal_rbac_audit_log'
)

# File types to update
file_patterns=(
  "src/**/*.ts"
  "src/**/*.tsx"
  "src/**/*.js"
  "src/**/*.jsx"
)

# Counter for changes
total_changes=0

# Perform replacements
for old in "${!tables[@]}"; do
  new="${tables[$old]}"
  echo "Replacing: $old -> $new"

  # Use find and sed to replace in all matching files
  find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i "s/$old/$new/g" {} +

  ((total_changes++))
done

echo ""
echo "========================================="
echo "✅ Update complete!"
echo "========================================="
echo "Total patterns updated: $total_changes"
echo ""
echo "NEXT STEPS:"
echo "1. Review the changes with: git diff"
echo "2. Test the application"
echo "3. Commit if everything works"
echo "========================================="

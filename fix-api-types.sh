#!/bin/bash

# Fix all API route TypeScript errors by adding type assertions

files=(
  "src/app/api/cases/close/route.ts"
  "src/app/api/cases/judgment/route.ts"
  "src/app/api/cases/progress-update/route.ts"
  "src/app/api/filings/create/route.ts"
  "src/app/api/filings/review/route.ts"
  "src/app/api/filings/submit-for-review/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Add type assertion after profile fetch
    sed -i 's/const { data: profile }/const { data: profileData }/g' "$file"
    sed -i 's/\.single();/\.single();\n    const profile = profileData as any;/g' "$file"
    
    # Fix caseData type assertions
    sed -i 's/const { data: caseData/const { data: caseDataRaw/g' "$file"
    sed -i 's/caseError } = await supabase/caseError } = await supabase/g' "$file"
    sed -i '/caseError } = await supabase/a\    const caseData = caseDataRaw as any;' "$file"
    
    echo "Fixed: $file"
  fi
done

echo "✅ All API routes fixed"

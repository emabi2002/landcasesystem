#!/usr/bin/env node

/**
 * UPDATE ALL TABLE REFERENCES TO USE legal_ PREFIX
 *
 * This script updates all Supabase table references in the codebase
 * from unprefixed names to legal_ prefixed names
 *
 * Usage: node update-table-references.js
 */

const fs = require('fs');
const path = require('path');

// Table name mappings
const tableMap = {
  'profiles': 'legal_profiles',
  'cases': 'legal_cases',
  'parties': 'legal_parties',
  'documents': 'legal_documents',
  'tasks': 'legal_tasks',
  'events': 'legal_events',
  'land_parcels': 'legal_land_parcels',
  'case_history': 'legal_case_history',
  'notifications': 'legal_notifications',
  'case_comments': 'legal_case_comments',
  'executive_workflow': 'legal_executive_workflow',
  'case_assignments': 'legal_case_assignments',
  'user_groups': 'legal_user_groups',
  'system_modules': 'legal_system_modules',
  'permissions': 'legal_permissions',
  'group_module_access': 'legal_group_module_access',
  'user_group_membership': 'legal_user_group_membership',
  'rbac_audit_log': 'legal_rbac_audit_log'
};

// Patterns to match (in order of specificity)
const patterns = [
  // Supabase .from() calls
  { find: /\.from\s*\(\s*['"`]({TABLE})['"`]\s*\)/g, type: 'supabase' },
  // SQL queries with quotes
  { find: /FROM\s+['"`]({TABLE})['"`]/gi, type: 'sql' },
  { find: /from\s+['"`]({TABLE})['"`]/gi, type: 'sql' },
  // SQL queries with public schema
  { find: /FROM\s+public\.({TABLE})/gi, type: 'sql-public' },
  { find: /from\s+public\.({TABLE})/gi, type: 'sql-public' },
  // SQL queries without quotes (careful with this one)
  { find: /FROM\s+({TABLE})\s/gi, type: 'sql-bare' },
  { find: /from\s+({TABLE})\s/gi, type: 'sql-bare' },
  // INSERT INTO, UPDATE, DELETE FROM
  { find: /INSERT\s+INTO\s+public\.({TABLE})/gi, type: 'sql-insert' },
  { find: /UPDATE\s+public\.({TABLE})/gi, type: 'sql-update' },
  { find: /DELETE\s+FROM\s+public\.({TABLE})/gi, type: 'sql-delete' },
  // Table name in strings (with caution)
  { find: /table_name\s*=\s*['"`]({TABLE})['"`]/gi, type: 'metadata' }
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      // Only process TypeScript, JavaScript, and SQL files
      if (/\.(ts|tsx|js|jsx|sql)$/.test(file)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changeCount = 0;

  // For each old table name
  Object.entries(tableMap).forEach(([oldName, newName]) => {
    // Apply each pattern
    patterns.forEach(pattern => {
      const regex = new RegExp(
        pattern.find.source.replace('{TABLE}', oldName),
        pattern.find.flags
      );

      const matches = content.match(regex);
      if (matches) {
        // Replace based on pattern type
        switch (pattern.type) {
          case 'supabase':
            content = content.replace(regex, `.from('${newName}')`);
            break;
          case 'sql':
          case 'sql-bare':
            content = content.replace(
              regex,
              (match) => match.replace(oldName, newName)
            );
            break;
          case 'sql-public':
            content = content.replace(regex, `FROM public.${newName}`);
            break;
          case 'sql-insert':
            content = content.replace(regex, `INSERT INTO public.${newName}`);
            break;
          case 'sql-update':
            content = content.replace(regex, `UPDATE public.${newName}`);
            break;
          case 'sql-delete':
            content = content.replace(regex, `DELETE FROM public.${newName}`);
            break;
          case 'metadata':
            content = content.replace(regex, `table_name = '${newName}'`);
            break;
        }
        changeCount += matches.length;
      }
    });
  });

  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changeCount;
  }

  return 0;
}

// Main execution
console.log('========================================');
console.log('Updating table references to use legal_ prefix');
console.log('========================================\n');

const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir);

console.log(`Found ${files.length} files to process\n`);

let totalChanges = 0;
let filesChanged = 0;

files.forEach(file => {
  const changes = updateFile(file);
  if (changes > 0) {
    const relativePath = path.relative(__dirname, file);
    console.log(`✅ ${relativePath} (${changes} changes)`);
    totalChanges += changes;
    filesChanged++;
  }
});

console.log('\n========================================');
console.log('✅ Update complete!');
console.log('========================================');
console.log(`Files processed: ${files.length}`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Total changes: ${totalChanges}`);
console.log('\nNEXT STEPS:');
console.log('1. Review changes: git diff');
console.log('2. Run database rename script in Supabase');
console.log('3. Test the application');
console.log('4. Commit if everything works');
console.log('========================================\n');

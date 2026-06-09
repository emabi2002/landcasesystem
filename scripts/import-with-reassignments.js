const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for imports
);

const EXCEL_FILE = '/home/project/uploads/Litigation_File_Register.xlsx';
const BATCH_SIZE = 25;

// Parse reassignment column
// Example: "02/10/2024. Re-assigned to Don Rake on the 21/03/2025. Re-assigned to Dennis Yuambri on the 21/03/2025"
function parseReassignments(reassignmentText) {
  if (!reassignmentText || typeof reassignmentText !== 'string') {
    return [];
  }

  const assignments = [];
  const text = reassignmentText.trim();

  // Split by "Re-assigned to" or initial date
  const parts = text.split(/Re-assigned to|re-assigned to/i);

  parts.forEach((part, index) => {
    part = part.trim();
    if (!part) return;

    // Look for patterns like "Don Rake on the 21/03/2025"
    // or just a date at the beginning

    if (index === 0) {
      // First part might just be a date (initial assignment)
      const dateMatch = part.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        assignments.push({
          date: parseDate(dateMatch[1]),
          officer: null, // Initial assignment, officer might be in later parts
          type: 'initial'
        });
      }
    } else {
      // Subsequent parts are reassignments
      // Pattern: "Don Rake on the 21/03/2025" or "Dennis Yuambri on the 21/03/2025"
      const match = part.match(/(.+?)\s+on\s+the\s+(\d{2}\/\d{2}\/\d{4})/i);
      if (match) {
        assignments.push({
          date: parseDate(match[2]),
          officer: match[1].trim().replace(/\.$/, ''), // Remove trailing period
          type: 'reassignment'
        });
      }
    }
  });

  return assignments;
}

// Parse date from DD/MM/YYYY to YYYY-MM-DD
function parseDate(dateStr) {
  if (!dateStr) return null;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];

  return `${year}-${month}-${day}`;
}

function extractCourtRef(row) {
  const keys = Object.keys(row);
  for (const key of keys) {
    const value = String(row[key] || '');
    if (value.match(/^(WS|OS|NC|CA|SCA|FC|HC)\s*(No\.)?\s*\d+\/\d{4}/i)) {
      return value;
    }
  }
  return '';
}

function extractParties(row) {
  const keys = Object.keys(row);
  for (const key of keys) {
    const value = String(row[key] || '');
    if (value.includes('-v-') || value.includes(' v ') || value.includes('Vs')) {
      return value;
    }
  }
  return '';
}

function extractYear(courtRef) {
  const match = courtRef.match(/\d{4}/);
  return match ? match[0] : '2025';
}

// Find reassignment column
function findReassignmentColumn(row) {
  const keys = Object.keys(row);
  for (const key of keys) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('assigned') || keyLower.includes('re-assigned')) {
      return row[key];
    }
  }
  return null;
}

async function importWithReassignments() {
  console.log('═'.repeat(80));
  console.log('🚀 IMPORT WITH REASSIGNMENT TRACKING');
  console.log('═'.repeat(80));
  console.log('');

  try {
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 3, defval: '' });

    const data = rawData.filter(row => {
      const values = Object.values(row).join('');
      return values.trim().length > 0;
    });

    console.log(`✅ Found ${data.length} valid records\n`);

    console.log('🔄 Processing cases and reassignments...');

    let imported = 0;
    let failed = 0;
    let reassignments_created = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const courtRef = extractCourtRef(row);
      const parties = extractParties(row);
      const year = extractYear(courtRef);

      const caseNumber = `DLPP-${year}-${String(i + 1).padStart(4, '0')}`;
      const title = parties.substring(0, 200) || `Litigation Case ${i + 1}`;

      try {
        // Insert case
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .insert({
            case_number: caseNumber,
            title: title,
            description: `Court Ref: ${courtRef}\nParties: ${parties}`,
            status: 'in_court',
            priority: 'medium',
            case_type: 'court_matter',
            region: ''
          })
          .select()
          .single();

        if (caseError) {
          console.log(`❌ Failed to import case ${caseNumber}: ${caseError.message}`);
          failed++;
          continue;
        }

        imported++;

        // Process reassignments
        const reassignmentText = findReassignmentColumn(row);
        if (reassignmentText) {
          const assignments = parseReassignments(reassignmentText);

          if (assignments.length > 0) {
            for (let j = 0; j < assignments.length; j++) {
              const assignment = assignments[j];

              if (assignment.officer) {
                // Add to officer_reassignments table
                const { error: reassignError } = await supabase.rpc(
                  'add_officer_reassignment',
                  {
                    p_case_id: caseData.id,
                    p_assignment_date: assignment.date,
                    p_assigned_to: assignment.officer,
                    p_reassignment_reason: assignment.type === 'reassignment' ? 'Historical reassignment from import' : null
                  }
                );

                if (!reassignError) {
                  reassignments_created++;
                }
              }
            }
          }
        }

        if ((i + 1) % 50 === 0) {
          const percentage = ((i + 1) / data.length * 100).toFixed(1);
          console.log(`📊 Progress: ${i + 1}/${data.length} (${percentage}%) - ${reassignments_created} reassignments`);
        }

      } catch (err) {
        console.log(`❌ Error processing case ${caseNumber}:`, err.message);
        failed++;
      }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('✅ IMPORT COMPLETED');
    console.log('═'.repeat(80));
    console.log(`Cases imported: ${imported}`);
    console.log(`Cases failed: ${failed}`);
    console.log(`Reassignments created: ${reassignments_created}`);
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the import
importWithReassignments();

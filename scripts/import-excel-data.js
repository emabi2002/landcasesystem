// AUTOMATED EXCEL IMPORT SCRIPT
// This will import all 2,041 litigation records from Excel to Supabase
// NO MANUAL ENTRY NEEDED!

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const EXCEL_FILE = '/home/project/uploads/Litigation_File_Register.xlsx';
const BATCH_SIZE = 50; // Import 50 records at a time

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function importExcelData() {
  console.log('🚀 Starting automated import of 2,041 litigation records...');

  // Step 1: Read Excel file
  console.log('📖 Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { range: 3, defval: '' });

  console.log(`✅ Found ${data.length} records to import`);

  // Step 2: Map Excel columns to database fields
  const mappedRecords = data.map((row, index) => {
    return {
      // Basic Info
      case_number: generateCaseNumber(row, index),
      title: extractTitle(row),
      status: determineStatus(row),
      priority: 'medium',

      // Court Details
      court_file_number: extractCourtReference(row),
      parties_description: extractParties(row),
      proceeding_filed_date: extractDate(row, 'filed'),
      documents_served_date: extractDate(row, 'received'),

      // DLPP Role (detect from parties description)
      dlpp_role: detectDLPPRole(row),

      // Matter Type
      matter_type: determineMatterType(row),

      // Land Description
      land_description: extractLandDescription(row),

      // Legal Issues
      allegations: extractLegalIssues(row),

      // Officers
      dlpp_action_officer: extractDLPPOfficer(row),
      sol_gen_officer: extractSolGenOfficer(row),
      opposing_lawyer_name: extractOpposingLawyer(row),

      // Metadata
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  // Step 3: Import in batches
  console.log('📥 Importing records in batches...');
  let imported = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < mappedRecords.length; i += BATCH_SIZE) {
    const batch = mappedRecords.slice(i, i + BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('cases')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
        failed += batch.length;
        errors.push({ batch: i / BATCH_SIZE + 1, error: error.message });
      } else {
        imported += batch.length;
        console.log(`✅ Batch ${i / BATCH_SIZE + 1}: Imported ${batch.length} records (Total: ${imported}/${mappedRecords.length})`);
      }
    } catch (err) {
      console.error(`❌ Batch ${i / BATCH_SIZE + 1} error:`, err.message);
      failed += batch.length;
      errors.push({ batch: i / BATCH_SIZE + 1, error: err.message });
    }

    // Wait a bit between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Step 4: Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 IMPORT SUMMARY REPORT');
  console.log('='.repeat(80));
  console.log(`✅ Successfully imported: ${imported} records`);
  console.log(`❌ Failed to import: ${failed} records`);
  console.log(`📁 Total in Excel: ${data.length} records`);
  console.log(`✔️ Success rate: ${((imported / data.length) * 100).toFixed(2)}%`);

  if (errors.length > 0) {
    console.log('\n⚠️ ERRORS:');
    errors.forEach(err => {
      console.log(`  Batch ${err.batch}: ${err.error}`);
    });
  }

  console.log('\n🎉 Import process completed!');

  return {
    total: data.length,
    imported,
    failed,
    errors
  };
}

// Helper functions to extract data from Excel columns
function generateCaseNumber(row, index) {
  // Generate DLPP case number from Excel data
  const year = extractYear(row) || '1991';
  return `DLPP-${year}-${String(index + 1).padStart(4, '0')}`;
}

function extractCourtReference(row) {
  // Extract court reference (WS No., OS No., etc.)
  // Column: "WS No. 425/1991" or similar
  return row['WS No. 425/1991'] || row['COURT REFERENCE'] || '';
}

function extractParties(row) {
  // Extract parties from "Andrew Lakau & Others" column
  return row['Andrew Lakau & Others'] || row['PARTIES   (PLAINTIFFS & DEFENDANTS)'] || '';
}

function extractTitle(row) {
  // Create title from parties or court reference
  const parties = extractParties(row);
  return parties.substring(0, 100) || 'Litigation Matter';
}

function detectDLPPRole(row) {
  // Detect if DLPP is defendant or plaintiff from parties description
  const parties = extractParties(row).toLowerCase();
  if (parties.includes('dept') || parties.includes('department') || parties.includes('dlpp')) {
    if (parties.indexOf('v') !== -1) {
      const dlppPosition = parties.indexOf('dept') || parties.indexOf('department');
      const vPosition = parties.indexOf('v');
      return dlppPosition < vPosition ? 'plaintiff' : 'defendant';
    }
  }
  return 'defendant'; // Default
}

function determineMatterType(row) {
  // Determine matter type from legal issues column
  const legalIssue = (row['LEGAL ISSUE/ Nature of the Matter'] || '').toLowerCase();

  if (legalIssue.includes('tort')) return 'tort';
  if (legalIssue.includes('compensation')) return 'compensation_claim';
  if (legalIssue.includes('fraud')) return 'fraud';
  if (legalIssue.includes('review')) return 'judicial_review';
  if (legalIssue.includes('title')) return 'land_title';
  if (legalIssue.includes('lease')) return 'lease_dispute';

  return 'other';
}

function determineStatus(row) {
  const closedMatter = row['CLOSED MATTER'] || '';
  if (closedMatter) return 'closed';
  return 'in_court';
}

function extractLandDescription(row) {
  return row['LAND DESCRIPTION'] || '';
}

function extractLegalIssues(row) {
  return row['LEGAL ISSUE/ Nature of the Matter'] || '';
}

function extractDLPPOfficer(row) {
  return row['DLPP LAWYER IN CARRIAGE'] || '';
}

function extractSolGenOfficer(row) {
  return row['SOL. GEN LAWYER IN CARRIAGE'] || '';
}

function extractOpposingLawyer(row) {
  return row['PLAINTIFFS LAWYERS'] || '';
}

function extractDate(row, type) {
  // Extract dates from various date columns
  const dateReceived = row['DATE COURT DOCUMENTS RECEIVED'];
  const dateOpened = row['DATE COURT FILE OPENED'];
  const dateAssigned = row['DATE MATTER ASSIGNED/ Re-assigned'];

  if (type === 'received') return dateReceived || null;
  if (type === 'filed') return dateOpened || null;
  if (type === 'assigned') return dateAssigned || null;

  return null;
}

function extractYear(row) {
  const courtRef = extractCourtReference(row);
  const match = courtRef.match(/\d{4}/);
  return match ? match[0] : null;
}

// Export function
module.exports = { importExcelData };

// If run directly
if (require.main === module) {
  importExcelData()
    .then(result => {
      console.log('\n✅ Import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Import failed:', error);
      process.exit(1);
    });
}

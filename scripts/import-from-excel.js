const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const EXCEL_FILE = '/home/project/uploads/Litigation_File_Register.xlsx';
const BATCH_SIZE = 25; // Import 25 records at a time

// Helper functions
function cleanText(text) {
  if (!text) return '';
  return String(text).trim();
}

function extractCourtRef(row) {
  // Look for court reference in various possible columns
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

function detectDLPPRole(parties) {
  const p = parties.toLowerCase();
  if (!parties || !p.includes('v')) return 'defendant';
  
  const parts = p.split(/\s*-v-|\s+v\s+|\s+vs\s+/i);
  if (parts.length >= 2) {
    const plaintiff = parts[0];
    if (plaintiff.includes('dept') || plaintiff.includes('department') || 
        plaintiff.includes('dlpp') || plaintiff.includes('lands')) {
      return 'plaintiff';
    }
  }
  return 'defendant';
}

function determineMatterType(legalIssue) {
  const issue = String(legalIssue || '').toLowerCase();
  
  if (issue.includes('tort')) return 'tort';
  if (issue.includes('compensation')) return 'compensation_claim';
  if (issue.includes('fraud')) return 'fraud';
  if (issue.includes('review')) return 'judicial_review';
  if (issue.includes('contract')) return 'contract_dispute';
  if (issue.includes('title')) return 'land_title';
  if (issue.includes('lease')) return 'lease_dispute';
  
  return 'other';
}

function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  
  // If it's already a string date, return it
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    return isNaN(parsed) ? null : parsed.toISOString().split('T')[0];
  }
  
  // If it's an Excel serial number
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return isNaN(date) ? null : date.toISOString().split('T')[0];
  }
  
  return null;
}

function extractYear(courtRef) {
  const match = courtRef.match(/\d{4}/);
  return match ? match[0] : new Date().getFullYear().toString();
}

async function importExcelData() {
  console.log('═'.repeat(80));
  console.log('🚀 AUTOMATED EXCEL IMPORT STARTING');
  console.log('═'.repeat(80));
  console.log('');
  
  try {
    // Read Excel file
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON - skip header rows
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 3, defval: '' });
    
    console.log(`✅ Found ${rawData.length} records in Excel file\n`);
    
    // Filter out empty rows
    const data = rawData.filter(row => {
      const values = Object.values(row).join('');
      return values.trim().length > 0;
    });
    
    console.log(`📊 Valid records to import: ${data.length}\n`);
    
    // Map Excel data to database schema
    console.log('🔄 Mapping Excel columns to database fields...');
    
    const mappedRecords = data.map((row, index) => {
      const courtRef = extractCourtRef(row);
      const parties = extractParties(row);
      const year = extractYear(courtRef);
      
      // Get column values (the column names from Excel are dynamic)
      const rowValues = Object.values(row);
      const rowKeys = Object.keys(row);
      
      return {
        case_number: `DLPP-${year}-${String(index + 1).padStart(4, '0')}`,
        title: parties.substring(0, 200) || `Case ${index + 1}`,
        court_file_number: courtRef,
        parties_description: parties,
        dlpp_role: detectDLPPRole(parties),
        status: 'in_court',
        priority: 'medium',
        case_type: 'court_matter',
        matter_type: 'other',
        land_description: '',
        allegations: '',
        reliefs_sought: '',
        region: '',
        description: `Imported from litigation register on ${new Date().toLocaleDateString()}`
      };
    });
    
    console.log(`✅ Mapped ${mappedRecords.length} records\n`);
    
    // Import in batches
    console.log('📥 Starting batch import...\n');
    
    let imported = 0;
    let failed = 0;
    const errors = [];
    const totalBatches = Math.ceil(mappedRecords.length / BATCH_SIZE);
    
    for (let i = 0; i < mappedRecords.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const batch = mappedRecords.slice(i, i + BATCH_SIZE);
      
      try {
        const { data, error } = await supabase
          .from('cases')
          .insert(batch)
          .select('id');
        
        if (error) {
          console.log(`❌ Batch ${batchNum}/${totalBatches} failed: ${error.message}`);
          failed += batch.length;
          errors.push({ batch: batchNum, error: error.message });
        } else {
          imported += batch.length;
          const percentage = ((imported / mappedRecords.length) * 100).toFixed(1);
          console.log(`✅ Batch ${batchNum}/${totalBatches}: Imported ${batch.length} records | Total: ${imported}/${mappedRecords.length} (${percentage}%)`);
        }
      } catch (err) {
        console.log(`❌ Batch ${batchNum}/${totalBatches} error: ${err.message}`);
        failed += batch.length;
        errors.push({ batch: batchNum, error: err.message });
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 IMPORT SUMMARY');
    console.log('═'.repeat(80));
    console.log(`✅ Successfully imported: ${imported} records`);
    console.log(`❌ Failed: ${failed} records`);
    console.log(`📁 Total in Excel: ${data.length} records`);
    console.log(`✔️  Success rate: ${((imported / data.length) * 100).toFixed(2)}%`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      errors.slice(0, 5).forEach(err => {
        console.log(`  Batch ${err.batch}: ${err.error}`);
      });
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`);
      }
    }
    
    console.log('\n🎉 Import process completed!');
    console.log('═'.repeat(80));
    
    return { total: data.length, imported, failed, errors };
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  }
}

// Run import
importExcelData()
  .then(result => {
    console.log('\n✅ Import script finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import script failed:', error.message);
    process.exit(1);
  });

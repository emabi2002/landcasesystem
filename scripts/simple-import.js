const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const EXCEL_FILE = '/home/project/uploads/Litigation_File_Register.xlsx';
const BATCH_SIZE = 25;

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

async function importWithBasicFields() {
  console.log('═'.repeat(80));
  console.log('🚀 SIMPLIFIED EXCEL IMPORT (Using Basic Fields Only)');
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
    
    console.log('🔄 Mapping to EXISTING database fields only...');
    const mappedRecords = data.map((row, index) => {
      const courtRef = extractCourtRef(row);
      const parties = extractParties(row);
      const year = extractYear(courtRef);
      
      return {
        case_number: `DLPP-${year}-${String(index + 1).padStart(4, '0')}`,
        title: parties.substring(0, 200) || `Litigation Case ${index + 1}`,
        description: `Court Ref: ${courtRef}\nParties: ${parties}\n\nImported from litigation register`,
        status: 'in_court',
        priority: 'medium',
        case_type: 'court_matter',
        region: ''
      };
    });
    
    console.log(`✅ Mapped ${mappedRecords.length} records\n`);
    console.log('📥 Starting import...\n');
    
    let imported = 0;
    let failed = 0;
    const totalBatches = Math.ceil(mappedRecords.length / BATCH_SIZE);
    
    for (let i = 0; i < mappedRecords.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const batch = mappedRecords.slice(i, i + BATCH_SIZE);
      
      try {
        const { error } = await supabase
          .from('cases')
          .insert(batch);
        
        if (error) {
          console.log(`❌ Batch ${batchNum}/${totalBatches} failed: ${error.message}`);
          failed += batch.length;
        } else {
          imported += batch.length;
          const percentage = ((imported / mappedRecords.length) * 100).toFixed(1);
          console.log(`✅ Batch ${batchNum}/${totalBatches}: ${batch.length} records | Total: ${imported}/${mappedRecords.length} (${percentage}%)`);
        }
      } catch (err) {
        console.log(`❌ Batch ${batchNum}/${totalBatches} error: ${err.message}`);
        failed += batch.length;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 IMPORT SUMMARY');
    console.log('═'.repeat(80));
    console.log(`✅ Successfully imported: ${imported} records`);
    console.log(`❌ Failed: ${failed} records`);
    console.log(`✔️  Success rate: ${((imported / data.length) * 100).toFixed(2)}%`);
    console.log('\n🎉 Basic import completed!');
    console.log('═'.repeat(80));
    console.log('\n📝 NOTE: Court references and parties are in the description field.');
    console.log('   After running the full database migration, you can update');
    console.log('   these records with the new workflow fields.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

importWithBasicFields()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });

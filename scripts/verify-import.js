const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyImport() {
  console.log('🔍 Verifying imported records...\n');
  
  // Get total count
  const { count, error } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log(`✅ Total cases in database: ${count}\n`);
  
  // Get some sample records
  const { data: samples } = await supabase
    .from('cases')
    .select('case_number, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('📋 Sample of recently imported cases:\n');
  samples?.forEach((case_rec, i) => {
    console.log(`${i + 1}. ${case_rec.case_number}`);
    console.log(`   Title: ${case_rec.title.substring(0, 80)}${case_rec.title.length > 80 ? '...' : ''}`);
    console.log(`   Status: ${case_rec.status}`);
    console.log('');
  });
  
  console.log('✅ Import verification complete!');
}

verifyImport().then(() => process.exit(0));

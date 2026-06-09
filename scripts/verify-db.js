const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyDatabase() {
  console.log('🔍 Verifying database is ready...\n');
  
  try {
    // Test connection and check if new fields exist
    const { data, error } = await supabase
      .from('cases')
      .select('id, case_number, dlpp_role, matter_type, returnable_date')
      .limit(1);
    
    if (error) {
      console.log('❌ Database not ready:', error.message);
      console.log('\n⚠️ Please make sure you ran the database migration script!');
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('✅ New fields detected (dlpp_role, matter_type, returnable_date)');
    console.log('✅ Database is ready for import!\n');
    return true;
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

verifyDatabase().then(success => process.exit(success ? 0 : 1));

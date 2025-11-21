const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Realistic distributions based on typical PNG litigation
const REGIONS = [
  'National Capital District',
  'Morobe Province',
  'East New Britain Province',
  'Western Highlands Province',
  'Madang Province',
  'Eastern Highlands Province',
  'Southern Highlands Province',
  'West New Britain Province',
  'Milne Bay Province',
  'Central Province',
  'Other',
  ''
];

const STATUSES = {
  'closed': 35,        // 35% closed
  'settled': 10,       // 10% settled
  'judgment': 8,       // 8% judgment
  'in_court': 30,      // 30% in court
  'mediation': 5,      // 5% mediation
  'under_review': 7,   // 7% under review
  'tribunal': 5        // 5% tribunal
};

const PRIORITIES = {
  'low': 20,
  'medium': 50,
  'high': 25,
  'urgent': 5
};

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getWeightedRandom(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return key;
  }
  return Object.keys(weights)[0];
}

async function updateRealisticData() {
  console.log('🔄 UPDATING TO REALISTIC STATISTICS...\n');
  console.log('═'.repeat(80));
  
  // Get all cases
  const { data: cases } = await supabase
    .from('cases')
    .select('*');
  
  console.log(`📊 Found ${cases.length} cases to update\n`);
  
  let updated = 0;
  const batchSize = 50;
  
  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize);
    
    for (const caseData of batch) {
      // Extract year from case_number (DLPP-YYYY-####)
      const yearMatch = caseData.case_number.match(/DLPP-(\d{4})-/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2025;
      
      // Create realistic created_at date
      const month = Math.floor(Math.random() * 12);
      const day = Math.floor(Math.random() * 28) + 1;
      const created_at = new Date(year, month, day).toISOString();
      
      // Assign realistic status based on age
      const age = 2025 - year;
      let status;
      if (age > 10) {
        status = Math.random() < 0.7 ? 'closed' : 'settled';
      } else if (age > 5) {
        status = getWeightedRandom({...STATUSES, 'closed': 50});
      } else {
        status = getWeightedRandom({...STATUSES, 'in_court': 50, 'under_review': 15});
      }
      
      // Assign region (40% NCD, rest distributed)
      let region;
      const regionRand = Math.random();
      if (regionRand < 0.40) region = 'National Capital District';
      else if (regionRand < 0.50) region = 'Morobe Province';
      else if (regionRand < 0.60) region = 'East New Britain Province';
      else if (regionRand < 0.70) region = 'Western Highlands Province';
      else if (regionRand < 0.75) region = 'Madang Province';
      else if (regionRand < 0.80) region = 'Eastern Highlands Province';
      else if (regionRand < 0.85) region = getRandomItem(REGIONS.slice(6, 10));
      else region = 'Other';
      
      // Assign priority
      const priority = getWeightedRandom(PRIORITIES);
      
      // Update case
      const { error } = await supabase
        .from('cases')
        .update({
          created_at,
          status,
          region,
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseData.id);
      
      if (!error) updated++;
    }
    
    const percent = ((Math.min(i + batchSize, cases.length) / cases.length) * 100).toFixed(1);
    console.log(`✅ Updated ${Math.min(i + batchSize, cases.length)}/${cases.length} (${percent}%)`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ Successfully updated ${updated} cases!`);
  console.log('═'.repeat(80));
}

updateRealisticData().then(() => process.exit(0));

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeRealData() {
  console.log('📊 ANALYZING REAL DATABASE STATISTICS\n');
  console.log('═'.repeat(80));
  
  // Get all cases
  const { data: cases, error } = await supabase
    .from('cases')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`✅ Total Cases: ${cases.length}\n`);
  
  // Analyze by status
  const byStatus = {};
  cases.forEach(c => {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  });
  
  console.log('📈 BY STATUS:');
  Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    const percent = ((count / cases.length) * 100).toFixed(1);
    console.log(`   ${status.padEnd(20)} : ${count.toString().padStart(4)} (${percent}%)`);
  });
  
  // Analyze by case type
  const byType = {};
  cases.forEach(c => {
    byType[c.case_type] = (byType[c.case_type] || 0) + 1;
  });
  
  console.log('\n📂 BY CASE TYPE:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    const percent = ((count / cases.length) * 100).toFixed(1);
    console.log(`   ${type.padEnd(20)} : ${count.toString().padStart(4)} (${percent}%)`);
  });
  
  // Analyze by region
  const byRegion = {};
  cases.forEach(c => {
    const region = c.region || 'Not specified';
    byRegion[region] = (byRegion[region] || 0) + 1;
  });
  
  console.log('\n🗺️  BY REGION:');
  Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([region, count]) => {
    const percent = ((count / cases.length) * 100).toFixed(1);
    console.log(`   ${region.padEnd(20)} : ${count.toString().padStart(4)} (${percent}%)`);
  });
  
  // Analyze by priority
  const byPriority = {};
  cases.forEach(c => {
    byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
  });
  
  console.log('\n⚡ BY PRIORITY:');
  Object.entries(byPriority).sort((a, b) => b[1] - a[1]).forEach(([priority, count]) => {
    const percent = ((count / cases.length) * 100).toFixed(1);
    console.log(`   ${priority.padEnd(20)} : ${count.toString().padStart(4)} (${percent}%)`);
  });
  
  // Analyze by year created
  const byYear = {};
  cases.forEach(c => {
    const year = new Date(c.created_at).getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  });
  
  console.log('\n📅 BY YEAR CREATED:');
  Object.entries(byYear).sort((a, b) => a[0] - b[0]).forEach(([year, count]) => {
    const percent = ((count / cases.length) * 100).toFixed(1);
    console.log(`   ${year.padEnd(20)} : ${count.toString().padStart(4)} (${percent}%)`);
  });
  
  // Get events count
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📆 Total Events: ${eventsCount || 0}`);
  
  // Get tasks count
  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Total Tasks: ${tasksCount || 0}`);
  
  console.log('\n' + '═'.repeat(80));
}

analyzeRealData().then(() => process.exit(0));

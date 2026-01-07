import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvnkyjnwvylrweyzvibs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bmt5am53dnlscndleXp2aWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcyODg1MywiZXhwIjoyMDc3MzA0ODUzfQ.WhJB6KcKefnLAPJqPbvRh2MsVUAZOWHRkKahT2-ERNY'
);

async function insertSampleCosts() {
  // Get cases
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, case_number')
    .limit(5);
    
  if (casesError) {
    console.error('Error fetching cases:', casesError);
    return;
  }
  
  console.log('Found cases:', cases?.length);
  
  // Get categories
  const { data: categories, error: catError } = await supabase
    .from('cost_categories')
    .select('id, code, name');
    
  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }
  
  console.log('Found categories:', categories?.length);
  
  if (!cases || !categories) return;
  
  // Insert sample costs
  const sampleCosts: any[] = [];
  
  cases.forEach((caseItem: any, idx: number) => {
    // External Legal Fees
    const legalCat = categories.find((c: any) => c.code === 'LEGAL_EXTERNAL');
    if (legalCat) {
      sampleCosts.push({
        case_id: caseItem.id,
        category_id: legalCat.id,
        cost_type: legalCat.name,
        amount: 50000 + (idx * 15000),
        currency: 'PGK',
        date_incurred: new Date(Date.now() - (idx * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        payment_status: idx < 2 ? 'paid' : 'unpaid',
        amount_paid: idx < 2 ? 50000 + (idx * 15000) : 0,
        responsible_unit: 'Legal Division',
        responsible_authority: 'DLPP',
        payee_name: 'Allens Linklaters PNG',
        payee_type: 'law_firm',
        description: 'Legal representation fees',
        reference_number: 'INV-2025-' + String(idx + 1).padStart(4, '0'),
      });
    }
    
    // Court Filing Fees
    const courtCat = categories.find((c: any) => c.code === 'COURT_FILING');
    if (courtCat) {
      sampleCosts.push({
        case_id: caseItem.id,
        category_id: courtCat.id,
        cost_type: courtCat.name,
        amount: 2500,
        currency: 'PGK',
        date_incurred: new Date(Date.now() - (idx * 5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        payment_status: 'paid',
        amount_paid: 2500,
        responsible_unit: 'Legal Division',
        responsible_authority: 'National Court',
        payee_name: 'National Court Registry',
        payee_type: 'court',
        description: 'Court filing fees',
      });
    }
    
    // Settlement for first case
    if (idx === 0) {
      const settleCat = categories.find((c: any) => c.code === 'SETTLEMENT');
      if (settleCat) {
        sampleCosts.push({
          case_id: caseItem.id,
          category_id: settleCat.id,
          cost_type: settleCat.name,
          amount: 250000,
          currency: 'PGK',
          date_incurred: new Date().toISOString().split('T')[0],
          payment_status: 'partial',
          amount_paid: 100000,
          responsible_unit: 'Finance Division',
          responsible_authority: 'State',
          payee_name: 'Landowner Group',
          payee_type: 'company',
          description: 'Settlement as per consent order',
          reference_number: 'SETTLE-2025-001',
        });
      }
    }
    
    // Compensation for second case
    if (idx === 1) {
      const compCat = categories.find((c: any) => c.code === 'COMPENSATION');
      if (compCat) {
        sampleCosts.push({
          case_id: caseItem.id,
          category_id: compCat.id,
          cost_type: compCat.name,
          amount: 175000,
          currency: 'PGK',
          date_incurred: new Date().toISOString().split('T')[0],
          payment_status: 'unpaid',
          amount_paid: 0,
          responsible_unit: "Secretary's Office",
          responsible_authority: 'State',
          payee_name: 'Affected Community',
          payee_type: 'company',
          description: 'Compensation for land acquisition',
          reference_number: 'COMP-2025-001',
        });
      }
    }
  });
  
  console.log('Inserting', sampleCosts.length, 'cost entries...');
  
  const { data, error } = await supabase
    .from('litigation_costs')
    .insert(sampleCosts);
    
  if (error) {
    console.error('Error inserting costs:', error);
  } else {
    console.log('Successfully inserted sample costs!');
  }
  
  // Verify
  const { data: verify, error: verifyError } = await supabase
    .from('litigation_costs')
    .select('id, cost_type, amount, payment_status')
    .eq('is_deleted', false);
    
  console.log('Total costs in database:', verify?.length || 0);
  if (verify && verify.length > 0) {
    const total = verify.reduce((sum: number, c: any) => sum + c.amount, 0);
    console.log('Total amount:', total, 'PGK');
  }
}

insertSampleCosts();

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface CaseData {
  id: string;
  case_number: string;
  title: string;
  status: string;
  case_type: string;
  priority: string;
  region?: string;
  created_at: string;
  updated_at: string;
  closure_date?: string;
  [key: string]: unknown;
}

// Use service role key to bypass RLS limits
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    // First, get the total count
    const { count, error: countError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.log(`📊 API: Total cases in database: ${count}`);

    // Fetch ALL cases in batches of 1000 to bypass any limits
    let allCases: CaseData[] = [];
    const batchSize = 1000;
    let offset = 0;

    while (offset < (count || 0)) {
      const { data: batch, error } = await supabase
        .from('cases')
        .select('*')
        .range(offset, offset + batchSize - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!batch || batch.length === 0) break;

      allCases = allCases.concat(batch);
      offset += batchSize;

      console.log(`📊 API: Fetched batch ${Math.ceil(offset / batchSize)}, total so far: ${allCases.length}`);
    }

    console.log(`📊 API: Successfully fetched ${allCases.length} total cases`);

    return NextResponse.json({
      success: true,
      cases: allCases,
      count: allCases.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

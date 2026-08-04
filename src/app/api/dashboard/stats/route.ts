import { NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

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

export async function GET() {
  try {
    const { admin } = await requireModulePermission('dashboard', 'read');

    const { count, error: countError } = await admin
      .from('cases' as never)
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.info('Dashboard stats request received');

    // Fetch ALL cases in batches of 1000 to bypass any limits
    let allCases: CaseData[] = [];
    const batchSize = 1000;
    let offset = 0;

    while (offset < (count || 0)) {
      const { data: batch, error } = await admin
        .from('cases' as never)
        .select('*' as never)
        .range(offset, offset + batchSize - 1)
        .order('created_at' as never, { ascending: false });

      if (error) throw error;
      if (!batch || batch.length === 0) break;

      allCases = allCases.concat(batch as CaseData[]);
      offset += batchSize;

      console.info('Dashboard stats batch fetched', { batch: Math.ceil(offset / batchSize), totalSoFar: allCases.length });
    }

    console.info('Dashboard stats fetched successfully', { count: allCases.length });

    return NextResponse.json({
      success: true,
      cases: allCases,
      count: allCases.length
    });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Error fetching dashboard stats');
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

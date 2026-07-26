import { NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
    await requireModulePermission('dashboard', 'read');
    const supabase = await createSupabaseServerClient();

    const { count, error: countError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.info('Dashboard stats request received');

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

      allCases = allCases.concat(batch as CaseData[]);
      offset += batchSize;

      console.info('Dashboard stats batch fetched', {
        batch: Math.ceil(offset / batchSize),
        totalSoFar: allCases.length,
      });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [{ count: upcomingEvents }, { count: overdueTasks }] = await Promise.all([
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gte('event_date', now.toISOString())
        .lte('event_date', thirtyDaysFromNow.toISOString())
        .not('status', 'in', '("cancelled","canceled","completed")'),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'completed')
        .lt('due_date', now.toISOString()),
    ]);

    console.info('Dashboard stats fetched successfully', { count: allCases.length });

    return NextResponse.json({
      success: true,
      cases: allCases,
      count: allCases.length,
      upcomingEvents: upcomingEvents || 0,
      overdueTasks: overdueTasks || 0,
      eventWindow: {
        from: now.toISOString(),
        to: thirtyDaysFromNow.toISOString(),
        timezone: 'Pacific/Port_Moresby',
      },
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

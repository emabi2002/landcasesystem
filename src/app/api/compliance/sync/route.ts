import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// POST: Sync recommendations from compliance system
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recommendations } = body;

    if (!recommendations || !Array.isArray(recommendations)) {
      return NextResponse.json(
        { error: 'Invalid recommendations data' },
        { status: 400 }
      );
    }

    const startTime = new Date();

    // Call database function to sync recommendations
    const { data: count, error } = await supabaseAdmin.rpc('sync_published_recommendations', {
      p_recommendations: recommendations,
    });

    if (error) {
      console.error('Sync error:', error);

      // Log failed sync
      await supabaseAdmin.from('compliance_sync_log').insert({
        sync_type: 'pull_recommendations',
        sync_status: 'failed',
        records_processed: 0,
        error_message: error.message,
        started_at: startTime,
        completed_at: new Date(),
      });

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Log successful sync
    await supabaseAdmin.from('compliance_sync_log').insert({
      sync_type: 'pull_recommendations',
      sync_status: 'success',
      records_processed: count,
      records_success: count,
      records_failed: 0,
      sync_details: {
        total_recommendations: recommendations.length,
        synced: count,
      },
      started_at: startTime,
      completed_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      synced_count: count,
      total: recommendations.length,
      message: `Successfully synced ${count} recommendations`,
    });

  } catch (error) {
    console.error('Sync recommendations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch sync logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabaseAdmin
      .from('compliance_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Fetch sync logs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

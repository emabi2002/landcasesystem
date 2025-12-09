import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create Supabase client with service role for server-side operations
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

// POST: Link recommendation to legal case
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      legal_case_id,
      recommendation_id,
      link_type = 'supporting_reference',
      link_context,
      create_snapshot = false,
      recommendation_data,
    } = body;

    // Validate required fields
    if (!legal_case_id || !recommendation_id) {
      return NextResponse.json(
        { error: 'Missing required fields: legal_case_id and recommendation_id' },
        { status: 400 }
      );
    }

    // Prepare snapshot data if requested
    const snapshot_data = create_snapshot ? recommendation_data : null;

    // Call database function to create link
    const { data, error } = await supabaseAdmin.rpc('link_recommendation_to_case', {
      p_legal_case_id: legal_case_id,
      p_recommendation_id: recommendation_id,
      p_link_type: link_type,
      p_link_context: link_context,
      p_snapshot_data: snapshot_data,
    });

    if (error) {
      console.error('Link creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Optionally notify compliance system (implement if needed)
    // await notifyComplianceSystem(recommendation_id, legal_case_id);

    return NextResponse.json({
      success: true,
      link_id: data,
      message: 'Recommendation linked successfully',
    });

  } catch (error) {
    console.error('Link recommendation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Unlink recommendation from case
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('link_id');
    const reason = searchParams.get('reason');

    if (!linkId) {
      return NextResponse.json(
        { error: 'Missing required parameter: link_id' },
        { status: 400 }
      );
    }

    // Call database function to unlink
    const { data, error } = await supabaseAdmin.rpc('unlink_recommendation_from_case', {
      p_link_id: linkId,
      p_reason: reason,
    });

    if (error) {
      console.error('Unlink error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: data,
      message: 'Recommendation unlinked successfully',
    });

  } catch (error) {
    console.error('Unlink recommendation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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

// GET: Fetch published compliance recommendations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const region = searchParams.get('region');
    const priority = searchParams.get('priority');
    const riskRating = searchParams.get('risk_rating');
    const parcelRef = searchParams.get('parcel_ref');
    const searchQuery = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('materialized_recommendations')
      .select('*', { count: 'exact' })
      .eq('status', 'Published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (region) {
      query = query.eq('region', region);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (riskRating) {
      query = query.eq('risk_rating', riskRating);
    }

    if (parcelRef) {
      query = query.ilike('parcel_ref', `%${parcelRef}%`);
    }

    // Full-text search
    if (searchQuery) {
      query = query.textSearch('search_vector', searchQuery);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching recommendations:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Recommendations fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

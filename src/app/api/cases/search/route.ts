import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const includeAssigned = searchParams.get('includeAssigned') === 'true';
    const includeClosed = searchParams.get('includeClosed') === 'true';

    // Build the query - using correct column names from database
    let dbQuery = supabase
      .from('cases')
      .select(`
        id,
        case_number,
        title,
        case_type,
        status,
        priority,
        description,
        created_at,
        assigned_officer_id,
        case_assignments!left (
          id,
          officer_user_id,
          assigned_at,
          briefing_note,
          status
        )
      `);

    // Filter by search query - using correct column names
    if (query) {
      dbQuery = dbQuery.or(`
        case_number.ilike.%${query}%,
        title.ilike.%${query}%,
        description.ilike.%${query}%,
        case_type.ilike.%${query}%
      `);
    }

    // Filter by status
    if (!includeClosed) {
      dbQuery = dbQuery.neq('status', 'closed');
      dbQuery = dbQuery.neq('status', 'settled');
    }

    // Order by created date
    dbQuery = dbQuery.order('created_at', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error searching cases:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // For each case, get the parties (plaintiff/defendant)
    const casesWithParties = await Promise.all(
      (data || []).map(async (caseItem: any) => {
        // Get parties for this case
        const { data: parties } = await supabase
          .from('parties')
          .select('name, role')
          .eq('case_id', caseItem.id);

        const plaintiff = parties?.find((p: any) => p.role === 'plaintiff');
        const defendant = parties?.find((p: any) => p.role === 'defendant');

        const activeAssignment = caseItem.case_assignments?.find(
          (a: any) => a.status === 'active'
        );

        const isAssigned = !!activeAssignment || !!caseItem.assigned_officer_id;

        // Filter out if already assigned and includeAssigned is false
        if (isAssigned && !includeAssigned) {
          return null;
        }

        return {
          id: caseItem.id,
          case_reference: caseItem.case_number, // Map to expected field name
          case_title: caseItem.title, // Map to expected field name
          case_type: caseItem.case_type,
          status: caseItem.status,
          priority: caseItem.priority,
          plaintiff_name: plaintiff?.name || 'N/A',
          defendant_name: defendant?.name || 'N/A',
          created_at: caseItem.created_at,
          is_assigned: isAssigned,
          assignment: activeAssignment || null,
        };
      })
    );

    const results = casesWithParties.filter(Boolean);

    return NextResponse.json({ cases: results });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

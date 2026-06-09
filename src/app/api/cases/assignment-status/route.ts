import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    // Get active assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('case_assignments')
      .select(`
        id,
        case_id,
        officer_user_id,
        assigned_by_user_id,
        assigned_at,
        briefing_note,
        assignment_notes,
        status
      `)
      .eq('case_id', caseId)
      .eq('status', 'active')
      .is('ended_at', null)
      .single();

    if (assignmentError && assignmentError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      console.error('Error checking assignment:', assignmentError);
      return NextResponse.json(
        { error: assignmentError.message },
        { status: 400 }
      );
    }

    if (!assignment) {
      return NextResponse.json({
        is_assigned: false,
        assignment: null,
      });
    }

    // Get officer details
    const { data: officer, error: officerError } = await supabase.auth.admin.getUserById(
      assignment.officer_user_id
    );

    if (officerError) {
      console.error('Error getting officer:', officerError);
    }

    // Get assigner details
    let assignerEmail = null;
    if (assignment.assigned_by_user_id) {
      const { data: assigner } = await supabase.auth.admin.getUserById(
        assignment.assigned_by_user_id
      );
      assignerEmail = assigner?.user?.email || null;
    }

    return NextResponse.json({
      is_assigned: true,
      assignment: {
        ...assignment,
        officer_email: officer?.user?.email || 'Unknown',
        officer_name: officer?.user?.user_metadata?.full_name || officer?.user?.email,
        assigned_by_email: assignerEmail,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caseId, officerId, briefingNote, assignedBy, allowReassignment, reassignmentReason } = body;

    if (!caseId || !officerId) {
      return NextResponse.json(
        { error: 'Case ID and Officer ID are required' },
        { status: 400 }
      );
    }

    // Check if case exists
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, case_reference, case_title, status')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check if case is closed
    if (caseData.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot assign a closed case' },
        { status: 400 }
      );
    }

    // Check if officer exists
    const { data: officer, error: officerError } = await supabase.auth.admin.getUserById(officerId);

    if (officerError || !officer) {
      return NextResponse.json(
        { error: 'Officer not found' },
        { status: 404 }
      );
    }

    // Check for existing active assignment
    const { data: existingAssignment, error: checkError } = await supabase
      .from('case_assignments')
      .select('id, officer_user_id')
      .eq('case_id', caseId)
      .eq('status', 'active')
      .is('ended_at', null)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing assignment:', checkError);
      return NextResponse.json(
        { error: checkError.message },
        { status: 400 }
      );
    }

    // If already assigned and reassignment not allowed
    if (existingAssignment && !allowReassignment) {
      const { data: currentOfficer } = await supabase.auth.admin.getUserById(
        existingAssignment.officer_user_id
      );

      return NextResponse.json(
        {
          error: 'Case is already assigned',
          assigned_to: currentOfficer?.user?.email || 'Unknown officer',
        },
        { status: 409 }
      );
    }

    // If reassignment, close the old assignment
    if (existingAssignment && allowReassignment) {
      if (!reassignmentReason) {
        return NextResponse.json(
          { error: 'Reassignment reason is required' },
          { status: 400 }
        );
      }

      // Close the old assignment
      const { error: closeError } = await supabase
        .from('case_assignments')
        .update({
          status: 'reassigned',
          ended_at: new Date().toISOString(),
          reassignment_reason: reassignmentReason,
        })
        .eq('id', existingAssignment.id);

      if (closeError) {
        console.error('Error closing old assignment:', closeError);
        return NextResponse.json(
          { error: 'Failed to close previous assignment' },
          { status: 500 }
        );
      }

      // Log reassignment to history
      await supabase
        .from('case_assignment_history')
        .insert({
          case_id: caseId,
          assignment_id: existingAssignment.id,
          action: 'reassigned',
          from_officer_user_id: existingAssignment.officer_user_id,
          to_officer_user_id: officerId,
          performed_by_user_id: assignedBy || null,
          reason: reassignmentReason,
        });
    }

    // Create new assignment
    const { data: newAssignment, error: assignError } = await supabase
      .from('case_assignments')
      .insert({
        case_id: caseId,
        officer_user_id: officerId,
        assigned_by_user_id: assignedBy || null,
        briefing_note: briefingNote || null,
        status: 'active',
      })
      .select()
      .single();

    if (assignError) {
      console.error('Error creating assignment:', assignError);
      return NextResponse.json(
        { error: assignError.message },
        { status: 400 }
      );
    }

    // Log assignment to history
    await supabase
      .from('case_assignment_history')
      .insert({
        case_id: caseId,
        assignment_id: newAssignment.id,
        action: existingAssignment ? 'reassigned' : 'assigned',
        to_officer_user_id: officerId,
        performed_by_user_id: assignedBy || null,
        notes: briefingNote,
      });

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      message: existingAssignment
        ? 'Case reassigned successfully'
        : 'Case assigned successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

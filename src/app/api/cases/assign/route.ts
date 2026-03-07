import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
// Use service role key for full database access
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { case_id, assigned_to, assignment_notes } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is manager or senior legal officer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (profile as any)?.role;
    if (!userRole || !['manager_legal_services', 'senior_legal_officer_litigation', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only Manager/Senior Legal Officers can assign cases' },
        { status: 403 }
      );
    }

    // Get current case
    const { data: currentCase, error: caseError } = await supabase
      .from('cases')
      .select('workflow_state')
      .eq('id', case_id)
      .single();

    if (caseError || !currentCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Validate workflow state
    if (currentCase.workflow_state !== 'REGISTERED') {
      return NextResponse.json(
        { error: 'Case must be in REGISTERED state to assign' },
        { status: 400 }
      );
    }

    // Deactivate previous active delegations
    await supabase
      .from('case_delegations')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: user.id
      })
      .eq('case_id', case_id)
      .eq('is_active', true);

    // Create new delegation
    const { error: delegationError } = await supabase
      .from('case_delegations')
      .insert({
        case_id,
        assigned_to,
        assigned_by: user.id,
        assignment_type: 'initial',
        assignment_notes,
        is_active: true
      });

    if (delegationError) throw delegationError;

    // Update case
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        assigned_officer_id: assigned_to,
        officer_assigned_date: new Date().toISOString().split('T')[0],
        workflow_state: 'ASSIGNED',
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', case_id);

    if (updateError) throw updateError;

    // Create case history entry
    await supabase
      .from('case_history')
      .insert({
        case_id,
        action: 'case_assigned',
        description: `Case assigned to action officer`,
        performed_by: user.id,
        workflow_state_from: 'REGISTERED',
        workflow_state_to: 'ASSIGNED',
        metadata: {
          assigned_to,
          assignment_notes
        }
      });

    // Create notification for assigned officer
    await supabase
      .from('notifications')
      .insert({
        user_id: assigned_to,
        case_id,
        title: 'New Case Assigned',
        message: `You have been assigned a new litigation case. ${assignment_notes || ''}`,
        type: 'case_update'
      });

    return NextResponse.json({
      success: true,
      message: 'Case assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning case:', error);
    return NextResponse.json(
      { error: 'Failed to assign case' },
      { status: 500 }
    );
  }
}

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
    const {
      case_id,
      court_order_date,
      closure_type,
      closure_notes
    } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is para-legal officer or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !['para_legal_officer', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only Para-Legal Officers can close cases' },
        { status: 403 }
      );
    }

    // Verify case is in JUDGMENT_ENTERED state
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('workflow_state, case_number, title')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (caseData.workflow_state !== 'JUDGMENT_ENTERED') {
      return NextResponse.json(
        { error: 'Case must be in JUDGMENT_ENTERED state to close' },
        { status: 400 }
      );
    }

    // Validate closure type
    const validClosureTypes = [
      'dismissed',
      'withdrawn',
      'settled',
      'judicial_review_upheld',
      'judicial_review_dismissed',
      'appeal_allowed',
      'appeal_dismissed',
      'struck_out',
      'other'
    ];

    if (!validClosureTypes.includes(closure_type)) {
      return NextResponse.json({ error: 'Invalid closure type' }, { status: 400 });
    }

    // Update case with closure details
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'closed',
        workflow_state: 'CLOSED',
        court_order_date,
        closure_type,
        closure_date: new Date().toISOString().split('T')[0],
        closure_notes,
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
        action: 'case_closed',
        description: `Case closed: ${closure_type.replace(/_/g, ' ')}`,
        performed_by: user.id,
        workflow_state_from: 'JUDGMENT_ENTERED',
        workflow_state_to: 'CLOSED',
        metadata: {
          closure_type,
          court_order_date,
          closure_notes,
          closed_by_name: profile.full_name
        }
      });

    // Notify assigned officer and managers
    const { data: assignedOfficer } = await supabase
      .from('cases')
      .select('assigned_officer_id')
      .eq('id', case_id)
      .single();

    const usersToNotify = [];
    if (assignedOfficer?.assigned_officer_id) {
      usersToNotify.push(assignedOfficer.assigned_officer_id);
    }

    // Also notify managers
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['manager_legal_services', 'senior_legal_officer_litigation']);

    if (managers && managers.length > 0) {
      usersToNotify.push(...managers.map(m => m.id));
    }

    if (usersToNotify.length > 0) {
      const notifications = usersToNotify.map(userId => ({
        user_id: userId,
        case_id,
        title: 'Case Closed',
        message: `Case ${caseData.case_number} has been closed: ${closure_type.replace(/_/g, ' ')}`,
        type: 'case_update'
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: 'Case closed successfully',
      closure_type
    });

  } catch (error) {
    console.error('Error closing case:', error);
    return NextResponse.json(
      { error: 'Failed to close case' },
      { status: 500 }
    );
  }
}

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
    const { case_id } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is action officer
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const profile = profileData as { role?: string } | null;

    if (!profile || !['action_officer_litigation_lawyer', 'admin'].includes(profile.role || '')) {
      return NextResponse.json(
        { error: 'Only Action Officers can submit for review' },
        { status: 403 }
      );
    }

    // Verify case is in DRAFTING state
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('workflow_state, assigned_officer_id')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseRecord = caseData as { workflow_state?: string; assigned_officer_id?: string };
    if (caseRecord.workflow_state !== 'DRAFTING') {
      return NextResponse.json(
        { error: 'Case must be in DRAFTING state to submit for review' },
        { status: 400 }
      );
    }

    if (caseRecord.assigned_officer_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'You are not assigned to this case' },
        { status: 403 }
      );
    }

    // Check if there are any draft filings
    const { data: draftFilings, error: filingsError } = await supabase
      .from('filings')
      .select('id')
      .eq('case_id', case_id)
      .in('status', ['draft', 'prepared']);

    if (filingsError) throw filingsError;

    if (!draftFilings || draftFilings.length === 0) {
      return NextResponse.json(
        { error: 'No draft filings found to submit' },
        { status: 400 }
      );
    }

    // Update all draft/prepared filings to under_review
    await supabase
      .from('filings')
      .update({ status: 'under_review' })
      .eq('case_id', case_id)
      .in('status', ['draft', 'prepared']);

    // Update case workflow state
    await supabase
      .from('cases')
      .update({
        workflow_state: 'UNDER_REVIEW',
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', case_id);

    // Create case history entry
    await supabase
      .from('case_history')
      .insert({
        case_id,
        action: 'submitted_for_review',
        description: `${draftFilings.length} filing(s) submitted for manager review`,
        performed_by: user.id,
        workflow_state_from: 'DRAFTING',
        workflow_state_to: 'UNDER_REVIEW',
        metadata: {
          filing_count: draftFilings.length
        }
      });

    // Notify managers
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['manager_legal_services', 'senior_legal_officer_litigation']);

    if (managers && managers.length > 0) {
      const notifications = managers.map((manager: { id: string }) => ({
        user_id: manager.id,
        case_id,
        title: 'Filings Ready for Review',
        message: `${draftFilings.length} filing(s) have been submitted for your review`,
        type: 'case_update'
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: 'Filings submitted for review successfully',
      filing_count: draftFilings.length
    });

  } catch (error) {
    console.error('Error submitting for review:', error);
    return NextResponse.json(
      { error: 'Failed to submit for review' },
      { status: 500 }
    );
  }
}

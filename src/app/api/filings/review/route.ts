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
    const { filing_id, decision, comments, changes_required } = body;

    // Validate decision
    if (!['changes_requested', 'approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is manager or senior legal officer
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const profile = profileData as any;

    if (!profile || !['manager_legal_services', 'senior_legal_officer_litigation', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only Manager/Senior Legal Officers can review filings' },
        { status: 403 }
      );
    }

    // Get filing details
    const { data: filing, error: filingError } = await supabase
      .from('filings')
      .select('case_id, filing_title, status, created_by')
      .eq('id', filing_id)
      .single();
    if (filingError || !filing) {
      return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
    }

    if (filing.status !== 'under_review') {
      return NextResponse.json(
        { error: 'Filing is not under review' },
        { status: 400 }
      );
    }

    // Create review record
    const { error: reviewError } = await supabase
      .from('filing_reviews')
      .insert({
        filing_id,
        reviewed_by: user.id,
        decision,
        comments,
        changes_required
      });

    if (reviewError) throw reviewError;

    // Update filing status based on decision
    let newFilingStatus = 'under_review';
    if (decision === 'approved') {
      newFilingStatus = 'approved';
    } else if (decision === 'changes_requested') {
      newFilingStatus = 'changes_requested';
    } else if (decision === 'rejected') {
      newFilingStatus = 'rejected';
    }

    await supabase
      .from('filings')
      .update({ status: newFilingStatus })
      .eq('id', filing_id);

    // Check if this is the last filing to be reviewed for this case
    const { data: pendingFilings } = await supabase
      .from('filings')
      .select('id')
      .eq('case_id', filing.case_id)
      .eq('status', 'under_review');

    let newWorkflowState = null;

    if (!pendingFilings || pendingFilings.length === 0) {
      // All filings reviewed
      if (decision === 'approved') {
        // Check if ALL filings are approved
        const { data: allFilings } = await supabase
          .from('filings')
          .select('status')
          .eq('case_id', filing.case_id);

        const allApproved = allFilings?.every(f => f.status === 'approved');

        if (allApproved) {
          newWorkflowState = 'APPROVED_FOR_FILING';
        }
      } else if (decision === 'changes_requested') {
        newWorkflowState = 'DRAFTING';
      }

      // Update case workflow state if determined
      if (newWorkflowState) {
        await supabase
          .from('cases')
          .update({
            workflow_state: newWorkflowState,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', filing.case_id);

        // Create case history entry
        await supabase
          .from('case_history')
          .insert({
            case_id: filing.case_id,
            action: 'review_completed',
            description: `Filing review ${decision}: ${filing.filing_title}`,
            performed_by: user.id,
            workflow_state_from: 'UNDER_REVIEW',
            workflow_state_to: newWorkflowState,
            metadata: {
              filing_id,
              decision,
              comments
            }
          });
      }
    }

    // Notify action officer
    await supabase
      .from('notifications')
      .insert({
        user_id: filing.created_by,
        case_id: filing.case_id,
        title: `Filing Review: ${decision.replace('_', ' ')}`,
        message: `Your filing "${filing.filing_title}" has been ${decision.replace('_', ' ')}. ${comments || ''}`,
        type: 'case_update'
      });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      new_workflow_state: newWorkflowState
    });

  } catch (error) {
    console.error('Error reviewing filing:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

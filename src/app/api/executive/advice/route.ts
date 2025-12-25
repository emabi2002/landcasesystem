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
      user_id,
      officer_role,
      commentary,
      advice,
      recommendations,
      workflow_stage,
      attachments = [],
      notify_next_officer = true
    } = body;

    console.log(`📝 Executive advice submission from ${officer_role}...`);

    // Get officer details
    const { data: officer, error: officerError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user_id)
      .single();

    if (officerError || !officer) {
      throw new Error('Officer not found');
    }

    // Get case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, case_number, title, court_file_number')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      throw new Error('Case not found');
    }

    // STEP 1: Update workflow tracking
    const { error: workflowError } = await supabase
      .from('executive_workflow')
      .update({
        commentary,
        advice,
        recommendations,
        status: 'completed',
        completed_at: new Date().toISOString(),
        action_taken: `${officer.full_name} provided ${commentary ? 'commentary' : ''}${advice ? ' and advice' : ''}${recommendations ? ' and recommendations' : ''}`
      })
      .eq('case_id', case_id)
      .eq('officer_id', user_id)
      .eq('status', 'pending');

    if (workflowError) {
      console.error('Warning: Could not update workflow:', workflowError);
    } else {
      console.log('✅ Workflow tracking updated');
    }

    // STEP 2: Add case comment with advice
    const commentText = [
      commentary ? `**Commentary:**\n${commentary}` : '',
      advice ? `**Legal Advice:**\n${advice}` : '',
      recommendations ? `**Recommendations:**\n${recommendations}` : ''
    ].filter(Boolean).join('\n\n');

    const { data: comment, error: commentError } = await supabase
      .from('case_comments')
      .insert({
        case_id,
        user_id,
        comment: commentText,
        comment_type: 'advice',
        workflow_stage,
        officer_role,
        attachments,
        visibility: 'executive_only',
        requires_response: officer_role === 'secretary_lands' || officer_role === 'director_legal'
      })
      .select()
      .single();

    if (commentError) {
      throw new Error(`Failed to create comment: ${commentError.message}`);
    }

    console.log('✅ Executive advice recorded as case comment');

    // STEP 3: Add case history entry
    const { error: historyError } = await supabase
      .from('case_history')
      .insert({
        case_id,
        action: `Executive Advice - ${officer.role}`,
        description: `${officer.full_name} (${getRoleName(officer.role)}) provided executive advice and guidance on this case.`,
        metadata: {
          officer_id: user_id,
          officer_role: officer.role,
          officer_name: officer.full_name,
          workflow_stage,
          has_commentary: !!commentary,
          has_advice: !!advice,
          has_recommendations: !!recommendations,
          attachment_count: attachments.length
        }
      });

    if (historyError) {
      console.error('Warning: Could not add history entry:', historyError);
    }

    // STEP 4: Notify next officer in chain if requested
    let nextOfficerNotified = false;
    if (notify_next_officer) {
      const nextRole = getNextOfficerRole(officer_role);
      if (nextRole) {
        // Get next officer
        const { data: nextOfficers, error: nextError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('role', nextRole);

        if (!nextError && nextOfficers && nextOfficers.length > 0) {
          // Notify each officer in the next role
          for (const nextOfficer of nextOfficers) {
            const { error: notifyError } = await supabase
              .from('notifications')
              .insert({
                user_id: nextOfficer.id,
                case_id,
                title: `Executive Guidance Required - ${caseData.case_number}`,
                message: `${officer.full_name} (${getRoleName(officer.role)}) has provided advice on case ${caseData.case_number}.\n\n` +
                        `Your guidance and instructions are now required to proceed with this case.\n\n` +
                        `Case: ${caseData.title}\n` +
                        `Court Reference: ${caseData.court_file_number || 'N/A'}`,
                type: 'case_updated',
                priority: 'high',
                action_required: true,
                action_url: `/cases/${case_id}`,
                workflow_stage: getWorkflowStage(nextRole),
                officer_role: nextRole,
                metadata: {
                  case_id,
                  case_number: caseData.case_number,
                  from_officer: officer.full_name,
                  from_role: officer.role
                }
              });

            if (!notifyError) {
              nextOfficerNotified = true;
              console.log(`✅ Notified ${nextOfficer.full_name} (${nextRole})`);
            }
          }
        }
      }
    }

    // STEP 5: Notify case creator
    const { data: caseCreator, error: creatorError } = await supabase
      .from('cases')
      .select('created_by')
      .eq('id', case_id)
      .single();

    if (!creatorError && caseCreator && caseCreator.created_by !== user_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: caseCreator.created_by,
          case_id,
          title: `Executive Advice Received - ${caseData.case_number}`,
          message: `${officer.full_name} (${getRoleName(officer.role)}) has provided advice on case ${caseData.case_number}.`,
          type: 'comment_added',
          priority: 'medium',
          action_required: false,
          action_url: `/cases/${case_id}`,
          metadata: {
            case_id,
            case_number: caseData.case_number,
            officer: officer.full_name,
            officer_role: officer.role
          }
        });
    }

    console.log('🎉 Executive advice submission complete!');

    return NextResponse.json({
      success: true,
      comment,
      nextOfficerNotified,
      message: 'Executive advice submitted successfully'
    });

  } catch (error) {
    console.error('❌ Error submitting executive advice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper: Get next officer role in workflow chain
function getNextOfficerRole(currentRole: string): string | null {
  const chain: Record<string, string | null> = {
    'secretary_lands': 'director_legal',
    'director_legal': 'manager_legal',
    'manager_legal': null, // Manager assigns to litigation officer (different flow)
  };
  return chain[currentRole] || null;
}

// Helper: Get workflow stage for role
function getWorkflowStage(role: string): string {
  const stages: Record<string, string> = {
    'secretary_lands': 'secretary_review',
    'director_legal': 'director_guidance',
    'manager_legal': 'manager_instruction'
  };
  return stages[role] || 'case_registered';
}

// Helper: Get human-readable role name
function getRoleName(role: string): string {
  const names: Record<string, string> = {
    'secretary_lands': 'Secretary for Lands',
    'director_legal': 'Director, Legal Services',
    'manager_legal': 'Manager, Legal Services',
    'litigation_officer': 'Litigation Officer'
  };
  return names[role] || role;
}

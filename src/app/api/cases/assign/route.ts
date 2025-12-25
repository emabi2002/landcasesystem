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
      assigned_to,
      assigned_by,
      instructions,
      assignment_type = 'primary_officer',
      attached_documents = []
    } = body;

    console.log('📋 Processing case assignment...');

    // Get manager details
    const { data: manager, error: managerError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', assigned_by)
      .single();

    if (managerError || !manager) {
      throw new Error('Manager not found');
    }

    // Verify manager has appropriate role
    if (manager.role !== 'manager_legal' && manager.role !== 'admin') {
      throw new Error('Only Manager Legal can assign cases');
    }

    // Get litigation officer details
    const { data: officer, error: officerError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', assigned_to)
      .single();

    if (officerError || !officer) {
      throw new Error('Litigation officer not found');
    }

    // Get case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      throw new Error('Case not found');
    }

    // STEP 1: Gather all executive commentary/advice from workflow
    console.log('📚 Gathering executive commentary and advice...');

    const { data: workflowData, error: workflowError } = await supabase
      .from('executive_workflow')
      .select('*')
      .eq('case_id', case_id)
      .order('created_at', { ascending: true });

    let secretaryAdvice = '';
    let directorGuidance = '';
    let managerInstructions = '';

    if (workflowData && workflowData.length > 0) {
      for (const workflow of workflowData) {
        if (workflow.officer_role === 'secretary_lands' && workflow.advice) {
          secretaryAdvice = workflow.advice;
        }
        if (workflow.officer_role === 'director_legal' && workflow.advice) {
          directorGuidance = workflow.advice;
        }
        if (workflow.officer_role === 'manager_legal' && workflow.instructions) {
          managerInstructions = workflow.instructions;
        }
      }
    }

    // STEP 2: Compile executive commentary
    const executiveCommentary = [
      secretaryAdvice ? `**Secretary for Lands:**\n${secretaryAdvice}` : '',
      directorGuidance ? `**Director, Legal Services:**\n${directorGuidance}` : '',
      managerInstructions ? `**Manager, Legal Services:**\n${managerInstructions}` : ''
    ].filter(Boolean).join('\n\n---\n\n');

    // STEP 3: Create case assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('case_assignments')
      .insert({
        case_id,
        assigned_to,
        assigned_by,
        assigned_to_name: officer.full_name,
        assigned_by_name: manager.full_name,
        assignment_type,
        instructions,
        executive_commentary: executiveCommentary || 'No executive commentary provided',
        secretary_advice: secretaryAdvice,
        director_guidance: directorGuidance,
        manager_instructions: managerInstructions || instructions,
        attached_documents,
        status: 'pending',
        metadata: {
          case_number: caseData.case_number,
          court_reference: caseData.court_file_number,
          matter_type: caseData.matter_type,
          priority: caseData.priority
        }
      })
      .select()
      .single();

    if (assignmentError) {
      throw new Error(`Failed to create assignment: ${assignmentError.message}`);
    }

    console.log('✅ Case assignment created');

    // STEP 4: Update case assigned_officer_id
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        assigned_officer_id: assigned_to,
        updated_at: new Date().toISOString()
      })
      .eq('id', case_id);

    if (updateError) {
      console.error('Warning: Could not update case assigned officer:', updateError);
    }

    // STEP 5: Update executive workflow to completed
    const { error: workflowUpdateError } = await supabase
      .from('executive_workflow')
      .update({
        stage: 'officer_assigned',
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('case_id', case_id)
      .eq('status', 'pending');

    if (workflowUpdateError) {
      console.error('Warning: Could not update workflow:', workflowUpdateError);
    }

    // STEP 6: Create comprehensive notification for litigation officer
    const notificationMessage = `
You have been assigned to case ${caseData.case_number} by ${manager.full_name}.

**Case Details:**
- Title: ${caseData.title}
- Court Reference: ${caseData.court_file_number || 'N/A'}
- Matter Type: ${caseData.matter_type || 'N/A'}
- Priority: ${caseData.priority || 'medium'}

**Instructions:**
${instructions || 'No specific instructions provided'}

**Executive Context:**
This case has been reviewed by the following executive officers. Their commentary and guidance are attached to this assignment:
${secretaryAdvice ? '✓ Secretary for Lands' : ''}
${directorGuidance ? '✓ Director, Legal Services' : ''}
${managerInstructions ? '✓ Manager, Legal Services' : ''}

Please review all executive commentary before proceeding with this case.
    `.trim();

    const { error: notifyError } = await supabase
      .from('notifications')
      .insert({
        user_id: assigned_to,
        case_id,
        title: `Case Assigned: ${caseData.case_number}`,
        message: notificationMessage,
        type: 'task_assigned',
        priority: caseData.priority === 'urgent' ? 'urgent' : 'high',
        action_required: true,
        action_url: `/cases/${case_id}`,
        workflow_stage: 'officer_assigned',
        officer_role: 'litigation_officer',
        metadata: {
          case_id,
          case_number: caseData.case_number,
          assignment_id: assignment.id,
          assigned_by: manager.full_name,
          has_executive_commentary: !!executiveCommentary,
          attachment_count: attached_documents.length
        }
      });

    if (notifyError) {
      console.error('Warning: Could not send notification:', notifyError);
    } else {
      console.log(`✅ Notification sent to ${officer.full_name}`);
    }

    // STEP 7: Add case history entry
    const { error: historyError } = await supabase
      .from('case_history')
      .insert({
        case_id,
        action: 'Case Assigned',
        description: `Case assigned to ${officer.full_name} (${officer.role}) by ${manager.full_name}`,
        metadata: {
          assignment_id: assignment.id,
          assigned_to: officer.full_name,
          assigned_to_id: assigned_to,
          assigned_by: manager.full_name,
          assigned_by_id: assigned_by,
          assignment_type,
          has_executive_commentary: !!executiveCommentary
        }
      });

    if (historyError) {
      console.error('Warning: Could not add history entry:', historyError);
    }

    // STEP 8: Create a task for the litigation officer
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        case_id,
        title: `Handle Case: ${caseData.case_number}`,
        description: `Case assigned to you by ${manager.full_name}.\n\n` +
                    `Court Reference: ${caseData.court_file_number || 'N/A'}\n` +
                    `Matter Type: ${caseData.matter_type || 'N/A'}\n\n` +
                    `Instructions: ${instructions || 'See case details'}`,
        assigned_to,
        due_date: caseData.returnable_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        priority: caseData.priority || 'medium',
        created_by: assigned_by
      });

    if (taskError) {
      console.error('Warning: Could not create task:', taskError);
    } else {
      console.log('✅ Task created for litigation officer');
    }

    console.log('🎉 Case assignment complete!');

    return NextResponse.json({
      success: true,
      assignment,
      message: `Case successfully assigned to ${officer.full_name}`,
      executiveCommentaryIncluded: !!executiveCommentary
    });

  } catch (error) {
    console.error('❌ Error assigning case:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve assignment details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const case_id = searchParams.get('case_id');
    const user_id = searchParams.get('user_id');

    if (!case_id && !user_id) {
      throw new Error('Either case_id or user_id is required');
    }

    let query = supabase
      .from('case_assignments')
      .select(`
        *,
        cases:case_id (
          case_number,
          title,
          court_file_number,
          matter_type,
          priority,
          status
        ),
        assigned_to_profile:assigned_to (
          full_name,
          email,
          role
        ),
        assigned_by_profile:assigned_by (
          full_name,
          email,
          role
        )
      `);

    if (case_id) {
      query = query.eq('case_id', case_id);
    }

    if (user_id) {
      query = query.eq('assigned_to', user_id);
    }

    const { data: assignments, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || []
    });

  } catch (error) {
    console.error('❌ Error fetching assignments:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

interface Profile {
  role?: string;
}

interface CaseData {
  assigned_officer_id?: string;
  workflow_state?: string;
}

interface ProgressUpdate {
  id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      case_id,
      stage_type,
      stage_title,
      stage_date,
      description,
      outcome,
      next_steps,
      document_url
    } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is action officer or admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const profile = profileData as Profile | null;

    if (!profile || !['action_officer_litigation_lawyer', 'admin'].includes(profile.role || '')) {
      return NextResponse.json(
        { error: 'Only Action Officers can add progress updates' },
        { status: 403 }
      );
    }

    // Verify case exists and user is assigned
    const { data: caseDataRaw, error: caseError } = await supabase
      .from('cases')
      .select('assigned_officer_id, workflow_state')
      .eq('id', case_id)
      .single();
    const caseData = caseDataRaw as CaseData | null;

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (caseData.assigned_officer_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'You are not assigned to this case' },
        { status: 403 }
      );
    }

    // Validate stage type
    const validStageTypes = [
      'leave_granted',
      'directions_hearing',
      'pre_trial_conference',
      'trial',
      'mediation',
      'arbitration',
      'settlement_conference',
      'interlocutory_application',
      'taxation_of_costs',
      'appeal_filed',
      'other'
    ];

    if (!validStageTypes.includes(stage_type)) {
      return NextResponse.json({ error: 'Invalid stage type' }, { status: 400 });
    }

    // Create progress update
    const { data: update, error: updateError } = await supabase
      .from('case_progress_updates')
      .insert({
        case_id,
        stage_type,
        stage_title,
        stage_date,
        description,
        outcome,
        next_steps,
        document_url,
        updated_by: user.id
      })
      .select()
      .single();

    if (updateError) throw updateError;

    const updateRecord = update as ProgressUpdate;

    // Update case workflow state to IN_PROGRESS if currently FILED
    if (caseData.workflow_state === 'FILED') {
      await supabase
        .from('cases')
        .update({
          workflow_state: 'IN_PROGRESS',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', case_id);
    }

    // Create case history entry
    await supabase
      .from('case_history')
      .insert({
        case_id,
        action: 'progress_update_added',
        description: `Progress update: ${stage_title}`,
        performed_by: user.id,
        metadata: {
          update_id: updateRecord.id,
          stage_type,
          stage_title,
          stage_date
        }
      });

    // Create event if stage_date is provided
    if (stage_date) {
      await supabase
        .from('events')
        .insert({
          case_id,
          event_type: 'hearing',
          title: stage_title,
          description,
          event_date: stage_date,
          created_by: user.id
        });
    }

    return NextResponse.json({
      success: true,
      update,
      message: 'Progress update added successfully'
    });

  } catch (error) {
    console.error('Error adding progress update:', error);
    return NextResponse.json(
      { error: 'Failed to add progress update' },
      { status: 500 }
    );
  }
}

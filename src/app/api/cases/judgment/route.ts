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
  full_name?: string;
}

interface CaseData {
  assigned_officer_id?: string;
  workflow_state?: string;
  case_number?: string;
  title?: string;
}

interface Judgment {
  id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      case_id,
      judgment_date,
      judgment_type,
      decision_summary,
      terms_of_orders,
      judges_names,
      judgment_document_url,
      compliance_memo_url,
      compliance_notes
    } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is action officer or admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    const profile = profileData as Profile | null;

    if (!profile || !['action_officer_litigation_lawyer', 'admin'].includes(profile.role || '')) {
      return NextResponse.json(
        { error: 'Only Action Officers can enter judgments' },
        { status: 403 }
      );
    }

    // Verify case exists
    const { data: caseDataRaw, error: caseError } = await supabase
      .from('cases')
      .select('assigned_officer_id, workflow_state, case_number, title')
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

    // Create judgment record
    const { data: judgment, error: judgmentError } = await supabase
      .from('case_judgments')
      .insert({
        case_id,
        judgment_date,
        judgment_type,
        decision_summary,
        terms_of_orders,
        judges_names,
        judgment_document_url,
        compliance_memo_url,
        compliance_memo_uploaded_by: compliance_memo_url ? user.id : null,
        compliance_memo_uploaded_at: compliance_memo_url ? new Date().toISOString() : null,
        compliance_notes,
        entered_by: user.id
      })
      .select()
      .single();

    if (judgmentError) throw judgmentError;

    const judgmentRecord = judgment as Judgment;

    // Update case workflow state
    await supabase
      .from('cases')
      .update({
        workflow_state: 'JUDGMENT_ENTERED',
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', case_id);

    // Create case history entry
    await supabase
      .from('case_history')
      .insert({
        case_id,
        action: 'judgment_entered',
        description: `Judgment entered: ${judgment_type || 'Judgment'}`,
        performed_by: user.id,
        workflow_state_to: 'JUDGMENT_ENTERED',
        metadata: {
          judgment_id: judgmentRecord.id,
          judgment_date,
          judgment_type,
          has_compliance_memo: !!compliance_memo_url
        }
      });

    // Notify managers, senior officers, and para-legal
    const { data: notifyUsers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', [
        'manager_legal_services',
        'senior_legal_officer_litigation',
        'para_legal_officer'
      ]);

    if (notifyUsers && notifyUsers.length > 0) {
      const notifications = notifyUsers.map((usr: { id: string }) => ({
        user_id: usr.id,
        case_id,
        title: 'Judgment Entered',
        message: `Judgment has been entered for case ${caseData.case_number}: ${caseData.title}`,
        type: 'case_update'
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({
      success: true,
      judgment,
      message: 'Judgment entered successfully'
    });

  } catch (error) {
    console.error('Error entering judgment:', error);
    return NextResponse.json(
      { error: 'Failed to enter judgment' },
      { status: 500 }
    );
  }
}

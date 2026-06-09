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
      filing_type,
      filing_title,
      filing_subtype,
      description,
      draft_file_url
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
    const profile = profileData as { role?: string } | null;

    if (!profile || !['action_officer_litigation_lawyer', 'admin'].includes(profile.role || '')) {
      return NextResponse.json(
        { error: 'Only Action Officers can create filings' },
        { status: 403 }
      );
    }

    // Verify case exists and user is assigned
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('assigned_officer_id, workflow_state')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseRecord = caseData as { assigned_officer_id?: string; workflow_state?: string };
    if (caseRecord.assigned_officer_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'You are not assigned to this case' },
        { status: 403 }
      );
    }

    // Create filing
    const { data: filing, error: filingError } = await supabase
      .from('filings')
      .insert({
        case_id,
        filing_type,
        filing_title,
        filing_subtype,
        description,
        draft_file_url,
        draft_uploaded_by: user.id,
        draft_uploaded_at: new Date().toISOString(),
        status: 'draft',
        created_by: user.id
      })
      .select()
      .single();

    if (filingError) throw filingError;

    // Update case workflow state if needed
    if (caseRecord.workflow_state === 'REGISTRATION_COMPLETED') {
      await supabase
        .from('cases')
        .update({
          workflow_state: 'DRAFTING',
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
        action: 'filing_created',
        description: `Draft filing created: ${filing_title} (${filing_type})`,
        performed_by: user.id,
        metadata: {
          filing_id: (filing as { id: string }).id,
          filing_type,
          filing_title
        }
      });

    return NextResponse.json({
      success: true,
      filing
    });

  } catch (error) {
    console.error('Error creating filing:', error);
    return NextResponse.json(
      { error: 'Failed to create filing' },
      { status: 500 }
    );
  }
}

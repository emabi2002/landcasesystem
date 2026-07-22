import { NextRequest, NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

export async function POST(request: NextRequest) {
  try {
    const { user, admin } = await requireModulePermission('filings', 'create');
    const body = await request.json();
    const {
      case_id,
      filing_type,
      filing_title,
      filing_subtype,
      description,
      draft_file_url
    } = body;

    if (typeof case_id !== 'string' || !case_id.trim()) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    if (
      typeof filing_type !== 'string' ||
      !filing_type.trim() ||
      typeof filing_title !== 'string' ||
      !filing_title.trim()
    ) {
      return NextResponse.json(
        { error: 'Filing type and title are required' },
        { status: 400 }
      );
    }

    const { data: caseData, error: caseError } = await admin
      .from('cases' as never)
      .select('assigned_officer_id, workflow_state' as never)
      .eq('id' as never, case_id as never)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseRecord = caseData as { assigned_officer_id?: string; workflow_state?: string };
    const assignedOfficerId = caseRecord.assigned_officer_id;
    if (assignedOfficerId && assignedOfficerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this case' },
        { status: 403 }
      );
    }

    const { data: filing, error: filingError } = await admin
      .from('filings' as never)
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
      } as never)
      .select()
      .single();

    if (filingError) throw filingError;

    if (caseRecord.workflow_state === 'REGISTRATION_COMPLETED') {
      await admin
        .from('cases' as never)
        .update({
          workflow_state: 'DRAFTING',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id' as never, case_id as never);
    }

    await admin
      .from('case_history' as never)
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
      } as never);

    return NextResponse.json({
      success: true,
      filing
    });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Error creating filing');
    return NextResponse.json(
      { error: 'Failed to create filing' },
      { status: 500 }
    );
  }
}

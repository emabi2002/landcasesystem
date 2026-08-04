import { NextRequest, NextResponse } from 'next/server';
import { permissionErrorResponse, requireAnyModulePermission } from '@/lib/auth/require-permission';

export async function POST(request: NextRequest) {
  try {
    const { user, admin } = await requireAnyModulePermission([
      { moduleKey: 'filings', action: 'approve' },
    ]);

    const body = await request.json();
    const { case_id } = body;

    if (typeof case_id !== 'string' || !case_id.trim()) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    const { data: caseData, error: caseError } = await admin
      .from('cases' as never)
      .select('workflow_state, assigned_officer_id' as never)
      .eq('id' as never, case_id as never)
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

    if (caseRecord.assigned_officer_id && caseRecord.assigned_officer_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this case' },
        { status: 403 }
      );
    }

    const { data: draftFilings, error: filingsError } = await admin
      .from('filings' as never)
      .select('id' as never)
      .eq('case_id' as never, case_id as never)
      .in('status' as never, ['draft', 'prepared'] as never);

    if (filingsError) throw filingsError;

    if (!draftFilings || draftFilings.length === 0) {
      return NextResponse.json(
        { error: 'No draft filings found to submit' },
        { status: 400 }
      );
    }

    await admin
      .from('filings' as never)
      .update({ status: 'under_review' } as never)
      .eq('case_id' as never, case_id as never)
      .in('status' as never, ['draft', 'prepared'] as never);

    await admin
      .from('cases' as never)
      .update({
        workflow_state: 'UNDER_REVIEW',
        updated_by: user.id,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id' as never, case_id as never);

    await admin
      .from('case_history' as never)
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
      } as never);

    const { data: managers } = await admin
      .from('profiles' as never)
      .select('id' as never)
      .in('role' as never, ['manager_legal_services', 'senior_legal_officer_litigation'] as never);

    if (managers && managers.length > 0) {
      const notifications = managers.map((manager: { id: string }) => ({
        user_id: manager.id,
        case_id,
        title: 'Filings Ready for Review',
        message: `${draftFilings.length} filing(s) have been submitted for your review`,
        type: 'case_update'
      }));

      await admin
        .from('notifications' as never)
        .insert(notifications as never);
    }

    return NextResponse.json({
      success: true,
      message: 'Filings submitted for review successfully',
      filing_count: draftFilings.length
    });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Error submitting for review');
    return NextResponse.json(
      { error: 'Failed to submit for review' },
      { status: 500 }
    );
  }
}

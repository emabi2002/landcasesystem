import { NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

// POST: Link recommendation to legal case
export async function POST(request: Request) {
  try {
    const { user, admin } = await requireModulePermission('compliance', 'update');
    const body = await request.json();
    const {
      legal_case_id,
      recommendation_id,
      link_type = 'supporting_reference',
      link_context,
      create_snapshot = false,
      recommendation_data,
    } = body;

    if (
      typeof legal_case_id !== 'string' ||
      !legal_case_id.trim() ||
      typeof recommendation_id !== 'string' ||
      !recommendation_id.trim()
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: legal_case_id and recommendation_id' },
        { status: 400 }
      );
    }

    const snapshot_data = create_snapshot ? recommendation_data : null;

    console.info('Compliance link request received', { userId: user.id });
    const { data, error } = await admin.rpc(
      'link_recommendation_to_case' as never,
      {
        p_legal_case_id: legal_case_id,
        p_recommendation_id: recommendation_id,
        p_link_type: link_type,
        p_link_context: link_context,
        p_snapshot_data: snapshot_data,
      } as never
    );

    if (error) {
      console.error('Link creation error');
      return NextResponse.json(
        { error: 'Failed to link recommendation' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      link_id: data,
      message: 'Recommendation linked successfully',
    });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Link recommendation error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Unlink recommendation from case
export async function DELETE(request: Request) {
  try {
    const { user, admin } = await requireModulePermission('compliance', 'update');
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('link_id');
    const reason = searchParams.get('reason');

    if (!linkId) {
      return NextResponse.json(
        { error: 'Missing required parameter: link_id' },
        { status: 400 }
      );
    }

    console.info('Compliance unlink request received', { userId: user.id });
    const { data, error } = await admin.rpc(
      'unlink_recommendation_from_case' as never,
      {
        p_link_id: linkId,
        p_reason: reason,
      } as never
    );

    if (error) {
      console.error('Unlink error');
      return NextResponse.json(
        { error: 'Failed to unlink recommendation' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: data,
      message: 'Recommendation unlinked successfully',
    });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Unlink recommendation error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

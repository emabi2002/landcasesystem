import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requireAuthenticatedUser } from '@/lib/auth/require-user';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { apiFailure, apiSuccess, createRequestId, databaseErrorToHttp } from '@/lib/api/responses';
import { isCaseWorkflowState } from '@/lib/workflow/case-workflow';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> },
) {
  const requestId = createRequestId();

  try {
    await requireAuthenticatedUser();
    const { caseId } = await context.params;
    const body = await request.json().catch(() => null);

    if (!UUID_PATTERN.test(caseId)) {
      return NextResponse.json(apiFailure('VALIDATION_FAILED', 'A valid case ID is required.', requestId), { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(apiFailure('INVALID_JSON', 'Request body must be valid JSON.', requestId), { status: 400 });
    }

    const targetState = clean((body as Record<string, unknown>).target_state);
    if (!targetState || !isCaseWorkflowState(targetState)) {
      return NextResponse.json(
        apiFailure('VALIDATION_FAILED', 'A supported target workflow state is required.', requestId, { target_state: ['Unsupported workflow state.'] }),
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('transition_case_workflow' as never, {
      p_case_id: caseId,
      p_target_state: targetState,
      p_comment: clean((body as Record<string, unknown>).comment),
      p_metadata: (body as Record<string, unknown>).metadata ?? {},
    } as never);

    if (error) throw error;

    return NextResponse.json(apiSuccess(data));
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;

    console.error('Workflow transition failed', { requestId });
    const mapped = databaseErrorToHttp(error);
    return NextResponse.json(apiFailure(mapped.code, mapped.message, requestId), { status: mapped.status });
  }
}

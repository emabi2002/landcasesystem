import { NextRequest, NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { apiFailure, apiSuccess, createRequestId, databaseErrorToHttp } from '@/lib/api/responses';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ filingId: string }> },
) {
  const requestId = createRequestId();

  try {
    await requireModulePermission('filings', 'approve');
    const { filingId } = await context.params;
    const body = await request.json().catch(() => null);

    if (!UUID_PATTERN.test(filingId)) {
      return NextResponse.json(apiFailure('VALIDATION_FAILED', 'A valid filing ID is required.', requestId), { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(apiFailure('INVALID_JSON', 'Request body must be valid JSON.', requestId), { status: 400 });
    }

    const action = clean((body as Record<string, unknown>).action);
    if (!action || !['approve', 'return', 'return_for_correction'].includes(action)) {
      return NextResponse.json(
        apiFailure('VALIDATION_FAILED', 'Review action must be approve or return.', requestId, { action: ['Invalid review action.'] }),
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('review_case_filing' as never, {
      p_filing_id: filingId,
      p_action: action,
      p_comment: clean((body as Record<string, unknown>).comment),
    } as never);

    if (error) throw error;

    return NextResponse.json(apiSuccess(data));
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Filing review failed', { requestId });
    const mapped = databaseErrorToHttp(error);
    return NextResponse.json(apiFailure(mapped.code, mapped.message, requestId), { status: mapped.status });
  }
}

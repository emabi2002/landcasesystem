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
  context: { params: Promise<{ caseId: string }> },
) {
  const requestId = createRequestId();

  try {
    await requireModulePermission('allocation', 'update');
    const { caseId } = await context.params;
    const body = await request.json().catch(() => null);

    if (!UUID_PATTERN.test(caseId)) {
      return NextResponse.json(apiFailure('VALIDATION_FAILED', 'A valid case ID is required.', requestId), { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(apiFailure('INVALID_JSON', 'Request body must be valid JSON.', requestId), { status: 400 });
    }

    const officerId = clean((body as Record<string, unknown>).officer_id ?? (body as Record<string, unknown>).assigned_to);
    if (!officerId || !UUID_PATTERN.test(officerId)) {
      return NextResponse.json(
        apiFailure('VALIDATION_FAILED', 'A valid officer ID is required.', requestId, { officer_id: ['A valid officer ID is required.'] }),
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('assign_case' as never, {
      p_case_id: caseId,
      p_officer_id: officerId,
      p_reason: clean((body as Record<string, unknown>).reason),
      p_instructions: clean((body as Record<string, unknown>).instructions),
    } as never);

    if (error) throw error;

    return NextResponse.json(apiSuccess(data));
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Case assignment failed', { requestId });
    const mapped = databaseErrorToHttp(error);
    return NextResponse.json(apiFailure(mapped.code, mapped.message, requestId), { status: mapped.status });
  }
}

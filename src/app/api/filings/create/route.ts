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

export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  try {
    await requireModulePermission('filings', 'create');
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(apiFailure('INVALID_JSON', 'Request body must be valid JSON.', requestId), { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const caseId = clean(payload.case_id);
    const filingType = clean(payload.filing_type);
    const filingTitle = clean(payload.filing_title ?? payload.title);
    const fieldErrors: Record<string, string[]> = {};

    if (!caseId || !UUID_PATTERN.test(caseId)) fieldErrors.case_id = ['A valid case ID is required.'];
    if (!filingType) fieldErrors.filing_type = ['Filing type is required.'];
    if (!filingTitle) fieldErrors.filing_title = ['Filing title is required.'];

    if (Object.keys(fieldErrors).length > 0 || !caseId) {
      return NextResponse.json(apiFailure('VALIDATION_FAILED', 'Please correct the highlighted fields.', requestId, fieldErrors), { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('create_case_filing' as never, {
      p_case_id: caseId,
      p_filing: {
        filing_type: filingType,
        filing_title: filingTitle,
        filing_subtype: clean(payload.filing_subtype),
        title: filingTitle,
        description: clean(payload.description),
        draft_file_url: clean(payload.draft_file_url),
      },
      p_idempotency_key: clean(payload.idempotency_key),
    } as never);

    if (error) throw error;

    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Error creating filing', { requestId });
    const mapped = databaseErrorToHttp(error);
    return NextResponse.json(apiFailure(mapped.code, mapped.message, requestId), { status: mapped.status });
  }
}

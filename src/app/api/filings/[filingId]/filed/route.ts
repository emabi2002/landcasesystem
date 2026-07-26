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

function isValidDate(value: unknown) {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ filingId: string }> },
) {
  const requestId = createRequestId();

  try {
    await requireModulePermission('filings', 'update');
    const { filingId } = await context.params;
    const body = await request.json().catch(() => null);

    if (!UUID_PATTERN.test(filingId)) {
      return NextResponse.json(apiFailure('VALIDATION_FAILED', 'A valid filing ID is required.', requestId), { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(apiFailure('INVALID_JSON', 'Request body must be valid JSON.', requestId), { status: 400 });
    }

    const courtFilingDate = (body as Record<string, unknown>).court_filing_date;
    if (!isValidDate(courtFilingDate)) {
      return NextResponse.json(
        apiFailure('VALIDATION_FAILED', 'Court filing date is required.', requestId, { court_filing_date: ['A valid court filing date is required.'] }),
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('mark_filing_filed' as never, {
      p_filing_id: filingId,
      p_court_filing_date: courtFilingDate,
      p_court_reference: clean((body as Record<string, unknown>).court_reference),
      p_file_url: clean((body as Record<string, unknown>).file_url),
    } as never);

    if (error) throw error;

    return NextResponse.json(apiSuccess(data));
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Record filed operation failed', { requestId });
    const mapped = databaseErrorToHttp(error);
    return NextResponse.json(apiFailure(mapped.code, mapped.message, requestId), { status: mapped.status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';
import { apiFailure, apiSuccess, createRequestId } from '@/lib/api/responses';

const LOOKUP_TABLES = {
  matter_types: { code: false, description: true },
  case_categories: { code: false, description: true },
  hearing_types: { code: false, description: true },
  order_types: { code: true, description: true },
  lease_types: { code: false, description: true },
  divisions: { code: true, description: true },
  regions: { code: true, description: false },
  lawyers: { code: false, description: false },
  sol_gen_officers: { code: false, description: false },
  case_statuses: { code: true, description: true },
  priority_levels: { code: true, description: true },
  action_officers: { code: false, description: false },
} as const;

type LookupTableName = keyof typeof LOOKUP_TABLES;

function isLookupTableName(value: unknown): value is LookupTableName {
  return typeof value === 'string' && value in LOOKUP_TABLES;
}

function nullableTrim(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function makeLookupCode(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  try {
    const { admin, user } = await requireModulePermission('master_files', 'create');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(apiFailure('INVALID_JSON', 'Request body must be valid JSON.', requestId), { status: 400 });
    }

    const tableName = (body as Record<string, unknown>).tableName;
    if (!isLookupTableName(tableName)) {
      return NextResponse.json(apiFailure('INVALID_LOOKUP_TABLE', 'This lookup table cannot be updated from this form.', requestId), { status: 400 });
    }

    const name = nullableTrim((body as Record<string, unknown>).name);
    if (!name) {
      return NextResponse.json(apiFailure('VALIDATION_FAILED', 'Name is required.', requestId, { name: ['Name is required.'] }), { status: 400 });
    }

    const { count } = await (admin as any)
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    const tableConfig = LOOKUP_TABLES[tableName];
    const payload: Record<string, unknown> = {
      name,
      is_active: true,
      display_order: typeof count === 'number' ? count + 1 : 1,
      created_by: user.id,
    };

    if (tableConfig.code) {
      payload.code = makeLookupCode(name);
    }

    if (tableConfig.description) {
      payload.description = nullableTrim((body as Record<string, unknown>).description);
    }

    const { data, error } = await (admin as any)
      .from(tableName)
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      const isDuplicate = error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate');
      return NextResponse.json(
        apiFailure(
          isDuplicate ? 'DUPLICATE_LOOKUP_ITEM' : 'LOOKUP_CREATE_FAILED',
          isDuplicate ? 'An option with this name or code already exists.' : 'The option could not be saved.',
          requestId,
        ),
        { status: isDuplicate ? 409 : 500 },
      );
    }

    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Master-file lookup create failed', { requestId, error });
    return NextResponse.json(apiFailure('SERVER_ERROR', 'The option could not be saved.', requestId), { status: 500 });
  }
}

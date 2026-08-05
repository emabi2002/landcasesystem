import { NextRequest, NextResponse } from 'next/server';
import { permissionErrorResponse, requireAnyModulePermission } from '@/lib/auth/require-permission';

function cleanText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalise(value: string | null) {
  return value?.trim().toLowerCase() || null;
}

function changedFields(oldData: Record<string, unknown> | null, newData: Record<string, unknown>) {
  if (!oldData) return Object.keys(newData);
  return Object.keys(newData).filter((key) => oldData[key] !== newData[key]);
}

export async function POST(request: NextRequest) {
  try {
    const { user, admin } = await requireAnyModulePermission([
      { moduleKey: 'cases', action: 'create' },
      { moduleKey: 'master_files', action: 'create' },
      { moduleKey: 'master_files', action: 'update' },
    ]);

    const body = await request.json();
    const id = cleanText(body.id);
    const name = cleanText(body.name);
    const description = cleanText(body.description);
    const status = cleanText(body.status) || 'active';

    if (!name) {
      return NextResponse.json({ error: 'Zoning name is required' }, { status: 400 });
    }

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid zoning status' }, { status: 400 });
    }

    const { data: existingRows, error: duplicateError } = await admin
      .from('zoning_types' as never)
      .select('*' as never)
      .limit(5000);

    if (duplicateError) throw duplicateError;

    const duplicate = ((existingRows as any[]) || []).find((row) => {
      if (id && row.id === id) return false;
      return normalise(row.name) === normalise(name);
    });

    if (duplicate) {
      return NextResponse.json({ error: 'A zoning type with this name already exists' }, { status: 409 });
    }

    const payload = {
      name,
      description,
      status,
      is_active: status === 'active',
      updated_by: user.id,
    };

    let oldData: Record<string, unknown> | null = null;
    let zoning: Record<string, unknown> | null = null;

    if (id) {
      const { data: existing, error: existingError } = await admin
        .from('zoning_types' as never)
        .select('*' as never)
        .eq('id' as never, id as never)
        .single();
      if (existingError) throw existingError;
      oldData = existing as Record<string, unknown>;

      const { data, error } = await admin
        .from('zoning_types' as never)
        .update(payload as never)
        .eq('id' as never, id as never)
        .select('*' as never)
        .single();
      if (error) throw error;
      zoning = data as Record<string, unknown>;
    } else {
      const { data, error } = await admin
        .from('zoning_types' as never)
        .insert({ ...payload, created_by: user.id } as never)
        .select('*' as never)
        .single();
      if (error) throw error;
      zoning = data as Record<string, unknown>;
    }

    await admin.from('audit_logs' as never).insert({
      user_id: user.id,
      action: id ? 'update' : 'create',
      table_name: 'zoning_types',
      record_type: 'zoning_types',
      record_id: String(zoning.id),
      old_data: oldData,
      new_data: zoning,
      changed_fields: changedFields(oldData, zoning),
      source_module: 'case_registration',
      reason: id ? 'Zoning lookup updated from case registration' : 'Zoning lookup created from case registration',
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: { zoning_name: zoning.name },
    } as never);

    return NextResponse.json({ zoning });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Zoning upsert failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save zoning type' }, { status: 500 });
  }
}

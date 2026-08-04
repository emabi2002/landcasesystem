import { NextRequest, NextResponse } from 'next/server';
import { permissionErrorResponse, requireAnyModulePermission } from '@/lib/auth/require-permission';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses = new Set(['active', 'inactive', 'leave', 'retired']);

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
      { moduleKey: 'cases', action: 'update' },
      { moduleKey: 'users', action: 'update' },
      { moduleKey: 'groups', action: 'update' },
    ]);

    const body = await request.json();
    const id = cleanText(body.id);
    const name = cleanText(body.name);
    const title = cleanText(body.title);
    const department = cleanText(body.department || body.division);
    const email = cleanText(body.email);
    const phone = cleanText(body.phone);
    const employeeId = cleanText(body.employee_id);
    const officeLocation = cleanText(body.office_location);
    const notes = cleanText(body.notes);
    const profileId = cleanText(body.profile_id);
    const employmentStatus = cleanText(body.employment_status) || 'active';

    if (!name || !title || !department) {
      return NextResponse.json({ error: 'Full name, position/title, and division/section are required' }, { status: 400 });
    }

    if (email && !emailPattern.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    if (!allowedStatuses.has(employmentStatus)) {
      return NextResponse.json({ error: 'Invalid employment status' }, { status: 400 });
    }

    const { data: possibleDuplicates, error: duplicateError } = await admin
      .from('action_officers' as never)
      .select('*' as never)
      .limit(5000);

    if (duplicateError) throw duplicateError;

    const duplicate = ((possibleDuplicates as any[]) || []).find((officer) => {
      if (id && officer.id === id) return false;
      return normalise(officer.name) === normalise(name)
        || (email && normalise(officer.email) === normalise(email))
        || (employeeId && normalise(officer.employee_id) === normalise(employeeId))
        || (profileId && officer.profile_id === profileId);
    });

    if (duplicate) {
      return NextResponse.json({ error: 'An internal officer with the same name, email, employee ID, or linked user already exists' }, { status: 409 });
    }

    const payload = {
      name,
      title,
      department,
      division: department,
      email,
      phone,
      employee_id: employeeId,
      office_location: officeLocation,
      notes,
      profile_id: profileId,
      employment_status: employmentStatus,
      is_active: employmentStatus === 'active',
      updated_by: user.id,
    };

    let oldData: Record<string, unknown> | null = null;
    let officer: Record<string, unknown> | null = null;

    if (id) {
      const { data: existing, error: existingError } = await admin
        .from('action_officers' as never)
        .select('*' as never)
        .eq('id' as never, id as never)
        .single();

      if (existingError) throw existingError;
      oldData = existing as Record<string, unknown>;

      const { data, error } = await admin
        .from('action_officers' as never)
        .update(payload as never)
        .eq('id' as never, id as never)
        .select('*' as never)
        .single();

      if (error) throw error;
      officer = data as Record<string, unknown>;
    } else {
      const { data, error } = await admin
        .from('action_officers' as never)
        .insert({ ...payload, created_by: user.id } as never)
        .select('*' as never)
        .single();

      if (error) throw error;
      officer = data as Record<string, unknown>;
    }

    await admin.from('audit_logs' as never).insert({
      user_id: user.id,
      action: id ? 'update' : 'create',
      table_name: 'action_officers',
      record_type: 'action_officers',
      record_id: String(officer.id),
      old_data: oldData,
      new_data: officer,
      changed_fields: changedFields(oldData, officer),
      source_module: 'case_assignments',
      reason: id ? 'Internal officer updated from assignment picker' : 'Internal officer created from assignment picker',
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        officer_name: officer.name,
        employment_status: officer.employment_status,
      },
    } as never);

    return NextResponse.json({ officer });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Internal officer upsert failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save internal officer' }, { status: 500 });
  }
}

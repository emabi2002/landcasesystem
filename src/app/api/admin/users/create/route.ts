import { NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { user, admin } = await requireModulePermission('users', 'create');
    const body = await request.json();
    const { email, password, full_name, group_id, department } = body;

    if (typeof email !== 'string' || !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (
      typeof full_name !== 'string' ||
      !full_name.trim() ||
      typeof group_id !== 'string' ||
      !group_id.trim()
    ) {
      return NextResponse.json(
        { error: 'Missing required fields. Full name and group are required.' },
        { status: 400 }
      );
    }

    const { data: groupData, error: groupError } = await admin
      .from('groups' as never)
      .select('id, group_name' as never)
      .eq('id' as never, group_id as never)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json({ error: 'Invalid group selected' }, { status: 400 });
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        department: typeof department === 'string' ? department : null,
      },
    });

    if (authError) {
      console.error('Auth user creation failed', { requestedBy: user.id });
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    const { error: groupAssignError } = await admin
      .from('user_groups' as never)
      .insert({
        user_id: authData.user.id,
        group_id,
        assigned_by: user.id,
      } as never);

    if (groupAssignError) {
      console.error('User group assignment failed', { requestedBy: user.id });
      await admin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json({ error: 'Failed to assign user to group' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name: full_name.trim(),
        group: (groupData as { group_name?: string }).group_name,
      },
    });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('User creation failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

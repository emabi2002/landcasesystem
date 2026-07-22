import { NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

export async function GET() {
  try {
    const { admin } = await requireModulePermission('users', 'read');

    const { data: { users }, error: usersError } = await admin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users');
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 400 }
      );
    }

    const usersWithGroups = await Promise.all(
      (users || []).map(async (user) => {
        const { data: userGroupsData } = await admin
          .from('user_groups' as never)
          .select('group_id, groups(*)' as never)
          .eq('user_id' as never, user.id as never);

        const userGroups = ((userGroupsData || []) as any[])
          .map(ug => ug.groups)
          .filter(Boolean);

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
          groups: userGroups,
        };
      })
    );

    return NextResponse.json({ users: usersWithGroups });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Unexpected error fetching users');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user email from query params or use current user
    const searchParams = request.nextUrl.searchParams;
    const targetEmail = searchParams.get('email');

    const targetUserId = targetEmail
      ? (await supabase.auth.admin.getUserByEmail(targetEmail))?.data?.user?.id
      : user.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's groups
    const { data: userGroups, error: groupsError } = await supabase
      .from('user_groups')
      .select(`
        *,
        groups (
          id,
          group_name,
          description
        )
      `)
      .eq('user_id', targetUserId)
      .eq('is_active', true);

    if (groupsError) throw groupsError;

    // Get user's permissions via the database function
    const { data: permissions, error: permError } = await (supabase as any)
      .rpc('get_user_permissions', {
        p_user_id: targetUserId
      });

    if (permError) throw permError;

    // Get user details
    const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);

    return NextResponse.json({
      user: {
        id: userData?.user?.id,
        email: userData?.user?.email,
        created_at: userData?.user?.created_at,
      },
      groups: userGroups?.map((ug: any) => ({
        id: ug.groups?.id,
        name: ug.groups?.group_name,
        description: ug.groups?.description,
        assigned_at: ug.assigned_at,
      })) || [],
      permissions: permissions || [],
      moduleKeys: (permissions || [])
        .filter((p: any) => p.can_read)
        .map((p: any) => p.module_key),
      summary: {
        totalGroups: userGroups?.length || 0,
        totalPermissions: permissions?.length || 0,
        readableModules: (permissions || []).filter((p: any) => p.can_read).length,
        isMultiGroup: (userGroups?.length || 0) > 1,
        hasAdminAccess: userGroups?.some((ug: any) =>
          ['Superadmin', 'Administrator'].includes(ug.groups?.group_name)
        ) || false,
      }
    });

  } catch (error: any) {
    console.error('Error in debug-permissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get permissions' },
      { status: 500 }
    );
  }
}

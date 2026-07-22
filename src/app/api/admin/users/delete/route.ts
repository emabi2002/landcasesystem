import { NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

export async function DELETE(request: Request) {
  try {
    const { user, admin } = await requireModulePermission('users', 'delete');
    const { userId } = await request.json();

    if (typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Users cannot delete their own account' },
        { status: 400 }
      );
    }

    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('User deletion failed', { requestedBy: user.id, targetUserId: userId });
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Unexpected error deleting user');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

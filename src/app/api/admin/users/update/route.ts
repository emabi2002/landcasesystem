import { NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(request: Request) {
  try {
    const { user, admin } = await requireModulePermission('users', 'update');
    const body = await request.json();
    const { userId, email, password, user_metadata } = body;

    if (typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData: {
      email?: string;
      password?: string;
      user_metadata?: Record<string, unknown>;
    } = {};

    if (email !== undefined) {
      if (typeof email !== 'string' || !emailPattern.test(email)) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      updateData.password = password;
    }

    if (user_metadata !== undefined) {
      if (!user_metadata || typeof user_metadata !== 'object' || Array.isArray(user_metadata)) {
        return NextResponse.json(
          { error: 'Invalid user metadata' },
          { status: 400 }
        );
      }
      updateData.user_metadata = user_metadata;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    const { data, error } = await admin.auth.admin.updateUserById(userId, updateData);

    if (error) {
      console.error('User update failed', { requestedBy: user.id, targetUserId: userId });
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user
    });
  } catch (error) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Unexpected error updating user');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

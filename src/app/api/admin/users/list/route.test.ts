import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from './route';

class MockHttpError extends Error {
  constructor(public status: number) {
    super('Mock HTTP error');
  }
}

vi.mock('@/lib/auth/require-permission', () => ({
  requireModulePermission: vi.fn(),
  permissionErrorResponse: (error: unknown) => {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status: unknown }).status)
      : 0;

    if (status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (status === 403) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    return null;
  },
}));

const { requireModulePermission } = await import('@/lib/auth/require-permission');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/admin/users/list', () => {
  it('returns 401 for unauthenticated access', async () => {
    vi.mocked(requireModulePermission).mockRejectedValueOnce(new MockHttpError(401));

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns 403 for authenticated users without permission', async () => {
    vi.mocked(requireModulePermission).mockRejectedValueOnce(new MockHttpError(403));

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('allows authorised administrators to access user-management APIs', async () => {
    vi.mocked(requireModulePermission).mockResolvedValueOnce({
      user: { id: 'admin-user' } as any,
      admin: {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
          },
        },
      } as any,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toEqual([]);
    expect(requireModulePermission).toHaveBeenCalledWith('users', 'read');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from './route';

vi.mock('@/lib/auth/require-permission', () => ({
  requireModulePermission: vi.fn().mockRejectedValue({ status: 401 }),
  permissionErrorResponse: (error: unknown) => {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status: unknown }).status)
        : 0;

    return status === 401
      ? NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      : null;
  },
}));

describe('/api/dashboard/stats', () => {
  it('rejects unauthenticated access', async () => {
    const response = await GET();

    expect(response.status).toBe(401);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';

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

const { requireModulePermission } = await import('@/lib/auth/require-permission');

describe('/api/filings/create', () => {
  it('authenticates using the caller session before filing operations', async () => {
    const request = new NextRequest('http://localhost/api/filings/create', {
      method: 'POST',
      body: JSON.stringify({ case_id: 'case-1' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(requireModulePermission).toHaveBeenCalledWith('filings', 'create');
  });
});

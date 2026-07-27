import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';

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

function jsonRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/master-files', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockAdmin() {
  const inserts: Array<{ tableName: string; payload: Record<string, unknown> }> = [];

  const admin = {
    from: vi.fn((tableName: string) => ({
      select: vi.fn(() => Promise.resolve({ count: 2, error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        inserts.push({ tableName, payload });

        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: `${tableName}-created-id`,
                ...payload,
              },
              error: null,
            })),
          })),
        };
      }),
    })),
  };

  return { admin, inserts };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/admin/master-files', () => {
  it('returns 401 for unauthenticated lookup creation', async () => {
    vi.mocked(requireModulePermission).mockRejectedValueOnce(new MockHttpError(401));

    const response = await POST(jsonRequest({ tableName: 'regions', name: 'Test Southern' }));

    expect(response.status).toBe(401);
  });

  it('rejects unsupported lookup tables', async () => {
    const { admin } = createMockAdmin();
    vi.mocked(requireModulePermission).mockResolvedValueOnce({
      user: { id: 'admin-user' } as any,
      admin: admin as any,
    });

    const response = await POST(jsonRequest({ tableName: 'unknown_table', name: 'Bad Option' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it.each([
    ['regions', 'Test Southern', 'test_southern'],
    ['matter_types', 'Custom Matter Type', undefined],
    ['divisions', 'Custom Division', 'custom_division'],
  ])('creates %s through the shared lookup save route', async (tableName, name, expectedCode) => {
    const { admin, inserts } = createMockAdmin();
    vi.mocked(requireModulePermission).mockResolvedValueOnce({
      user: { id: 'admin-user' } as any,
      admin: admin as any,
    });

    const response = await POST(jsonRequest({ tableName, name, description: 'Created from registration form' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(name);
    expect(body.data.id).toBe(`${tableName}-created-id`);
    expect(requireModulePermission).toHaveBeenCalledWith('master_files', 'create');

    expect(inserts).toHaveLength(1);
    expect(inserts[0].tableName).toBe(tableName);
    expect(inserts[0].payload).toMatchObject({
      name,
      is_active: true,
      display_order: 3,
      created_by: 'admin-user',
    });

    if (expectedCode) {
      expect(inserts[0].payload.code).toBe(expectedCode);
    } else {
      expect(inserts[0].payload).not.toHaveProperty('code');
    }
  });
});

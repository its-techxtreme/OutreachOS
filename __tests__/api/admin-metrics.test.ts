/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';

import { GET } from '@/app/api/admin/metrics/route';
import { Permission, Role } from '@/lib/auth/rbac';

jest.mock('@/lib/auth/require-session', () => ({
  getServerAuthUser: jest.fn(),
  unauthorizedJsonResponse: jest.fn(() =>
    NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ),
}));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { total_leads: 12, leads_today: 2 },
          error: null,
        }),
      }),
    }),
  })),
}));

jest.mock('@/lib/auth/rbac', () => {
  const actual = jest.requireActual('@/lib/auth/rbac');
  return {
    ...actual,
    RBACService: {
      ...actual.RBACService,
      hasPermission: jest.fn(),
    },
  };
});

import { getServerAuthUser } from '@/lib/auth/require-session';
import { RBACService } from '@/lib/auth/rbac';

describe('GET /api/admin/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns 403 when user lacks metrics permission', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.VIEWER] },
    });
    (RBACService.hasPermission as jest.Mock).mockReturnValue(false);

    const response = await GET();
    expect(response.status).toBe(403);
  });

  it('returns health report for authorized admin', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.ADMIN] },
    });
    (RBACService.hasPermission as jest.Mock).mockImplementation(
      (_user: unknown, permission: Permission) =>
        permission === Permission.SYSTEM_METRICS
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.systemHealth).toBeDefined();
    expect(body.systemHealth.period).toBe('Last 1 Hour');
    expect(body.database).toMatchObject({ total_leads: 12 });
    expect(body.timestamp).toBeDefined();
  });

  it('returns null database when lead_stats query throws', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.ADMIN] },
    });
    (RBACService.hasPermission as jest.Mock).mockReturnValue(true);

    const { getSupabaseServer } = await import('@/lib/supabase-server');
    (getSupabaseServer as jest.Mock).mockImplementation(() => {
      throw new Error('db down');
    });

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.database).toBeNull();
  });

  it('returns 500 when auth lookup throws', async () => {
    (getServerAuthUser as jest.Mock).mockRejectedValue(new Error('auth boom'));
    const response = await GET();
    expect(response.status).toBe(500);
  });
});

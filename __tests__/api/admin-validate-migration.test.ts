/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';

import { POST } from '@/app/api/admin/validate-migration/route';
import { Role } from '@/lib/auth/rbac';

jest.mock('@/lib/auth/require-session', () => ({
  getServerAuthUser: jest.fn(),
  unauthorizedJsonResponse: jest.fn(() =>
    NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ),
}));

jest.mock('@/lib/db/migration-validator', () => ({
  ProductionMigrationValidator: jest.fn().mockImplementation(() => ({
    validateMigration: jest.fn(),
  })),
}));

import { getServerAuthUser } from '@/lib/auth/require-session';
import { ProductionMigrationValidator } from '@/lib/db/migration-validator';

describe('POST /api/admin/validate-migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue(null);
    const response = await POST();
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admin roles', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.VIEWER] },
    });
    const response = await POST();
    expect(response.status).toBe(403);
  });

  it('returns 200 when validation succeeds for admin', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.ADMIN] },
    });
    (ProductionMigrationValidator as unknown as jest.Mock).mockImplementation(
      () => ({
        validateMigration: jest.fn().mockResolvedValue({
          success: true,
          errors: [],
          warnings: [],
          statistics: { total_leads: 0 },
        }),
      })
    );

    const response = await POST();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 422 when validation fails', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: ['super_admin'] },
    });
    (ProductionMigrationValidator as unknown as jest.Mock).mockImplementation(
      () => ({
        validateMigration: jest.fn().mockResolvedValue({
          success: false,
          errors: ['Missing tables'],
          warnings: [],
          statistics: {},
        }),
      })
    );

    const response = await POST();
    expect(response.status).toBe(422);
  });

  it('returns 500 when validator throws', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.ADMIN] },
    });
    (ProductionMigrationValidator as unknown as jest.Mock).mockImplementation(
      () => ({
        validateMigration: jest.fn().mockRejectedValue(new Error('boom')),
      })
    );

    const response = await POST();
    expect(response.status).toBe(500);
  });

  it('treats missing roles as non-elevated', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: {},
    });
    const response = await POST();
    expect(response.status).toBe(403);
  });
});

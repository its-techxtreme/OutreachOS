/**
 * @jest-environment node
 */
import { Role } from '@/lib/auth/rbac';

const getUserById = jest.fn();
const updateUserById = jest.fn();
const fromMock = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: () => ({
    auth: {
      admin: {
        getUserById,
        updateUserById,
      },
    },
    from: fromMock,
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

describe('syncPremiumRoleForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserById.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          app_metadata: { roles: [Role.USER] },
        },
      },
      error: null,
    });
    updateUserById.mockResolvedValue({ data: { user: {} }, error: null });
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { status: 'active', manual_override: false },
            error: null,
          }),
        }),
      }),
    });
  });

  it('adds premium when subscription is active', async () => {
    const { syncPremiumRoleForUser } = await import(
      '@/lib/billing/entitlements'
    );
    await syncPremiumRoleForUser('u1');
    expect(updateUserById).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        app_metadata: expect.objectContaining({
          roles: expect.arrayContaining([Role.PREMIUM]),
        }),
      })
    );
  });

  it('removes premium when forceRemove is set', async () => {
    getUserById.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          app_metadata: { roles: [Role.USER, Role.PREMIUM] },
        },
      },
      error: null,
    });
    const { syncPremiumRoleForUser } = await import(
      '@/lib/billing/entitlements'
    );
    await syncPremiumRoleForUser('u1', { forceRemove: true });
    const payload = updateUserById.mock.calls[0][1];
    expect(payload.app_metadata.roles).not.toContain(Role.PREMIUM);
  });
});

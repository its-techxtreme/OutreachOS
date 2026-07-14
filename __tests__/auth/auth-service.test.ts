import { AuthService } from '@/lib/auth/supabase-auth';

describe('AuthService', () => {
  function createMockClient(overrides: Record<string, unknown> = {}) {
    return {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        refreshSession: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
        ...overrides,
      },
    };
  }

  it('signs in successfully and returns auth data', async () => {
    const client = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'u1', email: 'admin@test.com' }, session: {} },
        error: null,
      }),
    });
    const service = new AuthService(client as never);

    const data = await service.signIn('admin@test.com', 'SecurePassword123!');
    expect(data.user?.id).toBe('u1');
  });

  it('throws on failed sign in', async () => {
    const client = createMockClient({
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      }),
    });
    const service = new AuthService(client as never);

    await expect(
      service.signIn('bad@test.com', 'wrongpassword')
    ).rejects.toEqual({ message: 'Invalid login credentials' });
  });

  it('signs out successfully', async () => {
    const client = createMockClient({
      signOut: jest.fn().mockResolvedValue({ error: null }),
    });
    const service = new AuthService(client as never);
    await expect(service.signOut()).resolves.toBeUndefined();
  });

  it('returns null session on getSession error', async () => {
    const client = createMockClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'boom' },
      }),
    });
    const service = new AuthService(client as never);
    await expect(service.getCurrentSession()).resolves.toBeNull();
  });

  it('requests password reset with redirect URL', async () => {
    const resetPasswordForEmail = jest
      .fn()
      .mockResolvedValue({ error: null });
    const client = createMockClient({ resetPasswordForEmail });
    const service = new AuthService(client as never);

    await service.resetPassword('admin@test.com');
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'admin@test.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/auth/callback?next=/auth/reset-password'),
      })
    );
  });

  it('rejects weak passwords on update', async () => {
    const client = createMockClient();
    const service = new AuthService(client as never);

    await expect(service.updatePassword('weak')).rejects.toThrow(
      /at least 12 characters/i
    );
  });

  it('throws on sign out failure', async () => {
    const client = createMockClient({
      signOut: jest.fn().mockResolvedValue({ error: { message: 'logout failed' } }),
    });
    const service = new AuthService(client as never);
    await expect(service.signOut()).rejects.toEqual({ message: 'logout failed' });
  });

  it('returns null user on getUser error', async () => {
    const client = createMockClient({
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'user missing' },
      }),
    });
    const service = new AuthService(client as never);
    await expect(service.getCurrentUser()).resolves.toBeNull();
  });

  it('returns current user when available', async () => {
    const client = createMockClient({
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      }),
    });
    const service = new AuthService(client as never);
    await expect(service.getCurrentUser()).resolves.toEqual({ id: 'u1' });
  });

  it('refreshes session successfully', async () => {
    const client = createMockClient({
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'new' } },
        error: null,
      }),
    });
    const service = new AuthService(client as never);
    await expect(service.refreshSession()).resolves.toEqual({
      access_token: 'new',
    });
  });

  it('throws when refresh session fails', async () => {
    const client = createMockClient({
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'refresh failed' },
      }),
    });
    const service = new AuthService(client as never);
    await expect(service.refreshSession()).rejects.toEqual({
      message: 'refresh failed',
    });
  });

  it('throws when password reset fails', async () => {
    const client = createMockClient({
      resetPasswordForEmail: jest
        .fn()
        .mockResolvedValue({ error: { message: 'reset failed' } }),
    });
    const service = new AuthService(client as never);
    await expect(service.resetPassword('admin@test.com')).rejects.toEqual({
      message: 'reset failed',
    });
  });

  it('throws when password update API fails', async () => {
    const client = createMockClient({
      updateUser: jest
        .fn()
        .mockResolvedValue({ error: { message: 'update failed' } }),
    });
    const service = new AuthService(client as never);
    await expect(
      service.updatePassword('SecureP@ssw0rd2024!')
    ).rejects.toEqual({ message: 'update failed' });
  });

  it('returns session when getSession succeeds', async () => {
    const session = { access_token: 'abc', user: { id: 'u1' } };
    const client = createMockClient({
      getSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
    });
    const service = new AuthService(client as never);
    await expect(service.getCurrentSession()).resolves.toEqual(session);
  });
});

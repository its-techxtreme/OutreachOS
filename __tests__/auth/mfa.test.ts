import { MFAService } from '@/lib/auth/mfa';
import { AuthService } from '@/lib/auth/supabase-auth';

function buildAuthServiceMock(metadata: Record<string, unknown> = {}) {
  const updateUser = jest.fn().mockResolvedValue({ data: {}, error: null });
  const getUser = jest.fn().mockResolvedValue({
    data: {
      user: {
        id: 'user-1',
        user_metadata: metadata,
      },
    },
    error: null,
  });

  const supabase = {
    auth: {
      updateUser,
      getUser,
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  };

  const authService = new AuthService(supabase as never);
  return { authService, updateUser, getUser, supabase };
}

describe('MFAService', () => {
  it('initiates MFA setup and stores secret metadata', async () => {
    const { authService, updateUser } = buildAuthServiceMock();
    const mfa = new MFAService(authService);

    const result = await mfa.enableMFA('user-1');

    expect(result.secret).toBeTruthy();
    expect(result.qrCode.startsWith('data:image')).toBe(true);
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mfa_enabled: false,
          mfa_secret: expect.any(String),
        }),
      })
    );
  });

  it('verifies and enables MFA with a valid TOTP token', async () => {
    const { authService, updateUser } = buildAuthServiceMock({
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_enabled: false,
    });
    const mfa = new MFAService(authService);

    const ok = await mfa.verifyAndEnableMFA('user-1', '123456');
    expect(ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      data: { mfa_enabled: true },
    });
  });

  it('rejects invalid MFA tokens', async () => {
    const { authService } = buildAuthServiceMock({
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_enabled: false,
    });
    const mfa = new MFAService(authService);

    await expect(mfa.verifyAndEnableMFA('user-1', '000000')).resolves.toBe(
      false
    );
  });

  it('allows access when MFA is not enabled', async () => {
    const { authService } = buildAuthServiceMock({ mfa_enabled: false });
    const mfa = new MFAService(authService);
    await expect(mfa.verifyMFA('user-1', '123456')).resolves.toBe(true);
  });

  it('generates backup codes', () => {
    const mfa = new MFAService(buildAuthServiceMock().authService);
    const codes = mfa.generateBackupCodes(4);
    expect(codes).toHaveLength(4);
    expect(codes[0]).toMatch(/^[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it('verifies MFA with backup codes and consumes them', async () => {
    const { authService, updateUser } = buildAuthServiceMock({
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_enabled: true,
      mfa_backup_codes: ['AAAA-BBBB', 'CCCC-DDDD'],
    });
    const mfa = new MFAService(authService);

    await expect(mfa.verifyMFA('user-1', 'AAAA-BBBB')).resolves.toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      data: { mfa_backup_codes: ['CCCC-DDDD'] },
    });
  });

  it('rejects MFA verification when enabled and token is invalid', async () => {
    const { authService } = buildAuthServiceMock({
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_enabled: true,
      mfa_backup_codes: [],
    });
    const mfa = new MFAService(authService);

    await expect(mfa.verifyMFA('user-1', '000000')).resolves.toBe(false);
  });

  it('throws when enabling MFA without prior setup secret', async () => {
    const { authService } = buildAuthServiceMock({});
    const mfa = new MFAService(authService);

    await expect(mfa.verifyAndEnableMFA('user-1', '123456')).rejects.toThrow(
      /not set up/i
    );
  });

  it('throws when MFA setup updateUser fails', async () => {
    const { authService, updateUser } = buildAuthServiceMock();
    updateUser.mockResolvedValueOnce({
      data: {},
      error: { message: 'db down' },
    });
    const mfa = new MFAService(authService);

    await expect(mfa.enableMFA('user-1')).rejects.toThrow(/Failed to setup MFA/);
  });

  it('throws when enabling MFA update fails after valid token', async () => {
    const { authService, updateUser } = buildAuthServiceMock({
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_enabled: false,
    });
    updateUser.mockResolvedValueOnce({
      data: {},
      error: { message: 'cannot enable' },
    });
    const mfa = new MFAService(authService);

    await expect(mfa.verifyAndEnableMFA('user-1', '123456')).rejects.toThrow(
      /Failed to enable MFA/
    );
  });

  it('throws when disable MFA update fails', async () => {
    const { authService, updateUser } = buildAuthServiceMock({
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_enabled: true,
    });
    updateUser.mockResolvedValueOnce({
      data: {},
      error: { message: 'cannot disable' },
    });
    const mfa = new MFAService(authService);

    await expect(mfa.disableMFA('user-1', '123456')).rejects.toThrow(
      /Failed to disable MFA/
    );
  });
});

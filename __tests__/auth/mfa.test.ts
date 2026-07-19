import { MFAService } from '@/lib/auth/mfa';
import { AuthService } from '@/lib/auth/supabase-auth';
import {
  encryptSecret,
  hashBackupCode,
  isEncryptedSecret,
  SECRET_CIPHER_PREFIX,
} from '@/lib/crypto/secrets';

const TEST_ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
});

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
  it('initiates MFA setup and stores encrypted secret metadata', async () => {
    const { authService, updateUser } = buildAuthServiceMock();
    const mfa = new MFAService(authService);

    const result = await mfa.enableMFA('user-1');

    expect(result.secret).toBeTruthy();
    expect(result.qrCode.startsWith('data:image')).toBe(true);
    expect(result.backupCodes.length).toBeGreaterThan(0);
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mfa_enabled: false,
          mfa_secret: expect.stringMatching(
            new RegExp(`^${SECRET_CIPHER_PREFIX}`)
          ),
          mfa_backup_codes: expect.arrayContaining([expect.any(String)]),
        }),
      })
    );
    const storedSecret = (updateUser.mock.calls[0][0] as { data: { mfa_secret: string } })
      .data.mfa_secret;
    expect(isEncryptedSecret(storedSecret)).toBe(true);
    expect(storedSecret).not.toBe(result.secret);
  });

  it('verifies and enables MFA with a valid TOTP token', async () => {
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const { authService, updateUser } = buildAuthServiceMock({
      mfa_secret: encryptSecret(plaintext),
      mfa_enabled: false,
    });
    const mfa = new MFAService(authService);
    jest.spyOn(mfa, 'verifyTOTP').mockReturnValue(true);

    const ok = await mfa.verifyAndEnableMFA('user-1', '123456');
    expect(ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      data: { mfa_enabled: true },
    });
  });

  it('rejects invalid MFA tokens', async () => {
    const { authService } = buildAuthServiceMock({
      mfa_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
      mfa_enabled: false,
    });
    const mfa = new MFAService(authService);
    jest.spyOn(mfa, 'verifyTOTP').mockReturnValue(false);

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

  it('verifies MFA with hashed backup codes and consumes them', async () => {
    const { authService, updateUser } = buildAuthServiceMock({
      mfa_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
      mfa_enabled: true,
      mfa_backup_codes: [hashBackupCode('AAAA-BBBB'), hashBackupCode('CCCC-DDDD')],
    });
    const mfa = new MFAService(authService);

    await expect(mfa.verifyMFA('user-1', 'AAAA-BBBB')).resolves.toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      data: { mfa_backup_codes: [hashBackupCode('CCCC-DDDD')] },
    });
  });

  it('rejects MFA verification when enabled and token is invalid', async () => {
    const { authService } = buildAuthServiceMock({
      mfa_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
      mfa_enabled: true,
      mfa_backup_codes: [],
    });
    const mfa = new MFAService(authService);
    jest.spyOn(mfa, 'verifyTOTP').mockReturnValue(false);

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
      mfa_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
      mfa_enabled: false,
    });
    updateUser.mockResolvedValueOnce({
      data: {},
      error: { message: 'cannot enable' },
    });
    const mfa = new MFAService(authService);
    jest.spyOn(mfa, 'verifyTOTP').mockReturnValue(true);

    await expect(mfa.verifyAndEnableMFA('user-1', '123456')).rejects.toThrow(
      /Failed to enable MFA/
    );
  });

  it('throws when disable MFA update fails', async () => {
    const { authService, updateUser } = buildAuthServiceMock({
      mfa_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
      mfa_enabled: true,
    });
    updateUser.mockResolvedValueOnce({
      data: {},
      error: { message: 'cannot disable' },
    });
    const mfa = new MFAService(authService);
    jest.spyOn(mfa, 'verifyTOTP').mockReturnValue(true);

    await expect(mfa.disableMFA('user-1', '123456')).rejects.toThrow(
      /Failed to disable MFA/
    );
  });
});

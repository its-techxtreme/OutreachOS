import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

import { logger } from '@/lib/logger';
import { SecurityEventType, SecurityLogger } from '@/lib/security-logger';

import { AuthService } from './supabase-auth';

function createTotp(secret: OTPAuth.Secret, label: string) {
  return new OTPAuth.TOTP({
    issuer: 'OutreachOS',
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });
}

export class MFAService {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService ?? new AuthService();
  }

  async enableMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secret.base32;

    const { error } = await this.authService.supabase.auth.updateUser({
      data: {
        mfa_secret: secretBase32,
        mfa_enabled: false,
        mfa_backup_codes: this.generateBackupCodes(),
      },
    });

    if (error) {
      throw new Error(`Failed to setup MFA: ${error.message}`);
    }

    const qrCode = await this.generateQRCode(userId, secretBase32);

    logger.info('MFA setup initiated', { userId });
    SecurityLogger.log(SecurityEventType.MFA_SETUP, { userId });

    return { secret: secretBase32, qrCode };
  }

  async verifyAndEnableMFA(userId: string, token: string): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    const secret = user?.user_metadata?.mfa_secret as string | undefined;

    if (!secret) {
      throw new Error('MFA not set up for this user');
    }

    const isValid = this.verifyTOTP(secret, token);

    if (!isValid) {
      logger.warn('Invalid MFA verification attempt', { userId });
      SecurityLogger.log(SecurityEventType.MFA_FAILURE, { userId });
      return false;
    }

    const { error } = await this.authService.supabase.auth.updateUser({
      data: {
        mfa_enabled: true,
      },
    });

    if (error) {
      throw new Error(`Failed to enable MFA: ${error.message}`);
    }

    logger.info('MFA enabled successfully', { userId });
    SecurityLogger.log(SecurityEventType.MFA_ENABLED, { userId });

    return true;
  }

  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    const enabled = Boolean(user?.user_metadata?.mfa_enabled);
    const secret = user?.user_metadata?.mfa_secret as string | undefined;

    if (!enabled || !secret) {
      return true;
    }

    const backupCodes = (user?.user_metadata?.mfa_backup_codes ?? []) as string[];
    if (backupCodes.includes(token)) {
      const remaining = backupCodes.filter((code) => code !== token);
      await this.authService.supabase.auth.updateUser({
        data: { mfa_backup_codes: remaining },
      });
      return true;
    }

    const isValid = this.verifyTOTP(secret, token);

    if (!isValid) {
      logger.warn('MFA verification failed', { userId });
      SecurityLogger.log(SecurityEventType.MFA_FAILURE, { userId });
    }

    return isValid;
  }

  async disableMFA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyMFA(userId, token);

    if (!isValid) {
      return false;
    }

    const { error } = await this.authService.supabase.auth.updateUser({
      data: {
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: [],
      },
    });

    if (error) {
      throw new Error(`Failed to disable MFA: ${error.message}`);
    }

    logger.info('MFA disabled', { userId });
    SecurityLogger.log(SecurityEventType.MFA_DISABLED, { userId });

    return true;
  }

  generateBackupCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const partA = Math.random().toString(36).slice(2, 6).toUpperCase();
      const partB = Math.random().toString(36).slice(2, 6).toUpperCase();
      codes.push(`${partA}-${partB}`);
    }
    return codes;
  }

  private async generateQRCode(userId: string, secretBase32: string) {
    const secret = OTPAuth.Secret.fromBase32(secretBase32);
    const totp = createTotp(secret, userId);
    return QRCode.toDataURL(totp.toString());
  }

  verifyTOTP(secretBase32: string, token: string, window = 1): boolean {
    const secret = OTPAuth.Secret.fromBase32(secretBase32);
    const totp = createTotp(secret, 'OutreachOS');
    const delta = totp.validate({ token, window });
    return delta !== null;
  }
}

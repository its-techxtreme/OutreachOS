import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { SecurityEventType, SecurityLogger } from '@/lib/security-logger';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import type { Database } from '@/types/database.types';

import { PasswordPolicyService } from './password-policy';

function maskEmail(email: string): string {
  return email.replace(/(.{2}).*@/, '$1***@');
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  );
}

export class AuthService {
  readonly supabase: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.supabase = client ?? createBrowserSupabaseClient();
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Authentication failed', {
        email: maskEmail(email),
        error: error.message,
      });
      SecurityLogger.log(SecurityEventType.AUTH_FAILURE, {
        message: error.message,
        email: maskEmail(email),
      });
      throw error;
    }

    logger.info('User signed in successfully', {
      userId: data.user?.id,
      email: maskEmail(email),
    });
    SecurityLogger.log(SecurityEventType.AUTH_SUCCESS, {
      userId: data.user?.id,
      email: maskEmail(email),
    });

    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      logger.error('Sign out failed', {
        error: error.message,
      });
      throw error;
    }

    logger.info('User signed out successfully');
    SecurityLogger.log(SecurityEventType.AUTH_LOGOUT, {});
  }

  async getCurrentSession(): Promise<Session | null> {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();

    if (error) {
      logger.error('Failed to get session', {
        error: error.message,
      });
      return null;
    }

    return session;
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error) {
      logger.error('Failed to get user', {
        error: error.message,
      });
      return null;
    }

    return user;
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      logger.error('Failed to refresh session', {
        error: error.message,
      });
      throw error;
    }

    return data.session;
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      logger.error('Password reset failed', {
        email: maskEmail(email),
        error: error.message,
      });
      throw error;
    }

    logger.info('Password reset requested', {
      email: maskEmail(email),
    });
  }

  async updatePassword(password: string, userInfo?: { email?: string }) {
    const validation = PasswordPolicyService.validatePassword(
      password,
      userInfo
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }

    const { error } = await this.supabase.auth.updateUser({
      password,
    });

    if (error) {
      logger.error('Password update failed', {
        error: error.message,
      });
      throw error;
    }

    logger.info('Password updated successfully');
    SecurityLogger.log(SecurityEventType.PASSWORD_CHANGED, {});
  }
}

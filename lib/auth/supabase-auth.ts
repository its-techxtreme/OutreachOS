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

/** Supabase auth races / network blips — not actionable app bugs. */
function isBenignSessionError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('refresh result discarded') ||
    normalized.includes('session state changed mid-flight') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('abort') ||
    normalized.includes('auth session missing') ||
    normalized.includes('not authenticated')
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

  async signUp(email: string, password: string) {
    const validation = PasswordPolicyService.validatePassword(password, {
      email,
    });

    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      logger.warn('Sign up failed', {
        email: maskEmail(email),
        error: error.message,
      });
      SecurityLogger.log(SecurityEventType.AUTH_FAILURE, {
        message: error.message,
        email: maskEmail(email),
      });
      throw error;
    }

    logger.info('User signed up', {
      userId: data.user?.id,
      email: maskEmail(email),
      needsEmailConfirmation: !data.session,
    });

    return data;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      logger.warn('Google OAuth start failed', { error: error.message });
      throw error;
    }

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
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        if (isBenignSessionError(error.message)) {
          logger.warn('Session read skipped (transient)', {
            error: error.message,
          });
          return null;
        }
        logger.error('Failed to get session', {
          error: error.message,
        });
        return null;
      }

      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (isBenignSessionError(message)) {
        logger.warn('Session read skipped (transient)', { error: message });
        return null;
      }
      logger.error('Failed to get session', { error: message });
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        if (isBenignSessionError(error.message)) {
          logger.warn('User read skipped (transient)', {
            error: error.message,
          });
          return null;
        }
        logger.error('Failed to get user', {
          error: error.message,
        });
        return null;
      }

      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (isBenignSessionError(message)) {
        logger.warn('User read skipped (transient)', { error: message });
        return null;
      }
      logger.error('Failed to get user', { error: message });
      return null;
    }
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      if (isBenignSessionError(error.message)) {
        logger.warn('Session refresh skipped (transient)', {
          error: error.message,
        });
        return null;
      }
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

import { logger } from '@/lib/logger';
import { SecurityEventType, SecurityLogger } from '@/lib/security-logger';

import { AuthService } from './supabase-auth';

const LAST_ACTIVITY_KEY = 'outreachos_last_activity';

export class SessionSecurityService {
  static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
  static readonly IDLE_TIMEOUT = 2 * 60 * 60 * 1000;
  static readonly REFRESH_THRESHOLD = 5 * 60 * 1000;

  private static activityInterval: ReturnType<typeof setInterval> | null = null;
  private static refreshInterval: ReturnType<typeof setInterval> | null = null;
  private static activityHandlersAttached = false;

  static setupSessionMonitoring(authService?: AuthService) {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const service = authService ?? new AuthService();

    this.setupIdleDetection();
    this.setupTokenRefresh(service);

    this.activityInterval = setInterval(() => {
      void this.checkSessionExpiry(service);
    }, 60_000);

    return () => {
      this.teardown();
    };
  }

  static teardown() {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  static touchActivity() {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  static getLastActivity(): number {
    if (typeof window === 'undefined') {
      return Date.now();
    }
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    return lastActivity ? Number.parseInt(lastActivity, 10) : Date.now();
  }

  static invalidateAllSessions(userId: string) {
    logger.info('Invalidating all sessions for user', { userId });
    SecurityLogger.log(SecurityEventType.SESSION_INVALIDATED, { userId });
  }

  private static async checkSessionExpiry(authService: AuthService) {
    const session = await authService.getCurrentSession();
    if (!session) {
      return;
    }

    const now = Date.now();
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const idleTime = now - this.getLastActivity();

    if (expiresAt > 0 && now > expiresAt + this.SESSION_TIMEOUT) {
      logger.warn('Session expired due to age', {
        userId: session.user.id,
      });
      SecurityLogger.log(SecurityEventType.SESSION_EXPIRED, {
        userId: session.user.id,
        reason: 'age',
      });
      await authService.signOut();
      return;
    }

    if (idleTime > this.IDLE_TIMEOUT) {
      logger.warn('Session expired due to inactivity', {
        userId: session.user.id,
        idleTime,
      });
      SecurityLogger.log(SecurityEventType.SESSION_EXPIRED, {
        userId: session.user.id,
        reason: 'idle',
      });
      await authService.signOut();
    }
  }

  private static setupIdleDetection() {
    if (this.activityHandlersAttached || typeof document === 'undefined') {
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ] as const;

    const updateActivity = () => {
      this.touchActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    this.activityHandlersAttached = true;
    updateActivity();
  }

  private static setupTokenRefresh(authService: AuthService) {
    if (this.refreshInterval) {
      return;
    }

    this.refreshInterval = setInterval(async () => {
      const session = await authService.getCurrentSession();
      if (!session?.expires_at) {
        return;
      }

      const timeUntilExpiry = session.expires_at * 1000 - Date.now();

      if (timeUntilExpiry < this.REFRESH_THRESHOLD) {
        try {
          await authService.refreshSession();
          logger.info('Session token refreshed automatically', {
            userId: session.user.id,
          });
        } catch (error) {
          logger.error('Failed to refresh session token', {
            userId: session.user.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          await authService.signOut();
        }
      }
    }, 60_000);
  }
}

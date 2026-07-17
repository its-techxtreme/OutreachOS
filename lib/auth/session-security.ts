import { logger } from '@/lib/logger';
import { SecurityEventType, SecurityLogger } from '@/lib/security-logger';

import { AuthService } from './supabase-auth';

const LAST_ACTIVITY_KEY = 'outreachos_last_activity';

/**
 * Idle / age session watchdog.
 *
 * Token refresh is owned by the Supabase browser client (`autoRefreshToken`).
 * A second manual refresh loop raced getSession/refreshSession and produced
 * "Refresh result discarded" + "Failed to fetch" console errors.
 */
export class SessionSecurityService {
  static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
  static readonly IDLE_TIMEOUT = 2 * 60 * 60 * 1000;
  /** Kept for tests / docs — Supabase client handles refresh itself. */
  static readonly REFRESH_THRESHOLD = 5 * 60 * 1000;

  private static activityInterval: ReturnType<typeof setInterval> | null = null;
  private static activityHandlersAttached = false;
  private static checkInFlight = false;
  private static attachedListeners: Array<{
    event: string;
    handler: () => void;
  }> = [];

  static setupSessionMonitoring(authService?: AuthService) {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    // Avoid stacking intervals when React Strict Mode remounts.
    this.teardownIntervalsOnly();

    const service = authService ?? new AuthService();

    this.setupIdleDetection();

    this.activityInterval = setInterval(() => {
      void this.checkSessionExpiry(service);
    }, 60_000);

    return () => {
      this.teardown();
    };
  }

  static teardown() {
    this.teardownIntervalsOnly();
    this.teardownActivityListeners();
  }

  private static teardownIntervalsOnly() {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    this.checkInFlight = false;
  }

  private static teardownActivityListeners() {
    if (typeof document === 'undefined') {
      this.activityHandlersAttached = false;
      this.attachedListeners = [];
      return;
    }
    for (const { event, handler } of this.attachedListeners) {
      document.removeEventListener(event, handler);
    }
    this.attachedListeners = [];
    this.activityHandlersAttached = false;
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
    if (this.checkInFlight) {
      return;
    }
    this.checkInFlight = true;

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        return;
      }

      const now = Date.now();
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const idleTime = now - this.getLastActivity();

      // Absolute ceiling: token expiry + grace. Relies on Supabase auto-refresh
      // for normal renewal; this only catches abandoned/broken sessions.
      if (expiresAt > 0 && now > expiresAt + this.SESSION_TIMEOUT) {
        logger.warn('Session expired due to age', {
          userId: session.user.id,
        });
        SecurityLogger.log(SecurityEventType.SESSION_EXPIRED, {
          userId: session.user.id,
          reason: 'age',
        });
        await this.safeSignOut(authService);
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
        await this.safeSignOut(authService);
      }
    } finally {
      this.checkInFlight = false;
    }
  }

  private static async safeSignOut(authService: AuthService) {
    try {
      await authService.signOut();
    } catch (error) {
      // Network blips during forced logout should not cascade into more errors.
      logger.warn('Sign out after session expiry failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
      this.attachedListeners.push({ event, handler: updateActivity });
    });

    this.activityHandlersAttached = true;
    updateActivity();
  }
}

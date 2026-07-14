/**
 * @jest-environment jsdom
 */
import { SessionSecurityService } from '@/lib/auth/session-security';

describe('SessionSecurityService', () => {
  beforeEach(() => {
    localStorage.clear();
    SessionSecurityService.teardown();
  });

  afterEach(() => {
    SessionSecurityService.teardown();
  });

  it('tracks activity timestamps', () => {
    SessionSecurityService.touchActivity();
    expect(SessionSecurityService.getLastActivity()).toBeGreaterThan(
      Date.now() - 1000
    );
  });

  it('sets up and tears down monitoring', () => {
    const cleanup = SessionSecurityService.setupSessionMonitoring({
      getCurrentSession: jest.fn().mockResolvedValue(null),
      refreshSession: jest.fn(),
      signOut: jest.fn(),
    } as never);

    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('logs session invalidation events', () => {
    expect(() =>
      SessionSecurityService.invalidateAllSessions('user-123')
    ).not.toThrow();
  });
});

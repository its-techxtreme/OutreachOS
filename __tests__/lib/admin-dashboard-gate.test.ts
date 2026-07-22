import {
  adminDashboardDenyMessage,
  evaluateAdminDashboardAccess,
} from '@/lib/auth/admin-dashboard-gate';
import { Role } from '@/lib/auth/rbac';

describe('evaluateAdminDashboardAccess', () => {
  const adminEmail = 'admin@example.com';

  beforeEach(() => {
    process.env.ADMIN_GOOGLE_EMAIL = adminEmail;
  });

  afterEach(() => {
    delete process.env.ADMIN_GOOGLE_EMAIL;
    delete process.env.ADMIN_EMAIL;
  });

  it('rejects missing user', () => {
    expect(evaluateAdminDashboardAccess(null)).toEqual({
      ok: false,
      reason: 'unauthenticated',
    });
  });

  it('rejects password-only sessions', () => {
    const result = evaluateAdminDashboardAccess({
      email: adminEmail,
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        roles: [Role.ADMIN],
      },
      identities: [{ provider: 'email' }],
    });
    expect(result).toEqual({ ok: false, reason: 'not_google' });
  });

  it('rejects non-allowlisted Google email', () => {
    const result = evaluateAdminDashboardAccess({
      email: 'other@example.com',
      app_metadata: {
        provider: 'google',
        providers: ['google'],
        roles: [Role.ADMIN],
      },
      identities: [{ provider: 'google' }],
    });
    expect(result).toEqual({ ok: false, reason: 'email' });
  });

  it('rejects Google allowlisted user without admin role', () => {
    const result = evaluateAdminDashboardAccess({
      email: adminEmail,
      app_metadata: {
        provider: 'google',
        providers: ['google'],
        roles: [Role.USER],
      },
      identities: [{ provider: 'google' }],
    });
    expect(result).toEqual({ ok: false, reason: 'role' });
  });

  it('allows Google + allowlist + admin', () => {
    const result = evaluateAdminDashboardAccess({
      email: 'Admin@Example.com',
      app_metadata: {
        provider: 'google',
        providers: ['google', 'email'],
        roles: [Role.ADMIN],
      },
      identities: [{ provider: 'google' }, { provider: 'email' }],
    });
    expect(result).toEqual({ ok: true });
  });

  it('maps deny reasons to messages', () => {
    expect(adminDashboardDenyMessage('not_google')).toMatch(/Google/i);
    expect(adminDashboardDenyMessage('email')).toMatch(/allowlisted/i);
  });
});

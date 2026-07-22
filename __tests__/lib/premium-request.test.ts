import { buildPremiumRequestMailto } from '@/lib/billing/premium-request';
import { PREMIUM_REQUEST_EMAIL, SUPPORT_EMAIL } from '@/lib/brand';

describe('buildPremiumRequestMailto', () => {
  it('emails support Gmail and always includes username', () => {
    expect(PREMIUM_REQUEST_EMAIL).toBe(SUPPORT_EMAIL);
    expect(PREMIUM_REQUEST_EMAIL).toBe('techxtremebuisness@gmail.com');

    const href = buildPremiumRequestMailto({
      currency: 'INR',
      userEmail: 'buyer@example.com',
      userId: 'user-123',
      username: 'buyer',
    });

    expect(href.startsWith(`mailto:${PREMIUM_REQUEST_EMAIL}?`)).toBe(true);
    const decoded = decodeURIComponent(href.replace(/\+/g, ' '));
    expect(decoded).toMatch(/Premium request — @buyer \(INR\)/);
    expect(decoded).toContain('Username: @buyer');
    expect(decoded).toContain('I want to buy the OutreachOS Premium plan');
    expect(decoded).toContain('buyer@example.com');
    expect(decoded).toContain('user-123');
    expect(decoded).toContain('₹1499');
  });

  it('supports USD wording and strips leading @', () => {
    const href = buildPremiumRequestMailto({
      currency: 'USD',
      userEmail: 'a@b.co',
      userId: 'id-1',
      username: '@rio',
    });
    const decoded = decodeURIComponent(href.replace(/\+/g, ' '));
    expect(decoded).toMatch(/\$15/);
    expect(decoded).toContain('USD');
    expect(decoded).toContain('@rio');
    expect(decoded).not.toContain('@@rio');
  });
});

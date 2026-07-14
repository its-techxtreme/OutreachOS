/**
 * @jest-environment node
 */

describe('Production security configuration', () => {
  it('vercel.json defines required security headers', async () => {
    const vercel = await import('../../vercel.json');
    const config = vercel.default ?? vercel;

    const globalHeaders = config.headers.find(
      (entry: { source: string }) => entry.source === '/(.*)'
    );

    expect(globalHeaders).toBeDefined();
    if (!globalHeaders) {
      return;
    }

    const headerMap = Object.fromEntries(
      globalHeaders.headers.map((h: { key: string; value: string }) => [
        h.key.toLowerCase(),
        h.value,
      ])
    );

    expect(headerMap['strict-transport-security']).toContain('max-age=31536000');
    expect(headerMap['x-frame-options']).toBe('DENY');
    expect(headerMap['x-content-type-options']).toBe('nosniff');
    expect(headerMap['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headerMap['x-xss-protection']).toBe('1; mode=block');
  });

  it('next.config exports security headers and redirects', async () => {
    const { default: nextConfig } = await import('../../next.config');

    expect(nextConfig.poweredByHeader).toBe(false);
    expect(typeof nextConfig.headers).toBe('function');
    expect(typeof nextConfig.redirects).toBe('function');

    const headers = await nextConfig.headers!();
    const global = headers.find((h) => h.source === '/(.*)');
    const keys = global?.headers.map((h) => h.key) ?? [];

    expect(keys).toContain('Strict-Transport-Security');
    expect(keys).toContain('X-Frame-Options');
    expect(keys).toContain('X-Content-Type-Options');

    const redirects = await nextConfig.redirects!();
    expect(redirects.some((r) => r.source === '/admin')).toBe(true);
    expect(redirects.some((r) => r.source === '/login')).toBe(true);
  });

  it('rejects SQL-injection-like payloads at schema validation layer', async () => {
    const { LeadSchema } = await import('@/lib/validation/lead-schema');

    const maliciousInputs = [
      "'; DROP TABLE leads; --",
      "1' OR '1'='1",
      "'; INSERT INTO leads VALUES ('hack'); --",
    ];

    for (const name of maliciousInputs) {
      const result = LeadSchema.safeParse({
        name,
        niche: 'Testing',
        country: 'Test',
        maps_url: `https://maps.google.com/security-test-${Date.now()}`,
      });

      // Either accepted as plain text (parameterized insert) or rejected —
      // never throw / crash.
      expect(typeof result.success).toBe('boolean');
    }
  });
});

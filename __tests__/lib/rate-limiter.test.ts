import {
  AdvancedRateLimiter,
  createRateLimiter,
  getImportRateLimiterForUser,
  getRateLimiterForAuth,
  rateLimiters,
} from '@/lib/rate-limiter';
import { RateLimitError } from '@/lib/errors';

describe('createRateLimiter', () => {
  it('allows requests under the configured limit', async () => {
    const limiter = createRateLimiter({ interval: 60_000, uniqueTokenPerInterval: 10 });
    await expect(limiter.check(2, 'test-token')).resolves.toBeUndefined();
    await expect(limiter.check(2, 'test-token')).resolves.toBeUndefined();
  });

  it('rejects requests that exceed the configured limit', async () => {
    const limiter = createRateLimiter({ interval: 60_000, uniqueTokenPerInterval: 10 });
    await limiter.check(1, 'limited-token');
    await expect(limiter.check(1, 'limited-token')).rejects.toThrow(RateLimitError);
  });

  it('tracks limits independently per token', async () => {
    const limiter = createRateLimiter({ interval: 60_000, uniqueTokenPerInterval: 10 });
    await limiter.check(1, 'token-a');
    await expect(limiter.check(1, 'token-b')).resolves.toBeUndefined();
  });

  it('reports inspect results without incrementing usage', async () => {
    const limiter = createRateLimiter({ interval: 60_000, uniqueTokenPerInterval: 10 });
    await limiter.check(1, 'inspect-token');
    const exceeded = await limiter.inspect(1, 'inspect-token');
    expect(exceeded.success).toBe(false);
    expect(exceeded.retryAfter).toBeDefined();
  });
});

describe('AdvancedRateLimiter', () => {
  it('allows requests under the configured limit', async () => {
    const limiter = new AdvancedRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    await expect(limiter.check('client-a')).resolves.toMatchObject({ success: true });
    await expect(limiter.check('client-a')).resolves.toMatchObject({ success: true });
  });

  it('rejects requests above the configured limit', async () => {
    const limiter = new AdvancedRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    await limiter.check('limited-client');
    await expect(limiter.check('limited-client')).rejects.toThrow(RateLimitError);
  });

  it('exposes inspect without incrementing counters', async () => {
    const limiter = new AdvancedRateLimiter({ windowMs: 60_000, maxRequests: 5 });
    await limiter.check('inspect-client');
    const result = await limiter.inspect('inspect-client');
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('supports custom key generators', async () => {
    const limiter = new AdvancedRateLimiter({
      windowMs: 60_000,
      maxRequests: 1,
      keyGenerator: (id) => `custom:${id}`,
    });

    await limiter.check('shared-client');
    await expect(limiter.check('shared-client')).rejects.toThrow(RateLimitError);
  });
});

describe('rateLimiters presets', () => {
  it('defines agent, api, public, and import limiters', () => {
    expect(rateLimiters.agent).toBeInstanceOf(AdvancedRateLimiter);
    expect(rateLimiters.api).toBeInstanceOf(AdvancedRateLimiter);
    expect(rateLimiters.public).toBeInstanceOf(AdvancedRateLimiter);
    expect(rateLimiters.leadImport).toBeInstanceOf(AdvancedRateLimiter);
    expect(rateLimiters.adminLeadImport).toBeInstanceOf(AdvancedRateLimiter);
    expect(rateLimiters.demoLeadImport).toBeInstanceOf(AdvancedRateLimiter);
  });

  it('selects limiter tiers based on auth strategy', () => {
    expect(getRateLimiterForAuth('api-key')).toBe(rateLimiters.api);
    expect(getRateLimiterForAuth('agent-secret')).toBe(rateLimiters.agent);
    expect(getRateLimiterForAuth(undefined)).toBe(rateLimiters.agent);
  });

  it('selects import limiter by role', () => {
    expect(getImportRateLimiterForUser(['demo'])).toBe(
      rateLimiters.demoLeadImport
    );
    expect(getImportRateLimiterForUser(['admin'])).toBe(
      rateLimiters.adminLeadImport
    );
    expect(getImportRateLimiterForUser(['premium'])).toBe(
      rateLimiters.premiumLeadImport
    );
    expect(getImportRateLimiterForUser(['viewer'])).toBe(
      rateLimiters.leadImport
    );
  });
});

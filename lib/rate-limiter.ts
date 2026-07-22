import { LRUCache } from 'lru-cache';

import { RateLimitError } from './errors';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

interface RateLimitEntry {
  requests: number[];
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimiter {
  check: (limit: number, token: string) => Promise<void>;
  inspect: (limit: number, token: string) => Promise<RateLimitResult>;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
}

export function createRateLimiter(options: RateLimitOptions = {}): RateLimiter {
  const tokenCache = new LRUCache<string, number>({
    max: options.uniqueTokenPerInterval ?? 500,
    ttl: options.interval ?? 60_000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const currentUsage = (tokenCache.get(token) ?? 0) + 1;
        tokenCache.set(token, currentUsage);

        if (currentUsage > limit) {
          reject(new RateLimitError());
          return;
        }

        resolve();
      }),
    inspect: async (limit: number, token: string) => {
      const currentUsage = tokenCache.get(token) ?? 0;
      const remaining = Math.max(0, limit - currentUsage);
      const resetTime = Date.now() + (options.interval ?? 60_000);

      return {
        success: currentUsage < limit,
        limit,
        remaining,
        resetTime,
        retryAfter: currentUsage >= limit ? Math.ceil((options.interval ?? 60_000) / 1000) : undefined,
      };
    },
  };
}

export class AdvancedRateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;

  constructor(private config: RateLimitConfig) {
    this.cache = new LRUCache<string, RateLimitEntry>({
      max: 10_000,
      ttl: config.windowMs * 2,
    });
  }

  async check(identifier: string, customLimit?: number): Promise<RateLimitResult> {
    const key = this.config.keyGenerator?.(identifier) ?? identifier;
    const limit = customLimit ?? this.config.maxRequests;
    const window = this.config.windowMs;
    const now = Date.now();

    const existing = this.cache.get(key) ?? { requests: [] };
    existing.requests = existing.requests.filter((timestamp) => now - timestamp < window);
    existing.requests.push(now);

    const isLimited = existing.requests.length > limit;
    this.cache.set(key, existing);

    if (isLimited) {
      throw new RateLimitError(Math.ceil(window / 1000));
    }

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - existing.requests.length),
      resetTime: now + window,
    };
  }

  async inspect(identifier: string, customLimit?: number): Promise<RateLimitResult> {
    const key = this.config.keyGenerator?.(identifier) ?? identifier;
    const limit = customLimit ?? this.config.maxRequests;
    const window = this.config.windowMs;
    const now = Date.now();

    const existing = this.cache.get(key) ?? { requests: [] };
    const activeRequests = existing.requests.filter((timestamp) => now - timestamp < window);

    return {
      success: activeRequests.length < limit,
      limit,
      remaining: Math.max(0, limit - activeRequests.length),
      resetTime: now + window,
      retryAfter:
        activeRequests.length >= limit ? Math.ceil(window / 1000) : undefined,
    };
  }
}

export const agentLeadsRateLimiter = createRateLimiter({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
});

export const rateLimiters = {
  agent: new AdvancedRateLimiter({
    windowMs: 60_000,
    maxRequests: 100,
    keyGenerator: (id) => `agent:${id}`,
  }),
  api: new AdvancedRateLimiter({
    windowMs: 60_000,
    maxRequests: 1000,
    keyGenerator: (id) => `api:${id}`,
  }),
  public: new AdvancedRateLimiter({
    windowMs: 15 * 60_000,
    maxRequests: 100,
    keyGenerator: (id) => `public:${id}`,
  }),
  /** Excel lead imports — free users: 10 / day. */
  leadImport: new AdvancedRateLimiter({
    windowMs: 24 * 60 * 60_000,
    maxRequests: 10,
    keyGenerator: (id) => `lead-import:${id}`,
  }),
  /** Admin / manager Excel imports — 200 files per minute. */
  adminLeadImport: new AdvancedRateLimiter({
    windowMs: 60_000,
    maxRequests: 200,
    keyGenerator: (id) => `lead-import-admin:${id}`,
  }),
  /** Premium — 30 files per hour. */
  premiumLeadImport: new AdvancedRateLimiter({
    windowMs: 60 * 60_000,
    maxRequests: 30,
    keyGenerator: (id) => `lead-import-premium:${id}`,
  }),
  /** Public demo account — 1 upload per hour. */
  demoLeadImport: new AdvancedRateLimiter({
    windowMs: 60 * 60_000,
    maxRequests: 1,
    keyGenerator: (id) => `lead-import-demo:${id}`,
  }),
  /** One-click demo sign-in — abuse protection. */
  demoSignIn: new AdvancedRateLimiter({
    windowMs: 15 * 60_000,
    maxRequests: 20,
    keyGenerator: (id) => `demo-signin:${id}`,
  }),
  /** Dial kit status / scripts / quests mutations. */
  dialKit: new AdvancedRateLimiter({
    windowMs: 60_000,
    maxRequests: 120,
    keyGenerator: (id) => `dial-kit:${id}`,
  }),
  /** Billing checkout creation. */
  billingCheckout: new AdvancedRateLimiter({
    windowMs: 60 * 60_000,
    maxRequests: 20,
    keyGenerator: (id) => `billing-checkout:${id}`,
  }),
};

/** Rolling sum of imported rows within a time window (Premium hourly budget). */
export class RollingSumLimiter {
  private cache: LRUCache<string, { entries: { at: number; amount: number }[] }>;

  constructor(
    private windowMs: number,
    private maxAmount: number
  ) {
    this.cache = new LRUCache({
      max: 10_000,
      ttl: windowMs * 2,
    });
  }

  async consume(identifier: string, amount: number): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.cache.get(identifier) ?? { entries: [] };
    existing.entries = existing.entries.filter(
      (entry) => now - entry.at < this.windowMs
    );
    const used = existing.entries.reduce((sum, entry) => sum + entry.amount, 0);

    if (used + amount > this.maxAmount) {
      throw new RateLimitError(Math.ceil(this.windowMs / 1000));
    }

    existing.entries.push({ at: now, amount });
    this.cache.set(identifier, existing);

    return {
      success: true,
      limit: this.maxAmount,
      remaining: Math.max(0, this.maxAmount - used - amount),
      resetTime: now + this.windowMs,
    };
  }
}

export const premiumImportRowBudget = new RollingSumLimiter(
  60 * 60_000,
  3_000
);

export function getImportRateLimiterForUser(roles: string[]): AdvancedRateLimiter {
  if (roles.includes('demo')) {
    return rateLimiters.demoLeadImport;
  }

  if (
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('manager')
  ) {
    return rateLimiters.adminLeadImport;
  }

  if (roles.includes('premium')) {
    return rateLimiters.premiumLeadImport;
  }

  return rateLimiters.leadImport;
}

export function getRateLimiterForAuth(strategy?: string): AdvancedRateLimiter {
  if (strategy === 'api-key') {
    return rateLimiters.api;
  }

  return rateLimiters.agent;
}

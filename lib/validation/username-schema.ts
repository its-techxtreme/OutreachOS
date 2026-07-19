import { z } from 'zod';

import { sanitizeInput } from '@/lib/sanitize';

/** Reserved handles — case-insensitive after normalize. */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'help',
  'security',
  'moderator',
  'mod',
  'owner',
  'staff',
  'official',
  'demo',
  'demouser',
  'guest',
  'null',
  'undefined',
  'api',
  'www',
  'mail',
  'email',
  'outreachos',
  'techxtreme',
  'techxtremedigital',
  'techxtremedigitalstudio',
  'username',
  'user',
  'me',
  'you',
]);

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/;

export function normalizeUsername(raw: string): string {
  return sanitizeInput(raw).toLowerCase().trim();
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(username));
}

export const UsernameSchema = z
  .string()
  .trim()
  .transform((value) => normalizeUsername(value))
  .pipe(
    z
      .string()
      .min(USERNAME_MIN, `Username must be at least ${USERNAME_MIN} characters`)
      .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
      .regex(
        USERNAME_PATTERN,
        'Username must start with a letter and use only lowercase letters, numbers, and underscores'
      )
      .refine((value) => !value.includes('__'), {
        message: 'Username cannot contain consecutive underscores',
      })
      .refine((value) => !isReservedUsername(value), {
        message: 'That username is reserved',
      })
  );

export type Username = z.infer<typeof UsernameSchema>;

export function parseUsername(raw: unknown): {
  ok: true;
  username: string;
} | {
  ok: false;
  error: string;
} {
  const result = UsernameSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues[0]?.message ?? 'Invalid username',
    };
  }
  return { ok: true, username: result.data };
}

/**
 * Format-only parse for login lookup. Skips reserved-name checks so seeded
 * accounts (e.g. admin handles) can still sign in by username.
 */
export function parseUsernameForLookup(raw: unknown): {
  ok: true;
  username: string;
} | {
  ok: false;
  error: string;
} {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Invalid username' };
  }
  const username = normalizeUsername(raw);
  if (
    username.length < USERNAME_MIN ||
    username.length > USERNAME_MAX ||
    !USERNAME_PATTERN.test(username) ||
    username.includes('__')
  ) {
    return { ok: false, error: 'Invalid username' };
  }
  return { ok: true, username };
}

/** True when the signed-in user still needs to pick a username. */
export function userNeedsUsername(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
} | null | undefined): boolean {
  if (!user) {
    return false;
  }

  const roles = user.app_metadata?.roles;
  if (Array.isArray(roles) && roles.includes('demo')) {
    return false;
  }

  const username = user.user_metadata?.username;
  return typeof username !== 'string' || username.trim().length === 0;
}

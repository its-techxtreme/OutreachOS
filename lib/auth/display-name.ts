import type { User } from '@supabase/supabase-js';

/**
 * Prefer username / display name — never surface full email in chrome UI.
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) {
    return 'Account';
  }

  const meta = user.user_metadata ?? {};
  const username =
    typeof meta.username === 'string' ? meta.username.trim() : '';
  if (username) {
    return username;
  }

  const name = typeof meta.name === 'string' ? meta.name.trim() : '';
  if (name) {
    return name;
  }

  const local = user.email?.split('@')[0]?.trim();
  return local && local.length > 0 ? local : 'Account';
}

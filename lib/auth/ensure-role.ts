import type { User } from '@supabase/supabase-js';

import { Role } from '@/lib/auth/rbac';
import { getSupabaseServer } from '@/lib/supabase-server';

function hasAnyRole(user: User): boolean {
  const roles = user.app_metadata?.roles;
  return Array.isArray(roles) && roles.some((r) => typeof r === 'string');
}

/**
 * Assigns the default `user` role to signups that have no app_metadata.roles yet
 * (email confirm / Google OAuth). Idempotent for admin/demo/existing roles.
 */
export async function ensureDefaultUserRole(user: User): Promise<User> {
  if (hasAnyRole(user)) {
    return user;
  }

  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(user.app_metadata ?? {}),
      roles: [Role.USER],
    },
  });

  if (error || !data.user) {
    return user;
  }

  return data.user;
}

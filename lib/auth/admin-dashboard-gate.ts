import { Role, RBACService } from '@/lib/auth/rbac';

/**
 * Strict gate for /admin/management-dashboard:
 * - Must be signed in
 * - Must have Google identity (not password-only)
 * - Email must match ADMIN_GOOGLE_EMAIL or ADMIN_EMAIL
 * - Must have admin or super_admin role
 */
export type AdminDashboardGateResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'not_google' | 'email' | 'role' };

function allowlistedAdminEmail(): string | null {
  const email =
    process.env.ADMIN_GOOGLE_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    null;
  return email ? email.toLowerCase() : null;
}

function hasGoogleIdentity(user: {
  app_metadata?: { provider?: string; providers?: string[] };
  identities?: Array<{ provider?: string }>;
}): boolean {
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.includes('google')) {
    return true;
  }
  if (user.app_metadata?.provider === 'google') {
    return true;
  }
  if (
    Array.isArray(user.identities) &&
    user.identities.some((identity) => identity.provider === 'google')
  ) {
    return true;
  }
  return false;
}

export function evaluateAdminDashboardAccess(
  user: unknown
): AdminDashboardGateResult {
  if (!user || typeof user !== 'object') {
    return { ok: false, reason: 'unauthenticated' };
  }

  const typed = user as {
    email?: string | null;
    app_metadata?: { provider?: string; providers?: string[]; roles?: unknown };
    identities?: Array<{ provider?: string }>;
  };

  if (!hasGoogleIdentity(typed)) {
    return { ok: false, reason: 'not_google' };
  }

  const allowlist = allowlistedAdminEmail();
  const email = typed.email?.toLowerCase() ?? '';
  if (!allowlist || email !== allowlist) {
    return { ok: false, reason: 'email' };
  }

  const roles = RBACService.getUserRoles(user);
  if (!roles.includes(Role.ADMIN) && !roles.includes(Role.SUPER_ADMIN)) {
    return { ok: false, reason: 'role' };
  }

  return { ok: true };
}

export function adminDashboardDenyMessage(
  reason: Exclude<AdminDashboardGateResult, { ok: true }>['reason']
): string {
  switch (reason) {
    case 'unauthenticated':
      return 'Sign in with Google to continue.';
    case 'not_google':
      return 'This console only accepts Google sign-in with the admin email.';
    case 'email':
      return 'This Google account is not allowlisted for admin management.';
    case 'role':
      return 'Admin role required.';
    default:
      return 'Access denied.';
  }
}

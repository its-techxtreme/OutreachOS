import { Role } from '@/lib/auth/rbac';
import { isActiveSubscriptionStatus } from '@/lib/billing/razorpay';
import { getSupabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

/**
 * Sync auth app_metadata.roles premium flag from subscription status.
 * Service role only.
 */
export async function syncPremiumRoleForUser(
  userId: string,
  options?: { forcePremium?: boolean; forceRemove?: boolean }
): Promise<void> {
  const admin = getSupabaseServer();
  const { data: userData, error: getError } =
    await admin.auth.admin.getUserById(userId);

  if (getError || !userData.user) {
    throw new Error(getError?.message ?? 'User not found');
  }

  const existingRoles = Array.isArray(userData.user.app_metadata?.roles)
    ? (userData.user.app_metadata.roles as string[]).filter(
        (role) => typeof role === 'string'
      )
    : [];

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, manual_override')
    .eq('user_id', userId)
    .maybeSingle();

  const shouldHavePremium =
    options?.forceRemove === true
      ? false
      : options?.forcePremium === true ||
        Boolean(sub?.manual_override) ||
        (sub?.status ? isActiveSubscriptionStatus(sub.status) : false);

  const withoutPremium = existingRoles.filter((role) => role !== Role.PREMIUM);
  const nextRoles = shouldHavePremium
    ? Array.from(new Set([...withoutPremium, Role.PREMIUM]))
    : withoutPremium.length > 0
      ? withoutPremium
      : [Role.USER];

  // Preserve admin/demo roles; never strip them when syncing premium.
  const preserved = existingRoles.filter(
    (role) =>
      role === Role.ADMIN ||
      role === Role.SUPER_ADMIN ||
      role === Role.MANAGER ||
      role === Role.DEMO
  );
  const merged = Array.from(
    new Set([
      ...preserved,
      ...nextRoles.filter(
        (role) =>
          role !== Role.ADMIN &&
          role !== Role.SUPER_ADMIN &&
          role !== Role.MANAGER &&
          role !== Role.DEMO
      ),
    ])
  );

  const { error: updateError } = await admin.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        ...userData.user.app_metadata,
        roles: merged.length > 0 ? merged : [Role.USER],
      },
    }
  );

  if (updateError) {
    logger.error('Failed to sync premium role', {
      userId,
      message: updateError.message,
    });
    throw new Error(updateError.message);
  }
}

export async function upsertSubscriptionFromRazorpay(input: {
  userId: string;
  customerId?: string | null;
  subscriptionId: string;
  currency: 'INR' | 'USD';
  status: string;
  currentPeriodEnd?: string | null;
}): Promise<void> {
  const admin = getSupabaseServer();
  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: input.userId,
      provider: 'razorpay',
      razorpay_customer_id: input.customerId ?? null,
      razorpay_subscription_id: input.subscriptionId,
      plan_currency: input.currency,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new Error(error.message);
  }

  await syncPremiumRoleForUser(input.userId);
}

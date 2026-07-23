import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import { getAccountDisableState } from '@/lib/auth/account-status';
import { requireAdminManagementAccess } from '@/lib/auth/require-admin-management';
import { RBACService, Role } from '@/lib/auth/rbac';
import { isActiveSubscriptionStatus } from '@/lib/billing/razorpay';
import { logger } from '@/lib/logger';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = randomUUID();
  const gate = await requireAdminManagementAccess(requestId);
  if (!gate.ok) {
    return gate.response;
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('perPage') ?? '50') || 50)
    );

    const admin = getSupabaseServer();
    const { data: listed, error: listError } =
      await admin.auth.admin.listUsers({ page, perPage });

    if (listError) {
      throw new Error(listError.message);
    }

    const users = listed.users ?? [];
    const ids = users.map((u) => u.id);

    const [{ data: subs }, { data: leadRows }] = await Promise.all([
      ids.length
        ? admin
            .from('subscriptions')
            .select(
              'user_id, status, plan_currency, current_period_end, razorpay_subscription_id, manual_override'
            )
            .in('user_id', ids)
        : Promise.resolve({ data: [] as never[] }),
      ids.length
        ? admin.from('leads').select('owner_id').in('owner_id', ids)
        : Promise.resolve({ data: [] as never[] }),
    ]);

    const subByUser = new Map(
      (subs ?? []).map((row) => [row.user_id as string, row])
    );
    const leadCountByUser = new Map<string, number>();
    for (const row of leadRows ?? []) {
      const ownerId = row.owner_id as string;
      leadCountByUser.set(ownerId, (leadCountByUser.get(ownerId) ?? 0) + 1);
    }

    const items = users.map((user) => {
      const roles = RBACService.getUserRoles(user);
      const disable = getAccountDisableState(user);
      const sub = subByUser.get(user.id);
      const plan =
        roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN)
          ? 'admin'
          : roles.includes(Role.PREMIUM) ||
              (sub &&
                (isActiveSubscriptionStatus(sub.status) || sub.manual_override))
            ? 'premium'
            : 'free';

      return {
        id: user.id,
        email: user.email ?? null,
        username:
          typeof user.user_metadata?.username === 'string'
            ? user.user_metadata.username
            : null,
        roles,
        createdAt: user.created_at,
        leadCount: leadCountByUser.get(user.id) ?? 0,
        plan,
        providers: Array.isArray(user.app_metadata?.providers)
          ? user.app_metadata.providers
          : user.app_metadata?.provider
            ? [user.app_metadata.provider]
            : [],
        disabled: disable.disabled,
        disabledReason: disable.reason,
        disabledAt: disable.disabledAt,
        subscription: sub
          ? {
              status: sub.status,
              currency: sub.plan_currency,
              currentPeriodEnd: sub.current_period_end,
              subscriptionId: sub.razorpay_subscription_id,
              manualOverride: sub.manual_override,
            }
          : null,
      };
    });

    return withApiHeaders(
      NextResponse.json({
        requestId,
        page,
        perPage,
        total: listed.total ?? items.length,
        users: items,
      }),
      requestId
    );
  } catch (error) {
    logger.error('Admin management list users failed', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to list users', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

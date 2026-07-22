import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { RBACService, Role } from '@/lib/auth/rbac';
import {
  PREMIUM_PRICE_INR,
  PREMIUM_PRICE_USD,
  isActiveSubscriptionStatus,
} from '@/lib/billing/razorpay';
import { PREMIUM_REQUEST_EMAIL } from '@/lib/brand';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const requestId = randomUUID();
  const rawUser = await getServerAuthUser();
  if (!rawUser) {
    return withApiHeaders(unauthorizedJsonResponse(requestId), requestId);
  }

  const user = await ensureDefaultUserRole(rawUser);
  const roles = RBACService.getUserRoles(user);
  const isAdmin =
    roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN);
  const isPremium = roles.includes(Role.PREMIUM);

  const admin = getSupabaseServer();
  const { data: sub } = await admin
    .from('subscriptions')
    .select(
      'status, plan_currency, current_period_end, razorpay_subscription_id, manual_override'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  return withApiHeaders(
    NextResponse.json({
      requestId,
      billingConfigured: false,
      checkoutMode: 'email_request',
      requestEmail: PREMIUM_REQUEST_EMAIL,
      prices: { INR: PREMIUM_PRICE_INR, USD: PREMIUM_PRICE_USD },
      plan: isAdmin ? 'admin' : isPremium ? 'premium' : 'free',
      roles,
      subscription: sub
        ? {
            status: sub.status,
            active: isActiveSubscriptionStatus(sub.status) || sub.manual_override,
            currency: sub.plan_currency,
            currentPeriodEnd: sub.current_period_end,
            subscriptionId: sub.razorpay_subscription_id,
            manualOverride: sub.manual_override,
          }
        : null,
    }),
    requestId
  );
}

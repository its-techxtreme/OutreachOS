import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { syncPremiumRoleForUser } from '@/lib/billing/entitlements';
import {
  getRazorpayClient,
  isRazorpayConfigured,
} from '@/lib/billing/razorpay';
import { logger } from '@/lib/logger';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  const requestId = randomUUID();

  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return withApiHeaders(unauthorizedJsonResponse(requestId), requestId);
    }

    const user = await ensureDefaultUserRole(rawUser);

    if (!isRazorpayConfigured()) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Billing is not configured', requestId },
          { status: 503 }
        ),
        requestId
      );
    }

    const admin = getSupabaseServer();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.razorpay_subscription_id) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'No active subscription to manage', requestId },
          { status: 404 }
        ),
        requestId
      );
    }

    const razorpay = getRazorpayClient();
    await razorpay.subscriptions.cancel(sub.razorpay_subscription_id, false);

    await admin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        manual_override: false,
      })
      .eq('user_id', user.id);

    await syncPremiumRoleForUser(user.id, { forceRemove: true });

    return withApiHeaders(
      NextResponse.json({
        success: true,
        requestId,
        message: 'Subscription cancelled. Premium access ends at period end or immediately per Razorpay.',
      }),
      requestId
    );
  } catch (error) {
    logger.error('Billing portal/cancel failed', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Unable to manage billing', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

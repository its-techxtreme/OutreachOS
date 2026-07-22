import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import { requireAdminManagementAccess } from '@/lib/auth/require-admin-management';
import { syncPremiumRoleForUser } from '@/lib/billing/entitlements';
import {
  getRazorpayClient,
  isRazorpayConfigured,
} from '@/lib/billing/razorpay';
import { logger } from '@/lib/logger';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = randomUUID();
  const gate = await requireAdminManagementAccess(requestId);
  if (!gate.ok) {
    return gate.response;
  }

  const { id: userId } = await context.params;

  try {
    const admin = getSupabaseServer();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('razorpay_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (sub?.razorpay_subscription_id && isRazorpayConfigured()) {
      const razorpay = getRazorpayClient();
      await razorpay.subscriptions.cancel(sub.razorpay_subscription_id, false);
    }

    await admin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        manual_override: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    await syncPremiumRoleForUser(userId, { forceRemove: true });

    return withApiHeaders(
      NextResponse.json({
        success: true,
        requestId,
        message: 'Subscription cancelled',
      }),
      requestId
    );
  } catch (error) {
    logger.error('Admin cancel subscription failed', {
      requestId,
      userId,
      message: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to cancel subscription', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import { syncPremiumRoleForUser } from '@/lib/billing/entitlements';
import { verifyRazorpayWebhookSignature } from '@/lib/billing/razorpay';
import { logger } from '@/lib/logger';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        customer_id?: string;
        current_end?: number;
        notes?: Record<string, string>;
      };
    };
  };
};

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = randomUUID();
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return withApiHeaders(
      NextResponse.json({ error: 'Invalid signature', requestId }, { status: 400 }),
      requestId
    );
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return withApiHeaders(
      NextResponse.json({ error: 'Invalid JSON', requestId }, { status: 400 }),
      requestId
    );
  }

  const eventId =
    request.headers.get('x-razorpay-event-id') ||
    `${payload.event ?? 'unknown'}:${payload.payload?.subscription?.entity?.id ?? randomUUID()}`;

  const admin = getSupabaseServer();
  const { error: claimError } = await admin
    .from('billing_webhook_events')
    .insert({ id: eventId });

  if (claimError) {
    // Already processed (unique violation) — ack to stop retries.
    if (claimError.code === '23505') {
      return withApiHeaders(
        NextResponse.json({ success: true, duplicate: true, requestId }),
        requestId
      );
    }
    logger.error('Webhook idempotency insert failed', {
      requestId,
      message: claimError.message,
    });
  }

  const entity = payload.payload?.subscription?.entity;
  const subscriptionId = entity?.id;
  const status = entity?.status;
  const notes = entity?.notes ?? {};
  const userId = notes.user_id;
  const currency =
    notes.currency === 'USD' || notes.currency === 'INR'
      ? notes.currency
      : 'INR';

  if (!subscriptionId || !status) {
    return withApiHeaders(
      NextResponse.json({ success: true, ignored: true, requestId }),
      requestId
    );
  }

  try {
    let resolvedUserId: string | undefined =
      typeof userId === 'string' && userId.length > 0 ? userId : undefined;
    if (!resolvedUserId) {
      const { data: existing } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('razorpay_subscription_id', subscriptionId)
        .maybeSingle();
      if (typeof existing?.user_id === 'string') {
        resolvedUserId = existing.user_id;
      }
    }

    if (!resolvedUserId) {
      logger.warn('Razorpay webhook missing user_id', {
        requestId,
        subscriptionId,
        event: payload.event,
      });
      return withApiHeaders(
        NextResponse.json({ success: true, unmatched: true, requestId }),
        requestId
      );
    }

    const periodEnd = entity?.current_end
      ? new Date(entity.current_end * 1000).toISOString()
      : null;

    await admin.from('subscriptions').upsert(
      {
        user_id: resolvedUserId,
        provider: 'razorpay',
        razorpay_customer_id: entity?.customer_id ?? null,
        razorpay_subscription_id: subscriptionId,
        plan_currency: currency,
        status,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    await syncPremiumRoleForUser(resolvedUserId);

    return withApiHeaders(
      NextResponse.json({ success: true, requestId }),
      requestId
    );
  } catch (error) {
    logger.error('Razorpay webhook processing failed', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Webhook processing failed', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

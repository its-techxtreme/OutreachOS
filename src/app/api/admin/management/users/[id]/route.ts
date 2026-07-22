import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withApiHeaders } from '@/lib/api-helpers';
import { requireAdminManagementAccess } from '@/lib/auth/require-admin-management';
import { Role } from '@/lib/auth/rbac';
import { syncPremiumRoleForUser } from '@/lib/billing/entitlements';
import { logger } from '@/lib/logger';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const BodySchema = z.object({
  grantPremium: z.boolean().optional(),
  revokePremium: z.boolean().optional(),
  refreshRoles: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = randomUUID();
  const gate = await requireAdminManagementAccess(requestId);
  if (!gate.ok) {
    return gate.response;
  }

  const { id: userId } = await context.params;
  if (!userId) {
    return withApiHeaders(
      NextResponse.json({ error: 'Missing user id', requestId }, { status: 400 }),
      requestId
    );
  }

  try {
    const json: unknown = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json({ error: 'Invalid body', requestId }, { status: 400 }),
        requestId
      );
    }

    const admin = getSupabaseServer();
    const { grantPremium, revokePremium, refreshRoles } = parsed.data;

    if (grantPremium) {
      await admin.from('subscriptions').upsert(
        {
          user_id: userId,
          provider: 'razorpay',
          plan_currency: 'INR',
          status: 'active',
          manual_override: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      await syncPremiumRoleForUser(userId, { forcePremium: true });
    } else if (revokePremium) {
      await admin
        .from('subscriptions')
        .update({
          manual_override: false,
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      await syncPremiumRoleForUser(userId, { forceRemove: true });
    } else if (refreshRoles) {
      await syncPremiumRoleForUser(userId);
    } else {
      return withApiHeaders(
        NextResponse.json(
          { error: 'No action specified', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const { data } = await admin.auth.admin.getUserById(userId);
    return withApiHeaders(
      NextResponse.json({
        success: true,
        requestId,
        roles: data.user
          ? Array.isArray(data.user.app_metadata?.roles)
            ? data.user.app_metadata.roles
            : [Role.USER]
          : [],
      }),
      requestId
    );
  } catch (error) {
    logger.error('Admin management patch user failed', {
      requestId,
      userId,
      message: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to update user', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

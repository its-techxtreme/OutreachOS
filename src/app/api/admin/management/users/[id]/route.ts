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
  disableAccount: z.boolean().optional(),
  enableAccount: z.boolean().optional(),
  disableReason: z.string().trim().min(3).max(500).optional(),
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
    const {
      grantPremium,
      revokePremium,
      refreshRoles,
      disableAccount,
      enableAccount,
      disableReason,
    } = parsed.data;

    if (disableAccount && gate.user.id === userId) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'You cannot disable your own admin account', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

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
    } else if (disableAccount) {
      if (!disableReason) {
        return withApiHeaders(
          NextResponse.json(
            { error: 'A disable reason is required', requestId },
            { status: 400 }
          ),
          requestId
        );
      }

      const { data: existing, error: getError } =
        await admin.auth.admin.getUserById(userId);
      if (getError || !existing.user) {
        throw new Error(getError?.message ?? 'User not found');
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(
        userId,
        {
          app_metadata: {
            ...(existing.user.app_metadata ?? {}),
            account_disabled: true,
            account_disabled_reason: disableReason,
            account_disabled_at: new Date().toISOString(),
            account_disabled_by: gate.user.id,
          },
        }
      );
      if (updateError) {
        throw new Error(updateError.message);
      }

      const { error: revokeError } = await admin.rpc(
        'admin_revoke_user_sessions',
        { target_user_id: userId }
      );
      if (revokeError) {
        logger.warn('Failed to revoke sessions after disable', {
          requestId,
          userId,
          message: revokeError.message,
        });
      }
    } else if (enableAccount) {
      const { data: existing, error: getError } =
        await admin.auth.admin.getUserById(userId);
      if (getError || !existing.user) {
        throw new Error(getError?.message ?? 'User not found');
      }

      const nextMeta = { ...(existing.user.app_metadata ?? {}) };
      delete nextMeta.account_disabled;
      delete nextMeta.account_disabled_reason;
      delete nextMeta.account_disabled_at;
      delete nextMeta.account_disabled_by;

      const { error: updateError } = await admin.auth.admin.updateUserById(
        userId,
        { app_metadata: nextMeta }
      );
      if (updateError) {
        throw new Error(updateError.message);
      }
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

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getClientIp, withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { RBACService, Role } from '@/lib/auth/rbac';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/sanitize';
import { getSupabaseServer } from '@/lib/supabase-server';

const BodySchema = z.object({
  confirmation: z.string().min(1).max(40),
});

const CONFIRMATION_WORD = 'delete';

function isProtectedAccount(user: unknown): boolean {
  return (
    RBACService.isDemoUser(user) ||
    RBACService.hasRole(user, Role.ADMIN) ||
    RBACService.hasRole(user, Role.SUPER_ADMIN)
  );
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);

  try {
    const user = await getServerAuthUser();
    if (!user) {
      return unauthorizedJsonResponse(requestId);
    }

    if (isProtectedAccount(user)) {
      return withApiHeaders(
        NextResponse.json(
          {
            error:
              'This account cannot be self-deleted. Contact support if you need help.',
            requestId,
          },
          { status: 403 }
        ),
        requestId
      );
    }

    const json: unknown = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid request', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const confirmation = sanitizeInput(parsed.data.confirmation).trim();
    if (confirmation !== CONFIRMATION_WORD) {
      return withApiHeaders(
        NextResponse.json(
          {
            error: `Type "${CONFIRMATION_WORD}" exactly to confirm`,
            requestId,
          },
          { status: 400 }
        ),
        requestId
      );
    }

    const admin = getSupabaseServer();

    const { error: leadsError } = await admin
      .from('leads')
      .delete()
      .eq('owner_id', user.id);

    if (leadsError) {
      logger.error('Account delete: leads cleanup failed', {
        requestId,
        userId: user.id,
        error: leadsError.message,
        ip,
      });
      return withApiHeaders(
        NextResponse.json(
          { error: 'Could not delete account data', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(
      user.id
    );

    if (deleteUserError) {
      logger.error('Account delete: auth user removal failed', {
        requestId,
        userId: user.id,
        error: deleteUserError.message,
        ip,
      });
      return withApiHeaders(
        NextResponse.json(
          { error: 'Could not delete account', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    logger.info('Account deleted', { requestId, userId: user.id, ip });

    return withApiHeaders(
      NextResponse.json({ success: true, requestId }),
      requestId
    );
  } catch (error) {
    logger.error('Account delete failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown',
      ip,
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Could not delete account', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

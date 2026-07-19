import { NextResponse } from 'next/server';

import { MFAService } from '@/lib/auth/mfa';
import { AuthService } from '@/lib/auth/supabase-auth';
import { getClientIp, withApiHeaders } from '@/lib/api-helpers';
import { hasEncryptionKeyConfigured } from '@/lib/crypto/secrets';
import { logger } from '@/lib/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, supabase };
  }
  return { user, supabase };
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);

  try {
    const { user, supabase } = await requireUser();
    if (!user) {
      return withApiHeaders(
        NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 }),
        requestId
      );
    }

    if (!hasEncryptionKeyConfigured()) {
      return withApiHeaders(
        NextResponse.json(
          {
            error: 'Server encryption is not configured',
            requestId,
          },
          { status: 503 }
        ),
        requestId
      );
    }

    const mfa = new MFAService(new AuthService(supabase));
    const result = await mfa.enableMFA(user.id);

    return withApiHeaders(
      NextResponse.json({
        success: true,
        requestId,
        qrCode: result.qrCode,
        secret: result.secret,
        backupCodes: result.backupCodes,
      }),
      requestId
    );
  } catch (error) {
    logger.error('MFA setup failed', {
      requestId,
      ip,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to setup MFA', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

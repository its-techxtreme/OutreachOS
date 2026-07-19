import { NextResponse } from 'next/server';
import { z } from 'zod';

import { MFAService } from '@/lib/auth/mfa';
import { AuthService } from '@/lib/auth/supabase-auth';
import { getClientIp, withApiHeaders } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  token: z.string().min(6).max(64),
});

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return withApiHeaders(
        NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 }),
        requestId
      );
    }

    const json: unknown = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json({ error: 'Invalid token', requestId }, { status: 400 }),
        requestId
      );
    }

    const mfa = new MFAService(new AuthService(supabase));
    const ok = await mfa.disableMFA(user.id, parsed.data.token);

    return withApiHeaders(
      NextResponse.json({ success: ok, requestId }),
      requestId
    );
  } catch (error) {
    logger.error('MFA disable failed', {
      requestId,
      ip,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to disable MFA', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

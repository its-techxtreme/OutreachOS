import { NextResponse } from 'next/server';

import { getClientIp, withApiHeaders } from '@/lib/api-helpers';
import { RateLimitError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limiter';
import { SecurityEventType, SecurityLogger } from '@/lib/security-logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);

  try {
    await rateLimiters.demoSignIn.check(ip);
  } catch (error) {
    if (error instanceof RateLimitError) {
      SecurityLogger.log(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        { requestId, path: '/api/auth/demo', ip },
        ip
      );
      return withApiHeaders(
        NextResponse.json(
          { error: 'Too many demo sign-in attempts. Try again later.', requestId },
          {
            status: 429,
            headers: error.retryAfter
              ? { 'Retry-After': String(error.retryAfter) }
              : undefined,
          }
        ),
        requestId
      );
    }
    throw error;
  }

  const email = process.env.DEMO_USER_EMAIL?.trim();
  const password = process.env.DEMO_USER_PASSWORD?.trim();

  if (!email || !password) {
    logger.error('Demo sign-in misconfigured — missing DEMO_USER_EMAIL/PASSWORD');
    return withApiHeaders(
      NextResponse.json(
        { error: 'Demo account is not configured', requestId },
        { status: 503 }
      ),
      requestId
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      SecurityLogger.log(
        SecurityEventType.AUTH_FAILURE,
        { requestId, path: '/api/auth/demo', message: error?.message, ip },
        ip
      );
      return withApiHeaders(
        NextResponse.json(
          { error: 'Unable to sign in to demo', requestId },
          { status: 401 }
        ),
        requestId
      );
    }

    SecurityLogger.log(
      SecurityEventType.AUTH_SUCCESS,
      { requestId, path: '/api/auth/demo', userId: data.user?.id, ip },
      ip
    );

    return withApiHeaders(
      NextResponse.json({
        success: true,
        requestId,
        redirectTo: '/dashboard',
      }),
      requestId
    );
  } catch (error) {
    logger.error('Demo sign-in failed', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

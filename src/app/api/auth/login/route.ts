import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getClientIp, withApiHeaders } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/sanitize';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import {
  parseUsernameForLookup,
  userNeedsUsername,
} from '@/lib/validation/username-schema';

const BodySchema = z.object({
  identifier: z.string().min(1).max(254),
  password: z.string().min(1).max(256),
});

function looksLikeEmail(value: string): boolean {
  return value.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const json: unknown = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid credentials', requestId },
          { status: 401 }
        ),
        requestId
      );
    }

    const identifier = sanitizeInput(parsed.data.identifier).trim();
    const password = parsed.data.password;

    let email = identifier.toLowerCase();

    if (!looksLikeEmail(identifier)) {
      const usernameParsed = parseUsernameForLookup(identifier);
      if (!usernameParsed.ok) {
        return withApiHeaders(
          NextResponse.json(
            { error: 'Invalid credentials', requestId },
            { status: 401 }
          ),
          requestId
        );
      }

      const admin = getSupabaseServer();
      const { data: lookedUp, error: lookupError } = await admin.rpc(
        'lookup_email_by_username',
        { p_username: usernameParsed.username }
      );

      if (lookupError || typeof lookedUp !== 'string' || !lookedUp) {
        logger.warn('Username login lookup failed', {
          requestId,
          ip: getClientIp(request),
        });
        return withApiHeaders(
          NextResponse.json(
            { error: 'Invalid credentials', requestId },
            { status: 401 }
          ),
          requestId
        );
      }
      email = lookedUp;
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid credentials', requestId },
          { status: 401 }
        ),
        requestId
      );
    }

    const redirectTo = userNeedsUsername(data.user)
      ? '/auth/username'
      : '/dashboard';

    return withApiHeaders(
      NextResponse.json({
        success: true,
        requestId,
        redirectTo,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      }),
      requestId
    );
  } catch (error) {
    logger.error('Login failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Invalid credentials', requestId },
        { status: 401 }
      ),
      requestId
    );
  }
}

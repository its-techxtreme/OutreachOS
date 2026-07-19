import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withApiHeaders } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/sanitize';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { parseUsername } from '@/lib/validation/username-schema';

const SetBodySchema = z.object({
  username: z.string().min(1).max(40),
  questBoardEnabled: z.boolean().optional(),
});

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('username') ?? '';

  const parsed = parseUsername(raw);
  if (!parsed.ok) {
    return withApiHeaders(
      NextResponse.json({
        available: false,
        error: parsed.error,
        requestId,
      }),
      requestId
    );
  }

  try {
    const admin = getSupabaseServer();
    const { data, error } = await admin.rpc('is_username_available', {
      p_username: parsed.username,
    });

    if (error) {
      logger.error('Username availability check failed', {
        requestId,
        error: error.message,
      });
      return withApiHeaders(
        NextResponse.json(
          { error: 'Could not check username', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    return withApiHeaders(
      NextResponse.json({
        available: Boolean(data),
        username: parsed.username,
        requestId,
      }),
      requestId
    );
  } catch (error) {
    return withApiHeaders(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Could not check username',
          requestId,
        },
        { status: 500 }
      ),
      requestId
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

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

    const existing =
      typeof user.user_metadata?.username === 'string'
        ? user.user_metadata.username.trim()
        : '';
    if (existing) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Username already set', requestId },
          { status: 409 }
        ),
        requestId
      );
    }

    const json: unknown = await request.json();
    const body = SetBodySchema.safeParse(json);
    if (!body.success) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid username', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const parsed = parseUsername(sanitizeInput(body.data.username));
    if (!parsed.ok) {
      return withApiHeaders(
        NextResponse.json({ error: parsed.error, requestId }, { status: 400 }),
        requestId
      );
    }

    const admin = getSupabaseServer();
    const { data: available, error: availError } = await admin.rpc(
      'is_username_available',
      { p_username: parsed.username }
    );

    if (availError) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Could not reserve username', requestId },
          { status: 500 }
        ),
        requestId
      );
    }
    if (!available) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Username is taken', requestId },
          { status: 409 }
        ),
        requestId
      );
    }

    const { error: insertError } = await admin.from('profiles').insert({
      user_id: user.id,
      username: parsed.username,
      display_name: parsed.username,
      quest_board_enabled: body.data.questBoardEnabled === true,
    });

    if (insertError) {
      logger.error('Profile insert failed', {
        requestId,
        error: insertError.message,
      });
      if (insertError.code === '23505') {
        return withApiHeaders(
          NextResponse.json(
            { error: 'Username is taken', requestId },
            { status: 409 }
          ),
          requestId
        );
      }
      return withApiHeaders(
        NextResponse.json(
          { error: 'Could not save username', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        username: parsed.username,
        name: parsed.username,
      },
    });

    if (metaError) {
      logger.warn('Username metadata sync failed', {
        requestId,
        error: metaError.message,
      });
    }

    return withApiHeaders(
      NextResponse.json({
        success: true,
        username: parsed.username,
        requestId,
      }),
      requestId
    );
  } catch (error) {
    logger.error('Set username failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Could not save username', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

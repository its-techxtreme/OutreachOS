import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { logger } from '@/lib/logger';
import { sanitizeText } from '@/lib/sanitize';
import {
  GENERAL_SCRIPT_KEY,
  getDefaultScriptBody,
  nicheToScriptKey,
} from '@/lib/scripts/default-scripts';
import { getSupabaseServer } from '@/lib/supabase-server';

const UpsertSchema = z.object({
  scriptKey: z.string().min(1).max(80),
  body: z.string().min(1).max(8000),
});

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }
    const user = await ensureDefaultUserRole(rawUser);
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('call_scripts')
      .select('script_key, body, updated_at')
      .eq('user_id', user.id);

    if (error) {
      logger.error('List call scripts failed', {
        requestId,
        error: error.message,
      });
      return withApiHeaders(
        NextResponse.json(
          { error: 'Failed to load scripts', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    const scripts: Record<string, string> = {};
    for (const row of data ?? []) {
      scripts[row.script_key] = row.body;
    }

    return withApiHeaders(
      NextResponse.json({ scripts, requestId }),
      requestId
    );
  } catch (error) {
    return withApiHeaders(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Failed to load scripts',
          requestId,
        },
        { status: 500 }
      ),
      requestId
    );
  }
}

export async function PUT(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }
    const user = await ensureDefaultUserRole(rawUser);

    const json: unknown = await request.json();
    const parsed = UpsertSchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid script payload', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const scriptKey =
      parsed.data.scriptKey === GENERAL_SCRIPT_KEY
        ? GENERAL_SCRIPT_KEY
        : nicheToScriptKey(sanitizeText(parsed.data.scriptKey));
    // Scripts are operator-authored plain text — strip markup only; do not
    // run aggressive injection scrubbers that can delete legitimate phrases.
    const body = sanitizeText(parsed.data.body).slice(0, 8000);

    if (!body.trim()) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Script body cannot be empty', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase.from('call_scripts').upsert(
      {
        user_id: user.id,
        script_key: scriptKey,
        body,
      },
      { onConflict: 'user_id,script_key' }
    );

    if (error) {
      logger.error('Upsert call script failed', {
        requestId,
        error: error.message,
      });
      return withApiHeaders(
        NextResponse.json(
          { error: 'Failed to save script', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    return withApiHeaders(
      NextResponse.json({
        success: true,
        scriptKey,
        body,
        requestId,
      }),
      requestId
    );
  } catch (error) {
    return withApiHeaders(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Failed to save script',
          requestId,
        },
        { status: 500 }
      ),
      requestId
    );
  }
}

export async function DELETE(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }
    const user = await ensureDefaultUserRole(rawUser);
    const { searchParams } = new URL(request.url);
    const rawKey = searchParams.get('scriptKey') ?? GENERAL_SCRIPT_KEY;
    const scriptKey =
      rawKey === GENERAL_SCRIPT_KEY
        ? GENERAL_SCRIPT_KEY
        : nicheToScriptKey(sanitizeText(rawKey));

    const supabase = getSupabaseServer();
    await supabase
      .from('call_scripts')
      .delete()
      .eq('user_id', user.id)
      .eq('script_key', scriptKey);

    return withApiHeaders(
      NextResponse.json({
        success: true,
        scriptKey,
        defaultBody: getDefaultScriptBody(scriptKey),
        requestId,
      }),
      requestId
    );
  } catch (error) {
    return withApiHeaders(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Failed to reset script',
          requestId,
        },
        { status: 500 }
      ),
      requestId
    );
  }
}

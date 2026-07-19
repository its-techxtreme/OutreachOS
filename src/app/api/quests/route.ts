import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { RBACService } from '@/lib/auth/rbac';
import { logger } from '@/lib/logger';
import { ensureWeeklyQuests } from '@/lib/quests/assign';
import { getQuestById } from '@/lib/quests/quest-catalog';
import { getIsoWeekStart } from '@/lib/quests/week';
import { getSupabaseServer } from '@/lib/supabase-server';

const OptInSchema = z.object({
  enabled: z.boolean(),
});

const ClaimSchema = z.object({
  questId: z.string().min(1).max(80),
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
    const isDemo = RBACService.isDemoUser(user);

    let { data: profile } = await supabase
      .from('profiles')
      .select('quest_board_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    // Demo: treat as enabled even if profile row missing/false preference unset
    let enabled = Boolean(profile?.quest_board_enabled) || isDemo;

    if (isDemo && profile && !profile.quest_board_enabled) {
      await supabase
        .from('profiles')
        .update({ quest_board_enabled: true })
        .eq('user_id', user.id);
      enabled = true;
    }

    if (!enabled) {
      return withApiHeaders(
        NextResponse.json({
          enabled: false,
          weekStart: getIsoWeekStart(new Date()),
          quests: [],
          requestId,
        }),
        requestId
      );
    }

    const rows = await ensureWeeklyQuests(supabase, user.id);
    const quests = rows.map((row) => {
      const def = getQuestById(row.quest_id);
      return {
        id: row.id,
        questId: row.quest_id,
        title: def?.title ?? row.quest_id,
        description: def?.description ?? '',
        kind: def?.kind ?? 'manual',
        progress: row.progress,
        target: row.target,
        completedAt: row.completed_at,
        manualAllowed: def?.manualAllowed ?? false,
        claimedManual: row.claimed_manual,
      };
    });

    return withApiHeaders(
      NextResponse.json({
        enabled: true,
        weekStart: getIsoWeekStart(new Date()),
        quests,
        requestId,
      }),
      requestId
    );
  } catch (error) {
    logger.error('GET quests failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to load quests', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }
    const user = await ensureDefaultUserRole(rawUser);
    const json: unknown = await request.json();
    const parsed = OptInSchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid payload', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    if (RBACService.isDemoUser(user) && !parsed.data.enabled) {
      return withApiHeaders(
        NextResponse.json(
          {
            error: 'Quest Board stays on for the demo account',
            requestId,
          },
          { status: 403 }
        ),
        requestId
      );
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('profiles')
      .update({ quest_board_enabled: parsed.data.enabled })
      .eq('user_id', user.id);

    if (error) {
      // Profile may not exist yet for edge cases
      logger.error('Quest opt-in update failed', {
        requestId,
        error: error.message,
      });
      return withApiHeaders(
        NextResponse.json(
          { error: 'Failed to update preference', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    if (parsed.data.enabled) {
      await ensureWeeklyQuests(supabase, user.id);
    }

    return withApiHeaders(
      NextResponse.json({
        success: true,
        enabled: parsed.data.enabled,
        requestId,
      }),
      requestId
    );
  } catch (error) {
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to update preference', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }
    const user = await ensureDefaultUserRole(rawUser);
    const json: unknown = await request.json();
    const parsed = ClaimSchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid quest id', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const def = getQuestById(parsed.data.questId);
    if (!def?.manualAllowed) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'This quest cannot be claimed manually', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const supabase = getSupabaseServer();
    const weekStart = getIsoWeekStart(new Date());

    const { data: row, error: fetchError } = await supabase
      .from('user_weekly_quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .eq('quest_id', parsed.data.questId)
      .maybeSingle();

    if (fetchError || !row) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Quest not found for this week', requestId },
          { status: 404 }
        ),
        requestId
      );
    }

    if (row.completed_at) {
      return withApiHeaders(
        NextResponse.json({ success: true, alreadyComplete: true, requestId }),
        requestId
      );
    }

    const { error: updateError } = await supabase
      .from('user_weekly_quests')
      .update({
        progress: row.target,
        completed_at: new Date().toISOString(),
        claimed_manual: true,
      })
      .eq('id', row.id);

    if (updateError) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Failed to claim quest', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    return withApiHeaders(
      NextResponse.json({ success: true, requestId }),
      requestId
    );
  } catch (error) {
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to claim quest', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { RBACService } from '@/lib/auth/rbac';
import { getDemoSampleLeadIds } from '@/lib/demo/sample-leads';
import { RateLimitError } from '@/lib/errors';
import { LEAD_STATUSES } from '@/lib/filter-leads';
import { upsertUserLeadStatus } from '@/lib/leads/user-lead-status';
import { logger } from '@/lib/logger';
import { applyStatusQuestProgress } from '@/lib/quests/progress';
import { rateLimiters } from '@/lib/rate-limiter';
import { getSupabaseServer } from '@/lib/supabase-server';
import type { LeadStatus } from '@/types/database.types';

const PatchBodySchema = z.object({
  status: z
    .string()
    .refine(
      (value): value is LeadStatus =>
        LEAD_STATUSES.includes(value as LeadStatus),
      { message: 'Invalid status' }
    ),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();

  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }

    const user = await ensureDefaultUserRole(rawUser);

    try {
      await rateLimiters.dialKit.check(user.id);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return withApiHeaders(
          NextResponse.json(
            { error: 'Too many status updates. Slow down.', requestId },
            { status: 429 }
          ),
          requestId
        );
      }
      throw error;
    }

    const { id: idParam } = await context.params;
    const leadId = Number.parseInt(idParam, 10);

    if (!Number.isFinite(leadId) || leadId <= 0) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid lead id', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const json: unknown = await request.json();
    const parsed = PatchBodySchema.safeParse(json);
    if (!parsed.success) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Invalid status', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const nextStatus = parsed.data.status;
    const supabase = getSupabaseServer();
    const isDemo = RBACService.isDemoUser(user);

    const { data: existing, error: fetchError } = await supabase
      .from('leads')
      .select('id, status, owner_id')
      .eq('id', leadId)
      .maybeSingle();

    if (fetchError) {
      logger.error('Lead status fetch failed', {
        requestId,
        error: fetchError.message,
      });
      return withApiHeaders(
        NextResponse.json(
          { error: 'Failed to load lead', requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    if (!existing) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Lead not found', requestId },
          { status: 404 }
        ),
        requestId
      );
    }

    if (isDemo) {
      const sampleIds = await getDemoSampleLeadIds(supabase);
      if (!sampleIds.includes(leadId)) {
        return withApiHeaders(
          NextResponse.json(
            { error: 'Forbidden', requestId },
            { status: 403 }
          ),
          requestId
        );
      }
    } else if (existing.owner_id !== user.id) {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Forbidden', requestId },
          { status: 403 }
        ),
        requestId
      );
    }

    const previousStatus = existing.status as LeadStatus;

    let effectivePrevious = previousStatus;
    if (isDemo) {
      const { data: overlay } = await supabase
        .from('user_lead_status')
        .select('status')
        .eq('user_id', user.id)
        .eq('lead_id', leadId)
        .maybeSingle();
      if (overlay?.status) {
        effectivePrevious = overlay.status as LeadStatus;
      }
    }

    if (effectivePrevious === nextStatus) {
      return withApiHeaders(
        NextResponse.json({
          success: true,
          lead: { id: leadId, status: nextStatus },
          requestId,
        }),
        requestId
      );
    }

    let updated;

    if (isDemo) {
      // Demo must not mutate shared sample leads — per-user overlay only.
      await upsertUserLeadStatus(supabase, user.id, leadId, nextStatus);
      const { data: baseLead, error: baseError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      if (baseError || !baseLead) {
        return withApiHeaders(
          NextResponse.json(
            { error: 'Failed to update status', requestId },
            { status: 500 }
          ),
          requestId
        );
      }
      updated = { ...baseLead, status: nextStatus };
    } else {
      const { data, error: updateError } = await supabase
        .from('leads')
        .update({ status: nextStatus })
        .eq('id', leadId)
        .select('*')
        .single();

      if (updateError || !data) {
        logger.error('Lead status update failed', {
          requestId,
          error: updateError?.message,
        });
        return withApiHeaders(
          NextResponse.json(
            { error: 'Failed to update status', requestId },
            { status: 500 }
          ),
          requestId
        );
      }
      updated = data;
    }

    try {
      await applyStatusQuestProgress(supabase, user.id, nextStatus);
    } catch (questError) {
      logger.warn('Quest progress after status update failed', {
        requestId,
        error:
          questError instanceof Error ? questError.message : 'Unknown',
      });
    }

    return withApiHeaders(
      NextResponse.json({
        success: true,
        lead: updated,
        requestId,
      }),
      requestId
    );
  } catch (error) {
    logger.error('PATCH lead failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return withApiHeaders(
      NextResponse.json(
        { error: 'Failed to update lead', requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}

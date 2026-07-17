import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import {
  corsHeaders,
  getClientIp,
  readJsonBody,
  withApiHeaders,
} from '@/lib/api-helpers';
import { validateApiKey } from '@/lib/auth';
import { RateLimitError } from '@/lib/errors';
import { submitLead } from '@/lib/leads';
import { resolveAgentLeadOwnerId } from '@/lib/auth/agent-owner';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { getRateLimiterForAuth } from '@/lib/rate-limiter';
import { LeadSubmissionSchema } from '@/lib/validation/lead-schema';

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
  startedAt: number,
  path = '/api/agent/leads'
): NextResponse {
  const responseTime = Date.now() - startedAt;
  metrics.recordApiRequest(path, status, responseTime);

  logger.logApiRequest('POST', path, status, responseTime, {
    requestId,
    success: body.success,
  });

  return withApiHeaders(NextResponse.json({ ...body, responseTime }, { status }), requestId);
}

export async function OPTIONS(): Promise<NextResponse> {
  return withApiHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  const requestId = randomUUID();
  const ip = getClientIp(request);
  const path = '/api/agent/leads';

  logger.info('API request started', {
    requestId,
    method: 'POST',
    path,
    ip,
    userAgent: request.headers.get('user-agent'),
  });

  try {
    const authResult = await validateApiKey(request);

    if (!authResult.valid) {
      metrics.recordAuthFailure();
      logger.warn('Authentication failed', {
        requestId,
        ip,
        userAgent: request.headers.get('user-agent'),
        reason: authResult.reason,
      });

      return jsonResponse(
        { success: false, error: 'Unauthorized', requestId },
        401,
        requestId,
        startedAt,
        path
      );
    }

    const limiter = getRateLimiterForAuth(authResult.strategy);
    const rateLimitKey = authResult.rateLimitKey ?? ip;
    const limit = authResult.strategy === 'api-key' ? 1000 : 100;

    try {
      await limiter.check(rateLimitKey, limit);
    } catch (error) {
      if (error instanceof RateLimitError) {
        metrics.recordRateLimitHit();
        logger.warn('Rate limit exceeded', {
          requestId,
          ip,
          strategy: authResult.strategy,
        });

        return jsonResponse(
          {
            success: false,
            error: 'Too many requests',
            retryAfter: error.retryAfter,
            requestId,
          },
          429,
          requestId,
          startedAt,
          path
        );
      }

      throw error;
    }

    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      const message =
        error instanceof Error &&
        (error.message === 'Request body too large' ||
          error.message === 'Invalid JSON payload')
          ? error.message
          : 'Invalid JSON payload';

      return jsonResponse(
        {
          success: false,
          error: 'Invalid request data',
          details: [{ message }],
          requestId,
        },
        400,
        requestId,
        startedAt,
        path
      );
    }

    const parsed = LeadSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('Validation failed', {
        requestId,
        errors: parsed.error.issues,
      });

      return jsonResponse(
        {
          success: false,
          error: 'Invalid request data',
          details: parsed.error.issues,
          requestId,
        },
        400,
        requestId,
        startedAt,
        path
      );
    }

    const ownerId = await resolveAgentLeadOwnerId();
    if (!ownerId) {
      return jsonResponse(
        {
          success: false,
          error: 'Agent lead owner is not configured',
          requestId,
        },
        500,
        requestId,
        startedAt,
        path
      );
    }

    const dbStartTime = Date.now();
    let result;

    try {
      result = await submitLead({
        ...parsed.data.lead,
        owner_id: ownerId,
      });
      metrics.recordDatabaseQuery(result.kind !== 'error');
      logger.logDatabaseOperation(
        'insert',
        'leads',
        Date.now() - dbStartTime,
        result.kind !== 'error',
        { requestId, userId: authResult.userId }
      );
    } catch (error) {
      metrics.recordDatabaseQuery(false);
      logger.error('Database operation failed', {
        requestId,
        message: error instanceof Error ? error.message : 'Lead submission failed',
        dbDuration: Date.now() - dbStartTime,
      });

      return jsonResponse(
        { success: false, error: 'Internal server error', requestId },
        500,
        requestId,
        startedAt,
        path
      );
    }

    if (result.kind === 'duplicate') {
      logger.info('Duplicate lead detected', {
        requestId,
        maps_url: parsed.data.lead.maps_url,
      });

      return jsonResponse(
        {
          success: true,
          message: 'Lead already exists',
          skipped: true,
          requestId,
        },
        200,
        requestId,
        startedAt,
        path
      );
    }

    if (result.kind === 'error') {
      logger.error('Database operation failed', {
        requestId,
        code: result.error.code,
        message: result.error.message,
      });

      return jsonResponse(
        { success: false, error: 'Internal server error', requestId },
        500,
        requestId,
        startedAt,
        path
      );
    }

    logger.info('Lead created successfully', {
      requestId,
      leadId: result.id,
      niche: parsed.data.lead.niche,
      country: parsed.data.lead.country,
      source: parsed.data.metadata?.source ?? 'chatgpt',
      userId: authResult.userId,
    });

    return jsonResponse(
      {
        success: true,
        message: 'Lead created successfully',
        data: {
          id: result.id,
          created_at: result.created_at,
        },
        requestId,
      },
      201,
      requestId,
      startedAt,
      path
    );
  } catch (error) {
    logger.error('Request processing failed', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startedAt,
    });

    return jsonResponse(
      { success: false, error: 'Internal server error', requestId },
      500,
      requestId,
      startedAt,
      path
    );
  }
}

export { corsHeaders };

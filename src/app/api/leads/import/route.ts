import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { getClientIp, withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { Permission, RBACService } from '@/lib/auth/rbac';
import { RateLimitError } from '@/lib/errors';
import {
  MAX_IMPORT_FILE_BYTES,
} from '@/lib/import/constants';
import {
  assertSafeImportFile,
  ImportFileError,
  parseExcelBuffer,
} from '@/lib/import/excel-parser';
import { importValidatedLeads } from '@/lib/import/import-leads';
import { logger } from '@/lib/logger';
import {
  getImportRateLimiterForUser,
  premiumImportRowBudget,
} from '@/lib/rate-limiter';
import { SecurityEventType, SecurityLogger } from '@/lib/security-logger';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { countLeadsForOwner } from '@/lib/leads';
import {
  isPremiumRole,
  isUnlimitedLeadStorage,
  maxImportRowsForRoles,
  maxStoredLeadsForRoles,
} from '@/lib/quotas';

export const runtime = 'nodejs';
export const maxDuration = 60;

function statusForImportError(code: ImportFileError['code']): number {
  switch (code) {
    case 'too_large':
    case 'too_many_rows':
      return 413;
    case 'invalid_type':
    case 'invalid_magic':
    case 'empty':
    case 'parse_failed':
      return 400;
    default:
      return 400;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  const requestId = randomUUID();
  const ip = getClientIp(request);
  const path = '/api/leads/import';

  try {
    const rawUser = await getServerAuthUser();

    if (!rawUser) {
      SecurityLogger.log(
        SecurityEventType.LEAD_IMPORT_DENIED,
        { requestId, path, message: 'Unauthenticated import attempt', ip },
        ip
      );
      return withApiHeaders(unauthorizedJsonResponse(requestId), requestId);
    }

    const user = await ensureDefaultUserRole(rawUser);

    if (!RBACService.hasPermission(user, Permission.LEADS_CREATE)) {
      SecurityLogger.log(
        SecurityEventType.DATA_ACCESS_DENIED,
        {
          requestId,
          path,
          userId: user.id,
          message: 'Missing LEADS_CREATE for import',
          ip,
        },
        ip
      );
      return withApiHeaders(
        NextResponse.json(
          { error: 'Forbidden', requestId },
          { status: 403 }
        ),
        requestId
      );
    }

    const roles = RBACService.getUserRoles(user);

    try {
      const importLimiter = getImportRateLimiterForUser(roles);
      await importLimiter.check(user.id);
    } catch (error) {
      if (error instanceof RateLimitError) {
        SecurityLogger.log(
          SecurityEventType.RATE_LIMIT_EXCEEDED,
          { requestId, path, userId: user.id, ip },
          ip
        );
        return withApiHeaders(
          NextResponse.json(
            {
              error: RBACService.isDemoUser(user)
                ? 'Demo accounts are limited to 1 Excel upload per hour.'
                : isPremiumRole(roles)
                  ? 'Premium accounts can import up to 30 files per hour. Try again later.'
                  : 'Too many import requests. Try again later, or upgrade on /pricing.',
              retryAfter: error.retryAfter,
              requestId,
            },
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

    const contentType = request.headers.get('content-type') ?? '';
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return withApiHeaders(
        NextResponse.json(
          {
            error:
              contentType.toLowerCase().includes('multipart/form-data')
                ? 'Invalid multipart body'
                : 'Expected multipart/form-data with an Excel file field named "file"',
            requestId,
          },
          { status: 400 }
        ),
        requestId
      );
    }

    const fileEntry = formData.get('file');
    if (!fileEntry || typeof fileEntry === 'string') {
      return withApiHeaders(
        NextResponse.json(
          { error: 'Missing file field', requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const file = fileEntry as File;

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      return withApiHeaders(
        NextResponse.json(
          {
            error: `File exceeds the ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB limit`,
            requestId,
          },
          { status: 413 }
        ),
        requestId
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use a sanitized basename only for extension checks — never trust path segments
    const safeName = file.name.replace(/[/\\]/g, '').slice(0, 255) || 'upload.xlsx';

    try {
      assertSafeImportFile(safeName, file.type || '', file.size, buffer);
    } catch (error) {
      if (error instanceof ImportFileError) {
        SecurityLogger.log(
          SecurityEventType.SUSPICIOUS_REQUEST,
          {
            requestId,
            path,
            userId: user.id,
            code: error.code,
            message: error.message,
            ip,
          },
          ip
        );
        return withApiHeaders(
          NextResponse.json(
            { error: error.message, code: error.code, requestId },
            { status: statusForImportError(error.code) }
          ),
          requestId
        );
      }
      throw error;
    }

    let rows;
    try {
      ({ rows } = await parseExcelBuffer(buffer));
    } catch (error) {
      if (error instanceof ImportFileError) {
        return withApiHeaders(
          NextResponse.json(
            { error: error.message, code: error.code, requestId },
            { status: statusForImportError(error.code) }
          ),
          requestId
        );
      }
      throw error;
    }

    const rowCap = maxImportRowsForRoles(roles);
    if (rows.length > rowCap) {
      return withApiHeaders(
        NextResponse.json(
          {
            error: `This account can import at most ${rowCap} rows per file`,
            code: 'too_many_rows',
            requestId,
          },
          { status: 413 }
        ),
        requestId
      );
    }

    if (isPremiumRole(roles)) {
      try {
        await premiumImportRowBudget.consume(user.id, rows.length);
      } catch (error) {
        if (error instanceof RateLimitError) {
          return withApiHeaders(
            NextResponse.json(
              {
                error:
                  'Premium accounts can import up to 3000 rows per hour. Try again later.',
                code: 'row_budget_exceeded',
                retryAfter: error.retryAfter,
                requestId,
              },
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
    }

    if (!RBACService.isDemoUser(user) && !isUnlimitedLeadStorage(roles)) {
      const currentCount = await countLeadsForOwner(user.id);
      const maxStored = maxStoredLeadsForRoles(roles);
      if (currentCount >= maxStored) {
        return withApiHeaders(
          NextResponse.json(
            {
              error: `Lead limit reached (${maxStored}). Delete leads or upgrade on /pricing.`,
              code: 'lead_quota_exceeded',
              requestId,
            },
            { status: 403 }
          ),
          requestId
        );
      }
    }

    const summary = await importValidatedLeads(rows, { ownerId: user.id });

    SecurityLogger.log(
      SecurityEventType.LEAD_IMPORT,
      {
        requestId,
        path,
        userId: user.id,
        ip,
        totalRows: summary.totalRows,
        created: summary.created,
        duplicates: summary.duplicates,
        skipped: summary.skipped,
        failed: summary.failed,
        filename: safeName,
        byteSize: file.size,
      },
      ip
    );

    logger.info('Lead Excel import completed', {
      requestId,
      userId: user.id,
      duration: Date.now() - startedAt,
      ...summary,
      errorSampleCount: summary.errors.length,
    });

    return withApiHeaders(
      NextResponse.json({
        success: true,
        requestId,
        summary: {
          totalRows: summary.totalRows,
          created: summary.created,
          duplicates: summary.duplicates,
          skipped: summary.skipped,
          failed: summary.failed,
          errors: summary.errors,
        },
      }),
      requestId
    );
  } catch (error) {
    logger.error('Lead Excel import failed', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startedAt,
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

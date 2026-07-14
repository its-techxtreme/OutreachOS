import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import { ProductionMigrationValidator } from '@/lib/db/migration-validator';
import { logger } from '@/lib/logger';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';

/**
 * POST /api/admin/validate-migration
 * Runs production migration integrity checks (admin/service only).
 */
export async function POST(): Promise<NextResponse> {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return withApiHeaders(unauthorizedJsonResponse());
    }

    const roles = Array.isArray(user.app_metadata?.roles)
      ? (user.app_metadata.roles as string[])
      : [];
    const isElevated = roles.some((r) => r === 'admin' || r === 'super_admin');
    if (!isElevated) {
      return withApiHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      );
    }

    const validator = new ProductionMigrationValidator();
    const result = await validator.validateMigration();

    return withApiHeaders(
      NextResponse.json(result, { status: result.success ? 200 : 422 })
    );
  } catch (error) {
    logger.error('Migration validation endpoint failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return withApiHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}

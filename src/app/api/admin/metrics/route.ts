import { NextResponse } from 'next/server';

import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { Permission, RBACService } from '@/lib/auth/rbac';
import { withApiHeaders } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { ProductionMonitor } from '@/lib/monitoring/production-monitor';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getServerAuthUser();

    if (!user) {
      return withApiHeaders(unauthorizedJsonResponse());
    }

    if (!RBACService.hasPermission(user, Permission.SYSTEM_METRICS)) {
      return withApiHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      );
    }

    const monitor = ProductionMonitor.getInstance();
    monitor.trackSystemHealth();
    const healthReport = monitor.generateHealthReport();

    let database: Record<string, unknown> | null = null;
    try {
      const { data } = await getSupabaseServer()
        .from('lead_stats')
        .select('*')
        .single();
      database = data as Record<string, unknown> | null;
    } catch {
      database = null;
    }

    return withApiHeaders(
      NextResponse.json({
        systemHealth: healthReport,
        database,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    logger.error('Failed to generate admin metrics', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return withApiHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}

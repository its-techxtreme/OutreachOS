import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import { isServerEnvConfigured } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const { error } = await getSupabaseServer()
      .from('leads')
      .select('id')
      .limit(1);

    const dbHealthy = !error;
    const envHealthy = isServerEnvConfigured();
    const responseTime = Date.now() - startTime;
    const status = dbHealthy && envHealthy ? 'healthy' : 'unhealthy';

    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime,
      checks: {
        database: dbHealthy,
        environment: envHealthy,
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
        },
      },
    };

    logger.info('Health check performed', healthData);

    return withApiHeaders(
      NextResponse.json(healthData, {
        status: status === 'healthy' ? 200 : 503,
      })
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    logger.error('Health check failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    });

    return withApiHeaders(
      NextResponse.json(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
          responseTime,
        },
        { status: 503 }
      )
    );
  }
}

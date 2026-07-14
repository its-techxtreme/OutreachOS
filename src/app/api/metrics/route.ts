import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import { metrics } from '@/lib/metrics';

export async function GET(): Promise<NextResponse> {
  const body = metrics.toPrometheusFormat();

  return withApiHeaders(
    new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    })
  );
}

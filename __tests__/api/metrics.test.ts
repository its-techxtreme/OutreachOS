import { GET } from '@/app/api/metrics/route';
import { metrics } from '@/lib/metrics';

describe('/api/metrics', () => {
  beforeEach(() => {
    metrics.resetForTests();
  });

  it('returns prometheus-formatted metrics', async () => {
    metrics.recordApiRequest('/api/agent/leads', 201, 120);
    metrics.recordDatabaseQuery(true);
    metrics.recordRateLimitHit();

    const response = await GET();
    const body =
      typeof response.text === 'function'
        ? await response.text()
        : metrics.toPrometheusFormat();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(body).toContain('api_requests_total');
    expect(body).toContain('api_response_time_seconds_avg');
    expect(body).toContain('database_queries_total');
    expect(body).toContain('rate_limit_hits_total');
    expect(body).toContain('process_uptime_seconds');
  });
});

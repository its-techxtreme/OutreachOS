import { metrics } from '@/lib/metrics';

describe('metrics collector', () => {
  beforeEach(() => {
    metrics.resetForTests();
  });

  it('tracks api requests and response times', () => {
    metrics.recordApiRequest('/api/agent/leads', 201, 100);
    metrics.recordApiRequest('/api/agent/leads', 429, 5);

    const output = metrics.toPrometheusFormat();
    expect(output).toContain('api_requests_total 2');
    expect(output).toContain('api_response_time_seconds_avg');
  });

  it('tracks database, rate limit, and auth failure counters', () => {
    metrics.recordDatabaseQuery(true);
    metrics.recordDatabaseQuery(false);
    metrics.recordRateLimitHit();
    metrics.recordAuthFailure();

    const output = metrics.toPrometheusFormat();
    expect(output).toContain('database_queries_total 2');
    expect(output).toContain('rate_limit_hits_total 1');
    expect(output).toContain('auth_failures_total 1');
  });
});

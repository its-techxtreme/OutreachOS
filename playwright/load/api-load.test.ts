import { test, expect } from '@playwright/test';

const agentSecret = process.env.AGENT_SECRET ?? 'test-agent-secret';

test.describe('API load testing', () => {
  test('handles concurrent agent requests', async ({ request }) => {
    test.setTimeout(120_000);

    const concurrentRequests = 50;
    const requests = Array.from({ length: concurrentRequests }, (_, index) =>
      request.post('/api/agent/leads', {
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Secret': agentSecret,
        },
        data: {
          lead: {
            name: `Load Test Business ${index}`,
            niche: 'Test Category',
            country: 'Test Country',
            maps_url: `https://maps.google.com/load-test-${Date.now()}-${index}`,
          },
        },
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const totalTime = Date.now() - startTime;

    expect(responses).toHaveLength(concurrentRequests);

    const successfulRequests = responses.filter(
      (response) => response.status() === 200 || response.status() === 201
    );

    const successRate = successfulRequests.length / concurrentRequests;
    expect(successRate).toBeGreaterThan(0.9);

    const averageResponseTime = totalTime / concurrentRequests;
    expect(averageResponseTime).toBeLessThan(5000);
  });

  test('rate limiting rejects excessive requests from one client', async ({ request }) => {
    test.setTimeout(120_000);

    const rateLimitRequests = 120;
    const responses = await Promise.all(
      Array.from({ length: rateLimitRequests }, (_, index) =>
        request.post('/api/agent/leads', {
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Secret': agentSecret,
          },
          data: {
            lead: {
              name: `Rate Test ${index}`,
              niche: 'Test',
              country: 'Test',
              maps_url: `https://maps.google.com/rate-test-${Date.now()}-${index}`,
            },
          },
        })
      )
    );

    const rateLimitedResponses = responses.filter((response) => response.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});

test.describe('Health & Metrics', () => {
  test('health check endpoint works correctly', async ({ request }) => {
    const response = await request.get('/api/health');

    expect([200, 503]).toContain(response.status());
    const data = await response.json();

    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();
    expect(data.responseTime).toBeLessThan(5000);
  });

  test('metrics endpoint provides performance data', async ({ request }) => {
    const response = await request.get('/api/metrics');

    expect(response.status()).toBe(200);
    const metricsText = await response.text();

    expect(metricsText).toContain('api_requests_total');
    expect(metricsText).toContain('api_response_time_seconds_avg');
    expect(metricsText).toContain('database_queries_total');
  });

  test('agent endpoint supports CORS preflight', async ({ request }) => {
    const response = await request.fetch('/api/agent/leads', {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
    expect(response.headers()['access-control-allow-methods']).toContain('POST');
  });
});

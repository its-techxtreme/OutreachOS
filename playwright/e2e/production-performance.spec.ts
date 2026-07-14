import { test, expect } from '@playwright/test';

test.describe('Production Performance Tests', () => {
  test('health endpoint responds within budget', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/api/health');
    const duration = Date.now() - start;

    expect([200, 503]).toContain(response.status());
    expect(duration).toBeLessThan(3000);
  });

  test('API performance under moderate concurrent load', async ({ request }) => {
    const agentSecret = process.env.AGENT_SECRET;
    test.skip(!agentSecret, 'AGENT_SECRET not configured');

    const concurrentRequests = 25;
    const stamp = Date.now();
    const startTime = Date.now();

    const responses = await Promise.all(
      Array.from({ length: concurrentRequests }, (_, i) =>
        request.post('/api/agent/leads', {
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Secret': agentSecret!,
          },
          data: {
            lead: {
              name: `Load Test Lead ${i}`,
              niche: 'Testing',
              country: 'Test Country',
              maps_url: `https://maps.google.com/load-test-${stamp}-${i}`,
            },
          },
        })
      )
    );

    const totalTime = Date.now() - startTime;
    const successful = responses.filter((r) =>
      [200, 201].includes(r.status())
    );
    const successRate = successful.length / concurrentRequests;

    expect(successRate).toBeGreaterThan(0.9);
    expect(totalTime / concurrentRequests).toBeLessThan(2000);
  });

  test('dashboard login path meets soft budget when credentials exist', async ({
    page,
  }) => {
    const email = process.env.TEST_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
    const password =
      process.env.TEST_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
    test.skip(!email || !password, 'Admin credentials not configured');

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', email!);
    await page.fill('[data-testid="password-input"]', password!);

    const startTime = Date.now();
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({
      timeout: 15_000,
    });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});

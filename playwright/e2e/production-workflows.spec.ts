import { test, expect } from '@playwright/test';

/**
 * Production-oriented E2E workflows.
 * Requires AGENT_SECRET and optionally TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD.
 * Skips auth UI steps when credentials are not configured.
 */
test.describe('Production E2E Workflows', () => {
  test('ChatGPT API integration simulation', async ({ request }) => {
    const agentSecret = process.env.AGENT_SECRET;
    test.skip(!agentSecret, 'AGENT_SECRET not configured');

    const stamp = Date.now();
    const testLeads = [
      {
        name: 'Production Test Lead 1',
        niche: 'Interior Design',
        country: 'United States',
        phone: '+1-555-0123',
        address: '123 Production St, Test City, TC 12345',
        maps_url: `https://maps.google.com/production-test-${stamp}-1`,
      },
      {
        name: 'Production Test Lead 2',
        niche: 'Pet Grooming',
        country: 'Canada',
        maps_url: `https://maps.google.com/production-test-${stamp}-2`,
      },
    ];

    for (const lead of testLeads) {
      const response = await request.post('/api/agent/leads', {
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Secret': agentSecret!,
        },
        data: { lead },
      });

      expect([200, 201]).toContain(response.status());
      const body = await response.json();
      expect(body.success).toBe(true);
    }

    const duplicateResponse = await request.post('/api/agent/leads', {
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Secret': agentSecret!,
      },
      data: { lead: testLeads[0] },
    });

    expect([200, 201]).toContain(duplicateResponse.status());
    const duplicateData = await duplicateResponse.json();
    expect(duplicateData.success).toBe(true);
    expect(duplicateData.skipped === true || duplicateData.data?.id).toBeTruthy();
  });

  test('health endpoint is reachable', async ({ request }) => {
    const response = await request.get('/api/health');
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  test('security and authentication flows', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);

    const email = process.env.TEST_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
    const password =
      process.env.TEST_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;

    await page.fill('[data-testid="email-input"]', 'invalid@test.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });

    test.skip(!email || !password, 'Admin credentials not configured');

    await page.fill('[data-testid="email-input"]', email!);
    await page.fill('[data-testid="password-input"]', password!);
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({
      timeout: 15_000,
    });

    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated admin metrics returns 401', async ({ request }) => {
    const response = await request.get('/api/admin/metrics');
    expect(response.status()).toBe(401);
  });
});

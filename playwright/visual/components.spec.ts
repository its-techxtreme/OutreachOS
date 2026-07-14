import { test, expect } from '@playwright/test';

test.describe('Dashboard visual regression', () => {
  test('GlobalMetricsPanel matches design', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="metrics-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-panel"]')).toHaveScreenshot(
      'metrics-panel.png',
      { maxDiffPixelRatio: 0.05 }
    );
  });

  test('FilterToolbar responsive behavior', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="filter-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-toolbar"]')).toHaveScreenshot(
      'filter-toolbar-mobile.png',
      { maxDiffPixelRatio: 0.05 }
    );
  });
});

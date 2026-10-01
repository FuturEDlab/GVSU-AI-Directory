import { test, expect } from '@playwright/test';

test.describe('Tool Detail Route E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        expect(text).not.toContain('Maximum update depth exceeded');
        expect(text).not.toContain('Target docRef was not properly memoized using useMemoFirebase');
      }
    });
  });

  test('navigates to tool detail route and verifies container mounts', async ({ page }) => {
    await page.goto('/tools/tool-gamma');
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  });

  test('handles non-existent tool route gracefully', async ({ page }) => {
    await page.goto('/tools/non-existent-tool-id-999');
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Cross-Route Navigation E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        expect(text).not.toContain('Maximum update depth exceeded');
        expect(text).not.toContain('Target docRef was not properly memoized using useMemoFirebase');
      }
    });
  });

  test('navigates seamlessly across primary application routes', async ({ page }) => {
    // 1. Open Homepage
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    // 2. Navigate to Prompt Library
    await page.goto('/prompt-library');
    await expect(page).toHaveURL(/\/prompt-library$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 3. Navigate to Admin Portal
    await page.goto('/admin-portal');
    await expect(page).toHaveURL(/\/admin-portal$/);
    await expect(page.getByRole('heading', { name: /governance hub/i })).toBeVisible({ timeout: 10000 });

    // 4. Return to Homepage
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });
});

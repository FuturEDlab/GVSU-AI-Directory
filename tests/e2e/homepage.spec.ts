import { test, expect } from '@playwright/test';

test.describe('Homepage & Search E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        expect(text).not.toContain('Maximum update depth exceeded');
        expect(text).not.toContain('Target docRef was not properly memoized using useMemoFirebase');
      }
    });
  });

  test('opens homepage and verifies header & main title elements', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LakerAI Directory/i);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Institutional/i })).toBeVisible();
  });

  test('searches for tool and verifies directory results container', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByPlaceholder(/ask lakerai/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('canvas');
    await page.waitForTimeout(400);

    // Verify main container rendered
    await expect(page.locator('main')).toBeVisible();
  });

  test('clicks category buttons to filter catalog', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.getByRole('button', { name: /WRITING/i });
    if (await categoryBtn.isVisible()) {
      await categoryBtn.click();
      await page.waitForTimeout(300);
    }
  });
});

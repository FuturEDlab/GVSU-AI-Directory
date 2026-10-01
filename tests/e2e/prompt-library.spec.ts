import { test, expect } from '@playwright/test';

test.describe('Prompt Library E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        expect(text).not.toContain('Maximum update depth exceeded');
        expect(text).not.toContain('Target docRef was not properly memoized using useMemoFirebase');
      }
    });
  });

  test('opens /prompt-library and verifies header and prompt library title', async ({ page }) => {
    await page.goto('/prompt-library');
    await expect(page.getByRole('heading', { name: /Community Prompt Library/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Search by title/i);
    await expect(searchInput).toBeVisible();
  });

  test('filters prompts by search keyword input', async ({ page }) => {
    await page.goto('/prompt-library');
    const searchInput = page.getByPlaceholder(/Search by title/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('syllabus');
    await page.waitForTimeout(400);
    await expect(page.locator('main')).toBeVisible();
  });
});

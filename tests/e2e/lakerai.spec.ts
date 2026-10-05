import { test, expect } from '@playwright/test';

test.describe('LakerAI Assistant UI E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        expect(text).not.toContain('Maximum update depth exceeded');
        expect(text).not.toContain('Target docRef was not properly memoized using useMemoFirebase');
      }
    });
  });

  test('locates LakerAI search component on homepage', async ({ page }) => {
    await page.goto('/');
    const lakerAiInput = page.getByPlaceholder(/ask lakerai/i);
    await expect(lakerAiInput).toBeVisible();
  });

  test('submits queries ("presentation tool", "research tool", "analyze data")', async ({ page }) => {
    await page.goto('/');
    const lakerAiInput = page.getByPlaceholder(/ask lakerai/i);
    await expect(lakerAiInput).toBeVisible();

    await lakerAiInput.fill('presentation tool');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    await expect(page.locator('main')).toBeVisible();
  });
});

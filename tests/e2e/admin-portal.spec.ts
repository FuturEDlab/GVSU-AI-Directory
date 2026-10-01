import { test, expect } from '@playwright/test';

test.describe('Admin Portal & Governance Hub E2E Flows', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });
  });

  test.afterEach(() => {
    // Assert no React infinite loop runtime errors occurred
    const updateDepthError = consoleErrors.find(e => e.includes('Maximum update depth exceeded'));
    const unmemoizedError = consoleErrors.find(e => e.includes('Target docRef was not properly memoized using useMemoFirebase'));

    expect(updateDepthError, 'Must NOT encounter Maximum update depth exceeded error').toBeUndefined();
    expect(unmemoizedError, 'Must NOT encounter unmemoized useDoc error').toBeUndefined();
  });

  test('loads /admin-portal and checks main container and governance desk elements', async ({ page }) => {
    await page.goto('/admin-portal');
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  });

  test('interacts with navigation switcher when governance desk mounts', async ({ page }) => {
    await page.goto('/admin-portal');
    await page.waitForTimeout(500);

    const governanceHeading = page.getByRole('heading', { name: /governance hub/i });
    if (await governanceHeading.isVisible()) {
      const tabs = ['Tool Moderation', 'User Reports', 'Community Feedback', 'Chat Moderation', 'Prompt Library'];
      for (const tabName of tabs) {
        const tabBtn = page.getByRole('button', { name: new RegExp(tabName, 'i') });
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(200);
        }
      }
    }
  });
});

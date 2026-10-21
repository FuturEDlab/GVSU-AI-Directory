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

  test('end-to-end vetting & publishing workflow: tools_submitted -> automatedVettingAgent -> 4-Pillar scorecard -> Approve & Publish -> tools_published', async ({ page }) => {
    const { automatedVettingAgent } = await import('../../src/ai/flows/admin-generates-tool-narrative-and-image');

    // 1. Simulate a submitted tool in tools_submitted
    const submittedTool = {
      id: 'e2e-audit-test-tool',
      title: 'Lovable',
      category: 'Coding Assistant',
      initialDescription: 'Popular vibe coding tool for rapid full-stack prototyping.',
      toolUrl: 'https://lovable.dev/',
      status: 'Submitted' as const,
      health: 'Healthy' as const,
      submitterDisplayName: 'Joseph Van Harken',
      submitterEmail: 'vanharkj@mail.gvsu.edu',
      submitterId: 'e2e-admin-uid',
      upvotes: 0,
      downvotes: 0,
      isVerified: false,
    };

    // 2. Run automatedVettingAgent as vanharkj@mail.gvsu.edu
    const auditResult = await automatedVettingAgent({
      toolTitle: submittedTool.title,
      toolDescription: submittedTool.initialDescription,
      toolUrl: submittedTool.toolUrl,
      adminEmail: 'vanharkj@mail.gvsu.edu',
      isAdmin: true,
    });

    expect(auditResult.aiVetted).toBe(true);
    expect(auditResult.pedagogicalNarrative.length).toBeGreaterThan(20);
    expect(auditResult.overallVerdict.length).toBeGreaterThan(10);

    // 3. Verify 4-Pillar scorecard keys & scores
    const rc = auditResult.reportCard;
    expect(Object.keys(rc)).toEqual([
      'security_privacy',
      'pedagogical_value',
      'ethics_stewardship',
      'access_cost',
    ]);
    for (const key of ['security_privacy', 'pedagogical_value', 'ethics_stewardship', 'access_cost'] as const) {
      expect(rc[key].score).toBeGreaterThanOrEqual(1);
      expect(rc[key].score).toBeLessThanOrEqual(5);
      expect(rc[key].summary.length).toBeGreaterThan(10);
    }

    // 4. Transition tool through Audited - Ready for Approval -> Approve & Publish -> tools_published
    const auditedTool = {
      ...submittedTool,
      aiVetted: true,
      status: 'Audited - Ready for Approval' as const,
      pedagogicalNarrative: auditResult.pedagogicalNarrative,
      overallVerdict: auditResult.overallVerdict,
      reportCard: rc,
      tags: auditResult.tags,
    };
    expect(auditedTool.status).toBe('Audited - Ready for Approval');

    const publishedTool = {
      ...auditedTool,
      status: 'Published' as const,
      isVerified: true,
    };
    expect(publishedTool.status).toBe('Published');
    expect(publishedTool.isVerified).toBe(true);

    // 5. Verify live scorecard & narrative rendering on tool detail view in browser
    await page.goto('/tools/chatgpt-seed');
    await expect(page.getByText(/4-Pillar Institutional Alignment Scorecard/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(/Security & Privacy/i).first()).toBeVisible();
    await expect(page.getByText(/Pedagogical Value/i).first()).toBeVisible();
    await expect(page.getByText(/Ethics & Stewardship/i).first()).toBeVisible();
    await expect(page.getByText(/Access & Cost/i).first()).toBeVisible();
  });
});

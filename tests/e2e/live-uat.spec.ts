import { test, expect } from '@playwright/test';

const TARGET_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  'https://production--gvsu-ai-directory.us-central1.hosted.app';

test.describe('Full Real-Browser User Acceptance Test (UAT) Suite', () => {
  test.setTimeout(120000);

  test('1. Discovery Hub & Visual Asset Integrity (20 Tools, Images, Category Pills, Real-Time Search)', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // Wait for all 20 seeded tool cards to render
    const chatgptHeading = page.locator('h3', { hasText: 'ChatGPT' });
    await expect(chatgptHeading.first()).toBeVisible({ timeout: 30000 });

    const toolHeadings = page.locator('main h3');
    const totalCount = await toolHeadings.count();
    expect(totalCount).toBeGreaterThanOrEqual(20);

    // Verify VETTED badges are visible across the cards
    const vettedBadges = page.locator('main', { hasText: 'Vetted' });
    await expect(vettedBadges.first()).toBeVisible();

    // Scroll through cards to trigger lazy-loaded images and verify every tool card <img> has naturalWidth > 0
    const toolImages = page.locator('main .glass-card img');
    const imgCount = await toolImages.count();
    expect(imgCount).toBe(20);

    for (let i = 0; i < imgCount; i++) {
      const img = toolImages.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(
          async () =>
            img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
          { timeout: 15000, message: `Expected image #${i + 1} to load with naturalWidth > 0` }
        )
        .toBe(true);
    }

    // Test every category filter pill
    const expectedCategoryCounts: Array<{ label: string; expectedMin: number; expectedMax: number }> = [
      { label: 'ALL TOOLS', expectedMin: 20, expectedMax: 24 },
      { label: 'WRITING ASSISTANTS', expectedMin: 4, expectedMax: 4 },
      { label: 'IMAGE GENERATION', expectedMin: 3, expectedMax: 3 },
      { label: 'DATA ANALYSIS', expectedMin: 2, expectedMax: 2 },
      { label: 'RESEARCH ASSISTANT', expectedMin: 6, expectedMax: 6 },
      { label: 'CODING ASSISTANT', expectedMin: 2, expectedMax: 2 },
      { label: 'VIDEO/AUDIO', expectedMin: 1, expectedMax: 1 },
      { label: 'EDUCATION', expectedMin: 2, expectedMax: 2 },
      { label: 'OTHER', expectedMin: 0, expectedMax: 5 },
    ];

    for (const { label, expectedMin, expectedMax } of expectedCategoryCounts) {
      const pill = page.locator('button', { hasText: new RegExp(`^${label.replace('/', '\\/')}$`, 'i') });
      await expect(pill).toBeVisible();
      await pill.click();
      await page.waitForTimeout(250);
      const count = await page.locator('main .glass-card').count();
      expect(count).toBeGreaterThanOrEqual(expectedMin);
      expect(count).toBeLessThanOrEqual(expectedMax);
    }

    // Reset back to ALL TOOLS
    await page.locator('button', { hasText: /^ALL TOOLS$/i }).click();
    await expect(page.locator('main .glass-card')).toHaveCount(20);

    // Test real-time header search and URL ?q= synchronization
    const searchInput = page.locator('input[aria-label="Search tools in header"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Python');

    await expect
      .poll(() => page.url(), { timeout: 10000 })
      .toContain('?q=Python');

    await expect
      .poll(async () => page.locator('main .glass-card').count(), { timeout: 10000 })
      .toBe(1);
    await expect(page.locator('main h3', { hasText: 'Julius AI' })).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect
      .poll(async () => page.locator('main .glass-card').count(), { timeout: 10000 })
      .toBe(20);
  });

  test('2. Tool Detail View & Alignment Report Cards (/tools/[toolId])', async ({ page }) => {
    await page.goto(`${TARGET_URL}/tools/chatgpt-seed`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h3', { hasText: 'ChatGPT' }).first()).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(/Low Risk/i).first()).toBeVisible();

    // Verify Alignment Report Card scores & disclaimer render
    await expect(page.getByText(/security privacy/i).first()).toBeVisible();
    await expect(page.getByText(/pedagogical value/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Report Inaccuracy/i }).first()).toBeVisible();

    // Verify Community Prompts section renders without error
    await expect(page.locator('h3', { hasText: 'Community Prompts' })).toBeVisible();
    await expect(page.getByText(/Socratic Concept Tutor/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('3. LakerAI Assistant & Automated AI Workflows + NewsGrid', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    const assistantInput = page.locator('input[placeholder="Ask LakerAI anything..."]');
    await expect(assistantInput).toBeVisible({ timeout: 20000 });
    await assistantInput.fill('literature review and citations');
    await page.getByRole('button', { name: /^Ask$/i }).click();

    // Verify LakerAI Recommendations panel opens and displays matches
    await expect(page.getByText('LakerAI Recommendations')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/% Match/i).first()).toBeVisible({ timeout: 25000 });

    // Close assistant results dropdown
    await page.keyboard.press('Escape');

    // Verify NewsGrid ("Higher Ed AI Intelligence") at the bottom of the page displays live articles
    const newsHeading = page.getByText(/Higher Ed AI Intelligence/i);
    await newsHeading.scrollIntoViewIfNeeded();
    await expect(newsHeading).toBeVisible({ timeout: 15000 });
    const newsReadReportLinks = page.getByText(/Read Report/i);
    await expect(newsReadReportLinks.first()).toBeVisible({ timeout: 15000 });
    expect(await newsReadReportLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test('4. Prompt Library, Help & Support, Changelog, and Reporting/Submission Modals', async ({ page }) => {
    // 4a. Prompt Library
    await page.goto(`${TARGET_URL}/prompt-library`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1', { hasText: 'Community Prompt Library' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('input[placeholder*="Search by title"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Submit Prompt/i }).first()).toBeVisible();

    // Verify seeded approved prompts appear and can be inspected
    const promptTitle = page.getByText(/Socratic Concept Tutor/i).first();
    await expect(promptTitle).toBeVisible({ timeout: 20000 });
    await promptTitle.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    // 4b. Help & Support (Knowledge Base, AI Support Assistant, Community Feedback)
    await page.goto(`${TARGET_URL}/help`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h2', { hasText: 'Help & Support' })).toBeVisible({ timeout: 20000 });

    // Switch to AI Support Assistant tab and test askSupportAssistant workflow
    const aiSupportTab = page.getByRole('tab', { name: /AI Support Assistant/i });
    await aiSupportTab.click();
    const supportInput = page.locator('input[placeholder*="Type your question"], textarea[placeholder*="Type your question"], input[placeholder*="Ask"], textarea[placeholder*="Ask"]').first();
    await expect(supportInput).toBeVisible({ timeout: 10000 });
    await supportInput.fill('How do I submit a tool?');
    await supportInput.press('Enter');
    await expect(page.getByText(/Submit New Tool|Recommend/i).first()).toBeVisible({ timeout: 20000 });

    // Switch to Community Feedback tab
    const feedbackTab = page.getByRole('tab', { name: /Community Feedback/i });
    await feedbackTab.click();
    await expect(page.getByText(/Community Feedback|Submit Feedback|All Feedback/i).first()).toBeVisible({ timeout: 10000 });

    // 4c. Release Changelog
    await page.goto(`${TARGET_URL}/help/changelog`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h2', { hasText: 'Release Changelog' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/v1\.1\.0/i).first()).toBeVisible();

    // 4d. ReportModal ("Report a Mistake") and SubmissionModal ("SUBMIT NEW TOOL") on homepage
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
    const reportBtn = page.getByRole('button', { name: /Report a Mistake/i });
    await expect(reportBtn).toBeVisible({ timeout: 15000 });
    await reportBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Report Hub Error/i)).toBeVisible();
    await expect(page.locator('input#toolName')).toBeVisible();
    await page.keyboard.press('Escape');

    const submitToolBtn = page.getByRole('button', { name: /SUBMIT NEW TOOL/i });
    await expect(submitToolBtn).toBeVisible();
    await submitToolBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Recommend AI/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('5. Admin Portal & Dashboard Institutional Auth Guards', async ({ page }) => {
    // 5a. Unauthenticated visitor on /dashboard sees Laker Only Area sign-in wall
    await page.goto(`${TARGET_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Laker Only Area/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /SIGN IN TO VIEW/i })).toBeVisible();

    // 5b. Unauthenticated visitor on /admin-portal is redirected to /
    await page.goto(`${TARGET_URL}/admin-portal`, { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 15000 })
      .toBe('/');
  });
});

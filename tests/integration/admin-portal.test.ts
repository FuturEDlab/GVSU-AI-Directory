import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockSnapshotStore } from '../mocks/firebase-mock';
import { normalizeReportCard } from '../../src/components/admin/governance/ToolModerationTab';
import { automatedVettingAgent } from '../../src/ai/flows/admin-generates-tool-narrative-and-image';

describe('Admin Portal Governance Hub Integration Suite', () => {
  it('enforces whitelist emails and isAdmin flag for admin authorization', async () => {
    const adminEmails = new Set([
      'indrajis@mail.gvsu.edu',
      'vanharkj@gvsu.edu',
      'vanharkj@mail.gvsu.edu',
      'indrajis@gvsu.edu',
      'joseph_email_here@gvsu.edu'
    ]);

    const checkAdmin = (email: string | null, isAdminDoc = false) => {
      if (isAdminDoc) return true;
      if (!email) return false;
      return adminEmails.has(email.trim().toLowerCase());
    };

    assert.equal(checkAdmin('indrajis@mail.gvsu.edu'), true);
    assert.equal(checkAdmin('vanharkj@gvsu.edu'), true);
    assert.equal(checkAdmin('vanharkj@mail.gvsu.edu'), true);
    assert.equal(checkAdmin('newadmin@gvsu.edu', true), true);
    assert.equal(checkAdmin('student@mail.gvsu.edu'), false);
    assert.equal(checkAdmin(null), false);

    await assert.rejects(
      () =>
        automatedVettingAgent({
          toolTitle: 'Unauthorized Test Tool',
          toolDescription: 'Testing unauthorized rejection',
          toolUrl: 'https://example.com',
          adminEmail: 'student@mail.gvsu.edu',
          isAdmin: false,
        }),
      /Unauthorized/
    );
  });

  it('aligns and normalizes both canonical and legacy 4-pillar reportCard keys', () => {
    const canonicalCard = {
      security_privacy: { score: 4, summary: 'FERPA safe with opt-out.' },
      pedagogical_value: { score: 5, summary: 'Strong coding scaffolding.' },
      ethics_stewardship: { score: 4, summary: 'Clear attribution needed.' },
      access_cost: { score: 5, summary: 'Generous free student tier.' },
    };

    const normalizedCanonical = normalizeReportCard(canonicalCard);
    assert.equal(normalizedCanonical.pillars.length, 4);
    assert.equal(normalizedCanonical.avgScore, 4.5);
    assert.equal(normalizedCanonical.riskRating, 'Low Risk');
    assert.deepEqual(
      normalizedCanonical.pillars.map((p) => p.key),
      ['security_privacy', 'pedagogical_value', 'ethics_stewardship', 'access_cost']
    );

    const legacyCard = {
      security: { score: 3, summary: 'Consumer defaults apply.' },
      pedagogy: { score: 4, summary: 'Useful classroom tool.' },
      ethics: { score: 3, summary: 'Requires instructor review.' },
      readiness: { score: 3, summary: 'Freemium credit limits.' },
    };

    const normalizedLegacy = normalizeReportCard(legacyCard);
    assert.equal(normalizedLegacy.pillars.length, 4);
    assert.equal(normalizedLegacy.avgScore, 3.3);
    assert.equal(normalizedLegacy.riskRating, 'Moderate Risk');
    assert.equal(normalizedLegacy.canonical?.security_privacy.score, 3);
    assert.equal(normalizedLegacy.canonical?.pedagogical_value.score, 4);
    assert.equal(normalizedLegacy.canonical?.ethics_stewardship.score, 3);
    assert.equal(normalizedLegacy.canonical?.access_cost.score, 3);
  });

  it('only initializes active tab listeners and cleans up when hidden/switched', () => {
    const store = new MockSnapshotStore();
    let currentTab = 'moderation';
    let activeUnsubscribe: (() => void) | null = null;

    const mountTab = (tabName: string) => {
      // Clean up previous tab listener
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }
      currentTab = tabName;
      // Start listener for active tab collection
      const collectionPath =
        tabName === 'moderation' ? 'tools_submitted' :
        tabName === 'reports' ? 'reports' :
        tabName === 'feedback' ? 'feedbackPosts' :
        tabName === 'chat_moderation' ? 'chatModerationReports' : 'promptLibrary';

      activeUnsubscribe = store.subscribe(collectionPath, () => {});
    };

    // 1. Initial mount: Tool Moderation tab active
    mountTab('moderation');
    assert.equal(store.getListenerCount('tools_submitted'), 1);
    assert.equal(store.getListenerCount('reports'), 0);
    assert.equal(store.getListenerCount('feedbackPosts'), 0);

    // 2. Switch to User Reports tab
    mountTab('reports');
    assert.equal(store.getListenerCount('tools_submitted'), 0, 'Previous tab listener MUST be cleaned up');
    assert.equal(store.getListenerCount('reports'), 1, 'Active tab listener MUST be initialized');

    // 3. Switch to Community Feedback
    mountTab('feedback');
    assert.equal(store.getListenerCount('reports'), 0);
    assert.equal(store.getListenerCount('feedbackPosts'), 1);

    // 4. Switch to Chat Moderation
    mountTab('chat_moderation');
    assert.equal(store.getListenerCount('feedbackPosts'), 0);
    assert.equal(store.getListenerCount('chatModerationReports'), 1);

    // 5. Switch to Prompt Library Moderation
    mountTab('prompt_library');
    assert.equal(store.getListenerCount('chatModerationReports'), 0);
    assert.equal(store.getListenerCount('promptLibrary'), 1);

    // Cleanup
    if (activeUnsubscribe) {
      (activeUnsubscribe as () => void)();
    }
    assert.equal(store.getListenerCount(), 0);
  });

  it('returning to previously loaded tab does not create duplicate listeners', () => {
    const store = new MockSnapshotStore();

    // Simulating mount & unmount cycle
    const unsub1 = store.subscribe('tools_submitted', () => {});
    assert.equal(store.getListenerCount('tools_submitted'), 1);

    unsub1(); // Tab unmounted
    assert.equal(store.getListenerCount('tools_submitted'), 0);

    const unsub2 = store.subscribe('tools_submitted', () => {}); // Re-entered tab
    assert.equal(store.getListenerCount('tools_submitted'), 1, 'Should have exactly 1 listener, not 2');

    unsub2();
    assert.equal(store.getListenerCount('tools_submitted'), 0);
  });
});

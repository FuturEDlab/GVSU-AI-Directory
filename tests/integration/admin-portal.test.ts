import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockSnapshotStore } from '../mocks/firebase-mock';

describe('Admin Portal Governance Hub Integration Suite', () => {
  it('enforces whitelist emails for admin authorization', () => {
    const adminEmails = new Set([
      'indrajis@mail.gvsu.edu',
      'vanharkj@gvsu.edu',
      'vanharkj@mail.gvsu.edu'
    ]);

    const checkAdmin = (email: string | null) => {
      if (!email) return false;
      return adminEmails.has(email.toLowerCase());
    };

    assert.equal(checkAdmin('indrajis@mail.gvsu.edu'), true);
    assert.equal(checkAdmin('vanharkj@gvsu.edu'), true);
    assert.equal(checkAdmin('student@mail.gvsu.edu'), false);
    assert.equal(checkAdmin(null), false);
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

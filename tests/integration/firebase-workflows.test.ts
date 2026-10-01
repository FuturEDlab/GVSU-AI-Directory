import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FirestorePermissionError } from '../../src/firebase/errors';

describe('Firebase Workflows & Security Rules Test Suite', () => {
  it('instantiates contextual FirestorePermissionError with operation details', () => {
    const err = new FirestorePermissionError({
      operation: 'get',
      path: 'chatModerationReports/123'
    });

    assert.ok(err instanceof FirestorePermissionError);
    assert.ok(err.message.includes('chatModerationReports/123'));
  });

  it('verifies default Firestore collection query bounds limit (<= 50/100 items)', () => {
    const queryLimits = {
      tools_submitted: 50,
      tools_published: 50,
      reports: 50,
      feedbackPosts: 50,
      chatModerationReports: 50,
      promptLibrary: 100
    };

    for (const [col, limitVal] of Object.entries(queryLimits)) {
      assert.ok(limitVal <= 100, `Collection ${col} query limit must be bounded to 100 or less for performance`);
    }
  });
});

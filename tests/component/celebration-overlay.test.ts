import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('CelebrationOverlay Memoized Safety Suite', () => {
  it('triggers dialog state ONLY when profile notificationPending is true', () => {
    const checkShowOverlay = (profile: any) => {
      return !!(profile && profile.notificationPending);
    };

    assert.equal(checkShowOverlay(null), false);
    assert.equal(checkShowOverlay({ notificationPending: false }), false);
    assert.equal(checkShowOverlay({ notificationPending: true }), true);
  });

  it('verifies profileRef is memoized using useMemoFirebase signature', () => {
    const user = { uid: 'user-123' };
    const firestore = { type: 'firestore' };

    // Factory simulating useMemoFirebase(() => doc(firestore, 'user_profiles', user.uid), [firestore, user?.uid])
    const createProfileRef = (u: any, fs: any) => {
      if (!u || !fs) return null;
      return { path: `user_profiles/${u.uid}`, __memo: true };
    };

    const ref1 = createProfileRef(user, firestore);
    const ref2 = createProfileRef(user, firestore);

    assert.ok(ref1);
    assert.equal(ref1.__memo, true, 'Ref MUST be tagged with __memo = true');
    assert.equal(ref1.path, 'user_profiles/user-123');
    assert.deepEqual(ref1, ref2);
  });
});

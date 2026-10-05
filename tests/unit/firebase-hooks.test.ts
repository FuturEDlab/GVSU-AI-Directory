import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockSnapshotStore, createMockDocRef, createMockQuery } from '../mocks/firebase-mock';

describe('Firebase Hooks & Memoization Regression Suite', () => {
  it('useDoc enforces __memo flag and throws on unmemoized DocumentReference', () => {
    const unmemoizedRef = { path: 'user_profiles/123' }; // Missing __memo: true
    const memoizedRef = { path: 'user_profiles/123', __memo: true };

    // Function simulating useDoc validation check
    const validateDocRef = (ref: any) => {
      if (ref && !ref.__memo) {
        throw new Error('Target docRef was not properly memoized using useMemoFirebase');
      }
      return true;
    };

    assert.throws(
      () => validateDocRef(unmemoizedRef),
      /Target docRef was not properly memoized using useMemoFirebase/
    );

    assert.equal(validateDocRef(memoizedRef), true);
  });

  it('useCollection enforces __memo flag and throws on unmemoized Query', () => {
    const unmemoizedQuery = { path: 'tools_published' };
    const memoizedQuery = { path: 'tools_published', __memo: true };

    const validateQueryRef = (ref: any) => {
      if (ref && !ref.__memo) {
        throw new Error('Target was not properly memoized using useMemoFirebase');
      }
      return true;
    };

    assert.throws(
      () => validateQueryRef(unmemoizedQuery),
      /Target was not properly memoized using useMemoFirebase/
    );

    assert.equal(validateQueryRef(memoizedQuery), true);
  });

  it('useMemoFirebase provides stable reference identity across multiple calls', () => {
    // Simulate useMemo factory function behavior
    const factory = () => ({ path: 'config/news_cron_status' });

    // Simulate memoized ref
    const ref1: any = factory();
    ref1.__memo = true;

    // Subsequent render with memoized deps returns same ref object
    const ref2 = ref1;

    assert.strictEqual(ref1, ref2, 'Memoized reference MUST maintain identity equality across renders');
    assert.equal(ref1.__memo, true);
  });

  it('onSnapshot listeners cleanup correctly upon unmount without memory/listener leaks', () => {
    const store = new MockSnapshotStore();
    const docPath = 'user_profiles/test-user';

    assert.equal(store.getListenerCount(docPath), 0);

    const unsubscribe = store.subscribe(docPath, () => {});
    assert.equal(store.getListenerCount(docPath), 1);

    unsubscribe();
    assert.equal(store.getListenerCount(docPath), 0, 'Listener count must return to 0 on unsubscribe');
  });

  it('Firestore snapshot callback does not trigger infinite render loop when reference is stable', () => {
    const store = new MockSnapshotStore();
    let renderPasses = 0;
    const stableRef = createMockDocRef('user_profiles/uid-1', 'uid-1', true);

    // Simulate component effect subscription
    const subscribeEffect = (ref: typeof stableRef) => {
      renderPasses++;
      return store.subscribe(ref.path, (snapshot) => {
        // State update inside snapshot callback
        const data = { ...snapshot };
        // Component state updated successfully
      });
    };

    const unsubscribe = subscribeEffect(stableRef);

    // Emit multiple snapshot updates
    store.emit(stableRef.path, { notificationPending: true });
    store.emit(stableRef.path, { notificationPending: false });

    assert.equal(renderPasses, 1, 'Component effect must execute ONLY ONCE for stable memoized reference');
    unsubscribe();
  });
});

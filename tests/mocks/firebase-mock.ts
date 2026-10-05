/**
 * Deterministic Mock for Firebase Firestore / Auth hooks in testing environment.
 */
export interface MockDocRef {
  path: string;
  id: string;
  __memo?: boolean;
}

export interface MockQuery {
  path: string;
  __memo?: boolean;
}

export function createMockDocRef(path: string, id: string, memoized = true): MockDocRef {
  return { path, id, __memo: memoized };
}

export function createMockQuery(path: string, memoized = true): MockQuery {
  return { path, __memo: memoized };
}

export class MockSnapshotStore {
  private listeners: Map<string, Set<(snap: any) => void>> = new Map();
  public listenerCounts: Map<string, number> = new Map();

  subscribe(path: string, callback: (snap: any) => void): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    const set = this.listeners.get(path)!;
    set.add(callback);
    this.listenerCounts.set(path, (this.listenerCounts.get(path) || 0) + 1);

    return () => {
      set.delete(callback);
      const count = (this.listenerCounts.get(path) || 1) - 1;
      if (count <= 0) {
        this.listenerCounts.delete(path);
      } else {
        this.listenerCounts.set(path, count);
      }
    };
  }

  emit(path: string, data: any) {
    const set = this.listeners.get(path);
    if (set) {
      set.forEach(cb => cb(data));
    }
  }

  getListenerCount(path?: string): number {
    if (path) return this.listenerCounts.get(path) || 0;
    let total = 0;
    for (const count of this.listenerCounts.values()) total += count;
    return total;
  }
}

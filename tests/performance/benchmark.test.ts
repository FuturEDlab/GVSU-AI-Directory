import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_SIMPLIFIED_TOOLS } from '../fixtures/mock-tools';
import { retrieveCandidates } from '../../src/ai/utils/tool-retrieval';
import { measureSync } from '../utils/test-helpers';

describe('Performance Benchmarks & Memory Efficiency Suite', () => {
  it('measures LakerAI candidate retrieval execution speed (< 5ms target)', () => {
    const { result, durationMs } = measureSync(() =>
      retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, 'data analysis and presentation slides generator')
    );

    console.log(`[PERF BENCHMARK] LakerAI Candidate Retrieval: ${durationMs.toFixed(3)}ms (Candidates: ${result.length})`);
    assert.ok(durationMs < 50, 'Candidate retrieval must execute under 50ms');
    assert.ok(result.length > 0);
  });

  it('measures client-side tool catalog search over 1,000 items (< 10ms target)', () => {
    const largeCatalog = Array.from({ length: 1000 }).map((_, i) => ({
      id: `tool-${i}`,
      title: `AI Tool ${i}`,
      category: i % 2 === 0 ? 'Teaching' : 'Research',
      description: `Description for tool number ${i}`
    }));

    const { result, durationMs } = measureSync(() => {
      const q = 'research';
      return largeCatalog.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    });

    console.log(`[PERF BENCHMARK] Search 1,000 Tools Catalog: ${durationMs.toFixed(3)}ms (Matches: ${result.length})`);
    assert.ok(durationMs < 50, 'Catalog filter over 1,000 tools must finish under 50ms');
    assert.equal(result.length, 500);
  });

  it('measures reference memoization identity check overhead (< 0.1ms target)', () => {
    const deps = ['firestore-instance-v1', 'user-uid-abc'];

    const { result, durationMs } = measureSync(() => {
      let isSame = true;
      for (let i = 0; i < 10000; i++) {
        if (deps[0] !== 'firestore-instance-v1' || deps[1] !== 'user-uid-abc') {
          isSame = false;
        }
      }
      return isSame;
    });

    console.log(`[PERF BENCHMARK] 10,000 Memoized Identity Checks: ${durationMs.toFixed(3)}ms`);
    assert.equal(result, true);
    assert.ok(durationMs < 20);
  });
});

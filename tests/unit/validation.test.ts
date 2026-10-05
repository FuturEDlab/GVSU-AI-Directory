import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Validation & Anti-Hallucination Safety Suite', () => {
  it('rejects empty inputs and inputs exceeding 500 characters', () => {
    const validateQuestion = (q: string) => {
      if (!q || q.trim().length === 0) throw new Error('Question cannot be empty.');
      if (q.length > 500) throw new Error('Question is too long. Please limit to 500 characters.');
      return true;
    };

    assert.throws(() => validateQuestion(''), /Question cannot be empty./);
    assert.throws(() => validateQuestion('   '), /Question cannot be empty./);
    assert.throws(() => validateQuestion('a'.repeat(501)), /Question is too long. Please limit to 500 characters./);
    assert.equal(validateQuestion('Valid query'), true);
  });

  it('filters out hallucinated tool IDs not present in valid candidate list', () => {
    const validCandidateIds = new Set(['tool-gamma', 'tool-julius']);

    const rawRecommendations = [
      { toolId: 'tool-gamma', toolName: 'Gamma App', matchPercentage: 95, whyThisMatches: 'Direct match' },
      { toolId: 'fake-hallucinated-id', toolName: 'Hallucinated Tool', matchPercentage: 99, whyThisMatches: 'Invented by AI' },
      { toolId: 'tool-julius', toolName: 'Julius AI', matchPercentage: 85, whyThisMatches: 'Data match' },
    ];

    const filtered = rawRecommendations
      .filter(rec => validCandidateIds.has(rec.toolId))
      .filter(rec => rec.matchPercentage > 50 && rec.matchPercentage <= 100);

    assert.equal(filtered.length, 2);
    assert.equal(filtered.some(r => r.toolId === 'fake-hallucinated-id'), false, 'Hallucinated IDs MUST be filtered out');
  });

  it('enforces match percentage bounds (51-100) and limits recommendations to max 5', () => {
    const rawRecommendations = Array.from({ length: 10 }).map((_, i) => ({
      toolId: `tool-${i}`,
      toolName: `Tool ${i}`,
      matchPercentage: i % 2 === 0 ? 90 - i : 40 - i, // Some <= 50
      whyThisMatches: 'Explanation'
    }));

    const filtered = rawRecommendations
      .filter(rec => rec.matchPercentage > 50 && rec.matchPercentage <= 100)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5);

    assert.ok(filtered.length <= 5, 'Must hard cap recommendations at 5');
    assert.ok(filtered.every(r => r.matchPercentage > 50 && r.matchPercentage <= 100));
  });
});

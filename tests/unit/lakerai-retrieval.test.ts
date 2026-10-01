import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTokens, scoreTool, retrieveCandidates } from '../../src/ai/utils/tool-retrieval';
import { MOCK_SIMPLIFIED_TOOLS } from '../fixtures/mock-tools';

describe('LakerAI Retrieval & Intent Scoring Suite', () => {
  it('normalizeTokens correctly normalizes text and removes punctuation & stop words', () => {
    const raw = 'How do I analyze data & create a presentation slide?';
    const tokens = normalizeTokens(raw);
    assert.deepEqual(tokens, ['how', 'analyze', 'data', 'create', 'presentation', 'slide']);
  });

  it('scoreTool assigns higher scores to exact title & tag matches', () => {
    const gamma = MOCK_SIMPLIFIED_TOOLS.find(t => t.id === 'tool-gamma')!;

    const exactScore = scoreTool(gamma, ['presentation']);
    const descScore = scoreTool(gamma, ['academic']);
    const noMatchScore = scoreTool(gamma, ['recipe', 'cake']);

    assert.ok(exactScore > descScore, 'Exact title/tag token should score higher than description token');
    assert.equal(noMatchScore, 0, 'Unrelated tokens should score 0');
  });

  it('retrieveCandidates matches exact searches ("presentation tool")', () => {
    const candidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, 'presentation tool');
    assert.ok(candidates.length > 0);
    assert.equal(candidates[0].id, 'tool-gamma');
  });

  it('retrieveCandidates handles typos gracefully ("presntation tool")', () => {
    const candidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, 'presntation tool');
    assert.ok(candidates.length > 0);
    // Should still retrieve tools even with typo in token
    assert.ok(candidates.some(c => c.id === 'tool-gamma'));
  });

  it('retrieveCandidates handles semantic requests ("analyze data")', () => {
    const candidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, 'analyze data');
    assert.ok(candidates.length > 0);
    assert.equal(candidates[0].id, 'tool-julius');
  });

  it('retrieveCandidates handles typo in semantic requests ("analize data")', () => {
    const candidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, 'analize data');
    assert.ok(candidates.length > 0);
    assert.ok(candidates.some(c => c.id === 'tool-julius'));
  });

  it('retrieveCandidates handles research query ("research tool")', () => {
    const candidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, 'research tool');
    assert.ok(candidates.length > 0);
    assert.equal(candidates[0].id, 'tool-elicit');
  });

  it('retrieveCandidates handles unsupported query ("baking/cooking")', () => {
    const candidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, 'baking and cooking recipes');
    // Should return fallback pool (up to max 8/20) without error
    assert.ok(Array.isArray(candidates));
    assert.ok(candidates.length <= 20);
  });

  it('handles empty input and very long input bounds', () => {
    const emptyTokens = normalizeTokens('');
    assert.deepEqual(emptyTokens, []);

    const emptyCandidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, '');
    assert.ok(Array.isArray(emptyCandidates));

    const longQuery = 'tool '.repeat(200);
    const longCandidates = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, longQuery);
    assert.ok(longCandidates.length <= 20);
  });
});

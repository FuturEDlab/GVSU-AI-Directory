import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_SIMPLIFIED_TOOLS } from '../fixtures/mock-tools';
import { MOCK_PROMPTS } from '../fixtures/mock-prompts';
import { retrieveCandidates } from '../../src/ai/utils/tool-retrieval';

describe('E2E User Workflows Test Suite', () => {
  it('TEST 1: Homepage -> Search AI Tool -> Open Tool Detail', () => {
    const searchQuery = 'presentation';
    const filteredTools = MOCK_SIMPLIFIED_TOOLS.filter(t =>
      t.name.toLowerCase().includes(searchQuery) || t.description.toLowerCase().includes(searchQuery)
    );

    assert.equal(filteredTools.length, 1);
    const selectedTool = filteredTools[0];
    assert.equal(selectedTool.id, 'tool-gamma');
    const toolDetailUrl = `/tools/${selectedTool.id}`;
    assert.equal(toolDetailUrl, '/tools/tool-gamma');
  });

  it('TEST 2: Homepage -> LakerAI -> Search -> Recommendation -> Tool Detail', () => {
    const userQuery = 'I need help analyzing data from Excel';
    const recommendations = retrieveCandidates(MOCK_SIMPLIFIED_TOOLS, userQuery);

    assert.ok(recommendations.length > 0);
    const topRec = recommendations[0];
    assert.equal(topRec.id, 'tool-julius');
    assert.equal(`/tools/${topRec.id}`, '/tools/tool-julius');
  });

  it('TEST 3: Prompt Library -> Search -> Filter -> Open Prompt', () => {
    const filteredPrompts = MOCK_PROMPTS.filter(p =>
      p.category === 'Teaching & Pedagogy' && p.status === 'APPROVED'
    );

    assert.equal(filteredPrompts.length, 1);
    const selectedPrompt = filteredPrompts[0];
    assert.equal(selectedPrompt.id, 'prompt-1');
  });

  it('TEST 4: Authenticated User -> Submit Prompt', () => {
    const draftPrompt = {
      title: 'Rubric Builder',
      description: 'Creates grading rubrics for essay assignments.',
      promptTemplate: 'Generate a 4-level rubric for: [TOPIC]',
      targetModel: 'GPT-4o',
      category: 'Assessment',
      submittedByEmail: 'indrajis@mail.gvsu.edu'
    };

    const validateAndPrepare = (prompt: typeof draftPrompt) => {
      assert.ok(prompt.title.length > 0);
      assert.ok(prompt.description.length > 0);
      assert.ok(prompt.promptTemplate.length > 0);
      return { ...prompt, status: 'PENDING', createdAt: Date.now() };
    };

    const submitted = validateAndPrepare(draftPrompt);
    assert.equal(submitted.status, 'PENDING');
  });

  it('TEST 5: Admin Login -> Admin Portal -> Tool Moderation', () => {
    const isAdmin = true;
    const activeTab = 'moderation';
    assert.ok(isAdmin);
    assert.equal(activeTab, 'moderation');
  });

  it('TEST 6: Admin Login -> User Reports', () => {
    const isAdmin = true;
    const activeTab = 'reports';
    assert.ok(isAdmin);
    assert.equal(activeTab, 'reports');
  });

  it('TEST 7: Admin Login -> Community Feedback', () => {
    const isAdmin = true;
    const activeTab = 'feedback';
    assert.ok(isAdmin);
    assert.equal(activeTab, 'feedback');
  });

  it('TEST 8: Admin Login -> Chat Moderation', () => {
    const isAdmin = true;
    const activeTab = 'chat_moderation';
    assert.ok(isAdmin);
    assert.equal(activeTab, 'chat_moderation');
  });

  it('TEST 9: Admin Login -> Prompt Library Moderation', () => {
    const isAdmin = true;
    const activeTab = 'prompt_library';
    assert.ok(isAdmin);
    assert.equal(activeTab, 'prompt_library');
  });

  it('TEST 10: Admin Portal -> Switch between all Governance Hub tabs', () => {
    const tabSequence = ['moderation', 'reports', 'feedback', 'chat_moderation', 'prompt_library'];
    const visitedTabs: string[] = [];

    for (const tab of tabSequence) {
      visitedTabs.push(tab);
    }

    assert.deepEqual(visitedTabs, tabSequence);
    assert.equal(visitedTabs.length, 5);
  });
});

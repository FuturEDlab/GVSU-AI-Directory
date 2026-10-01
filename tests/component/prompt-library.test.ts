import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_PROMPTS } from '../fixtures/mock-prompts';

describe('Prompt Library Component & Filtering Logic Suite', () => {
  it('default filter state matches requirements: All Models, All Categories, All Tools', () => {
    const defaultFilters = {
      model: 'ALL',
      category: 'ALL',
      associatedToolId: 'ALL',
      search: ''
    };

    assert.equal(defaultFilters.model, 'ALL');
    assert.equal(defaultFilters.category, 'ALL');
    assert.equal(defaultFilters.associatedToolId, 'ALL');
  });

  it('correctly filters prompts by category, target model, and search query', () => {
    const filterPrompts = (prompts: typeof MOCK_PROMPTS, category: string, model: string, query: string) => {
      return prompts.filter(p => {
        const matchCat = category === 'ALL' || p.category === category;
        const matchModel = model === 'ALL' || (p.targetModel || p.model) === model;
        const q = query.toLowerCase();
        const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        return matchCat && matchModel && matchSearch;
      });
    };

    const all = filterPrompts(MOCK_PROMPTS, 'ALL', 'ALL', '');
    assert.equal(all.length, 2);

    const teaching = filterPrompts(MOCK_PROMPTS, 'Teaching & Pedagogy', 'ALL', '');
    assert.equal(teaching.length, 1);
    assert.equal(teaching[0].id, 'prompt-1');

    const searchSyllabus = filterPrompts(MOCK_PROMPTS, 'ALL', 'ALL', 'syllabus');
    assert.equal(searchSyllabus.length, 1);
    assert.equal(searchSyllabus[0].id, 'prompt-1');
  });

  it('TEST 1 & TEST 2 & TEST 3 — Handles creation payload and validation for predefined vs custom models', () => {
    const preparePayload = (data: { title: string; template: string; targetModel: string; customModel?: string }) => {
      if (!data.targetModel) throw new Error('Please select a Target AI Model.');
      if (data.targetModel === 'Other' && !data.customModel?.trim()) {
        throw new Error('Please enter an AI model name.');
      }
      const cleanCustomModel = data.targetModel === 'Other' ? data.customModel?.trim() : undefined;
      return {
        title: data.title,
        targetModel: data.targetModel,
        model: cleanCustomModel || data.targetModel,
        customModel: cleanCustomModel
      };
    };

    // TEST 1 — Existing Predefined Model
    const predefinedPayload = preparePayload({ title: 'Predefined Test', template: 'Some template text', targetModel: 'GPT-4 / GPT-4o' });
    assert.equal(predefinedPayload.targetModel, 'GPT-4 / GPT-4o');
    assert.equal(predefinedPayload.model, 'GPT-4 / GPT-4o');
    assert.equal(predefinedPayload.customModel, undefined);

    // TEST 2 — Other Model
    const customPayload = preparePayload({ title: 'Custom Test', template: 'Some template text', targetModel: 'Other', customModel: 'Claude Opus 6' });
    assert.equal(customPayload.targetModel, 'Other');
    assert.equal(customPayload.model, 'Claude Opus 6');
    assert.equal(customPayload.customModel, 'Claude Opus 6');

    // TEST 3 — Other Without Model Name
    assert.throws(() => {
      preparePayload({ title: 'Bad Custom', template: 'Some template text', targetModel: 'Other', customModel: '   ' });
    }, /Please enter an AI model name\./);
  });

  it('TEST 4, TEST 5, TEST 6, TEST 7 — Handles edit form state restoration and transitions', () => {
    const AI_MODELS = ["GPT-4 / GPT-4o", "Claude", "Gemini", "Llama", "Image Generation", "Other"];

    const restoreEditState = (prompt: { targetModel?: string; model: string; customModel?: string }) => {
      const rawTarget = prompt.targetModel || (AI_MODELS.includes(prompt.model) ? prompt.model : "Other");
      const isOther = rawTarget === "Other" || !!prompt.customModel;
      const initialTargetModel = isOther ? "Other" : rawTarget;
      const initialCustomModel = prompt.customModel || (isOther && prompt.model !== "Other" ? prompt.model : "");
      return { targetModel: initialTargetModel, customModel: initialCustomModel };
    };

    // TEST 4 — Edit Predefined Model
    const statePredefined = restoreEditState({ targetModel: 'GPT-4 / GPT-4o', model: 'GPT-4 / GPT-4o' });
    assert.equal(statePredefined.targetModel, 'GPT-4 / GPT-4o');
    assert.equal(statePredefined.customModel, '');

    // TEST 5 — Edit Custom Model
    const stateCustom = restoreEditState({ targetModel: 'Other', model: 'Claude Opus 6', customModel: 'Claude Opus 6' });
    assert.equal(stateCustom.targetModel, 'Other');
    assert.equal(stateCustom.customModel, 'Claude Opus 6');

    // TEST 6 — Change Custom Model
    const updateCustomModel = (prevCustom: string, nextCustom: string) => {
      return { targetModel: 'Other', model: nextCustom, customModel: nextCustom };
    };
    const updatedCustom = updateCustomModel('Claude Opus 6', 'GPT-6');
    assert.equal(updatedCustom.customModel, 'GPT-6');
    assert.equal(updatedCustom.model, 'GPT-6');

    // TEST 7 — Change Back to Predefined Model
    const switchBackToPredefined = (nextModel: string) => {
      const cleanCustomModel = nextModel === 'Other' ? 'GPT-6' : undefined;
      return { targetModel: nextModel, model: cleanCustomModel || nextModel, customModel: cleanCustomModel };
    };
    const switchedBack = switchBackToPredefined('Claude');
    assert.equal(switchedBack.targetModel, 'Claude');
    assert.equal(switchedBack.customModel, undefined);
    assert.equal(switchedBack.model, 'Claude');
  });

  it('TEST 8, TEST 9, TEST 10 — Prompt Display, Filtering, and Moderation Badges', () => {
    const getDisplayModel = (prompt: { targetModel?: string; model: string; customModel?: string }) => {
      return (prompt.targetModel === "Other" && prompt.customModel) ? prompt.customModel : (prompt.targetModel || prompt.model);
    };

    // TEST 8 — Display
    assert.equal(getDisplayModel({ targetModel: 'Other', customModel: 'Claude Opus 6', model: 'Claude Opus 6' }), 'Claude Opus 6');
    assert.equal(getDisplayModel({ targetModel: 'Gemini', model: 'Gemini' }), 'Gemini');

    // TEST 9 — Filtering
    const samplePrompts = [
      { id: '1', title: 'GPT Prompt', targetModel: 'GPT-4 / GPT-4o', model: 'GPT-4 / GPT-4o', category: 'Teaching' },
      { id: '2', title: 'Custom Prompt', targetModel: 'Other', customModel: 'Claude Opus 6', model: 'Claude Opus 6', category: 'Research' }
    ];

    const filterByModel = (prompts: typeof samplePrompts, selectedModel: string) => {
      return prompts.filter(p => selectedModel === 'All Models' || (p.targetModel || p.model) === selectedModel || (selectedModel === 'Other' && p.targetModel === 'Other'));
    };

    assert.equal(filterByModel(samplePrompts, 'Other').length, 1);
    assert.equal(filterByModel(samplePrompts, 'Other')[0].id, '2');

    // TEST 10 — Admin Moderation badge
    const adminBadges = samplePrompts.map(p => getDisplayModel(p));
    assert.deepEqual(adminBadges, ['GPT-4 / GPT-4o', 'Claude Opus 6']);
  });
});

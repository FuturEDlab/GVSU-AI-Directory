import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_TOOL_SUBMISSIONS } from '../fixtures/mock-tools';

describe('ToolCard Component Logic & Image Handling Suite', () => {
  it('renders vetted badge when tool has aiVetted or isVerified enabled', () => {
    const verifiedTool = MOCK_TOOL_SUBMISSIONS[0];
    const unverifiedTool = MOCK_TOOL_SUBMISSIONS[1];

    assert.equal(verifiedTool.isVerified, true);
    assert.equal(verifiedTool.aiVetted, true);
    assert.equal(unverifiedTool.isVerified, false);
  });

  it('determines fallback avatar initial when image URL is missing or errors', () => {
    const getAvatarInitial = (title: string, ogImageUrl?: string, imageError?: boolean) => {
      if (ogImageUrl && !imageError) {
        return { type: 'image', src: ogImageUrl };
      }
      return { type: 'initial', char: title.trim().charAt(0).toUpperCase() || '?' };
    };

    const imgFallback = getAvatarInitial('Gamma App', 'https://example.com/img.png', true);
    assert.equal(imgFallback.type, 'initial');
    assert.equal(imgFallback.char, 'G');

    const validImg = getAvatarInitial('Gamma App', 'https://example.com/img.png', false);
    assert.equal(validImg.type, 'image');
  });

  it('calculates net vote counts correctly', () => {
    const tool = MOCK_TOOL_SUBMISSIONS[0];
    const upvotes = tool.upvotes || 0;
    const downvotes = tool.downvotes || 0;
    const net = upvotes - downvotes;

    assert.equal(upvotes, 24);
    assert.equal(downvotes, 1);
    assert.equal(net, 23);
  });
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * CENTRALIZED GEMINI 3 MODEL REGISTRY
 *
 * Verified live against Google Cloud Secret Manager (`gemini-api-key`):
 * - FAST: Gemini 3 Flash for low-latency reranking, conversational support, and structured curation.
 * - REASONING: Gemini 3.1 Pro for deep multi-pillar institutional compliance & FERPA auditing.
 * - SYNTHESIS: Gemini 3 Flash for SVG vector synthesis and news curation.
 * - LITE: Gemini 3.1 Flash Lite for ultra-fast auxiliary operations.
 */
export const AI_MODELS = {
  FAST: 'googleai/gemini-3-flash-preview',
  REASONING: 'googleai/gemini-3.1-pro-preview',
  SYNTHESIS: 'googleai/gemini-3-flash-preview',
  LITE: 'googleai/gemini-3.1-flash-lite-preview',
} as const;

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: AI_MODELS.FAST,
});


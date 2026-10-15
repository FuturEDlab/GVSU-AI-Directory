import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * GENKIT SERVICE INITIALIZATION
 * 
 * CRITICAL DIRECTIVE FOR DEVELOPERS & AI AGENTS:
 * ALWAYS use the latest production-ready Gemini model (currently 'googleai/gemini-2.5-flash').
 * NEVER downgrade, revert, or fallback to deprecated or out-of-date models (such as 'gemini-1.5-flash' or older).
 */
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: 'googleai/gemini-2.5-flash',
});

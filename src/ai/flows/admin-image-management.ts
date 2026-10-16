'use server';

import { ai, AI_MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { scrapeVendorWebsite } from '@/ai/utils/web-scraper';

const ImageDiscoveryInput = z.object({
  url: z
    .string()
    .url()
    .max(2048)
    .describe('The vendor URL to scan for verified OpenGraph or Twitter preview images.'),
});

/**
 * Server action to scrape official og:image or twitter:image and verify HTTP 200 image/* response.
 * Delegates to the unified SSRF-hardened `scrapeVendorWebsite` utility.
 */
export async function findOfficialImage(input: z.infer<typeof ImageDiscoveryInput>) {
  try {
    const parsedInput = ImageDiscoveryInput.parse(input);
    const scraped = await scrapeVendorWebsite(parsedInput.url);
    if (scraped.imageUrl) {
      return { success: true, url: scraped.imageUrl, error: null };
    }
    return {
      success: false,
      url: null,
      error:
        scraped.error || 'No reachable HTTP 200 Open Graph or Twitter image found on the site.',
    };
  } catch (err: any) {
    return { success: false, url: null, error: err.message || 'Error occurred while scanning.' };
  }
}

const ImageGenerationInput = z.object({
  toolTitle: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .describe('The title of the AI tool.'),
  toolCategory: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .describe('The academic category of the AI tool.'),
  toolDescription: z
    .string()
    .trim()
    .max(2000)
    .describe('The description or pedagogical narrative of the AI tool.'),
});

const generateSvgPrompt = ai.definePrompt({
  name: 'generateSvgPrompt',
  model: AI_MODELS.SYNTHESIS,
  input: { schema: ImageGenerationInput },
  output: {
    schema: z
      .string()
      .describe('Valid standalone <svg viewBox="0 0 800 450">...</svg> markup with no markdown fences.'),
  },
  config: { temperature: 0.3 },
  prompt: `<system_role>
You are the Principal Brand & Vector Illustrator for Grand Valley State University's LakerAI Directory.
Generate a sleek, modern 16:9 SVG card illustration representing the specified academic AI tool.
</system_role>

<brand_guidelines>
- Primary Brand Palette: GVSU Laker Blue (#0032A0), Deep Midnight (#0F172A), Vibrant Laker Accent Purple (#601EE3), and Soft Ice Blue (#93C5FD).
- Do NOT reproduce copyrighted vendor trademarks. Instead, combine geometric vector motifs, abstract neural/workflow nodes, and clean typography featuring the tool's title and category.
</brand_guidelines>

<tool_context>
  <title>{{{toolTitle}}}</title>
  <category>{{{toolCategory}}}</category>
  <description>{{{toolDescription}}}</description>
</tool_context>

<svg_constraints>
1. Return ONLY raw valid XML starting with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450"> and ending with </svg>.
2. Do NOT wrap the output in markdown code blocks.
3. Ensure high contrast and visual polish suitable for a university directory card header.
</svg_constraints>`,
});

function buildDeterministicSvg(title: string, category: string): string {
  const safeTitle = title.replace(/[<>&"']/g, '');
  const safeCat = category.replace(/[<>&"']/g, '').toUpperCase();
  const initials = safeTitle.substring(0, 2).toUpperCase() || 'AI';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="gvsu-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0032A0" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#gvsu-grad)" />
  <rect x="56" y="52" width="108" height="108" rx="26" fill="#FFFFFF" fill-opacity="0.15" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2" />
  <text x="110" y="124" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="48" font-weight="800">${initials}</text>
  <text x="56" y="252" fill="#93C5FD" font-family="system-ui, sans-serif" font-size="15" font-weight="800" letter-spacing="2.5">${safeCat}</text>
  <text x="56" y="314" fill="#FFFFFF" font-family="Georgia, serif" font-size="50" font-weight="900">${safeTitle}</text>
  <text x="56" y="358" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="19" font-weight="500" opacity="0.9">LakerAI Institutional Directory</text>
</svg>`;
}

/**
 * Server action to generate a professional SVG visual using Gemini 3 Flash, with deterministic SVG fallback.
 */
export async function generateProfessionalImage(input: z.infer<typeof ImageGenerationInput>) {
  const parsedInput = ImageGenerationInput.parse(input);
  try {
    const { output } = await generateSvgPrompt(parsedInput);
    if (output) {
      let svg = output.trim();
      if (svg.startsWith('```svg')) svg = svg.replace(/^```svg/, '');
      if (svg.startsWith('```xml')) svg = svg.replace(/^```xml/, '');
      if (svg.startsWith('```')) svg = svg.replace(/^```/, '');
      if (svg.endsWith('```')) svg = svg.replace(/```$/, '');
      svg = svg.trim();

      if (svg.startsWith('<svg')) {
        const base64Svg = Buffer.from(svg).toString('base64');
        return { success: true, url: `data:image/svg+xml;base64,${base64Svg}`, error: null };
      }
    }
  } catch (err) {
    console.warn(
      'Gemini 3 SVG generation unavailable; falling back to deterministic GVSU SVG template:',
      err
    );
  }

  const fallbackSvg = buildDeterministicSvg(parsedInput.toolTitle, parsedInput.toolCategory);
  const base64Fallback = Buffer.from(fallbackSvg).toString('base64');
  return {
    success: true,
    url: `data:image/svg+xml;base64,${base64Fallback}`,
    error: null,
  };
}

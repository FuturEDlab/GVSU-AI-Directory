'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

const ImageDiscoveryInput = z.object({
  url: z.string().url(),
});

/**
 * Server action to scrape official og:image or twitter:image.
 * Reuses the logic from automatedVettingAgent for consistency.
 */
export async function findOfficialImage(input: z.infer<typeof ImageDiscoveryInput>) {
  try {
    const response = await fetch(input.url, { 
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (LakerAI Academic Auditor)' }
    });
    if (!response.ok) return { success: false, url: null, error: 'Failed to fetch url' };
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const imageUrl = $('meta[property="og:image"]').attr('content') || 
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('link[rel="apple-touch-icon"]').attr('href');
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = new URL(input.url);
      return { success: true, url: `${baseUrl.protocol}//${baseUrl.host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`, error: null };
    }
    
    if (imageUrl) {
      return { success: true, url: imageUrl, error: null };
    }
    
    return { success: false, url: null, error: 'No official Open Graph or Twitter image found on the site.' };
  } catch (err: any) {
    return { success: false, url: null, error: err.message || 'Error occurred while scanning.' };
  }
}

const ImageGenerationInput = z.object({
  toolTitle: z.string(),
  toolCategory: z.string(),
  toolDescription: z.string(),
});

const generateSvgPrompt = ai.definePrompt({
  name: 'generateSvgPrompt',
  input: { schema: ImageGenerationInput },
  output: { schema: z.string() },
  config: { temperature: 0.4 },
  prompt: `You are an expert graphic designer.
Your task is to generate a professional, sleek, flat-design SVG illustration representing a specific software tool.
The SVG must be beautiful, modern, and use a harmonious color palette suitable for a professional directory.
Do NOT use copyrighted logos. Create an abstract or metaphorical representation of the tool's purpose.

Tool Title: {{{toolTitle}}}
Category: {{{toolCategory}}}
Description: {{{toolDescription}}}

Requirements:
1. Return ONLY the raw SVG code. Do not include markdown formatting like \`\`\`svg.
2. The SVG must have a viewBox of "0 0 800 600".
3. Use a modern, dark or rich background with vibrant accent elements.
4. Keep it relatively simple but professional (e.g. geometric shapes, subtle gradients, nodes, abstract workflows).
5. Ensure valid XML/SVG syntax.
`,
});

/**
 * Server action to generate a professional SVG visual using Gemini.
 */
export async function generateProfessionalImage(input: z.infer<typeof ImageGenerationInput>) {
  try {
    const { output } = await generateSvgPrompt(input);
    if (!output) {
      return { success: false, url: null, error: 'Generation returned empty output.' };
    }
    
    // Clean up potential markdown if Gemini includes it despite instructions
    let svg = output.trim();
    if (svg.startsWith('```svg')) svg = svg.replace(/^```svg/, '');
    if (svg.startsWith('```xml')) svg = svg.replace(/^```xml/, '');
    if (svg.startsWith('```')) svg = svg.replace(/^```/, '');
    if (svg.endsWith('```')) svg = svg.replace(/```$/, '');
    
    svg = svg.trim();
    
    // Convert to a base64 Data URI so it can be used directly in an <img> tag or uploaded to storage
    const base64Svg = Buffer.from(svg).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;
    
    return { success: true, url: dataUrl, error: null };
  } catch (err: any) {
    return { success: false, url: null, error: err.message || 'Error generating image.' };
  }
}

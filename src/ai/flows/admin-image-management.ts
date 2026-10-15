'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

function isPrivateOrReservedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '0:0:0:0:0:0:0:1' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower === 'metadata.google.internal'
  ) {
    return true;
  }

  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    ) {
      return true;
    }
  }

  if (
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80:') ||
    lower.startsWith('::ffff:127.') ||
    lower.startsWith('::ffff:10.') ||
    lower.startsWith('::ffff:192.168.') ||
    lower.startsWith('::ffff:169.254.')
  ) {
    return true;
  }

  return false;
}

const ImageDiscoveryInput = z.object({
  url: z.string().url().max(2048),
});

/**
 * Server action to scrape official og:image or twitter:image.
 * Reuses the SSRF and protocol validation logic from automatedVettingAgent for consistency.
 */
export async function findOfficialImage(input: z.infer<typeof ImageDiscoveryInput>) {
  try {
    const parsedInput = ImageDiscoveryInput.parse(input);
    const parsed = new URL(parsedInput.url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { success: false, url: null, error: 'Unsupported URL protocol.' };
    }
    if (isPrivateOrReservedHost(parsed.hostname)) {
      return { success: false, url: null, error: 'Private or reserved hosts are not allowed.' };
    }

    const response = await fetch(parsed.toString(), { 
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (LakerAI Academic Auditor)' }
    });
    if (!response.ok) return { success: false, url: null, error: 'Failed to fetch url' };

    if (response.url) {
      const finalParsed = new URL(response.url);
      if (
        (finalParsed.protocol !== 'http:' && finalParsed.protocol !== 'https:') ||
        isPrivateOrReservedHost(finalParsed.hostname)
      ) {
        return { success: false, url: null, error: 'Redirected to disallowed host.' };
      }
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const imageUrl = $('meta[property="og:image"]').attr('content') || 
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('link[rel="apple-touch-icon"]').attr('href');
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = new URL(parsed.toString());
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
  toolTitle: z.string().trim().min(1).max(100),
  toolCategory: z.string().trim().min(1).max(100),
  toolDescription: z.string().trim().max(2000),
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

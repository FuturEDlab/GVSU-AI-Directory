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

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 (LakerAI Academic Auditor)';

async function verifyReachableImageUrl(candidateUrl: string): Promise<string | null> {
  try {
    const imgParsed = new URL(candidateUrl);
    if (imgParsed.protocol !== 'http:' && imgParsed.protocol !== 'https:') {
      return null;
    }
    if (isPrivateOrReservedHost(imgParsed.hostname)) {
      return null;
    }

    const imgRes = await fetch(imgParsed.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!imgRes.ok) return null;

    if (imgRes.url) {
      const finalImgParsed = new URL(imgRes.url);
      if (
        (finalImgParsed.protocol !== 'http:' && finalImgParsed.protocol !== 'https:') ||
        isPrivateOrReservedHost(finalImgParsed.hostname)
      ) {
        return null;
      }
    }

    const contentType = (imgRes.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return null;
    }

    return imgRes.url || imgParsed.toString();
  } catch {
    return null;
  }
}

const ImageDiscoveryInput = z.object({
  url: z.string().url().max(2048),
});

/**
 * Server action to scrape official og:image or twitter:image and verify HTTP 200 image/* response.
 * Enforces SSRF and protocol validation on both the target page and the discovered image URL.
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
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) {
      return { success: false, url: null, error: `Failed to fetch URL (HTTP ${response.status}).` };
    }

    const finalPageUrl = response.url || parsed.toString();
    const finalParsed = new URL(finalPageUrl);
    if (
      (finalParsed.protocol !== 'http:' && finalParsed.protocol !== 'https:') ||
      isPrivateOrReservedHost(finalParsed.hostname)
    ) {
      return { success: false, url: null, error: 'Redirected to disallowed host.' };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const rawCandidates = [
      $('meta[property="og:image"]').attr('content'),
      $('meta[property="og:image:secure_url"]').attr('content'),
      $('meta[property="og:image:url"]').attr('content'),
      $('meta[name="twitter:image"]').attr('content'),
      $('meta[name="twitter:image:src"]').attr('content'),
      $('link[rel="apple-touch-icon"]').attr('href'),
    ].filter((c): c is string => Boolean(c && c.trim()));

    for (const raw of rawCandidates) {
      let resolved: string;
      try {
        resolved = new URL(raw.trim(), finalPageUrl).toString();
      } catch {
        continue;
      }
      const verified = await verifyReachableImageUrl(resolved);
      if (verified) {
        return { success: true, url: verified, error: null };
      }
    }

    return {
      success: false,
      url: null,
      error: 'No reachable HTTP 200 Open Graph or Twitter image found on the site.',
    };
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
 * Server action to generate a professional SVG visual using Gemini, with deterministic SVG fallback.
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
    console.warn('Gemini SVG generation unavailable; falling back to deterministic GVSU SVG template:', err);
  }

  const fallbackSvg = buildDeterministicSvg(parsedInput.toolTitle, parsedInput.toolCategory);
  const base64Fallback = Buffer.from(fallbackSvg).toString('base64');
  return {
    success: true,
    url: `data:image/svg+xml;base64,${base64Fallback}`,
    error: null,
  };
}

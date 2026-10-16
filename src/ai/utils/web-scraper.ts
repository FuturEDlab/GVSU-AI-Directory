import * as cheerio from 'cheerio';

export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 (LakerAI Academic Auditor)';

/**
 * Validates that a hostname does not point to private, loopback, link-local, or cloud metadata networks.
 */
export function isPrivateOrReservedHost(hostname: string): boolean {
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

  // IPv4 private/reserved ranges
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

  // IPv6 private/loopback/link-local ranges
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

/**
 * Verifies that a candidate image URL is safe (non-SSRF, http/https) and returns HTTP 200 with an `image/*` Content-Type.
 */
export async function verifyReachableImageUrl(candidateUrl: string): Promise<string | null> {
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

export interface ScrapedVendorMetadata {
  success: boolean;
  finalUrl: string | null;
  imageUrl: string | null;
  pageTitle: string | null;
  metaDescription: string | null;
  ogDescription: string | null;
  siteName: string | null;
  error: string | null;
}

/**
 * Performs a single SSRF-hardened fetch of a vendor URL to extract both its verified
 * OpenGraph/Twitter preview image and its page metadata (`<title>`, `meta[name="description"]`, `og:description`).
 */
export async function scrapeVendorWebsite(rawUrl: string): Promise<ScrapedVendorMetadata> {
  const emptyResult = (error: string): ScrapedVendorMetadata => ({
    success: false,
    finalUrl: null,
    imageUrl: null,
    pageTitle: null,
    metaDescription: null,
    ogDescription: null,
    siteName: null,
    error,
  });

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return emptyResult('Unsupported URL protocol.');
    }
    if (isPrivateOrReservedHost(parsed.hostname)) {
      return emptyResult('Private or reserved hosts are not allowed.');
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
      return emptyResult(`Failed to fetch URL (HTTP ${response.status}).`);
    }

    const finalPageUrl = response.url || parsed.toString();
    const finalParsed = new URL(finalPageUrl);
    if (
      (finalParsed.protocol !== 'http:' && finalParsed.protocol !== 'https:') ||
      isPrivateOrReservedHost(finalParsed.hostname)
    ) {
      return emptyResult('Redirected to disallowed host.');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const pageTitle =
      ($('meta[property="og:title"]').attr('content') || $('title').first().text() || '')
        .trim()
        .substring(0, 300) || null;
    const metaDescription =
      ($('meta[name="description"]').attr('content') || '').trim().substring(0, 1000) || null;
    const ogDescription =
      (
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        ''
      )
        .trim()
        .substring(0, 1000) || null;
    const siteName =
      ($('meta[property="og:site_name"]').attr('content') || '').trim().substring(0, 200) || null;

    const rawCandidates = [
      $('meta[property="og:image"]').attr('content'),
      $('meta[property="og:image:secure_url"]').attr('content'),
      $('meta[property="og:image:url"]').attr('content'),
      $('meta[name="twitter:image"]').attr('content'),
      $('meta[name="twitter:image:src"]').attr('content'),
      $('link[rel="apple-touch-icon"]').attr('href'),
    ].filter((c): c is string => Boolean(c && c.trim()));

    let verifiedImageUrl: string | null = null;
    for (const raw of rawCandidates) {
      let resolved: string;
      try {
        resolved = new URL(raw.trim(), finalPageUrl).toString();
      } catch {
        continue;
      }
      const verified = await verifyReachableImageUrl(resolved);
      if (verified) {
        verifiedImageUrl = verified;
        break;
      }
    }

    return {
      success: true,
      finalUrl: finalPageUrl,
      imageUrl: verifiedImageUrl,
      pageTitle,
      metaDescription,
      ogDescription,
      siteName,
      error: verifiedImageUrl
        ? null
        : 'No reachable HTTP 200 Open Graph or Twitter image found on the site.',
    };
  } catch (err: any) {
    return emptyResult(err?.message || 'Error occurred while scanning vendor URL.');
  }
}

/**
 * Shared URL scraping helper for Smart Import edge functions.
 *
 * Scrape chain:
 * 1) Firecrawl rendered markdown (when FIRECRAWL_API_KEY exists)
 * 2) Direct fetch with browser-like headers
 * 3) Reader proxy fallback for bot-protected pages (optional)
 */

export type UrlScrapeMethod = 'firecrawl' | 'fetch' | 'reader_proxy';

export interface UrlScrapeResult {
  content: string;
  method: UrlScrapeMethod;
}

interface ScrapeOptions {
  logPrefix: string;
  allowReaderProxy?: boolean;
}

const MIN_CONTENT_LENGTH = 50;

function log(prefix: string, message: string): void {
  console.log(`[${prefix}] ${message}`);
}

async function scrapeWithFirecrawl(
  url: string,
  logPrefix: string,
): Promise<UrlScrapeResult | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    log(logPrefix, 'FIRECRAWL_API_KEY not set, skipping Firecrawl');
    return null;
  }

  try {
    log(logPrefix, 'Attempting Firecrawl scrape...');
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[${logPrefix}] Firecrawl error ${response.status}:`, errorData);
      return null;
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown || '';
    if (!markdown || markdown.trim().length < MIN_CONTENT_LENGTH) {
      log(logPrefix, 'Firecrawl returned empty/minimal content, falling back');
      return null;
    }

    log(logPrefix, `Firecrawl success: ${markdown.length} chars of markdown`);
    return { content: markdown, method: 'firecrawl' };
  } catch (err) {
    console.error(`[${logPrefix}] Firecrawl failed:`, err);
    return null;
  }
}

async function scrapeWithFetch(url: string, logPrefix: string): Promise<UrlScrapeResult | null> {
  try {
    log(logPrefix, 'Falling back to raw fetch...');
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!pageResponse.ok) {
      log(logPrefix, `HTTP ${pageResponse.status} from ${url}`);
      return null;
    }

    const html = await pageResponse.text();
    log(logPrefix, `Raw fetch success: ${html.length} chars`);
    return { content: html, method: 'fetch' };
  } catch (err) {
    console.error(`[${logPrefix}] Fetch error:`, err);
    return null;
  }
}

async function scrapeWithReaderProxy(
  url: string,
  logPrefix: string,
): Promise<UrlScrapeResult | null> {
  const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;

  try {
    log(logPrefix, 'Trying reader proxy fallback...');
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Chravel-SmartImport/1.0',
        Accept: 'text/plain,text/markdown,text/html;q=0.8,*/*;q=0.5',
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      log(logPrefix, `Reader proxy failed with HTTP ${response.status}`);
      return null;
    }

    const content = await response.text();
    if (content.trim().length < MIN_CONTENT_LENGTH) {
      log(logPrefix, 'Reader proxy returned minimal content');
      return null;
    }

    log(logPrefix, `Reader proxy success: ${content.length} chars`);
    return { content, method: 'reader_proxy' };
  } catch (err) {
    console.error(`[${logPrefix}] Reader proxy failed:`, err);
    return null;
  }
}

export async function scrapeUrlContentForAi(
  url: string,
  options: ScrapeOptions,
): Promise<UrlScrapeResult | null> {
  const { logPrefix, allowReaderProxy = true } = options;

  const firecrawl = await scrapeWithFirecrawl(url, logPrefix);
  if (firecrawl) return firecrawl;

  const fetchResult = await scrapeWithFetch(url, logPrefix);
  if (fetchResult) return fetchResult;

  if (!allowReaderProxy) return null;
  return scrapeWithReaderProxy(url, logPrefix);
}

export function getScrapeContentTypeLabel(method: UrlScrapeMethod): string {
  switch (method) {
    case 'firecrawl':
      return 'rendered webpage content (markdown)';
    case 'reader_proxy':
      return 'reader-friendly webpage text';
    case 'fetch':
    default:
      return 'webpage HTML';
  }
}

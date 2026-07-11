import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/invite-preview';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

function makeRequest(url: string, userAgent?: string): Request {
  return new Request(url, {
    headers: userAgent ? { 'User-Agent': userAgent } : undefined,
  });
}

describe('api/invite-preview', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 400 when code is missing', async () => {
    const response = await handler(
      makeRequest('https://chravel.app/api/invite-preview', BROWSER_UA),
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Invalid Invite Link');
  });

  it('proxies OG HTML from generate-invite-preview for crawler user agents', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<!doctype html><html><body>OG CARD</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    );
    global.fetch = fetchMock as typeof global.fetch;

    const response = await handler(
      makeRequest('https://chravel.app/api/invite-preview?code=chravelabc123', 'Twitterbot/1.0'),
    );
    const body = await response.text();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const upstreamUrl = fetchMock.mock.calls[0][0] as string;
    expect(upstreamUrl).toContain('generate-invite-preview?code=chravelabc123');
    expect(upstreamUrl).toContain(encodeURIComponent('https://chravel.app/j/chravelabc123'));
    expect(response.status).toBe(200);
    expect(response.headers.get('vary')).toBe('User-Agent');
    expect(body).toContain('OG CARD');
  });

  it('serves the SPA shell to real browsers (no meta-refresh loop)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<!doctype html><html><body><div id="root"></div></body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    );
    global.fetch = fetchMock as typeof global.fetch;

    const response = await handler(
      makeRequest('https://chravel.app/api/invite-preview?code=chravelabc123', BROWSER_UA),
    );
    const body = await response.text();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://chravel.app/index.html');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('vary')).toBe('User-Agent');
    expect(body).toContain('<div id="root">');
    expect(body).not.toContain('http-equiv="refresh"');
  });

  it('serves a static non-refreshing fallback to browsers when the SPA shell is unavailable', async () => {
    // Must NOT fall through to the crawler/OG proxy: that response meta-refreshes
    // back to this same URL and would loop a real browser forever.
    const fetchMock = vi.fn().mockRejectedValue(new Error('index fetch failed'));
    global.fetch = fetchMock as typeof global.fetch;

    const response = await handler(
      makeRequest('https://chravel.app/api/invite-preview?code=chravelabc123', BROWSER_UA),
    );
    const body = await response.text();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).not.toContain('http-equiv="refresh"');
    expect(body).toContain('https://chravel.app/join/chravelabc123');
  });

  it('serves the same static fallback to browsers when the SPA shell responds non-ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('server error', { status: 500 }));
    global.fetch = fetchMock as typeof global.fetch;

    const response = await handler(
      makeRequest('https://chravel.app/api/invite-preview?code=chravelabc123', BROWSER_UA),
    );
    const body = await response.text();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(body).not.toContain('http-equiv="refresh"');
  });

  it('preserves the upstream Cache-Control instead of overriding negative responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<!doctype html><html><body>Invite No Longer Active</body></html>', {
        status: 410,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }),
    );
    global.fetch = fetchMock as typeof global.fetch;

    const response = await handler(
      makeRequest('https://chravel.app/api/invite-preview?code=chravelabc123', 'Twitterbot/1.0'),
    );

    expect(response.status).toBe(410);
    expect(response.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate');
  });

  it('escapes the invite code in the error fallback HTML', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('upstream down')) as typeof global.fetch;

    const payload = '"><script>alert(1)</script>';
    const response = await handler(
      makeRequest(
        `https://chravel.app/api/invite-preview?code=${encodeURIComponent(payload)}`,
        'Slackbot-LinkExpanding 1.0',
      ),
    );
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).not.toContain('<script>alert');
    expect(body).not.toContain(payload);
  });
});

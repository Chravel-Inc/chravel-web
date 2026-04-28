import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/trip-preview';

describe('api/trip-preview', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('serves fallback HTML when upstream is degraded JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED',
          message: 'Service is temporarily unavailable',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    ) as typeof global.fetch;

    const response = await handler(
      new Request(
        'https://p.chravel.app/api/trip-preview?tripId=f91fb178-dcea-453f-ac73-71f42856b163',
      ),
    );

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(body).toContain('Continue to this trip');
    expect(body).toContain('https://chravel.app/trip/f91fb178-dcea-453f-ac73-71f42856b163/preview');
  });

  it('passes through upstream HTML previews', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('<!doctype html><html><body>OG</body></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public,max-age=300',
        },
      }),
    ) as typeof global.fetch;

    const response = await handler(
      new Request('https://p.chravel.app/api/trip-preview?tripId=abc123'),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('cache-control')).toBe('public,max-age=300');
    expect(body).toContain('OG');
  });
});

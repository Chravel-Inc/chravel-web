import { describe, it, expect, vi, beforeEach } from 'vitest';

import handler from '../../api/trip-preview';

describe('trip-preview proxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('forces text/html content-type when upstream body is HTML but header is text/plain', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>•</body></html>',
          {
            status: 200,
            headers: {
              'content-type': 'text/plain',
            },
          },
        ),
      ),
    );

    const req = new Request('https://chravel.app/api/trip-preview?tripId=trip-123');
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    await expect(res.text()).resolves.toContain('<!DOCTYPE html>');
  });
});

// Test-only file: exercises the decorative-image auth fetch fallback paths
// (no trip loading, no RLS-scoped reads, no payment state involved).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthedImage, requiresAuthedFetch } from '../useAuthedImage';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

const mockGetSession = vi.mocked(supabase.auth.getSession);

const PROXY_URL = 'https://proj.supabase.co/functions/v1/image-proxy?placePhotoName=places%2Fabc';

describe('requiresAuthedFetch', () => {
  it('is true only for image-proxy URLs', () => {
    expect(requiresAuthedFetch(PROXY_URL)).toBe(true);
    expect(requiresAuthedFetch('https://example.com/photo.jpg')).toBe(false);
    expect(requiresAuthedFetch(null)).toBe(false);
  });
});

describe('useAuthedImage', () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'jwt-123' } },
      error: null,
    } as never);
    URL.createObjectURL = vi.fn(() => 'blob:mock-1');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    vi.clearAllMocks();
  });

  it('passes non-proxy URLs through untouched without fetching', () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as never;
    const { result } = renderHook(() => useAuthedImage('https://cdn.example.com/pic.jpg'));
    expect(result.current).toBe('https://cdn.example.com/pic.jpg');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches proxy URLs with the session bearer token and returns an object URL', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
    });
    global.fetch = fetchSpy as never;

    const { result } = renderHook(() => useAuthedImage(PROXY_URL));

    await waitFor(() => expect(result.current).toBe('blob:mock-1'));
    expect(fetchSpy).toHaveBeenCalledWith(PROXY_URL, {
      headers: { Authorization: 'Bearer jwt-123' },
    });
  });

  it('returns null (placeholder) when the proxy responds non-OK', async () => {
    const uniqueUrl = `${PROXY_URL}&v=fail`;
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 }) as never;
    const { result } = renderHook(() => useAuthedImage(uniqueUrl));
    // Give the async effect a tick to settle
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('returns null when no session exists (unauthenticated fallback, no throw)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null } as never);
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as never;
    const uniqueUrl = `${PROXY_URL}&v=nosession`;
    const { result } = renderHook(() => useAuthedImage(uniqueUrl));
    await waitFor(() => expect(mockGetSession).toHaveBeenCalled());
    expect(result.current).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

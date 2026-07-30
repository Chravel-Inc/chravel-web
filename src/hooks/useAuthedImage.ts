import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * The image-proxy edge function requires an Authorization header (it meters
 * billable Google Places/Static Maps traffic per user), but a plain
 * <img src> can never send one — every proxied photo would 401. This hook
 * fetches auth-required images with the session bearer token and exposes an
 * object URL for <img>. Non-proxy URLs pass through untouched.
 *
 * Auth notes (critical-path review): this is decorative-image loading only.
 * A missing/unhydrated session resolves to null and the caller's placeholder
 * renders — it never throws, never redirects, and reads the session lazily at
 * fetch time (no fetch-before-hydration race can produce a user-facing error
 * state). No RLS-scoped data is fetched here; the proxy meters quota per user.
 */

const AUTH_REQUIRED_PATH = '/functions/v1/image-proxy';

/** Small module-level cache so re-renders and repeated cards don't refetch. */
const objectUrlCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 60;

function cacheObjectUrl(sourceUrl: string, objectUrl: string): void {
  if (objectUrlCache.size >= MAX_CACHE_ENTRIES) {
    // Evict the oldest entry (Map preserves insertion order)
    const oldest = objectUrlCache.keys().next().value;
    if (oldest) {
      const evicted = objectUrlCache.get(oldest);
      if (evicted) URL.revokeObjectURL(evicted);
      objectUrlCache.delete(oldest);
    }
  }
  objectUrlCache.set(sourceUrl, objectUrl);
}

export function requiresAuthedFetch(url: string | null | undefined): boolean {
  return !!url && url.includes(AUTH_REQUIRED_PATH);
}

/**
 * Resolve an image URL for <img src>. Auth-gated proxy URLs are fetched with
 * the user's bearer token and returned as object URLs; anything else is
 * returned as-is. Returns null while loading or on failure (callers keep
 * their existing placeholder/onError fallbacks).
 */
export function useAuthedImage(url: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(() => {
    if (!url) return null;
    if (!requiresAuthedFetch(url)) return url;
    return objectUrlCache.get(url) ?? null;
  });

  useEffect(() => {
    if (!url) {
      setResolved(null);
      return;
    }
    if (!requiresAuthedFetch(url)) {
      setResolved(url);
      return;
    }

    const cached = objectUrlCache.get(url);
    if (cached) {
      setResolved(cached);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (!cancelled) setResolved(null);
          return;
        }
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          if (!cancelled) setResolved(null);
          return;
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        cacheObjectUrl(url, objectUrl);
        if (!cancelled) setResolved(objectUrl);
        // If unmounted mid-fetch the cache still owns the object URL, so no
        // revoke here — eviction handles lifecycle.
      } catch {
        if (!cancelled) setResolved(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return resolved;
}

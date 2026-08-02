/**
 * URL safety helpers for user-supplied links.
 *
 * A `javascript:` (or `data:`) URL placed in an <a href> executes in the viewer's session when
 * clicked — a stored-XSS vector when the URL came from another user (e.g. a saved trip link). Only
 * http/https URLs are safe to render or open.
 */

/** Returns the URL only if it uses a safe web scheme (http/https), otherwise undefined. */
export function sanitizeExternalHref(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

/** True when the URL uses a safe web scheme (http/https). Use to validate input at save time. */
export function isSafeExternalUrl(url: string | null | undefined): boolean {
  return sanitizeExternalHref(url) !== undefined;
}

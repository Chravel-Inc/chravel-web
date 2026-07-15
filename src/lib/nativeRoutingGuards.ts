export const NATIVE_AUTH_CALLBACK_PATH = '/auth-callback';
export const WEB_AUTH_PATH = '/auth';

const OAUTH_SESSION_HASH_KEYS = new Set(['access_token', 'refresh_token']);

function toUrl(input: string | URL | Location): URL | null {
  if (input instanceof URL) return input;

  if (typeof input === 'string') {
    try {
      return new URL(input, 'https://chravel.app');
    } catch {
      return null;
    }
  }

  const maybeLocation = input as Location;
  try {
    return new URL(
      `${maybeLocation.pathname ?? ''}${maybeLocation.search ?? ''}${maybeLocation.hash ?? ''}`,
      maybeLocation.origin || 'https://chravel.app',
    );
  } catch {
    return null;
  }
}

/**
 * Canonical OAuth-return matcher for native/deferred routing decisions.
 *
 * Bare `/auth` is intentionally NOT an OAuth return path: it is the login page.
 * Only session-bearing paths block deferred notification/universal-link routing.
 */
export function isNativeAuthReturnPath(input: string | URL | Location): boolean {
  const url = toUrl(input);
  if (!url) return false;

  if (url.pathname === NATIVE_AUTH_CALLBACK_PATH) return true;

  if (url.pathname !== WEB_AUTH_PATH) return false;
  if (url.searchParams.has('code')) return true;

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  return [...OAUTH_SESSION_HASH_KEYS].some(key => hashParams.has(key));
}

/** Exact-or-dot-boundary host allowlist matching. Rejects suffix bypasses like evilsupabase.co. */
export function hostMatchesAllowlistedDomain(
  hostname: string,
  allowlistedDomains: string[],
): boolean {
  const normalizedHost = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (!normalizedHost) return false;

  return allowlistedDomains.some(domain => {
    const normalizedDomain = domain.trim().toLowerCase().replace(/^\.+/, '').replace(/\.$/, '');
    return normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`);
  });
}

export function urlHostMatchesAllowlistedDomain(
  url: string,
  allowlistedDomains: string[],
): boolean {
  try {
    return hostMatchesAllowlistedDomain(new URL(url).hostname, allowlistedDomains);
  } catch {
    return false;
  }
}

function deferredPathScore(path: string | null | undefined): number {
  if (!path) return 0;

  let score = 1;
  if (/^\/trip\/[^/?#]+/.test(path)) score += 2;
  if (/[?&]tab=(chat|messages|alerts|polls|tasks|calendar|payments|media)\b/.test(path)) score += 2;
  if (/[?&](messageId|threadId|eventId|pollId|taskId)=/.test(path)) score += 3;
  if (/[?&](source|utm_source)=notification\b/.test(path)) score += 4;
  if (path.includes('#')) score += 1;

  return score;
}

/**
 * Preserve the richer pending route when native startup sources race.
 * Notification paths generally include resource IDs and must win over generic initial URLs.
 */
export function preferExistingDeferredPath(
  existingPath: string | null | undefined,
  candidatePath: string | null | undefined,
): string | null {
  if (!existingPath) return candidatePath ?? null;
  if (!candidatePath) return existingPath;

  return deferredPathScore(existingPath) >= deferredPathScore(candidatePath)
    ? existingPath
    : candidatePath;
}

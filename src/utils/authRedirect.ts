import { isInstalledApp } from './platformDetection';
import { getSafeReturnTo } from './safeReturnTo';

/**
 * Single source of truth for OAuth `redirectTo` URLs.
 *
 * - **Installed app** (Capacitor / chravel-mobile WebView / standalone PWA):
 *   Uses the production Universal Link host so the native shell can intercept
 *   the callback via AASA and route it back into the in-app WebView. The path
 *   `/auth-callback` is registered in `public/.well-known/apple-app-site-association`.
 * - **Web** (vercel preview / dev / chravel.app in a regular browser):
 *   Uses the current origin so previews and localhost don't bounce to
 *   chravel.app for the callback. Lands on `/auth` (existing behavior) so
 *   AuthPage handles both `/auth?code=...` and `/auth-callback?code=...`.
 *
 * `returnTo` is validated against same-origin relative-path rules; any other
 * value is dropped and the OAuth flow lands at `/`.
 */
export function getAuthRedirectUrl(returnToOverride?: string | null): string {
  const safeReturnTo = getSafeReturnTo(returnToOverride ?? null, '');
  const queryReturnTo =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('returnTo')
      : null;
  const resolvedReturnTo = safeReturnTo || getSafeReturnTo(queryReturnTo, '');
  const returnToQuery = resolvedReturnTo ? `?returnTo=${encodeURIComponent(resolvedReturnTo)}` : '';

  if (isInstalledApp()) {
    return `https://chravel.app/auth-callback${returnToQuery}`;
  }

  if (typeof window === 'undefined') {
    return `https://chravel.app/auth${returnToQuery}`;
  }
  return `${window.location.origin}/auth${returnToQuery}`;
}

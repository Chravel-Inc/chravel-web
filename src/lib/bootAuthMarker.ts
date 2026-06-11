import { hasAuthStorageMarker } from './bootstrapShell';

/**
 * Computed once at module scope: a persisted auth marker means this device very
 * likely resolves to an authenticated session, so boot-time loading states can
 * paint an app skeleton instead of a bare spinner. Visual decision only —
 * every data fetch stays gated on hydrated auth.
 */
export const bootHasAuthMarker = (() => {
  try {
    return hasAuthStorageMarker({
      localStorage: window.localStorage,
      sessionStorage: window.sessionStorage,
      cookieIncludes: needle => document.cookie.includes(needle),
    });
  } catch {
    return false;
  }
})();

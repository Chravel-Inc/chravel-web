/**
 * Centralized platform detection.
 * These are synchronous checks — context does not change during a session.
 */

/**
 * True when running inside the Capacitor native shell (TestFlight / Play Store builds).
 * Capacitor sets `window.Capacitor` and `isNativePlatform()` distinguishes real native
 * from `cap serve` / web. Relying only on WKWebView UA heuristics misses many iOS shell
 * configurations (Safari token present), which broke installed-app routing on `/`.
 */
export function isCapacitorNativeShell(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform() === true;
}

/** True when running as an installed PWA in standalone display mode. */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * True when user-agent indicates a handheld/mobile device class.
 * Desktop browsers can report standalone display mode in certain launch contexts,
 * but we still want desktop marketing behavior on chravel.app.
 */
export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua);
}

/**
 * Heuristic for iOS WKWebView user agents: AppleWebKit present without Safari/Chrome/Firefox.
 * Kept in sync with `isNativeWebView()` so billing and shell detection agree on OS class.
 */
export function isLikelyIosWkWebViewUserAgent(userAgent: string): boolean {
  return (
    /AppleWebKit/.test(userAgent) &&
    !/Safari/.test(userAgent) &&
    !/Chrome|CriOS|Firefox|FxiOS/.test(userAgent)
  );
}

/** True when running inside a native app's webview (Expo WebView, Android WebView, etc). */
export function isNativeWebView(): boolean {
  if (typeof window === 'undefined') return false;
  if (isCapacitorNativeShell()) return true;
  // Explicit query param from chravel-mobile Expo WebView
  const params = new URLSearchParams(window.location.search);
  if (params.get('app_context') === 'native') return true;
  const ua = navigator.userAgent;
  // Android WebView
  if (/; wv\)/.test(ua)) return true;
  // iOS WKWebView: has AppleWebKit but no Safari token (and not Chrome/Firefox)
  if (isLikelyIosWkWebViewUserAgent(ua)) return true;
  return false;
}

/**
 * True when the app is running as an installed experience —
 * PWA standalone or native webview. Marketing page should NOT be shown.
 */
export function isInstalledApp(): boolean {
  if (isCapacitorNativeShell()) return true;
  // Native webview should always be treated as installed app context.
  if (isNativeWebView()) return true;
  // Standalone PWA gate is limited to mobile-class devices to avoid desktop false positives.
  return isStandalonePWA() && isLikelyMobileDevice();
}

/**
 * Production web app URL for OAuth callbacks.
 * Uses VITE_APP_URL env var if set, otherwise defaults to chravel.app.
 */
const PRODUCTION_WEB_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) || 'https://chravel.app';

/**
 * Returns the base URL to use for OAuth redirect callbacks.
 *
 * In installed app contexts (Capacitor/PWA/WebView), window.location.origin
 * may be a custom scheme (capacitor://localhost) or file:// URL that OAuth
 * providers can't redirect to. In these cases, we redirect through the
 * production web URL which can then deep-link back to the app.
 *
 * In browser contexts, we use window.location.origin for local dev support.
 */
export function getOAuthRedirectOrigin(): string {
  if (typeof window === 'undefined') return PRODUCTION_WEB_URL;

  // In installed apps, OAuth must redirect through the web URL
  // The web app will then handle deep linking back to the installed app
  if (isInstalledApp()) {
    return PRODUCTION_WEB_URL;
  }

  // For standard browser contexts, use the current origin (supports localhost dev)
  return window.location.origin;
}

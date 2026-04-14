/**
 * Centralized platform detection.
 * These are synchronous checks — context does not change during a session.
 */

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
  // Native webview should always be treated as installed app context.
  if (isNativeWebView()) return true;
  // Standalone PWA gate is limited to mobile-class devices to avoid desktop false positives.
  return isStandalonePWA() && isLikelyMobileDevice();
}

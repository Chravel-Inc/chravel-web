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

/** True when running inside a native app's webview (Expo WebView, Android WebView, etc). */
export function isNativeWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  // Android WebView
  if (/; wv\)/.test(ua)) return true;
  // iOS WKWebView: has AppleWebKit but no Safari token (and not Chrome/Firefox)
  if (/AppleWebKit/.test(ua) && !/Safari/.test(ua) && !/Chrome|CriOS|Firefox|FxiOS/.test(ua))
    return true;
  return false;
}

/**
 * True when the app is running as an installed experience —
 * PWA standalone or native webview. Marketing page should NOT be shown.
 */
export function isInstalledApp(): boolean {
  return isStandalonePWA() || isNativeWebView();
}

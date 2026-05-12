/**
 * Open an OAuth URL from an installed-app context (Expo WebView shell or PWA).
 *
 * The chravel-mobile (Expo) shell injects `window.ChravelNative.openOAuthUrl`
 * to run `WebBrowser.openAuthSessionAsync` / ASWebAuthenticationSession, then
 * loads the callback URL in the **main** WebView so Supabase
 * `detectSessionInUrl` shares the same storage as the app. Without that
 * bridge, the fallback is `location.assign`, which replaces the WebView with
 * the provider chain and often strands the session (callback runs in a
 * context the shell does not hand back).
 *
 * The WebView-embedded path is intentionally not supported: Google blocks it
 * with `disallowed_useragent`.
 */

type ChravelNativeOAuthBridge = {
  openOAuthUrl?: (url: string) => void | Promise<void>;
};

function getChravelNativeOpenOAuthUrl(): ((url: string) => void | Promise<void>) | null {
  if (typeof window === 'undefined') return null;
  const fn = (window as Window & { ChravelNative?: ChravelNativeOAuthBridge }).ChravelNative
    ?.openOAuthUrl;
  return typeof fn === 'function' ? fn : null;
}

export async function openInstalledAuthBrowser(url: string): Promise<void> {
  const nativeOpen = getChravelNativeOpenOAuthUrl();
  if (nativeOpen) {
    await Promise.resolve(nativeOpen(url));
    return;
  }

  window.location.assign(url);
}

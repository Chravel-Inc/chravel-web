/**
 * Open an OAuth URL from an installed-app context.
 *
 * Priority:
 * 1. ChravelNative.openAuthBrowser — Expo WebView bridge (expo-web-browser)
 * 2. Capacitor Browser plugin — legacy/alternative shells
 * 3. Same-tab navigation — PWA fallback
 *
 * Both native bridges launch SFSafariViewController on iOS or Chrome Custom Tabs
 * on Android, which Google and Apple accept. The WebView-embedded path is
 * intentionally not supported: Google blocks it with `disallowed_useragent`.
 */

type ChravelNativeWindow = Window & {
  ChravelNative?: {
    openAuthBrowser?: (url: string) => void;
  };
};

type CapacitorBrowserPlugin = {
  open: (options: { url: string; presentationStyle?: 'popover' | 'fullscreen' }) => Promise<void>;
};

type CapacitorWindow = Window & {
  Capacitor?: {
    Plugins?: {
      Browser?: CapacitorBrowserPlugin;
    };
  };
};

function getChravelNativeBrowser(): ((url: string) => void) | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as ChravelNativeWindow).ChravelNative?.openAuthBrowser;
  return typeof bridge === 'function' ? bridge : null;
}

function getCapacitorBrowser(): CapacitorBrowserPlugin | null {
  if (typeof window === 'undefined') return null;
  const plugin = (window as CapacitorWindow).Capacitor?.Plugins?.Browser;
  return plugin && typeof plugin.open === 'function' ? plugin : null;
}

export async function openInstalledAuthBrowser(url: string): Promise<void> {
  // Priority 1: Expo WebView bridge (SFSafariViewController via expo-web-browser)
  const chravelBrowser = getChravelNativeBrowser();
  if (chravelBrowser) {
    chravelBrowser(url);
    return;
  }

  // Priority 2: Capacitor Browser plugin
  const capacitorBrowser = getCapacitorBrowser();
  if (capacitorBrowser) {
    await capacitorBrowser.open({ url, presentationStyle: 'popover' });
    return;
  }

  // Fallback: same-tab navigation (PWA)
  window.location.assign(url);
}

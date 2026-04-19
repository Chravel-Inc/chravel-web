/**
 * Open an OAuth URL from an installed-app context (Capacitor native shell or PWA).
 *
 * Prefers the native Capacitor Browser plugin when the native shell (chravel-mobile)
 * has registered it — that launches SFSafariViewController on iOS or Chrome Custom
 * Tabs on Android, which Google and Apple accept. Falls back to a same-tab
 * navigation so the PWA and any shell without the plugin still exchange the session.
 *
 * The WebView-embedded path is intentionally not supported: Google blocks it with
 * `disallowed_useragent`.
 */

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

function getCapacitorBrowser(): CapacitorBrowserPlugin | null {
  if (typeof window === 'undefined') return null;
  const plugin = (window as CapacitorWindow).Capacitor?.Plugins?.Browser;
  return plugin && typeof plugin.open === 'function' ? plugin : null;
}

export async function openInstalledAuthBrowser(url: string): Promise<void> {
  const browser = getCapacitorBrowser();
  if (browser) {
    await browser.open({ url, presentationStyle: 'popover' });
    return;
  }
  window.location.assign(url);
}

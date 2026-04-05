/**
 * Safe page reload utility for web and PWA standalone contexts.
 */

const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

const buildCacheBustedPath = (): string => {
  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    url = new URL('/', window.location.origin || 'http://localhost');
  }

  url.searchParams.set('_reload', String(Date.now()));
  return `${url.pathname}${url.search}${url.hash}`;
};

const clearServiceWorkerState = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }
};

/**
 * Perform a safe reload.
 *
 * @param clearCaches - If true, clears SW caches + registrations before reloading.
 */
export async function safeReload(clearCaches = false): Promise<void> {
  if (clearCaches) {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }

      await clearServiceWorkerState();
    } catch {
      // Ignore cache clearing failures
    }
  }

  if (clearCaches || isStandalonePWA()) {
    window.location.replace(buildCacheBustedPath());
    return;
  }

  window.location.reload();
}

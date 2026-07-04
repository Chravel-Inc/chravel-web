import { isLovablePreview } from '@/utils/env';
import { safeReload } from '@/utils/safeReload';

// A controllerchange this soon after boot is treated as the tail end of the current
// navigation (deploy landed between loads); later ones are mid-session updates.
export const UPDATE_TAKEOVER_RELOAD_WINDOW_MS = 30_000;

/**
 * Collapse the post-deploy double reload.
 *
 * sw.js uses skipWaiting()+clientsClaim(), so the first navigation after a deploy
 * still paints the OLD precached shell; the new worker installs and takes control a
 * few seconds later (`controllerchange`) but nothing re-renders — the user has to
 * reload a second time (or notice the useSwUpdate toast) to actually get new code.
 * When that takeover happens right after boot, finish the job with one automatic
 * reload. First-time installs are skipped (an uncontrolled page came straight from
 * the network and is already current), as are takeovers outside the boot window
 * (a mid-session deploy must not yank the page — the toast owns that UX).
 */
export const installUpdateTakeoverReload = ({
  reload = () => void safeReload(),
  now = () => Date.now(),
  windowMs = UPDATE_TAKEOVER_RELOAD_WINDOW_MS,
}: {
  reload?: () => void;
  now?: () => number;
  windowMs?: number;
} = {}): void => {
  const bootAt = now();
  const wasControlledAtBoot = navigator.serviceWorker.controller !== null;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!wasControlledAtBoot || reloaded) return;
    if (now() - bootAt > windowMs) return;
    reloaded = true;
    reload();
  });
};

export const registerServiceWorker = async () => {
  // Don't register SW in Lovable preview environment
  // CRITICAL: Preview includes lovable.app, *.lovable.app, lovableproject.com, *.lovableproject.com
  if (isLovablePreview()) {
    // One-time cleanup of any existing SW in preview (v2 to re-run after domain fix)
    try {
      const CLEANUP_KEY = 'lovable_sw_cleanup_v2';
      if (!localStorage.getItem(CLEANUP_KEY)) {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }

        localStorage.setItem(CLEANUP_KEY, 'true');
      }
    } catch {
      // Ignore in restricted/sandboxed preview environments
    }
    return;
  }

  // Production SW registration
  if ('serviceWorker' in navigator) {
    installUpdateTakeoverReload();
    try {
      // Derive buildId from env (Render's git commit or VITE_BUILD_ID)
      const buildId =
        import.meta.env.VITE_BUILD_ID ||
        import.meta.env.RENDER_GIT_COMMIT ||
        import.meta.env.RENDER_GIT_COMMIT_SHA ||
        'static';
      const swUrl = `/sw.js?v=${buildId}`;

      // One-time production cleanup migration (v1)
      let prodMigrationDone = false;
      const PROD_MIGRATION_KEY = 'prod_sw_migration_v1';
      try {
        prodMigrationDone = !!localStorage.getItem(PROD_MIGRATION_KEY);
      } catch {
        // Treat as done if storage is inaccessible
        prodMigrationDone = true;
      }
      if (!prodMigrationDone) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          const chravelCaches = keys.filter(k => k.startsWith('chravel-'));
          await Promise.all(chravelCaches.map(k => caches.delete(k)));
        }

        try {
          localStorage.setItem(PROD_MIGRATION_KEY, 'true');
        } catch {
          // Best-effort marker
        }
      }

      const registration = await navigator.serviceWorker.register(swUrl, {
        updateViaCache: 'none',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            // A new SW has installed and is waiting; there was a prior active SW — this is an update.
            // Notify the app so it can prompt the user to reload.
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller !== null) {
              window.dispatchEvent(new CustomEvent('sw:updateavailable'));
            }
          });
        }
      });

      // Check for updates every 5 minutes
      setInterval(() => {
        registration.update().catch(err => {
          if (import.meta.env.DEV) {
            console.warn('[SW] Update check failed:', err);
          }
        });
      }, 300000);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[SW] Service Worker registration failed:', error);
      }

      // On failure, trigger cleanup to recover from stale SW
      const PROD_MIGRATION_KEY = 'prod_sw_migration_v1';
      let hasMarker = false;
      try {
        hasMarker = !!localStorage.getItem(PROD_MIGRATION_KEY);
        if (hasMarker) localStorage.removeItem(PROD_MIGRATION_KEY);
      } catch {
        // Storage inaccessible — skip marker-based recovery
      }
      if (hasMarker) {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }

        if ('caches' in window) {
          const keys = await caches.keys();
          const chravelCaches = keys.filter(k => k.startsWith('chravel-'));
          await Promise.all(chravelCaches.map(k => caches.delete(k)));
        }
      }
    }
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
};

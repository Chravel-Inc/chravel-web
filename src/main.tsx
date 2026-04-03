import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TripVariantProvider } from '@/contexts/TripVariantContext';
import { BasecampProvider } from '@/contexts/BasecampContext';
import { initNativeLifecycle } from '@/native/lifecycle';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import { initRevenueCat } from '@/config/revenuecat';
import { setupGlobalPurchaseListener } from '@/integrations/revenuecat/revenuecatClient';
import { telemetry } from '@/telemetry/service';
import { isLovablePreview } from './utils/env';
import { Capacitor } from '@capacitor/core';
import App from './App.tsx';
import './index.css';

// ── Startup env validation ──────────────────────────────────────────────────
// Warn early if required env vars are missing (Supabase client has hardcoded
// fallbacks so the app still boots, but this surfaces misconfig in dev/staging).
const REQUIRED_ENV_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
const missingEnvVars = REQUIRED_ENV_VARS.filter(k => !import.meta.env[k]);
if (missingEnvVars.length > 0) {
  console.warn(
    `[Chravel] Missing env vars: ${missingEnvVars.join(', ')}. Using hardcoded fallbacks.`,
  );
}

// ── Imperative init (runs after all imports are resolved) ──────────────────

const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures in restricted environments (e.g. sandboxed previews)
  }
};

const clearAllCaches = (): void => {
  if ('caches' in window) {
    caches
      .keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .catch(() => {});
  }
};

// Skip all service worker operations on native — Capacitor bundles assets locally,
// so the SW's 22.8 MB precache is pure overhead. Push notifications on native use
// @capacitor/push-notifications (APNs), not the web push handler in sw.js.
const isNativePlatform = Capacitor.isNativePlatform();

// Unregister stale service workers from old hosts on first load.
// NOTE: This runs before registerServiceWorker() below to avoid unregistering
// the freshly-registered worker. The .then() chain is already non-blocking.
if (!isNativePlatform && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      registrations.forEach(reg => reg.unregister());
    })
    .catch(() => {});
}

// Initialize theme
const theme = localStorage.getItem('theme');
if (theme === 'light') {
  document.documentElement.classList.add('light');
}

// Preview hardening: always clear stale caches (prevents sticky blank preview states)
if (isLovablePreview()) {
  clearAllCaches();
} else {
  // Version-based cache busting: clear caches when app version changes
  const STORED_VERSION_KEY = 'chravel_host_version';
  const currentVersion = (import.meta.env.VITE_APP_VERSION as string) || '0';
  const storedVersion = safeLocalStorageGet(STORED_VERSION_KEY);

  if (storedVersion !== null && storedVersion !== currentVersion) {
    clearAllCaches();
    safeLocalStorageSet(STORED_VERSION_KEY, currentVersion);
    window.location.reload();
  } else {
    safeLocalStorageSet(STORED_VERSION_KEY, currentVersion);
  }
}

// Register service worker for offline support (web only)
if (import.meta.env.PROD && !isNativePlatform) {
  registerServiceWorker();
}

// Initialize native lifecycle listeners as early as possible (no-op on web).
initNativeLifecycle();

// Capacitor/TestFlight: warm the home dashboard chunk in parallel with first paint so
// navigating to `/` after auth does not wait on an extra lazy-import round trip.
if (Capacitor.isNativePlatform()) {
  void import('./pages/Index');
}

// Initialize PostHog analytics
telemetry.init().catch(err => console.warn('[Telemetry] Init failed:', err));

// Global error listeners — catch unhandled errors outside React boundaries
window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  telemetry.captureError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), {
    context: 'unhandledrejection',
  });
});

window.addEventListener('error', (e: ErrorEvent) => {
  telemetry.captureError(e.error ?? new Error(e.message), { context: 'window.onerror' });
});

// Initialize RevenueCat for subscription management
initRevenueCat().catch(err => console.warn('[RevenueCat] Init failed:', err));

// Initialize global listener for native purchases (deferred — not needed before first paint)
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => setupGlobalPurchaseListener());
} else {
  setTimeout(() => setupGlobalPurchaseListener(), 0);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TripVariantProvider variant="consumer">
      <BasecampProvider>
        <App />
      </BasecampProvider>
    </TripVariantProvider>
  </StrictMode>,
);

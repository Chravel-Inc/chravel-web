import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { TripVariantProvider } from '@/contexts/TripVariantContext';
import { BasecampProvider } from '@/contexts/BasecampContext';
import { RuntimeConfigError } from '@/components/RuntimeConfigError';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import { setupGlobalPurchaseListener } from '@/integrations/revenuecat/revenuecatClient';
import { getMissingSupabaseEnvVars } from '@/integrations/supabase/config';
import { telemetry } from '@/telemetry/service';
import { isLovablePreview } from './utils/env';
import { isChravelNativeShell } from './utils/platformDetection';
import './index.css';

// ── Startup env validation ──────────────────────────────────────────────────
// Supabase config is required at runtime. Accept either the modern
// publishable key or legacy anon key.
const missingEnvVars = getMissingSupabaseEnvVars(import.meta.env);
if (missingEnvVars.length > 0) {
  console.warn(`[Chravel] Missing env vars: ${missingEnvVars.join(', ')}.`);
}
const hasRequiredSupabaseEnv = missingEnvVars.length === 0;
const App = hasRequiredSupabaseEnv ? lazy(() => import('./App.tsx')) : null;

// Kick off the AuthPage chunk in parallel with App.tsx when the cold-start route
// is /auth. Without this, AuthPage waits behind App.tsx parse + AuthProvider mount
// before its own chunk request even leaves the device — adding a serial round trip
// to the slowest part of the cold-start path inside the native WebView shell.
if (
  hasRequiredSupabaseEnv &&
  typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/auth')
) {
  void import('./pages/AuthPage');
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

const scheduleWhenIdle = (task: () => void): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => task());
    return;
  }

  setTimeout(task, 0);
};

// Native shell handles its own caching and lifecycle — service workers add startup
// cost (registration, activation) without benefit inside the WebView.
const inNativeShell = isChravelNativeShell();

// Unregister stale service workers from old hosts on first load.
// Skip in the native shell to avoid pointless work on cold start.
if (!inNativeShell && 'serviceWorker' in navigator) {
  if (navigator.serviceWorker.controller !== null) {
    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        registrations.forEach(reg => reg.unregister());
      })
      .catch(() => {});
  }
}

// Initialize theme
const theme = safeLocalStorageGet('theme');
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

// Register service worker for offline support (web/PWA only — native shell has its own).
if (import.meta.env.PROD && !inNativeShell) {
  registerServiceWorker();
}

// Initialize PostHog analytics — defer in the native shell so it never competes
// with the auth route's first paint.
const initTelemetry = () =>
  telemetry.init().catch(err => console.warn('[Telemetry] Init failed:', err));
scheduleWhenIdle(initTelemetry);

// Global error listeners — catch unhandled errors outside React boundaries
window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  const error = e.reason instanceof Error ? e.reason : new Error(String(e.reason));

  if (document.readyState === 'complete') {
    telemetry.captureError(error, { context: 'unhandledrejection' });
    return;
  }

  scheduleWhenIdle(() => telemetry.captureError(error, { context: 'unhandledrejection' }));
});

window.addEventListener('error', (e: ErrorEvent) => {
  const error = e.error ?? new Error(e.message);

  if (document.readyState === 'complete') {
    telemetry.captureError(error, { context: 'window.onerror' });
    return;
  }

  scheduleWhenIdle(() => telemetry.captureError(error, { context: 'window.onerror' }));
});

// Initialize global listener for purchases only after non-marketing app shell paths.
const isMarketingShellPath =
  window.location.pathname === '/' || window.location.pathname.startsWith('/marketing');
if (!isMarketingShellPath) {
  scheduleWhenIdle(() => setupGlobalPurchaseListener());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {hasRequiredSupabaseEnv && App ? (
      <TripVariantProvider variant="consumer">
        <BasecampProvider>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 animate-spin gold-gradient-spinner" />
              </div>
            }
          >
            <App />
          </Suspense>
        </BasecampProvider>
      </TripVariantProvider>
    ) : (
      <RuntimeConfigError vars={missingEnvVars} />
    )}
  </StrictMode>,
);

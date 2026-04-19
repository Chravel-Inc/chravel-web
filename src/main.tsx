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

// Do NOT unregister all service workers here. This runs on every load and
// races with registerServiceWorker() below: the unregister promise can resolve
// after registration, leaving no controlling worker and a stale precache — a
// common blank-screen failure after deploys. Targeted cleanup lives in
// serviceWorkerRegistration.ts (preview skip, prod migration, registration failure).

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

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerServiceWorker();
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

// Initialize global listener for native purchases (deferred — not needed before first paint)
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => setupGlobalPurchaseListener());
} else {
  setTimeout(() => setupGlobalPurchaseListener(), 0);
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

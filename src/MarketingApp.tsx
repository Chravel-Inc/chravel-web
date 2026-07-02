import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FullPageLanding } from '@/components/landing/FullPageLanding';
import { AuthProvider, useOptionalAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { confirmNativeShellIfDetected, isInstalledAppSticky } from '@/utils/platformDetection';
import { markAppBooted } from '@/utils/chunkRecovery';

// How long we keep polling for a late `window.ChravelNative` bridge injection
// before giving up. Native shells that inject the bridge via a post-navigation
// call (rather than a document-start user script) can lose the boot-time race
// in `main.tsx`, stranding the user on the marketing shell — see
// `isInstalledAppSticky()` for the persisted-marker half of this fix. Generous
// timeout because a cold boot under chunk-loading contention (the exact
// condition that makes injection arrive late) is also the condition most
// likely to delay a `setTimeout` firing on schedule — checked against a
// wall-clock deadline below, not a tick count, so backgrounding/throttling
// can't silently extend how long this actually runs.
const NATIVE_SHELL_POLL_INTERVAL_MS = 150;
const NATIVE_SHELL_POLL_TIMEOUT_MS = 8000;

const BlogIndex = lazy(() => import('@/pages/BlogIndex'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const UseCasesHub = lazy(() => import('@/pages/UseCasesHub'));
const UseCasePage = lazy(() => import('@/pages/UseCasePage'));

/**
 * After a successful sign-in inside the lightweight marketing shell, force a
 * full page navigation so `main.tsx` re-runs bootstrap auth detection, detects
 * the new Supabase auth marker in localStorage, and mounts the full <App />
 * shell with the dashboard router. Without this the user stays stuck on the
 * marketing landing because MarketingApp has no route for the dashboard.
 */
function PostAuthBoot() {
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const isLoading = auth?.isLoading ?? true;

  useEffect(() => {
    if (isLoading || !user) return;
    // Respect the `?marketing=1` / `/home` preview override — don't bounce a logged-in
    // viewer out of the marketing landing when they're explicitly previewing it.
    const forcedMarketing =
      window.location.search.includes('marketing=1') || window.location.pathname === '/home';
    if (forcedMarketing) return;
    window.location.assign('/');
  }, [user, isLoading]);

  return null;
}

/**
 * Safety net: if an installed/native shell ever mounts MarketingApp (stale SW,
 * deep link race, or a `window.ChravelNative` bridge that injects after this
 * shell has already rendered), jump to /auth so main.tsx boots the full App
 * router on next load. Polls rather than checking once, since the native
 * bridge can be injected well after our first render — a one-shot check at
 * mount only catches the (rare) case where it beat us there. Persists the
 * sticky marker the moment it detects native so every later boot in this
 * WebView instance skips MarketingApp entirely instead of re-losing the race.
 * Respects the `?marketing=1` / `/home` / `/index` preview override.
 */
function InstalledShellEscape() {
  useEffect(() => {
    const forcedMarketing =
      window.location.search.includes('marketing=1') ||
      window.location.pathname === '/home' ||
      window.location.pathname === '/index';
    if (forcedMarketing) return;

    const deadline = Date.now() + NATIVE_SHELL_POLL_TIMEOUT_MS;
    let timer: number;

    const check = () => {
      confirmNativeShellIfDetected();
      if (isInstalledAppSticky()) {
        window.location.replace('/auth');
        return;
      }
      if (Date.now() < deadline) {
        timer = window.setTimeout(check, NATIVE_SHELL_POLL_INTERVAL_MS);
      }
    };

    // Check immediately (not just via the first setTimeout) — the common case
    // is the sticky marker already being true from a prior boot, and that case
    // deserves zero added delay, not one wasted poll interval.
    check();
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

export default function MarketingApp() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const forcedMarketing =
    typeof window !== 'undefined' &&
    (window.location.search.includes('marketing=1') ||
      window.location.pathname === '/home' ||
      window.location.pathname === '/index');
  const installed = !forcedMarketing && isInstalledAppSticky();

  // The marketing shell mounted — its chunk loaded successfully. Clear the one-shot
  // chunk-recovery guard so a later, independent stale-chunk error can recover too.
  useEffect(() => {
    markAppBooted();
  }, []);

  const fallback = useMemo(
    () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 animate-spin gold-gradient-spinner" />
      </div>
    ),
    [],
  );

  if (installed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {fallback}
        <InstalledShellEscape />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <PostAuthBoot />
        <InstalledShellEscape />
        <Suspense fallback={fallback}>
          <main data-marketing="true">
            <Routes>
              <Route
                path="/"
                element={<FullPageLanding onSignUp={() => setAuthMode('signup')} />}
              />
              <Route
                path="/home"
                element={<FullPageLanding onSignUp={() => setAuthMode('signup')} />}
              />
              <Route
                path="/index"
                element={<FullPageLanding onSignUp={() => setAuthMode('signup')} />}
              />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/use-cases" element={<UseCasesHub />} />
              <Route path="/use-cases/:slug" element={<UseCasePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {authMode && (
            <AuthModal isOpen initialMode={authMode} onClose={() => setAuthMode(null)} />
          )}
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

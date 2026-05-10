import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { notifyNativeShellReady } from '@/utils/nativeBridge';
import { getSafeReturnTo } from '@/utils/safeReturnTo';

type AuthMode = 'signin' | 'signup';

const INVITE_CODE_STORAGE_KEY = 'chravel_pending_invite_code';
const CALLBACK_TIMEOUT_MS = 15_000;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [callbackTimedOut, setCallbackTimedOut] = useState(false);

  const returnTo = useMemo(() => {
    const fromQuery = searchParams.get('returnTo');
    // If caller used state, prefer it (more trustworthy).
    const fromState = (location.state as { returnTo?: string } | null)?.returnTo ?? null;
    return getSafeReturnTo(fromState ?? fromQuery, '/');
  }, [location.state, searchParams]);

  const mode = useMemo<AuthMode>(() => {
    const raw = searchParams.get('mode');
    return raw === 'signup' ? 'signup' : 'signin';
  }, [searchParams]);

  // Detect when the page is hosting an OAuth provider redirect that Supabase
  // `detectSessionInUrl` is processing in the background. We must NOT bounce to
  // `/` while this is in flight — that flashes the empty-trips state during the
  // brief window between page mount and session hydration (and on TestFlight,
  // where the universal-link handoff sometimes lands here from the system browser
  // before the WebView session is populated, that flash is what users report).
  const isOAuthCallback = useMemo(() => {
    if (location.pathname !== '/auth' && location.pathname !== '/auth-callback') return false;
    if (searchParams.has('code')) return true;
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) return true;
    return false;
  }, [location.pathname, searchParams]);

  // Restore invite context from query param into localStorage.
  // This ensures the invite code survives OAuth redirects that may clear localStorage.
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode) {
      try {
        localStorage.setItem(INVITE_CODE_STORAGE_KEY, inviteCode);
      } catch {
        // localStorage unavailable — JoinTrip will fall back to query param
      }
    }
  }, [searchParams]);

  // Signal the native WebView shell that the auth surface is mounted and interactive.
  useEffect(() => {
    notifyNativeShellReady({ surface: 'auth' });
  }, []);

  // Safety net: if the OAuth callback exchange hasn't completed in N seconds,
  // surface a recovery action instead of leaving the spinner forever.
  useEffect(() => {
    if (!isOAuthCallback) return;
    if (user) return;
    const timer = window.setTimeout(() => setCallbackTimedOut(true), CALLBACK_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isOAuthCallback, user]);

  // If already authenticated, redirect — preferring invite join flow if invite code exists.
  useEffect(() => {
    if (user && !authLoading) {
      const inviteCode = searchParams.get('invite');
      if (inviteCode) {
        navigate(`/join/${inviteCode}`, { replace: true });
      } else {
        navigate(returnTo, { replace: true });
      }
    }
  }, [user, authLoading, navigate, returnTo, searchParams]);

  if (isOAuthCallback && !user && !callbackTimedOut) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center px-6"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
        </div>
      </div>
    );
  }

  if (isOAuthCallback && !user && callbackTimedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-lg font-semibold">Sign-in didn't complete</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't finish signing you in. Please try again.
          </p>
          <Button onClick={() => navigate('/auth', { replace: true })}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthModal
        isOpen={true}
        initialMode={mode}
        onClose={() => navigate(returnTo, { replace: true })}
      />
    </div>
  );
};

export default AuthPage;

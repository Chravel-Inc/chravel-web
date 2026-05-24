/**
 * auth.test.tsx — Integration tests for the real AuthProvider / useAuth hook.
 *
 * Boundary strategy (matches passing tests in this repo):
 *  - vi.mock('@/integrations/supabase/client') — full auth surface + minimal .from() stub
 *  - vi.mock all leaf services/utils that don't belong to the auth domain
 *  - Drive auth state via captured onAuthStateChange callback
 *  - Use real AuthProvider so we test the actual hydration logic
 *
 * What is NOT mocked:
 *  - AuthProvider, useAuth (the system under test)
 *  - tokenValidation (uses real btoa/atob — jsdom provides both)
 *  - buildSessionDerivedUser (pure, no I/O)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { buildAuthMock, makeMockSession, makeMockSupabaseUser } from './utils/authTestKit';

// ── hoisted mock state ────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any -- mock setup needs flexible types */
const { mockSupabaseClient, helpers: authHelpers } = vi.hoisted(() => {
  // We can't import from authTestKit inside vi.hoisted (no top-level await for modules),
  // so we inline the minimal subset needed here and delegate full builds to beforeEach.
  let _callbacks: Array<(event: string, session: Session | null) => void> = [];
  let _session: Session | null = null;

  const makeJwt = (sub: string): string => {
    const exp = Math.floor(Date.now() / 1000) + 7200;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const payloadStr = btoa(
      JSON.stringify({ sub, exp, aud: 'authenticated', iat: Math.floor(Date.now() / 1000) }),
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `${header}.${payloadStr}.mock_sig`;
  };

  const fromStub = () => {
    const chain: any = {};
    const noop = () => chain;
    chain.select = noop;
    chain.eq = noop;
    chain.neq = noop;
    chain.limit = noop;
    chain.single = () => Promise.resolve({ data: null, error: null });
    chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
    chain.upsert = () => Promise.resolve({ data: null, error: null });
    chain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
    return chain;
  };

  const mockSupabaseClient = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: _session }, error: null })),
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: _session?.user ?? null }, error: null }),
      ),
      refreshSession: vi.fn(() => Promise.resolve({ data: { session: _session }, error: null })),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      ),
      signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithOAuth: vi.fn(() => Promise.resolve({ data: { url: null }, error: null })),
      signInWithOtp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      updateUser: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      onAuthStateChange: vi.fn((cb: any) => {
        _callbacks.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    from: vi.fn(() => fromStub()),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(() => Promise.resolve()),
    removeAllChannels: vi.fn(() => Promise.resolve()),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  };

  const helpers = {
    triggerAuthStateChange: (event: string, session: Session | null) => {
      _session = session;
      _callbacks.forEach(cb => cb(event, session));
    },
    setSession: (session: Session | null) => {
      _session = session;
      mockSupabaseClient.auth.getSession.mockImplementation(() =>
        Promise.resolve({ data: { session }, error: null }),
      );
    },
    reset: () => {
      _callbacks = [];
      _session = null;
      vi.clearAllMocks();
      // Re-wire closures after clearAllMocks
      mockSupabaseClient.auth.getSession.mockImplementation(() =>
        Promise.resolve({ data: { session: _session }, error: null }),
      );
      mockSupabaseClient.auth.refreshSession.mockImplementation(() =>
        Promise.resolve({ data: { session: _session }, error: null }),
      );
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((cb: any) => {
        _callbacks.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockImplementation(() => fromStub());
    },
    makeJwt,
  };

  return { mockSupabaseClient, helpers };
});

// ── Supabase client mock ──────────────────────────────────────────────────
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// ── Leaf-service / utility mocks (don't belong to auth domain under test) ─
vi.mock('@/lib/authCache', () => ({ invalidateAuthCache: vi.fn() }));
vi.mock('@/lib/queryClient', () => ({
  queryClient: { prefetchQuery: vi.fn(), clear: vi.fn(), invalidateQueries: vi.fn() },
}));
vi.mock('@/constants/admins', () => ({ SUPER_ADMIN_EMAILS: [] }));
vi.mock('@/store/demoModeStore', () => {
  const demoState = { demoView: 'off' as const, isDemoMode: false, setDemoView: vi.fn() };
  const useDemoModeStore = Object.assign(
    vi.fn((selector: unknown) =>
      typeof selector === 'function' ? selector(demoState) : demoState,
    ),
    { getState: () => demoState },
  );
  return { useDemoModeStore };
});
vi.mock('@/services/conciergeCacheService', () => ({
  conciergeCacheService: { clearAllCaches: vi.fn() },
}));
vi.mock('@/utils/platformDetection', () => ({ isInstalledApp: () => false }));
vi.mock('@/utils/authDebug', () => ({ authDebug: vi.fn() }));
vi.mock('@/telemetry/service', () => ({
  telemetry: { identify: vi.fn(), reset: vi.fn(), track: vi.fn() },
}));
vi.mock('@/utils/authTelemetry', () => ({ logAuthEvent: vi.fn() }));
vi.mock('@/utils/installedAuthBrowser', () => ({ openInstalledAuthBrowser: vi.fn() }));
vi.mock('@/services/errorTracking', () => ({
  errorTracking: { captureException: vi.fn() },
}));
vi.mock('@/utils/uuid', () => ({
  generateSafeUuid: vi.fn(() => 'demo-uuid-stable'),
}));
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/store/notificationRealtimeStore', () => ({
  useNotificationRealtimeStore: { getState: () => ({ clearAll: vi.fn() }) },
}));
vi.mock('@/store/onboardingStore', () => ({
  useOnboardingStore: { getState: () => ({ resetOnboarding: vi.fn() }) },
}));
vi.mock('@/services/userPreferencesService', () => ({
  userPreferencesService: {
    getNotificationPreferences: vi.fn().mockResolvedValue({
      push_enabled: false,
      email_enabled: true,
      sms_enabled: false,
      chat_messages: true,
      mentions_only: false,
      broadcasts: true,
      tasks: false,
      payments: false,
      calendar_events: true,
      calendar_reminders: true,
      polls: true,
      trip_invites: true,
      join_requests: false,
      basecamp_updates: true,
      messages: true,
      broadcasts_and_pins: true,
      quiet_hours_enabled: false,
      quiet_start: '22:00',
      quiet_end: '08:00',
      timezone: 'America/New_York',
    }),
    updateNotificationPreferences: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('@/services/tripService', () => ({
  tripService: { getUserTrips: vi.fn().mockResolvedValue([]) },
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Import SUT after mocks are in place ───────────────────────────────────
import { AuthProvider, useAuth } from '@/hooks/useAuth';

// ── Shared test helper ────────────────────────────────────────────────────
const AuthConsumer = ({ onRender }: { onRender: (ctx: ReturnType<typeof useAuth>) => void }) => {
  const ctx = useAuth();
  onRender(ctx);
  return null;
};

describe('Authentication — AuthProvider / useAuth integration', () => {
  beforeEach(() => {
    authHelpers.reset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ── 1. Initial unauthenticated hydration ─────────────────────────────
  describe('initial hydration — no session', () => {
    it('resolves isLoading=false and user=null when no session exists', async () => {
      let captured: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <AuthConsumer
            onRender={ctx => {
              captured = ctx;
            }}
          />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(captured?.isLoading).toBe(false);
      });

      expect(captured?.user).toBeNull();
      expect(captured?.session).toBeNull();
      expect(captured?.authState).toBe('unauthenticated');
    });
  });

  // ── 2. Sign-in success ────────────────────────────────────────────────
  describe('signIn success', () => {
    it('returns no error and the auth listener fires, setting a user', async () => {
      const session = makeMockSession();

      // signInWithPassword resolves OK; the listener drives the state change
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: session.user, session },
        error: null,
      });

      let captured: ReturnType<typeof useAuth> | null = null;
      const TestUI = () => {
        const ctx = useAuth();
        captured = ctx;
        return (
          <div>
            <button onClick={() => ctx.signIn('test@example.com', 'password123')}>Sign In</button>
            {ctx.user && <span data-testid="user-id">{ctx.user.id}</span>}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestUI />
        </AuthProvider>,
      );

      // Wait for initial hydration
      await waitFor(() => expect(captured?.isLoading).toBe(false));

      // Click sign-in
      await userEvent.click(screen.getByText('Sign In'));

      // Simulate the Supabase auth listener firing SIGNED_IN
      act(() => {
        authHelpers.triggerAuthStateChange('SIGNED_IN', session);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent(session.user.id);
      });
    });
  });

  // ── 3. Sign-in error ──────────────────────────────────────────────────
  describe('signIn error', () => {
    it('surfaces an error message when credentials are invalid', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', name: 'AuthApiError' },
      });

      let signInResult: { error?: string } | null = null;

      const TestUI = () => {
        const ctx = useAuth();
        return (
          <button
            onClick={async () => {
              signInResult = await ctx.signIn('bad@example.com', 'wrongpassword');
            }}
          >
            Sign In
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestUI />
        </AuthProvider>,
      );

      await waitFor(() => {}); // let initial hydration finish
      await userEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(signInResult).not.toBeNull();
        expect(signInResult?.error).toBeTruthy();
      });
      // useAuth maps "Invalid login credentials" to a friendlier message
      expect(signInResult?.error).toContain('Invalid email or password');
    });
  });

  // ── 4. Sign-out clears state ──────────────────────────────────────────
  describe('signOut', () => {
    it('clears user after sign-out via the auth listener', async () => {
      const session = makeMockSession();

      // Start with an authenticated session
      authHelpers.setSession(session);

      let captured: ReturnType<typeof useAuth> | null = null;
      const TestUI = () => {
        const ctx = useAuth();
        captured = ctx;
        return (
          <div>
            {ctx.user && <span data-testid="user-id">{ctx.user.id}</span>}
            <button onClick={() => ctx.signOut()}>Sign Out</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestUI />
        </AuthProvider>,
      );

      // Wait for initial hydration with the session; auth listener fires SIGNED_IN
      act(() => {
        authHelpers.triggerAuthStateChange('SIGNED_IN', session);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('user-id')).toBeInTheDocument();
      });

      // Click sign-out
      await userEvent.click(screen.getByText('Sign Out'));

      // Supabase listener fires SIGNED_OUT (no session)
      act(() => {
        authHelpers.triggerAuthStateChange('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('user-id')).not.toBeInTheDocument();
        expect(captured?.user).toBeNull();
      });
    });
  });

  // ── 5. authState derived value ────────────────────────────────────────
  describe('authState derivation', () => {
    it('transitions from loading → authenticated when a session is present at init', async () => {
      const session = makeMockSession();
      authHelpers.setSession(session);

      const states: string[] = [];
      const TestUI = () => {
        const ctx = useAuth();
        // Deduplicate consecutive same-state entries to keep assertion lean
        if (states[states.length - 1] !== ctx.authState) {
          states.push(ctx.authState);
        }
        return null;
      };

      render(
        <AuthProvider>
          <TestUI />
        </AuthProvider>,
      );

      // Trigger auth listener (simulating Supabase's INITIAL_SESSION event)
      act(() => {
        authHelpers.triggerAuthStateChange('SIGNED_IN', session);
      });

      await waitFor(() => {
        expect(states).toContain('authenticated');
      });

      expect(states[0]).toBe('loading');
    });
  });

  // ── 6. signUp needs email confirmation ────────────────────────────────
  describe('signUp — email confirmation required', () => {
    it('returns a success message when confirmation email is sent', async () => {
      const newUser = makeMockSupabaseUser({ email: 'new@example.com' });
      // session null → Supabase requires email confirmation
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: newUser, session: null },
        error: null,
      });

      let signUpResult: { error?: string; success?: string } | null = null;
      const TestUI = () => {
        const ctx = useAuth();
        return (
          <button
            onClick={async () => {
              signUpResult = await ctx.signUp('new@example.com', 'password123', 'New', 'User');
            }}
          >
            Sign Up
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestUI />
        </AuthProvider>,
      );

      await waitFor(() => {}); // initial hydration
      await userEvent.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(signUpResult).not.toBeNull();
        expect(signUpResult?.success).toBeTruthy();
      });
      expect(signUpResult?.error).toBeUndefined();
    });
  });

  // ── 7. signUp error propagated ────────────────────────────────────────
  describe('signUp — error path', () => {
    it('returns an error message when sign-up fails', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered', name: 'AuthApiError' },
      });

      let signUpResult: { error?: string; success?: string } | null = null;
      const TestUI = () => {
        const ctx = useAuth();
        return (
          <button
            onClick={async () => {
              signUpResult = await ctx.signUp(
                'existing@example.com',
                'password123',
                'Test',
                'User',
              );
            }}
          >
            Sign Up
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestUI />
        </AuthProvider>,
      );

      await waitFor(() => {}); // initial hydration
      await userEvent.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(signUpResult?.error).toBeTruthy();
      });
    });
  });
});

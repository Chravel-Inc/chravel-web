/**
 * authTestKit — minimal, controllable Supabase-auth mock for AuthProvider tests.
 *
 * Pattern: capture the `onAuthStateChange` callback via vi.mock, expose a
 * `triggerAuthStateChange` so tests can drive state transitions deterministically.
 *
 * Do NOT use this in tests that need the full Supabase fluent query-builder chain —
 * those should use supabaseMocks.ts instead.
 */
import { vi } from 'vitest';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// ── Minimal valid JWT ──────────────────────────────────────────────────────
// isSessionTokenValid requires sub (UUID), exp (future), aud fields.
// The signature is not verified in client-side code, so this placeholder works.
const MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';
const makeValidJwt = (sub: string = MOCK_USER_ID): string => {
  const exp = Math.floor(Date.now() / 1000) + 7200;
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const payloadObj = { sub, exp, aud: 'authenticated', iat: Math.floor(Date.now() / 1000) };
  const payload = btoa(JSON.stringify(payloadObj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payload}.mock_sig`;
};

// ── Canonical mock shapes ──────────────────────────────────────────────────
export const makeMockSupabaseUser = (overrides: Partial<SupabaseUser> = {}): SupabaseUser =>
  ({
    id: MOCK_USER_ID,
    email: 'test@example.com',
    phone: '',
    app_metadata: { provider: 'email' },
    user_metadata: { display_name: 'Test User' },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }) as SupabaseUser;

export const makeMockSession = (userOverrides: Partial<SupabaseUser> = {}): Session => {
  const user = makeMockSupabaseUser(userOverrides);
  return {
    access_token: makeValidJwt(user.id),
    refresh_token: 'mock-refresh-token',
    expires_in: 7200,
    expires_at: Math.floor(Date.now() / 1000) + 7200,
    token_type: 'bearer',
    user,
  } as Session;
};

// ── Auth state change callback registry ───────────────────────────────────
type AuthCallback = (event: string, session: Session | null) => void;
let _capturedCallbacks: AuthCallback[] = [];

/**
 * Factory: returns the vi.fn() objects that should be passed to vi.mock('@/integrations/supabase/client').
 * Call `buildAuthMock()` inside vi.hoisted() or at module scope before vi.mock.
 */
export function buildAuthMock(initialSession: Session | null = null) {
  _capturedCallbacks = [];

  let currentSession = initialSession;

  const getSession = vi
    .fn()
    .mockImplementation(() => Promise.resolve({ data: { session: currentSession }, error: null }));

  const refreshSession = vi
    .fn()
    .mockImplementation(() => Promise.resolve({ data: { session: currentSession }, error: null }));

  const signInWithPassword = vi.fn().mockResolvedValue({
    data: { user: null, session: null },
    error: null,
  });

  const signUp = vi.fn().mockResolvedValue({
    data: { user: null, session: null },
    error: null,
  });

  const signOut = vi.fn().mockResolvedValue({ error: null });

  const onAuthStateChange = vi.fn().mockImplementation((cb: AuthCallback) => {
    _capturedCallbacks.push(cb);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });

  // Supabase .from() stub — returns empty results so transformUser doesn't hang
  const fromStub = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    // Awaitable (thenable) for bare .select() pattern
    then: (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  });

  const mockSupabaseClient = {
    auth: {
      getSession,
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: currentSession?.user ?? null }, error: null }),
      refreshSession,
      signInWithPassword,
      signUp,
      signOut,
      signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: null }, error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      onAuthStateChange,
    },
    from: fromStub,
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
    removeAllChannels: vi.fn().mockResolvedValue(undefined),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };

  // ── Test-facing helpers ────────────────────────────────────────────────
  const helpers = {
    /** Simulate Supabase emitting an auth state change event. */
    triggerAuthStateChange: (event: string, session: Session | null) => {
      currentSession = session;
      _capturedCallbacks.forEach(cb => cb(event, session));
    },

    /** Override the value returned by getSession for subsequent calls. */
    setSession: (session: Session | null) => {
      currentSession = session;
      getSession.mockImplementation(() => Promise.resolve({ data: { session }, error: null }));
    },

    /** Make signInWithPassword resolve to a success with the given session. */
    mockSignInSuccess: (session: Session) => {
      signInWithPassword.mockResolvedValueOnce({
        data: { user: session.user, session },
        error: null,
      });
    },

    /** Make signInWithPassword resolve to an error. */
    mockSignInError: (message: string) => {
      signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message, name: 'AuthApiError' },
      });
    },

    /** Make signUp resolve to a success that requires email confirmation. */
    mockSignUpNeedsConfirmation: (user: SupabaseUser) => {
      signUp.mockResolvedValueOnce({
        data: { user, session: null },
        error: null,
      });
    },

    /** Make signUp resolve with an error. */
    mockSignUpError: (message: string) => {
      signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message, name: 'AuthApiError' },
      });
    },

    /** Expose the raw mock client for additional configuration. */
    client: mockSupabaseClient,
  };

  return { mockSupabaseClient, helpers };
}

export { makeValidJwt, MOCK_USER_ID };

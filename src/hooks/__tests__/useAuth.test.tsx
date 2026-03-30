import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from '../useAuth';

// Mock user and session data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  phone: '+1234567890',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

const mockSession = {
  access_token:
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJleHAiOjQxMDI0NDQ4MDAsImlhdCI6MTcwMDAwMDAwMH0.signature',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Create mock Supabase client using vi.hoisted to ensure it's available during mock hoisting
const { mockSupabaseClient } = vi.hoisted(() => {
  const createChainMock = () => {
    const chainMock: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve: (value: { data: never[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
      ),
    };
    // Make all chain methods return the chain mock for chaining
    Object.keys(chainMock).forEach(key => {
      if (
        typeof chainMock[key] === 'function' &&
        key !== 'then' &&
        key !== 'single' &&
        key !== 'maybeSingle'
      ) {
        chainMock[key].mockReturnValue(chainMock);
      }
    });
    return chainMock;
  };

  return {
    mockSupabaseClient: {
      from: vi.fn(() => createChainMock()),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        signInWithOAuth: vi.fn(),
        signInWithOtp: vi.fn(),
        refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        mfa: {
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: { currentLevel: 'aal1', nextLevel: 'aal1' },
            error: null,
          }),
        },
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      })),
      removeChannel: vi.fn(),
    },
  };
});

// MFA gate renders a portal; not needed for hook tests
vi.mock('@/components/MfaChallengeGate', () => ({
  MfaChallengeGate: () => null,
}));

// Mock Supabase module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock demo mode store
vi.mock('@/store/demoModeStore', () => {
  const mockStore = vi.fn(selector => {
    const state = { demoView: 'off', isDemoMode: false, setDemoView: vi.fn() };
    return selector ? selector(state) : state;
  }) as any;
  mockStore.getState = () => ({ demoView: 'off', isDemoMode: false, setDemoView: vi.fn() });
  return {
    useDemoModeStore: mockStore,
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth mocks to default state
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    (
      mockSupabaseClient.auth.mfa.getAuthenticatorAssuranceLevel as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });
  });

  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Initially loading should be true
    expect(result.current.isLoading).toBe(true);
  });

  it('syncs auth metadata when updating display and real names', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeTruthy();
    });

    await act(async () => {
      await result.current.updateProfile({
        display_name: 'Crew Chief',
        real_name: 'Christian Amechi',
      });
    });

    expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
      data: {
        display_name: 'Crew Chief',
        full_name: 'Christian Amechi',
      },
    });
  });

  it('should handle sign up flow', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 },
    );

    const signUpResult = await result.current.signUp(
      'test@example.com',
      'password123',
      'Test',
      'User',
    );

    expect(signUpResult.error).toBeUndefined();
    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalled();
  });

  it('returns requiresMfa when AAL must be upgraded to aal2', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });
    // signIn and the session AAL effect both call this — must stay consistent until MFA completes
    (
      mockSupabaseClient.auth.mfa.getAuthenticatorAssuranceLevel as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 },
    );

    let signInResult: { error?: string; requiresMfa?: boolean } = {};
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password123');
      // Provider only gets a session when onAuthStateChange fires (not automatic in unit tests).
      const subscribeCall = mockSupabaseClient.auth.onAuthStateChange.mock.calls[0]?.[0];
      if (typeof subscribeCall === 'function') {
        subscribeCall('SIGNED_IN', mockSession);
      }
    });

    expect(signInResult.requiresMfa).toBe(true);
    await waitFor(() => {
      expect(result.current.mfaPending).toBe(true);
    });
  });
});

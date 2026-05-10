import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AuthPage from '../AuthPage';

type AuthState = { user: unknown | null; isLoading: boolean };

const authState: AuthState = { user: null, isLoading: false };

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: authState.user,
    isLoading: authState.isLoading,
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
    signUp: vi.fn().mockResolvedValue({}),
    resetPassword: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock('@/components/AuthModal', () => ({
  AuthModal: () => <div data-testid="auth-modal">AuthModal</div>,
}));

vi.mock('@/utils/nativeBridge', () => ({
  notifyNativeShellReady: vi.fn(),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
};

const renderAt = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth-callback" element={<AuthPage />} />
        <Route path="/" element={<div data-testid="root-page">RootPage</div>} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe('AuthPage /auth-callback handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    authState.user = null;
    authState.isLoading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows 'Finishing sign-in…' while ?code= is present and user is null", () => {
    renderAt('/auth-callback?code=abc');
    expect(screen.getByText(/finishing sign-in/i)).toBeInTheDocument();
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('root-page')).not.toBeInTheDocument();
  });

  it('falls through to the AuthModal when no code param is present', () => {
    renderAt('/auth-callback');
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    expect(screen.queryByText(/finishing sign-in/i)).not.toBeInTheDocument();
  });

  it('treats /auth?code=... as a callback context too', () => {
    renderAt('/auth?code=xyz');
    expect(screen.getByText(/finishing sign-in/i)).toBeInTheDocument();
  });

  it('shows the recovery state after the callback timeout elapses without a session', () => {
    renderAt('/auth-callback?code=abc');
    expect(screen.getByText(/finishing sign-in/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(15_001);
    });
    expect(screen.getByText(/sign-in didn't complete/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

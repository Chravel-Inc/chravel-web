import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { AuthModal } from '../AuthModal';
import { AuthProvider } from '@/hooks/useAuth';
import * as platformDetection from '@/utils/platformDetection';

const signInWithOAuthMock = vi.fn().mockResolvedValue({ data: { url: null }, error: null });

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithOAuth: (...args: unknown[]) => signInWithOAuthMock(...args),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

const createTestWrapper = () => {
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

describe('AuthModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(platformDetection, 'isInstalledApp').mockReturnValue(false);
    signInWithOAuthMock.mockResolvedValue({ data: { url: null }, error: null });
  });

  describe('email form functionality', () => {
    it('renders email and password fields in signin mode', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-modal-logo')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
      });
    });

    it('renders first and last name fields in signup mode', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signup" />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/john/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/doe/i)).toBeInTheDocument();
      });
    });

    it('shows forgot password form when clicked', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signin" />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });

      // Click on "Forgot password?" link
      const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i });
      fireEvent.click(forgotPasswordButton);

      // Should show reset password form
      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      });
    });
  });

  describe('tab navigation', () => {
    it('switches between signin and signup modes', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} initialMode="signin" />, {
        wrapper: createTestWrapper(),
      });

      // Wait for signin mode
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });

      // Switch to signup mode (mode switcher uses tab semantics)
      const signUpTab = screen.getByRole('tab', { name: /^sign up$/i });
      fireEvent.click(signUpTab);

      // Should show Create Account header (use heading role to be more specific)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
        // Name fields should appear
        expect(screen.getByPlaceholderText(/john/i)).toBeInTheDocument();
      });
    });
  });

  describe('modal behavior', () => {
    it('does not render when isOpen is false', () => {
      render(<AuthModal isOpen={false} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
    });

    it('renders the modal content in a centered viewport container', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        const backdrop = screen.getByTestId('auth-modal-backdrop');
        const content = screen.getByTestId('auth-modal-content');
        expect(backdrop).toHaveClass('fixed');
        expect(content).toHaveClass('max-w-md');
        expect(content).toHaveClass('w-full');
      });
    });

    it('calls onClose when X button is clicked', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });

      // Find the close button by its class (contains lucide-x icon)
      const header = screen.getByRole('heading', { name: /welcome back/i }).parentElement;
      const closeButton = header?.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows Google and Apple OAuth options in browser context', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^google$/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /^apple$/i })).toBeInTheDocument();
    });

    it('shows Google and Apple OAuth options in installed app context', async () => {
      vi.spyOn(platformDetection, 'isInstalledApp').mockReturnValue(true);

      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^google$/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /^apple$/i })).toBeInTheDocument();
      expect(screen.queryByText(/To stay inside the app/i)).not.toBeInTheDocument();
    });
  });

  describe('OAuth error handling', () => {
    it('normalizes "Load failed" from Google OAuth to actionable copy', async () => {
      signInWithOAuthMock.mockResolvedValueOnce({
        data: { url: null },
        error: { message: 'Load failed' },
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      const googleButton = await screen.findByRole('button', { name: /^google$/i });
      await act(async () => {
        fireEvent.click(googleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Network issue while signing in/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/^Load failed$/)).not.toBeInTheDocument();
    });

    it('normalizes "Failed to fetch" from Apple OAuth to actionable copy', async () => {
      signInWithOAuthMock.mockResolvedValueOnce({
        data: { url: null },
        error: { message: 'Failed to fetch' },
      });

      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      const appleButton = await screen.findByRole('button', { name: /^apple$/i });
      await act(async () => {
        fireEvent.click(appleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Network issue while signing in/i)).toBeInTheDocument();
      });
    });

    it('clears the OAuth spinner when the document becomes visible again', async () => {
      // Simulate a stuck-spinner scenario: signInWithOAuth resolves with a URL but never
      // produces a callback (user backgrounds the in-app browser). The visibilitychange
      // recovery effect should clear the spinner when the user returns.
      vi.spyOn(platformDetection, 'isInstalledApp').mockReturnValue(true);
      let resolveSignIn: ((value: unknown) => void) | null = null;
      signInWithOAuthMock.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSignIn = resolve;
          }),
      );

      render(<AuthModal isOpen={true} onClose={mockOnClose} />, {
        wrapper: createTestWrapper(),
      });

      const googleButton = await screen.findByRole('button', { name: /^google$/i });
      await act(async () => {
        fireEvent.click(googleButton);
      });

      // Spinner button label flips to "Redirecting…" while the OAuth promise is pending.
      expect(screen.getByRole('button', { name: /redirecting/i })).toBeInTheDocument();

      // Simulate user returning to the WebView (Safari sheet dismissed).
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^google$/i })).toBeInTheDocument();
      });

      // Clean up the pending promise so test runner doesn't hang.
      if (resolveSignIn) {
        await act(async () => {
          resolveSignIn!({ data: { url: 'https://oauth.example/auth' }, error: null });
        });
      }
    });
  });
});

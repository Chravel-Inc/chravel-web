import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { fetchTripRoles, useTripRoles } from '@/hooks/useTripRoles';

const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: vi.fn(),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

const authStateRef = vi.hoisted(() => ({
  user: null as { id: string } | null,
  authState: 'loading' as 'loading' | 'authenticated' | 'unauthenticated',
  isHydrated: false,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authStateRef,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useTripRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateRef.user = null;
    authStateRef.authState = 'loading';
    authStateRef.isHydrated = false;

    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    });
  });

  it('does not fetch until auth is hydrated and authenticated', async () => {
    const { result, rerender } = renderHook(() => useTripRoles({ tripId: 'trip-1' }), {
      wrapper: createWrapper(),
    });

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);

    authStateRef.isHydrated = true;
    authStateRef.authState = 'authenticated';
    authStateRef.user = { id: 'user-1' };
    rerender();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'trip_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('trip_roles');
    });
  });

  it('fetchTripRoles throws when member count query fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trip_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'role-1',
                trip_id: 'trip-1',
                role_name: 'Coach',
                description: '',
                permission_level: 'edit',
                feature_permissions: null,
                created_by: 'user-1',
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
                trip_channels: [],
              },
            ],
            error: null,
          }),
        };
      }
      const secondEq = vi
        .fn()
        .mockResolvedValue({ count: null, error: { message: 'count failed' } });
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({ eq: secondEq }),
      };
    });

    await expect(fetchTripRoles('trip-1', false)).rejects.toEqual({ message: 'count failed' });
  });
});

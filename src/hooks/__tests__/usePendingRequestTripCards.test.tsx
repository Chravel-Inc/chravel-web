import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePendingRequestTripCards } from '../usePendingRequestTripCards';

const rpcMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePendingRequestTripCards', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('hydrates pending request cards from RPC rows', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          request_id: 'req-1',
          trip_id: 'trip-1',
          trip_type: 'consumer',
          requested_at: '2026-04-01T00:00:00Z',
          title: 'Investfest Chat',
          destination: 'Paris, France',
          start_date: '2026-04-20',
          end_date: '2026-06-25',
          cover_image_url: 'https://example.com/cover.jpg',
          member_count: 3,
          places_count: 4,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => usePendingRequestTripCards(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cards).toHaveLength(1);
    expect(result.current.cards[0]).toMatchObject({
      requestId: 'req-1',
      tripId: 'trip-1',
      title: 'Investfest Chat',
      destination: 'Paris, France',
      peopleCount: 3,
      placesCount: 4,
    });
    expect(result.current.cards[0].dateLabel).toContain('Apr');
    expect(result.current.cards[0].dateLabel).toContain('Jun');
  });

  it('drops rows with missing trip title instead of rendering placeholders', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          request_id: 'req-2',
          trip_id: 'trip-2',
          trip_type: 'consumer',
          requested_at: '2026-04-01T00:00:00Z',
          title: null,
          destination: null,
          start_date: null,
          end_date: null,
          cover_image_url: null,
          member_count: null,
          places_count: null,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => usePendingRequestTripCards(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cards).toHaveLength(0);
  });
});

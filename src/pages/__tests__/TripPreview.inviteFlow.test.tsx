import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TripPreview from '../TripPreview';

const mockInvoke = vi.fn();
const mockMaybeSingle = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({
    setDemoView: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
    from: (table: string) => {
      if (table === 'trip_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => mockMaybeSingle(),
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

function renderTripPreview(initialEntry: string): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/trip/:tripId/preview" element={<TripPreview />} />
          <Route path="/t/:tripId" element={<TripPreview />} />
          <Route path="/join/:token" element={<div>Join Route</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TripPreview invite flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        trip: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Festival Weekend',
          destination: 'Los Angeles',
          start_date: '2026-05-02',
          end_date: '2026-05-11',
          cover_image_url: null,
          trip_type: 'consumer',
          member_count: 5,
          active_invite_code: 'chravelabc123',
        },
      },
      error: null,
    });

    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('routes authenticated non-members through /join/:code when preview returns active invite code', async () => {
    const user = userEvent.setup();

    renderTripPreview('/trip/11111111-1111-4111-8111-111111111111/preview');

    const joinButton = await screen.findByRole('button', { name: 'Join This Trip' });
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Join Route')).toBeInTheDocument();
    });
  });

  it('supports branded /t/:tripId path and still routes non-members through /join/:code', async () => {
    const user = userEvent.setup();

    renderTripPreview('/t/11111111-1111-4111-8111-111111111111');

    const joinButton = await screen.findByRole('button', { name: 'Join This Trip' });
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Join Route')).toBeInTheDocument();
    });
  });

  it('submits a join request directly from trip preview when no active invite code exists', async () => {
    const user = userEvent.setup();

    mockInvoke
      .mockResolvedValueOnce({
        data: {
          success: true,
          trip: {
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Festival Weekend',
            destination: 'Los Angeles',
            start_date: '2026-05-02',
            end_date: '2026-05-11',
            cover_image_url: null,
            trip_type: 'consumer',
            member_count: 5,
            active_invite_code: null,
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          requires_approval: true,
          trip_id: '11111111-1111-4111-8111-111111111111',
          trip_name: 'Festival Weekend',
          trip_type: 'consumer',
          message: 'Join request submitted! The trip organizer will review your request.',
        },
        error: null,
      });

    renderTripPreview('/trip/11111111-1111-4111-8111-111111111111/preview');

    const requestButton = await screen.findByRole('button', { name: 'Request to Join' });
    await user.click(requestButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenNthCalledWith(2, 'join-trip', {
        body: { tripId: '11111111-1111-4111-8111-111111111111' },
      });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Join request submitted! The trip organizer will review your request.',
    );
    expect(mockToastError).not.toHaveBeenCalled();
  });
});

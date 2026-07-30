import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConciergeConfirmCard } from '../ConciergeConfirmCard';
import { confirmGatedConciergeAction } from '@/features/concierge/lib/confirmGatedAction';

vi.mock('@/features/concierge/lib/confirmGatedAction', () => ({
  confirmGatedConciergeAction: vi.fn(),
}));

const mockConfirm = vi.mocked(confirmGatedConciergeAction);

const baseRequest = {
  id: 'req-1',
  toolName: 'deleteCalendarEvent',
  requestedArgs: { event_id: 'evt-1', title: 'Old dinner' },
  destructive: true,
  message: 'Tool "deleteCalendarEvent" requires explicit confirmation',
};

const renderCard = (request = baseRequest) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConciergeConfirmCard request={request} tripId="trip-1" />
    </QueryClientProvider>,
  );
};

describe('ConciergeConfirmCard', () => {
  beforeEach(() => {
    mockConfirm.mockReset();
  });

  it('renders the destructive prompt with a human-readable summary', () => {
    renderCard();
    expect(screen.getByText(/Delete calendar event: Old dinner/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('cancel shows the cancelled state without invoking the tool', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByText(/nothing was changed/i)).toBeInTheDocument();
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('confirm re-invokes the tool and swaps in the result card on success', async () => {
    mockConfirm.mockResolvedValue({
      success: true,
      actionType: 'delete_calendar_event',
      message: 'Removed from calendar',
    });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
    expect(mockConfirm).toHaveBeenCalledWith('trip-1', baseRequest);
    // Result card replaces the prompt
    await screen.findByText(/Removed from calendar/);
    expect(screen.queryByRole('button', { name: /confirm/i })).toBeNull();
  });

  it('confirm failure renders the failure card with the error message', async () => {
    mockConfirm.mockResolvedValue({
      success: false,
      error: 'Not allowed for this trip',
    });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await screen.findByText(/Not allowed for this trip/);
  });
});

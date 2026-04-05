import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock safeReload
vi.mock('@/utils/safeReload', () => ({
  safeReload: vi.fn().mockResolvedValue(undefined),
}));

// Mock supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock toast
vi.mock('../../components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock haptics
vi.mock('@/services/hapticService', () => ({
  hapticService: {
    success: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock useAuth — component calls useAuth() for current user context.
// user-1 matches the Supabase auth mock above; signOut is unused by the component.
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, signOut: vi.fn() }),
}));

import { ConfirmPaymentDialog } from '../ConfirmPaymentDialog';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockBalance = {
  userId: 'other-user-1',
  userName: 'Jane Doe',
  avatar: 'https://avatar.com/jane.png',
  amountOwed: -50.0,
  amountOwedCurrency: 'USD',
  preferredPaymentMethod: null,
  unsettledPayments: [],
};

describe('ConfirmPaymentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with payment details when open', () => {
    renderWithProviders(
      <ConfirmPaymentDialog
        open={true}
        onOpenChange={vi.fn()}
        balance={mockBalance}
        tripId="trip-1"
      />,
    );

    expect(screen.getByText('Confirm Payment Received')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    renderWithProviders(
      <ConfirmPaymentDialog
        open={false}
        onOpenChange={vi.fn()}
        balance={mockBalance}
        tripId="trip-1"
      />,
    );

    expect(screen.queryByText('Confirm Payment Received')).not.toBeInTheDocument();
  });

  it('should call onOpenChange when Leave Pending is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <ConfirmPaymentDialog
        open={true}
        onOpenChange={onOpenChange}
        balance={mockBalance}
        tripId="trip-1"
      />,
    );

    const leavePendingButton = screen.getByText('Leave Pending');
    await user.click(leavePendingButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show preferred payment method when available', () => {
    const balanceWithMethod = {
      ...mockBalance,
      preferredPaymentMethod: { id: 'pm-1', type: 'venmo' as const, identifier: '@janedoe' },
    };

    renderWithProviders(
      <ConfirmPaymentDialog
        open={true}
        onOpenChange={vi.fn()}
        balance={balanceWithMethod}
        tripId="trip-1"
      />,
    );

    // The component uses CSS capitalize on the type string
    expect(screen.getByText('venmo')).toBeInTheDocument();
  });

  it('should have Confirm Received button', () => {
    renderWithProviders(
      <ConfirmPaymentDialog
        open={true}
        onOpenChange={vi.fn()}
        balance={mockBalance}
        tripId="trip-1"
      />,
    );

    expect(screen.getByText('Confirm Received')).toBeInTheDocument();
  });
});

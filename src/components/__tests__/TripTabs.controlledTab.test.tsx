/**
 * TripTabs — parent-controlled active tab (desktop trip detail sync)
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TripTabs } from '../TripTabs';

vi.mock('@/contexts/TripVariantContext', () => ({
  useTripVariant: () => ({ variant: 'consumer' }),
}));

vi.mock('@/hooks/useSuperAdmin', () => ({
  useSuperAdmin: () => ({ isSuperAdmin: false }),
}));

vi.mock('@/hooks/usePrefetchTrip', () => ({
  usePrefetchTrip: () => ({
    prefetchTab: vi.fn(),
    prefetchAdjacentTabs: vi.fn(),
    prefetchPriorityTabs: vi.fn(),
  }),
}));

vi.mock('@/features/chat/components/TripChat', () => ({
  TripChat: () => <div data-testid="tab-chat" />,
}));

vi.mock('../GroupCalendar', () => ({
  default: () => <div data-testid="tab-calendar" />,
}));

vi.mock('../CommentsWall', () => ({
  default: () => <div data-testid="tab-polls" />,
}));

vi.mock('../todo/TripTasksTab', () => ({
  default: () => <div data-testid="tab-tasks" />,
}));

vi.mock('../UnifiedMediaHub', () => ({
  default: () => <div data-testid="tab-media" />,
}));

vi.mock('../PlacesSection', () => ({
  default: () => <div data-testid="tab-places" />,
}));

vi.mock('../AIConciergeChat', () => ({
  default: () => <div data-testid="tab-concierge" />,
}));

vi.mock('../payments/PaymentsTab', () => ({
  default: () => <div data-testid="tab-payments" />,
}));

vi.mock('../AddLinkModal', () => ({
  AddLinkModal: () => null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

function Harness() {
  const [tab, setTab] = useState('chat');
  return (
    <>
      <TripTabs
        activeTab={tab}
        onTabChange={setTab}
        tripId="trip-1"
        tripData={{ trip_type: 'consumer' }}
        showPlaces
        showConcierge
      />
      <span data-testid="parent-tab">{tab}</span>
    </>
  );
}

describe('TripTabs controlled mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates parent activeTab when user switches tabs', async () => {
    const user = userEvent.setup();
    render(<Harness />, { wrapper });

    expect(screen.getByTestId('parent-tab')).toHaveTextContent('chat');

    await user.click(screen.getByRole('button', { name: /calendar/i }));

    await waitFor(() => {
      expect(screen.getByTestId('parent-tab')).toHaveTextContent('calendar');
    });
    const calendarBtn = screen.getByRole('button', { name: /calendar/i });
    expect(calendarBtn).toHaveAttribute('data-active', 'true');
  });
});

import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TripGrid } from '../TripGrid';

vi.mock('../../TripCard', () => ({
  TripCard: ({
    trip,
    pendingApproval,
    pendingSecondaryActionLabel,
  }: {
    trip: { title: string };
    pendingApproval?: boolean;
    pendingSecondaryActionLabel?: string;
  }) => (
    <div data-testid="trip-card">
      <span>{trip.title}</span>
      <span>{pendingApproval ? 'pending-enabled' : 'standard'}</span>
      {pendingSecondaryActionLabel ? <span>{pendingSecondaryActionLabel}</span> : null}
    </div>
  ),
}));

vi.mock('../../EventCard', () => ({ EventCard: () => null }));
vi.mock('../../MobileEventCard', () => ({ MobileEventCard: () => null }));
vi.mock('../../RecommendationCard', () => ({ RecommendationCard: () => null }));
vi.mock('../LocationSearchBar', () => ({ LocationSearchBar: () => null }));
vi.mock('../ArchivedTripCard', () => ({ ArchivedTripCard: () => null }));
vi.mock('../../UpgradeModal', () => ({ UpgradeModal: () => null }));
vi.mock('../../../contexts/SwipeableRowContext', () => ({
  SwipeableRowProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../SwipeableTripCardWrapper', () => ({
  SwipeableTripCardWrapper: () => null,
  SwipeableProTripCardWrapper: () => null,
}));
vi.mock('../../../hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('../../../hooks/useDeleteTrip', () => ({ useDeleteTrip: () => ({ deleteTrip: vi.fn() }) }));
vi.mock('../../../hooks/useLocationFilteredRecommendations', () => ({
  useLocationFilteredRecommendations: () => ({
    recommendations: [],
    activeLocation: '',
    isBasecampLocation: false,
  }),
}));
vi.mock('@/hooks/useSavedRecommendations', () => ({ useSavedRecommendations: () => ({}) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useDemoMode', () => ({ useDemoMode: () => ({ isDemoMode: false }) }));
vi.mock('@/hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({ tier: 'pro' }),
}));
vi.mock('../../dashboard/SortableTripGrid', () => ({ SortableTripGrid: () => null }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      delete: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }) }),
    }),
  },
}));

describe('TripGrid requests tab', () => {
  it('does not render pending trip cards in my trips view outside requests filter', () => {
    render(<TripGrid viewMode="myTrips" trips={[]} proTrips={{}} events={{}} activeFilter="all" />);

    expect(screen.queryByText('pending-enabled')).not.toBeInTheDocument();
  });

  it('renders empty requests state when no pendingTrips are provided', () => {
    render(
      <TripGrid viewMode="myTrips" trips={[]} proTrips={{}} events={{}} activeFilter="requests" />,
    );

    expect(screen.getByText('No pending requests')).toBeInTheDocument();
    expect(screen.queryByText('Pending Trip')).not.toBeInTheDocument();
  });

  it('renders pending trips in Requests using standard TripCard pending mode', () => {
    render(
      <TripGrid
        viewMode="myTrips"
        trips={[]}
        proTrips={{}}
        events={{}}
        activeFilter="requests"
        pendingTrips={[
          {
            id: 'trip-100',
            title: 'Pending via Trips Query',
            location: 'Paris',
            dateRange: 'Apr 1, 2026 - Apr 8, 2026',
            participants: [],
          },
        ]}
        outboundRequestIdsByTripId={{ 'trip-100': 'req-100' }}
      />,
    );

    expect(screen.getByText('Pending via Trips Query')).toBeInTheDocument();
    expect(screen.getByText('pending-enabled')).toBeInTheDocument();
    expect(screen.getByText('Cancel request')).toBeInTheDocument();
  });

  it('does not render pending request cards in standard My Trips mode', () => {
    render(<TripGrid viewMode="myTrips" trips={[]} proTrips={{}} events={{}} activeFilter="all" />);

    expect(screen.queryByText('Requests Only Trip')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel request')).not.toBeInTheDocument();
  });
});

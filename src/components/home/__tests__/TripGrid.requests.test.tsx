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

  it('renders outbound requests with TripCard pending mode', () => {
    render(
      <TripGrid
        viewMode="myTrips"
        trips={[]}
        proTrips={{}}
        events={{}}
        activeFilter="requests"
        dashboardJoinRequests={[
          {
            id: 'req-1',
            trip_id: 'trip-1',
            user_id: 'user-1',
            requested_at: '2026-04-10T00:00:00Z',
            direction: 'outbound',
            trip: {
              id: 'trip-1',
              name: 'Pending Trip',
              destination: 'LA',
              start_date: '2026-05-01',
              cover_image_url: undefined,
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('pending-enabled')).toBeInTheDocument();
    expect(screen.getByText('Cancel request')).toBeInTheDocument();
  });

  it('hides inbound approval requests from the Requests section', () => {
    render(
      <TripGrid
        viewMode="myTrips"
        trips={[]}
        proTrips={{}}
        events={{}}
        activeFilter="requests"
        dashboardJoinRequests={[
          {
            id: 'req-2',
            trip_id: 'trip-2',
            user_id: 'other-user',
            requested_at: '2026-04-10T00:00:00Z',
            direction: 'inbound',
            requesterLabel: 'Alex',
            trip: {
              id: 'trip-2',
              name: 'Inbound Trip',
              destination: 'NYC',
              start_date: '2026-06-01',
              cover_image_url: undefined,
              trip_type: 'consumer',
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('No pending requests')).toBeInTheDocument();
    expect(screen.queryByText('Inbound Trip')).not.toBeInTheDocument();
  });

  it('does not render outbound pending request cards in standard My Trips mode', () => {
    render(
      <TripGrid
        viewMode="myTrips"
        trips={[]}
        proTrips={{}}
        events={{}}
        activeFilter="all"
        dashboardJoinRequests={[
          {
            id: 'req-3',
            trip_id: 'trip-3',
            user_id: 'user-1',
            requested_at: '2026-04-10T00:00:00Z',
            direction: 'outbound',
            trip: {
              id: 'trip-3',
              name: 'Requests Only Trip',
              destination: 'Chicago',
              start_date: '2026-07-01',
              cover_image_url: undefined,
            },
          },
        ]}
      />,
    );

    expect(screen.queryByText('Requests Only Trip')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel request')).not.toBeInTheDocument();
  });

  it('renders only outbound cards when inbound and outbound requests coexist', () => {
    render(
      <TripGrid
        viewMode="myTrips"
        trips={[]}
        proTrips={{}}
        events={{}}
        activeFilter="requests"
        dashboardJoinRequests={[
          {
            id: 'req-4',
            trip_id: 'trip-4',
            user_id: 'user-1',
            requested_at: '2026-04-10T00:00:00Z',
            direction: 'outbound',
            trip: {
              id: 'trip-4',
              name: 'Outbound Trip',
              destination: 'Austin',
              start_date: '2026-07-01',
              cover_image_url: undefined,
            },
          },
          {
            id: 'req-5',
            trip_id: 'trip-5',
            user_id: 'other-user',
            requested_at: '2026-04-10T00:00:00Z',
            direction: 'inbound',
            requesterLabel: 'Sam',
            trip: {
              id: 'trip-5',
              name: 'Inbound Trip',
              destination: 'Seattle',
              start_date: '2026-08-01',
              cover_image_url: undefined,
              trip_type: 'consumer',
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('Outbound Trip')).toBeInTheDocument();
    expect(screen.queryByText('Inbound Trip')).not.toBeInTheDocument();
  });
});

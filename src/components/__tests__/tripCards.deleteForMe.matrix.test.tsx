import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TripCard } from '../TripCard';
import { EventCard } from '../EventCard';
import { ProTripCard } from '../ProTripCard';
import type { EventData } from '@/types/events';
import type { ProTripData } from '@/types/pro';
import { supabase } from '@/integrations/supabase/client';

const USER_ID = 'user-creator-1';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-creator-1' } } }),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock('@/services/stream/streamMembershipSync', () => ({
  removeMemberFromTripChannels: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-creator-1' } }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-creator-1' } }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('../../hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({ tier: 'pro' }),
}));

vi.mock('../../hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({ tier: 'pro' }),
}));

vi.mock('@/hooks/usePrefetchTrip', () => ({
  usePrefetchTrip: () => ({ prefetch: vi.fn() }),
}));

vi.mock('../../hooks/usePrefetchTrip', () => ({
  usePrefetchTrip: () => ({ prefetch: vi.fn() }),
}));

vi.mock('@/hooks/useProTrips', () => ({
  useProTrips: () => ({
    archiveTrip: vi.fn(),
    hideTrip: vi.fn(),
  }),
}));

vi.mock('../../hooks/useProTrips', () => ({
  useProTrips: () => ({
    archiveTrip: vi.fn(),
    hideTrip: vi.fn(),
  }),
}));

vi.mock('@/store/demoTripMembersStore', () => ({
  useDemoTripMembersStore: () => [],
}));

vi.mock('../../store/demoTripMembersStore', () => ({
  useDemoTripMembersStore: () => [],
}));

vi.mock('../OptimizedImage', () => ({
  OptimizedImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('../ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('../ArchiveConfirmDialog', () => ({ ArchiveConfirmDialog: () => null }));
vi.mock('../InviteModal', () => ({ InviteModal: () => null }));
vi.mock('../share/ShareTripModal', () => ({ ShareTripModal: () => null }));
vi.mock('../trip/LazyTripExportModal', () => ({ LazyTripExportModal: () => null }));
vi.mock('../trip/TripExportModal', () => ({ TripExportModal: () => null }));

vi.mock('../DeleteTripConfirmDialog', () => ({
  DeleteTripConfirmDialog: ({
    isOpen,
    onConfirm,
    isLoading,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    isLoading?: boolean;
  }) =>
    isOpen ? (
      <button type="button" onClick={onConfirm} disabled={isLoading}>
        Delete For Me
      </button>
    ) : null,
}));

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const consumerTrip = {
  id: 'consumer-trip-1',
  title: 'Beach Weekend',
  location: 'Malibu, CA',
  dateRange: 'Jul 1 - Jul 3, 2026',
  participants: [],
  created_by: USER_ID,
};

const eventTrip = {
  id: 'event-trip-1',
  title: 'Community Festival',
  location: 'Austin, TX',
  dateRange: 'Aug 1 - Aug 3, 2026',
  category: 'Festival',
  description: 'Outdoor event',
  tags: [],
  capacity: 500,
  registrationStatus: 'open',
  attendanceExpected: 250,
  groupChatEnabled: true,
  created_by: USER_ID,
} as EventData;

const proTrip = {
  id: 'pro-trip-1',
  title: 'Summer Tour',
  description: 'Arena run',
  location: 'Los Angeles, CA',
  dateRange: 'Jul 1 - Jul 10, 2026',
  tags: [],
  participants: [],
  roster: [],
  roomAssignments: [],
  schedule: [],
  perDiem: {
    dailyRate: 0,
    currency: 'USD',
    startDate: '',
    endDate: '',
    participants: [],
  },
  settlement: [],
  medical: [],
  compliance: [],
  media: [],
  sponsors: [],
  budget: { total: 0, spent: 0, categories: [] },
  itinerary: [],
  created_by: USER_ID,
} as ProTripData;

describe('Delete for me matrix — consumer / event / pro cards call leave_trip via useDeleteTrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true },
      error: null,
    } as never);
  });

  it.each([
    {
      label: 'consumer TripCard',
      tripId: consumerTrip.id,
      renderCard: () => renderWithQuery(<TripCard trip={consumerTrip} />),
    },
    {
      label: 'event EventCard',
      tripId: eventTrip.id,
      renderCard: () => renderWithQuery(<EventCard event={eventTrip} />),
    },
    {
      label: 'pro ProTripCard',
      tripId: proTrip.id,
      renderCard: () => renderWithQuery(<ProTripCard trip={proTrip} />),
    },
  ])('$label → useDeleteTrip → leave_trip RPC', async ({ tripId, renderCard }) => {
    renderCard();

    fireEvent.click(screen.getByText('Delete for me'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete For Me' }));

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('leave_trip', { _trip_id: tripId });
    });
  });
});

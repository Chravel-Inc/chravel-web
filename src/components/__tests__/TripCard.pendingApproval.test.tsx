import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TripCard } from '../TripCard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/useDeleteTrip', () => ({
  useDeleteTrip: () => ({ deleteTrip: vi.fn(), isDeleting: false }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({ tier: 'pro' }),
}));

vi.mock('@/hooks/usePrefetchTrip', () => ({
  usePrefetchTrip: () => ({ prefetch: vi.fn() }),
}));

vi.mock('@/store/demoTripMembersStore', () => ({
  useDemoTripMembersStore: () => [],
}));

vi.mock('../InviteModal', () => ({
  InviteModal: () => null,
}));

vi.mock('../share/ShareTripModal', () => ({
  ShareTripModal: () => null,
}));

vi.mock('../ArchiveConfirmDialog', () => ({
  ArchiveConfirmDialog: () => null,
}));

vi.mock('../DeleteTripConfirmDialog', () => ({
  DeleteTripConfirmDialog: () => null,
}));

vi.mock('../trip/TripExportModal', () => ({
  TripExportModal: () => null,
}));

describe('TripCard pending approval mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders normal card actions as disabled and blocks navigation', () => {
    render(
      <TripCard
        trip={{
          id: 'trip-1',
          title: 'Pending Trip',
          location: 'Los Angeles',
          dateRange: 'Apr 1, 2026',
          participants: [],
          placesCount: 0,
          peopleCount: 0,
        }}
        pendingApproval
      />,
    );

    expect(screen.getByRole('button', { name: 'Recap' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'View' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows pending feedback badge while keeping View CTA non-interactive', () => {
    render(
      <TripCard
        trip={{
          id: 'trip-2',
          title: 'Pending Approval Feedback',
          location: 'San Diego',
          dateRange: 'Apr 10, 2026',
          participants: [],
          placesCount: 0,
          peopleCount: 0,
        }}
        pendingApproval
        pendingBadgeLabel="Awaiting host approval"
      />,
    );

    expect(screen.getByText('Awaiting host approval')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

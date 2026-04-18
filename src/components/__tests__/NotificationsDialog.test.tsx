import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationsDialog } from '../home/NotificationsDialog';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, isLoading: false }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockClearAll = vi.fn();

let mockNotifications: unknown[] = [];
let mockUnreadCount = 0;

vi.mock('@/hooks/useNotificationRealtime', () => ({
  useNotificationRealtime: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    clearAll: mockClearAll,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => ({ limit: () => ({ data: [] }) }) }),
        ilike: () => ({ order: () => ({ limit: () => ({ data: [] }) }) }),
      }),
    }),
  },
}));

function renderDialog(open: boolean) {
  const onOpenChange = vi.fn();
  const result = render(
    <MemoryRouter>
      <NotificationsDialog open={open} onOpenChange={onOpenChange} />
    </MemoryRouter>,
  );
  return { ...result, onOpenChange };
}

describe('NotificationsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications = [];
    mockUnreadCount = 0;
  });

  it('renders empty state when open with no notifications', () => {
    renderDialog(true);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderDialog(false);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('renders notification items when present', () => {
    mockNotifications = [
      {
        id: 'n-1',
        type: 'join_request',
        title: 'Alice wants to join Trip',
        description: 'Tap to approve or reject',
        tripId: 'trip-1',
        tripName: 'Coachella',
        timestamp: '4 days ago',
        isRead: false,
      },
    ];
    mockUnreadCount = 1;

    renderDialog(true);
    expect(screen.getByText('Alice wants to join Trip')).toBeInTheDocument();
    expect(screen.getByText('Coachella')).toBeInTheDocument();
  });

  it('navigates mention notification to consumer chat with metadata-first routing + handshake state', async () => {
    mockNotifications = [
      {
        id: 'n-consumer-mention',
        type: 'mention',
        title: 'You were mentioned',
        description: 'In consumer trip',
        tripId: 'trip-fallback',
        tripName: 'Consumer Trip',
        timestamp: 'now',
        isRead: false,
        data: {
          trip_id: 'trip-consumer',
          trip_type: 'consumer',
          channel_type: 'chat',
          message_id: 'msg-123',
        },
      },
    ];

    renderDialog(true);
    fireEvent.click(screen.getByText('You were mentioned'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trip/trip-consumer?tab=chat', {
        state: {
          chatNavigationContext: {
            source: 'notification',
            notificationId: 'n-consumer-mention',
            messageId: 'msg-123',
            channelType: 'chat',
          },
        },
      });
    });
  });

  it('navigates mention notification to pro chat', async () => {
    mockNotifications = [
      {
        id: 'n-pro-mention',
        type: 'mention',
        title: 'You were mentioned in pro trip',
        description: 'Pro mention',
        tripId: 'trip-pro',
        tripName: 'Pro Trip',
        timestamp: 'now',
        isRead: false,
        data: {
          trip_id: 'trip-pro',
          trip_type: 'pro',
          channel_type: 'chat',
        },
      },
    ];

    renderDialog(true);
    fireEvent.click(screen.getByText('You were mentioned in pro trip'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/tour/pro/trip-pro?tab=chat', {
        state: {
          chatNavigationContext: {
            source: 'notification',
            notificationId: 'n-pro-mention',
            channelType: 'chat',
          },
        },
      });
    });
  });

  it('navigates mention notification to event chat', async () => {
    mockNotifications = [
      {
        id: 'n-event-mention',
        type: 'mention',
        title: 'You were mentioned in event',
        description: 'Event mention',
        tripId: 'trip-event',
        tripName: 'Event Trip',
        timestamp: 'now',
        isRead: false,
        data: {
          trip_id: 'trip-event',
          trip_type: 'event',
          channel_type: 'chat',
        },
      },
    ];

    renderDialog(true);
    fireEvent.click(screen.getByText('You were mentioned in event'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/event/trip-event?tab=chat', {
        state: {
          chatNavigationContext: {
            source: 'notification',
            notificationId: 'n-event-mention',
            channelType: 'chat',
          },
        },
      });
    });
  });

  it('falls back to notification tripId when metadata trip_id is missing', async () => {
    mockNotifications = [
      {
        id: 'n-fallback',
        type: 'calendar',
        title: 'Itinerary updated',
        description: 'No metadata trip id',
        tripId: 'trip-safe-fallback',
        tripName: 'Fallback Trip',
        timestamp: 'now',
        isRead: false,
        data: {
          trip_type: 'consumer',
        },
      },
    ];

    renderDialog(true);
    fireEvent.click(screen.getByText('Itinerary updated'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trip/trip-safe-fallback?tab=calendar', undefined);
    });
  });
});

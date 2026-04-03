import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationsDialog } from '../home/NotificationsDialog';
import { MemoryRouter } from 'react-router-dom';

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
});

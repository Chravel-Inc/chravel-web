/**
 * Ensures in-app notifications (including join_request) render when the dialog is open.
 * Regression: mobile home mounts this dialog outside TripActionBar (hidden below lg).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsDialog } from '../NotificationsDialog';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: true }),
}));

vi.mock('@/hooks/useNotificationRealtime', () => ({
  useNotificationRealtime: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
    fetchNotifications: vi.fn(),
    fetchUnreadCount: vi.fn(),
    deleteNotification: vi.fn(),
  }),
}));

describe('NotificationsDialog', () => {
  it('shows join request notification copy from demo data when open', () => {
    render(
      <MemoryRouter>
        <NotificationsDialog open onOpenChange={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Join Request - The Tyler's Tie The Knot")).toBeInTheDocument();
    expect(screen.getByText(/Emily Rodriguez would like to join your trip/i)).toBeInTheDocument();
  });
});

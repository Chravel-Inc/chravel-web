import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { EventNotificationsSection } from '../EventNotificationsSection';

const getNotificationPreferences = vi.fn();

vi.mock('@/services/userPreferencesService', () => ({
  userPreferencesService: {
    getNotificationPreferences: (...args: unknown[]) => getNotificationPreferences(...args),
    updateNotificationPreferences: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 't@example.com' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useNativePush', () => ({
  useNativePush: () => ({
    isNative: false,
    registerForPush: vi.fn(),
    unregisterFromPush: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ showDemoContent: false }),
}));

vi.mock('@/hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({
    tier: 'free',
    isSuperAdmin: false,
  }),
}));

describe('EventNotificationsSection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('stops loading and shows defaults when notification preferences fetch never resolves', async () => {
    getNotificationPreferences.mockImplementation(() => new Promise(() => {}));

    render(<EventNotificationsSection />);

    expect(document.querySelector('.gold-gradient-spinner')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 3, name: 'Event Notifications' }),
      ).toBeInTheDocument();
    });
    expect(document.querySelector('.gold-gradient-spinner')).not.toBeInTheDocument();
  });

  it('renders preferences after a successful fetch', async () => {
    getNotificationPreferences.mockResolvedValue({
      push_enabled: true,
      email_enabled: false,
      sms_enabled: false,
      broadcasts: true,
      calendar_events: true,
      join_requests: true,
      tasks: true,
      polls: true,
      chat_messages: false,
      mentions_only: true,
      payments: true,
      trip_invites: true,
      basecamp_updates: true,
      quiet_hours_enabled: false,
      quiet_start: '22:00',
      quiet_end: '08:00',
      timezone: 'UTC',
    });

    render(<EventNotificationsSection />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 3, name: 'Event Notifications' }),
      ).toBeInTheDocument();
    });

    expect(getNotificationPreferences).toHaveBeenCalledWith('user-1');
  });
});

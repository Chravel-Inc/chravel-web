import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDashboard } from '../AdminDashboard';

const getScheduledMessagesMock = vi.fn();

vi.mock('@/hooks/useProTrips', () => ({
  useProTrips: () => ({
    data: [],
    proTrips: [],
  }),
}));

vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: () => false,
}));

vi.mock('@/services/unifiedMessagingService', () => ({
  unifiedMessagingService: {
    getScheduledMessages: (...args: unknown[]) => getScheduledMessagesMock(...args),
    scheduleMessage: vi.fn(),
  },
}));

describe('AdminDashboard broadcast scheduling disabled state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getScheduledMessagesMock.mockResolvedValue([]);
  });

  it('shows unavailable copy and disables schedule action when scheduling flag is off', async () => {
    render(<AdminDashboard />);

    expect(
      await screen.findByText(
        'Scheduled messages for Pro Trips are temporarily unavailable while scheduling is disabled.',
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Schedule Pro Trip Message' })).toBeDisabled();
  });
});

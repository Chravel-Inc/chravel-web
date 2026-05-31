import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileTripTabs } from '../MobileTripTabs';

vi.mock('../../../hooks/useFeatureToggle', () => ({
  useFeatureToggle: () => ({
    showChat: true,
    showCalendar: true,
    showConcierge: true,
    showMedia: true,
    showPayments: true,
    showPlaces: true,
    showPolls: true,
    showTasks: true,
  }),
}));

vi.mock('../../../hooks/usePrefetchTrip', () => ({
  usePrefetchTrip: () => ({
    prefetchTab: vi.fn(),
    prefetchAdjacentTabs: vi.fn(),
    prefetchPriorityTabs: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('../../../contexts/TripVariantContext', () => ({
  useTripVariant: () => ({ accentColors: {} }),
}));

vi.mock('../../../hooks/useEventPermissions', () => ({
  useEventPermissions: () => ({ isAdmin: false }),
}));

vi.mock('../../../hooks/useEventTabSettings', () => ({
  useEventTabSettings: () => ({ enabledTabs: [] }),
}));

vi.mock('../../../hooks/useRoleAssignments', () => ({
  useRoleAssignments: () => ({ assignRole: vi.fn() }),
}));

vi.mock('../../../hooks/useTripRoles', () => ({
  useTripRoles: () => ({ refetch: vi.fn() }),
}));

vi.mock('../../../hooks/useEventAgenda', () => ({
  useEventAgenda: () => ({ sessions: [] }),
}));

vi.mock('../../../hooks/useEventLineup', () => ({
  useEventLineup: () => ({ members: [], addMembersFromAgenda: vi.fn() }),
}));

vi.mock('@/lib/retryImport', () => ({
  retryImport: <T,>(loader: () => Promise<T>) => loader(),
}));

vi.mock('../../AIConciergeChat', () => ({
  AIConciergeChat: () => <div data-testid="concierge-panel">concierge-panel</div>,
}));

vi.mock('@/features/chat/components/TripChat', () => ({
  TripChat: () => <div data-testid="chat-panel">chat-panel</div>,
}));

vi.mock('../MobileUnifiedMediaHub', () => ({
  MobileUnifiedMediaHub: () => <div data-testid="media-panel">media-panel</div>,
}));

vi.mock('../MobileTripPayments', () => ({
  MobileTripPayments: () => <div data-testid="payments-panel">payments-panel</div>,
}));

vi.mock('../MobileGroupCalendar', () => ({
  MobileGroupCalendar: () => <div data-testid="calendar-panel">calendar-panel</div>,
}));

vi.mock('../../CommentsWall', () => ({
  CommentsWall: () => <div data-testid="polls-panel">polls-panel</div>,
}));

vi.mock('../../PlacesSection', () => ({
  PlacesSection: () => <div data-testid="places-panel">places-panel</div>,
}));

vi.mock('../MobileTripTasks', () => ({
  MobileTripTasks: () => <div data-testid="tasks-panel">tasks-panel</div>,
}));

describe('MobileTripTabs concierge tab switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('calls onTabChange when leaving Concierge for Media or Payments', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <MobileTripTabs
        activeTab="concierge"
        onTabChange={onTabChange}
        tripId="trip-1"
        basecamp={{ name: 'Tokyo', address: 'Japan' }}
        tripData={{ trip_type: 'consumer' }}
      />,
    );

    expect(await screen.findByTestId('concierge-panel')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Media' }));
    await waitFor(() => expect(onTabChange).toHaveBeenCalledWith('media'));

    onTabChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Payments' }));
    await waitFor(() => expect(onTabChange).toHaveBeenCalledWith('payments'));
  });

  it('keeps tab panels overflow-hidden so only inner panes scroll', () => {
    render(
      <MobileTripTabs
        activeTab="concierge"
        onTabChange={vi.fn()}
        tripId="trip-1"
        basecamp={{ name: 'Tokyo', address: 'Japan' }}
      />,
    );

    const conciergePanel = document.querySelector('[data-tab-panel="concierge"]');
    expect(conciergePanel).toHaveAttribute('data-tab-active', 'true');
    expect(conciergePanel).toHaveStyle({ overflow: 'hidden' });
  });
});

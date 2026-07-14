import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoleChannels } from '../useRoleChannels';
import type { TripChannel } from '../../types/roleChannels';

const getAccessibleChannelsMock = vi.fn();
const channelOnMock = vi.fn();
const removeChannelMock = vi.fn();
const channelMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: vi.fn(),
  },
}));

vi.mock('../useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/constants/demoTrips', () => ({
  isDemoChannelTripId: () => false,
}));

vi.mock('@/services/mockRolesService', () => ({
  MockRolesService: { getChannelsForTrip: vi.fn(() => []) },
}));

vi.mock('../../data/demoChannelData', () => ({
  getDemoChannelsForTrip: vi.fn(() => ({ channels: [], messagesByChannel: new Map() })),
}));

vi.mock('../../services/channelService', () => ({
  channelService: {
    getAccessibleChannels: (...args: unknown[]) => getAccessibleChannelsMock(...args),
    archiveChannel: vi.fn(),
    updateChannel: vi.fn(),
  },
}));

vi.mock('../../services/roleChannelService', () => ({
  roleChannelService: {
    createRoleChannel: vi.fn(),
    deleteChannel: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: (...args: unknown[]) => channelMock(...args),
    removeChannel: (...args: unknown[]) => removeChannelMock(...args),
  },
}));

const makeChannel = (id: string, name: string): TripChannel => ({
  id,
  tripId: 'trip-1',
  channelName: name,
  channelSlug: name.toLowerCase().replace(/\s+/g, '-'),
  requiredRoleId: `role-${id}`,
  requiredRoleName: name,
  isPrivate: true,
  isArchived: false,
  memberCount: 3,
  createdBy: 'user-9',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

describe('useRoleChannels realtime + guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessibleChannelsMock.mockResolvedValue([]);
    channelMock.mockImplementation(() => {
      const channel = {
        on: (...args: unknown[]) => {
          channelOnMock(...args);
          return channel;
        },
        subscribe: () => channel,
      };
      return channel;
    });
  });

  it('does not query or subscribe when tripId is undefined (consumer trips)', async () => {
    const { result } = renderHook(() => useRoleChannels(undefined, 'user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getAccessibleChannelsMock).not.toHaveBeenCalled();
    expect(channelMock).not.toHaveBeenCalled();
    expect(result.current.availableChannels).toEqual([]);
  });

  it('subscribes to trip_channels and user_trip_roles filtered by trip and refetches on events', async () => {
    getAccessibleChannelsMock.mockResolvedValue([makeChannel('c1', 'Coaches')]);

    const { unmount } = renderHook(() => useRoleChannels('trip-1', 'user-1'));

    await waitFor(() => {
      expect(getAccessibleChannelsMock).toHaveBeenCalledTimes(1);
    });
    expect(channelMock).toHaveBeenCalledWith('trip_channels_rt:trip-1');

    const registrations = channelOnMock.mock.calls.map(
      call => call[1] as { table: string; filter: string; event: string },
    );
    expect(registrations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: 'trip_channels', filter: 'trip_id=eq.trip-1' }),
        expect.objectContaining({ table: 'user_trip_roles', filter: 'trip_id=eq.trip-1' }),
      ]),
    );

    // Two rapid events coalesce into one debounced silent refetch
    const callbacks = channelOnMock.mock.calls.map(call => call[2] as () => void);
    act(() => {
      callbacks[0]();
      callbacks[1]();
    });

    await waitFor(
      () => {
        expect(getAccessibleChannelsMock).toHaveBeenCalledTimes(2);
      },
      { timeout: 2000 },
    );
    // Debounce coalesced: exactly one extra call, not two
    expect(getAccessibleChannelsMock).toHaveBeenCalledTimes(2);

    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it('evicts the active channel when it disappears from the refreshed list', async () => {
    const coaches = makeChannel('c1', 'Coaches');
    getAccessibleChannelsMock.mockResolvedValue([coaches]);

    const { result } = renderHook(() => useRoleChannels('trip-1', 'user-1'));

    await waitFor(() => {
      expect(result.current.availableChannels).toHaveLength(1);
    });

    act(() => {
      result.current.setActiveChannel(coaches);
    });
    expect(result.current.activeChannel?.id).toBe('c1');

    // Channel archived elsewhere: next (realtime-triggered) refetch omits it
    getAccessibleChannelsMock.mockResolvedValue([]);
    const callback = channelOnMock.mock.calls[0][2] as () => void;
    act(() => {
      callback();
    });

    await waitFor(
      () => {
        expect(result.current.activeChannel).toBeNull();
      },
      { timeout: 2000 },
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      expect.stringContaining('#coaches'),
      expect.objectContaining({ description: expect.stringContaining('archived') }),
    );
  });

  it('keeps the last-known list and active channel when a silent refetch fails', async () => {
    const coaches = makeChannel('c1', 'Coaches');
    getAccessibleChannelsMock.mockResolvedValue([coaches]);

    const { result } = renderHook(() => useRoleChannels('trip-1', 'user-1'));

    await waitFor(() => {
      expect(result.current.availableChannels).toHaveLength(1);
    });

    act(() => {
      result.current.setActiveChannel(coaches);
    });

    // Transient network failure on the background refetch
    getAccessibleChannelsMock.mockRejectedValue(new Error('network down'));
    const callback = channelOnMock.mock.calls[0][2] as () => void;
    act(() => {
      callback();
    });

    // Wait out the debounce + refetch, then assert nothing was evicted
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    expect(result.current.availableChannels).toHaveLength(1);
    expect(result.current.activeChannel?.id).toBe('c1');
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const connectStreamClientMock = vi.fn();
const addTripMock = vi.fn();

vi.mock('../streamClient', () => ({
  connectStreamClient: (...args: unknown[]) => connectStreamClientMock(...args),
}));

vi.mock('../streamMembershipSync', () => ({
  addMemberToTripChannels: (...args: unknown[]) => addTripMock(...args),
  removeMemberFromTripChannels: vi.fn(),
  addMemberToProChannel: vi.fn(),
  removeMemberFromProChannel: vi.fn(),
}));

import {
  reportStreamMembershipSyncFailure,
  syncAddMemberToTripChannels,
} from '../streamMembershipCoordinator';

describe('streamMembershipCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries until stream client is available', async () => {
    connectStreamClientMock.mockResolvedValueOnce(null).mockResolvedValueOnce({ userID: 'user-1' });
    addTripMock.mockResolvedValue(undefined);

    await syncAddMemberToTripChannels('trip-1', 'user-2');

    expect(connectStreamClientMock).toHaveBeenCalledTimes(2);
    expect(addTripMock).toHaveBeenCalledWith('trip-1', 'user-2');
  });

  it('deduplicates concurrent requests for the same membership op', async () => {
    connectStreamClientMock.mockResolvedValue({ userID: 'user-1' });
    addTripMock.mockResolvedValue(undefined);

    await Promise.all([
      syncAddMemberToTripChannels('trip-1', 'user-2'),
      syncAddMemberToTripChannels('trip-1', 'user-2'),
    ]);

    expect(addTripMock).toHaveBeenCalledTimes(1);
  });

  it('logs structured error metadata for failed sync operations', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    reportStreamMembershipSyncFailure(
      'add-trip-member',
      { tripId: 'trip-1', userId: 'user-2' },
      new Error('boom'),
    );

    expect(consoleSpy).toHaveBeenCalledWith('[StreamMembershipCoordinator] sync failed', {
      operation: 'add-trip-member',
      tripId: 'trip-1',
      userId: 'user-2',
      error: 'boom',
    });

    consoleSpy.mockRestore();
  });
});

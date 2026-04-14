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

import { syncAddMemberToTripChannels } from '../streamMembershipCoordinator';

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
});

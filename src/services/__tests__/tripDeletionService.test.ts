import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeDeleteTrip } from '../tripDeletionService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('../stream/streamMembershipSync', () => ({
  removeMemberFromTripChannels: vi.fn().mockResolvedValue(undefined),
}));

describe('tripDeletionService.executeDeleteTrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses leave_trip RPC for members and returns left action', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true },
      error: null,
    } as never);

    const result = await executeDeleteTrip({
      tripId: 'trip-1',
      userId: 'user-1',
      isCreator: false,
    });

    expect(supabase.rpc).toHaveBeenCalledWith('leave_trip', { _trip_id: 'trip-1' });
    expect(result).toEqual({ action: 'left', tripId: 'trip-1' });
  });

  it('uses leave_trip RPC for creators and returns archived when server archives', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true, archived: true },
      error: null,
    } as never);

    const result = await executeDeleteTrip({
      tripId: 'trip-2',
      userId: 'creator-1',
      isCreator: true,
    });

    expect(supabase.rpc).toHaveBeenCalledWith('leave_trip', { _trip_id: 'trip-2' });
    expect(result).toEqual({ action: 'archived', tripId: 'trip-2' });
  });

  it('throws when leave_trip RPC reports failure', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: false, message: 'You are not a member of this trip' },
      error: null,
    } as never);

    await expect(
      executeDeleteTrip({
        tripId: 'trip-3',
        userId: 'user-3',
        isCreator: false,
      }),
    ).rejects.toThrow('You are not a member of this trip');
  });
});

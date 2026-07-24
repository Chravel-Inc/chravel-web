import { beforeEach, describe, expect, it, vi } from 'vitest';
import { archiveTripForUser } from '../archiveService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}));

vi.mock('../stream/streamMembershipSync', () => ({
  removeMemberFromTripChannels: vi.fn().mockResolvedValue(undefined),
}));

describe('archiveService.archiveTripForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls archive_trip RPC and returns archived when server archives', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true, archived: true },
      error: null,
    } as never);

    const result = await archiveTripForUser('trip-1');

    expect(supabase.rpc).toHaveBeenCalledWith('archive_trip', { _trip_id: 'trip-1' });
    expect(result).toEqual({ action: 'archived' });
  });

  it('returns left when archive_trip delegates to leave_trip semantics', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true, notify_user_id: 'other-user' },
      error: null,
    } as never);

    const result = await archiveTripForUser('trip-2');

    expect(result).toEqual({ action: 'left' });
  });

  it('throws when archive_trip RPC reports failure', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: false, message: 'You are not a member of this trip' },
      error: null,
    } as never);

    await expect(archiveTripForUser('trip-3')).rejects.toThrow('You are not a member of this trip');
  });
});

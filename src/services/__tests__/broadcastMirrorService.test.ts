import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordBroadcastMirror } from '../broadcastMirrorService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockFrom = vi.mocked(supabase.from);

describe('recordBroadcastMirror', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a broadcasts row so the notify trigger + search/export see chat broadcasts', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert } as never);

    await recordBroadcastMirror({
      tripId: 'trip-1',
      message: 'Bus leaves at 9am sharp',
      createdBy: 'user-1',
    });

    expect(mockFrom).toHaveBeenCalledWith('broadcasts');
    expect(insert).toHaveBeenCalledWith({
      trip_id: 'trip-1',
      created_by: 'user-1',
      message: 'Bus leaves at 9am sharp',
      priority: 'normal',
      is_sent: true,
    });
  });

  it('throws on insert error so callers can log the miss', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: 'RLS denied' } });
    mockFrom.mockReturnValue({ insert } as never);

    await expect(
      recordBroadcastMirror({ tripId: 't', message: 'm', createdBy: 'u' }),
    ).rejects.toMatchObject({ message: 'RLS denied' });
  });
});

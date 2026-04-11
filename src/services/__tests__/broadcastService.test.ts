import { beforeEach, describe, expect, it, vi } from 'vitest';
import { broadcastService } from '../broadcastService';
import { supabase } from '@/integrations/supabase/client';

const insertMock = vi.fn();
const selectMock = vi.fn();
const singleMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: insertMock,
    })),
  },
}));

describe('broadcastService.createBroadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as never);

    insertMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      single: singleMock,
    });
    singleMock.mockResolvedValue({
      data: { id: 'broadcast-1' },
      error: null,
    });
  });

  it('does not pass scheduled_for and forces immediate send in insert payload', async () => {
    await broadcastService.createBroadcast({
      trip_id: 'trip-1',
      message: 'Hello team',
      priority: 'urgent',
      scheduled_for: '2026-04-15T10:00:00.000Z',
      metadata: { recipients: 'everyone' },
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        trip_id: 'trip-1',
        message: 'Hello team',
        priority: 'urgent',
        created_by: 'user-123',
        is_sent: true,
      }),
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ scheduled_for: expect.anything() }),
    );
  });
});

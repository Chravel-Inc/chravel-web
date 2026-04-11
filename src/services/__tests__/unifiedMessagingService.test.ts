import { beforeEach, describe, expect, it, vi } from 'vitest';
import { unifiedMessagingService } from '../unifiedMessagingService';
import { supabase } from '@/integrations/supabase/client';
import * as featureFlags from '@/lib/featureFlags';

const insertMock = vi.fn();

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

describe('unifiedMessagingService.scheduleMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false and does not attempt insert when broadcast scheduling flag is disabled', async () => {
    vi.spyOn(featureFlags, 'isFeatureFlagEnabled').mockResolvedValue(false);

    const result = await unifiedMessagingService.scheduleMessage(
      'trip-1',
      'Scheduled message',
      new Date('2026-06-01T10:00:00.000Z'),
      'reminder',
    );

    expect(result).toBe(false);
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalledWith('broadcasts');
    expect(insertMock).not.toHaveBeenCalled();
  });
});

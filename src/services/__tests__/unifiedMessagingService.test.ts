import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { Database } from '@/integrations/supabase/types';
import type { ScheduledMessage } from '@/types/messaging';

const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockIsFeatureFlagEnabled = vi.fn();

vi.mock('@/lib/featureFlags', () => ({
  isFeatureFlagEnabled: (...args: unknown[]) => mockIsFeatureFlagEnabled(...args),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: vi.fn((table: string) => {
      if (table === 'broadcasts') {
        return {
          insert: (...args: unknown[]) => mockInsert(...args),
        };
      }

      return {
        insert: vi.fn(),
      };
    }),
  },
}));

import {
  mapBroadcastRowToScheduledMessage,
  unifiedMessagingService,
} from '../unifiedMessagingService';

type BroadcastRow = Database['public']['Tables']['broadcasts']['Row'];

describe('mapBroadcastRowToScheduledMessage', () => {
  it('maps broadcasts row snake_case fields into canonical scheduled message shape', () => {
    const row: BroadcastRow = {
      id: 'broadcast-1',
      trip_id: 'trip-1',
      message: 'Heads up team',
      scheduled_for: '2026-06-01T12:30:00.000Z',
      priority: 'urgent',
      is_sent: false,
      created_at: '2026-05-20T09:00:00.000Z',
      created_by: 'user-1',
      metadata: null,
      updated_at: '2026-05-20T09:00:00.000Z',
    };

    const mapped = mapBroadcastRowToScheduledMessage(row);

    const canonical: ScheduledMessage = mapped;
    expectTypeOf(mapped).toMatchTypeOf<ScheduledMessage>();
    expectTypeOf(mapped).not.toHaveProperty('trip_id');
    expectTypeOf(mapped).not.toHaveProperty('scheduled_for');
    expectTypeOf(mapped).not.toHaveProperty('is_sent');
    expect(canonical.tripId).toBe('trip-1');
    expect(canonical.sendAt).toBe('2026-06-01T12:30:00.000Z');
    expect(canonical.priority).toBe('urgent');
    expect(canonical.isSent).toBe(false);
    expect(canonical.messageType).toBe('broadcast');
    expect(canonical.senderId).toBe('user-1');
    expect(canonical.senderName).toBe('System');
  });

  it('falls back to defaults when optional broadcast columns are null/unknown', () => {
    const row: BroadcastRow = {
      id: 'broadcast-2',
      trip_id: 'trip-2',
      message: 'Fallback test',
      scheduled_for: null,
      priority: 'normal',
      is_sent: null,
      created_at: '2026-05-21T10:00:00.000Z',
      created_by: 'user-2',
      metadata: null,
      updated_at: '2026-05-21T10:00:00.000Z',
    };

    const mapped = mapBroadcastRowToScheduledMessage(row);
    expect(mapped.sendAt).toBe('2026-05-21T10:00:00.000Z');
    expect(mapped.priority).toBe('fyi');
    expect(mapped.isSent).toBe(false);
    expect(mapped.senderId).toBe('user-2');
    expect(mapped.senderName).toBe('System');
  });
});

describe('UnifiedMessagingService scheduling feature flag guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFeatureFlagEnabled.mockResolvedValue(false);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('returns false and does not attempt auth/insert when broadcast scheduling is disabled', async () => {
    const result = await unifiedMessagingService.scheduleMessage(
      'trip-1',
      'Disabled scheduler test',
      new Date('2026-07-01T10:00:00.000Z'),
      'fyi',
    );

    expect(result).toBe(false);
    expect(mockIsFeatureFlagEnabled).toHaveBeenCalledWith('broadcast-scheduling-enabled', false);
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

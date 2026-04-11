import { describe, expect, it } from 'vitest';
import type { Database } from '@/integrations/supabase/types';
import type { ScheduledMessage } from '@/types/messaging';
import { mapBroadcastRowToScheduledMessage } from '../unifiedMessagingService';

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
    expect(canonical.tripId).toBe('trip-1');
    expect(canonical.sendAt).toBe('2026-06-01T12:30:00.000Z');
    expect(canonical.priority).toBe('urgent');
    expect(canonical.isSent).toBe(false);
    expect(canonical.messageType).toBe('broadcast');
    expect(canonical.senderId).toBe('user-1');
    expect(canonical.senderName).toBe('user-1');
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
    expect(mapped.senderName).toBe('user-2');
  });

  it('uses a shortened display name for long creator user ids', () => {
    const longId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const row: BroadcastRow = {
      id: 'broadcast-3',
      trip_id: 'trip-3',
      message: 'Long id test',
      scheduled_for: '2026-06-02T12:00:00.000Z',
      priority: 'fyi',
      is_sent: false,
      created_at: '2026-05-22T09:00:00.000Z',
      created_by: longId,
      metadata: null,
      updated_at: '2026-05-22T09:00:00.000Z',
    };

    const mapped = mapBroadcastRowToScheduledMessage(row);
    expect(mapped.senderId).toBe(longId);
    expect(mapped.senderName).toBe('User aaaaaaaa…');
  });
});

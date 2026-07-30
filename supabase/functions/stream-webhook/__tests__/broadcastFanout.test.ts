import { describe, expect, it } from 'vitest';
import {
  buildBroadcastInsertRow,
  isStreamBroadcastMessage,
  resolveBroadcastTargetRoleIds,
} from '../broadcastFanout.ts';

describe('broadcastFanout helpers', () => {
  it('detects broadcast message_type on the message root', () => {
    expect(isStreamBroadcastMessage({ message_type: 'broadcast' })).toBe(true);
    expect(isStreamBroadcastMessage({ message_type: 'text' })).toBe(false);
  });

  it('detects broadcast message_type nested under custom', () => {
    expect(isStreamBroadcastMessage({ custom: { message_type: 'broadcast' } })).toBe(true);
  });

  it('resolves target role ids from root or custom', () => {
    expect(resolveBroadcastTargetRoleIds({ target_role_ids: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(resolveBroadcastTargetRoleIds({ custom: { target_role_ids: ['c'] } })).toEqual(['c']);
    expect(resolveBroadcastTargetRoleIds({})).toEqual([]);
  });

  it('builds an idempotent dual-write row with stream_message_id metadata', () => {
    const row = buildBroadcastInsertRow({
      tripId: 'trip-1',
      senderId: 'user-1',
      messageText: 'Heads up',
      streamMessageId: 'stream-msg-1',
      targetRoleIds: ['role-1'],
    });

    expect(row.trip_id).toBe('trip-1');
    expect(row.created_by).toBe('user-1');
    expect(row.message).toBe('Heads up');
    expect(row.is_sent).toBe(true);
    expect(row.metadata).toEqual({
      source: 'stream-webhook',
      stream_message_id: 'stream-msg-1',
      target_role_ids: ['role-1'],
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  HANDLED_STREAM_CHANNEL_TYPES,
  HANDLED_STREAM_EVENT_TYPES,
  dedupeRecipients,
  isUuid,
  normalizeMentionedUserIds,
  parseStreamCid,
  resolveTripIdFromChannel,
} from '../eventRouting.ts';

describe('stream-webhook event routing', () => {
  it('accepts required message event types', () => {
    expect(HANDLED_STREAM_EVENT_TYPES.has('message.new')).toBe(true);
    expect(HANDLED_STREAM_EVENT_TYPES.has('message.updated')).toBe(true);
    expect(HANDLED_STREAM_EVENT_TYPES.has('message.deleted')).toBe(true);
  });

  it('accepts required Chravel channel types', () => {
    expect(HANDLED_STREAM_CHANNEL_TYPES.has('chravel-trip')).toBe(true);
    expect(HANDLED_STREAM_CHANNEL_TYPES.has('chravel-broadcast')).toBe(true);
    expect(HANDLED_STREAM_CHANNEL_TYPES.has('chravel-channel')).toBe(true);
    expect(HANDLED_STREAM_CHANNEL_TYPES.has('chravel-concierge')).toBe(false);
  });

  it('parses stream cid into channel type + channel id', () => {
    expect(parseStreamCid('chravel-trip:trip-abc')).toEqual({
      channelType: 'chravel-trip',
      channelId: 'trip-abc',
    });
  });

  it('resolves trip ids for trip and broadcast channels', () => {
    expect(resolveTripIdFromChannel('chravel-trip', 'trip-trip_123')).toBe('trip_123');
    expect(resolveTripIdFromChannel('chravel-broadcast', 'broadcast-trip_123')).toBe('trip_123');
  });

  it('isUuid accepts canonical UUIDs and rejects synthetic ids', () => {
    expect(isUuid('ec5fb8d1-fd98-4323-a471-e19959532aa6')).toBe(true);
    expect(isUuid('5F87A85C-3AF6-4978-819A-6F4CEB76F553')).toBe(true);
    expect(isUuid('b2-recipA-a327a389')).toBe(false);
    expect(isUuid('concierge')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid(42)).toBe(false);
  });

  it('dedupes recipients and excludes sender', () => {
    expect(dedupeRecipients(['u1', 'u1', 'u2', null, undefined], 'u2')).toEqual(['u1']);
  });

  it('normalizes mention payload user ids from mixed webhook shapes', () => {
    expect(
      normalizeMentionedUserIds([
        'u1',
        { id: 'u2' },
        { user_id: 'u3' },
        { user: { id: 'u4' } },
        { id: 'u2' },
        null,
        undefined,
      ]),
    ).toEqual(['u1', 'u2', 'u3', 'u4']);
  });
});

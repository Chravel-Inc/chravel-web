import { describe, expect, it } from 'vitest';
import {
  isBroadcastFlagged,
  isGuardedChannelType,
  senderMayBroadcast,
  stripBroadcastMarkers,
  tripIdFromChannelId,
} from '../policy';

describe('stream-broadcast-guard policy', () => {
  describe('isBroadcastFlagged', () => {
    it('detects every broadcast marker variant', () => {
      expect(isBroadcastFlagged({ message_type: 'broadcast' })).toBe(true);
      expect(isBroadcastFlagged({ privacy_mode: 'broadcast' })).toBe(true);
      expect(isBroadcastFlagged({ isBroadcast: true })).toBe(true);
    });

    it('ignores normal messages and absent payloads', () => {
      expect(isBroadcastFlagged({ message_type: 'message' })).toBe(false);
      expect(isBroadcastFlagged({ text: 'hello' })).toBe(false);
      expect(isBroadcastFlagged(null)).toBe(false);
      expect(isBroadcastFlagged(undefined)).toBe(false);
    });
  });

  describe('isGuardedChannelType / tripIdFromChannelId', () => {
    it('guards trip and broadcast channels only', () => {
      expect(isGuardedChannelType('chravel-trip')).toBe(true);
      expect(isGuardedChannelType('chravel-broadcast')).toBe(true);
      expect(isGuardedChannelType('chravel-channel')).toBe(false);
      expect(isGuardedChannelType('')).toBe(false);
      expect(isGuardedChannelType(undefined)).toBe(false);
    });

    it('extracts trip ids from both guarded channel id shapes', () => {
      expect(tripIdFromChannelId('trip-abc-123')).toBe('abc-123');
      expect(tripIdFromChannelId('broadcast-abc-123')).toBe('abc-123');
      expect(tripIdFromChannelId('channel-xyz')).toBe('');
      expect(tripIdFromChannelId(undefined)).toBe('');
    });
  });

  describe('senderMayBroadcast', () => {
    it('consumer trips (and unknown/null type) are open to all members', () => {
      expect(senderMayBroadcast('consumer', 'member')).toBe(true);
      expect(senderMayBroadcast(null, null)).toBe(true);
      expect(senderMayBroadcast(undefined, 'member')).toBe(true);
    });

    it('pro/event trips require admin, organizer, or owner', () => {
      expect(senderMayBroadcast('pro', 'admin')).toBe(true);
      expect(senderMayBroadcast('pro', 'organizer')).toBe(true);
      expect(senderMayBroadcast('event', 'owner')).toBe(true);
      expect(senderMayBroadcast('pro', 'member')).toBe(false);
      expect(senderMayBroadcast('event', 'member')).toBe(false);
      expect(senderMayBroadcast('pro', null)).toBe(false);
      expect(senderMayBroadcast('event', undefined)).toBe(false);
    });
  });

  describe('stripBroadcastMarkers', () => {
    it('removes every broadcast marker but preserves the rest of the message', () => {
      const stripped = stripBroadcastMarkers({
        text: 'big news',
        message_type: 'broadcast',
        privacy_mode: 'broadcast',
        isBroadcast: true,
        idempotency_key: 'send-1',
      });

      expect(stripped).toEqual({ text: 'big news', idempotency_key: 'send-1' });
    });

    it('leaves non-broadcast marker values untouched', () => {
      const stripped = stripBroadcastMarkers({
        text: 'pay up',
        message_type: 'payment',
        privacy_mode: 'friends',
      });

      expect(stripped).toEqual({
        text: 'pay up',
        message_type: 'payment',
        privacy_mode: 'friends',
      });
    });

    it('does not mutate the input message', () => {
      const original = { text: 'x', message_type: 'broadcast' };
      stripBroadcastMarkers(original);
      expect(original.message_type).toBe('broadcast');
    });
  });
});

import { describe, expect, it } from 'vitest';
import { shouldUseStreamBroadcasts } from '../Broadcasts';

describe('shouldUseStreamBroadcasts', () => {
  it('returns true only when stream is connected and demo mode is off', () => {
    expect(shouldUseStreamBroadcasts({ isDemoMode: false, streamConnected: true })).toBe(true);
    expect(shouldUseStreamBroadcasts({ isDemoMode: true, streamConnected: true })).toBe(false);
    expect(shouldUseStreamBroadcasts({ isDemoMode: false, streamConnected: false })).toBe(false);
  });
});

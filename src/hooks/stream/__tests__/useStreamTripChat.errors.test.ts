import { describe, expect, it } from 'vitest';
import { isStreamReadChannelPermissionError } from '../useStreamTripChat';

describe('isStreamReadChannelPermissionError', () => {
  it('detects ReadChannel authorization failures', () => {
    const err = new Error(
      "StreamChat error code 17: GetOrCreateChannel failed with error: User 'abc' is not allowed to perform action ReadChannel",
    );
    expect(isStreamReadChannelPermissionError(err)).toBe(true);
  });

  it('does not classify unrelated chat errors as permission failures', () => {
    const err = new Error('Timed out waiting for chat connection');
    expect(isStreamReadChannelPermissionError(err)).toBe(false);
  });
});

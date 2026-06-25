import { describe, expect, it } from 'vitest';
import { capRetainedMessages } from '../chatMessageRetention';

describe('capRetainedMessages', () => {
  it('keeps newest messages when over cap', () => {
    const messages = Array.from({ length: 300 }, (_, index) => ({ id: `m-${index}` }));
    const capped = capRetainedMessages(messages, 250);
    expect(capped).toHaveLength(250);
    expect(capped[0].id).toBe('m-50');
    expect(capped[capped.length - 1].id).toBe('m-299');
  });
});

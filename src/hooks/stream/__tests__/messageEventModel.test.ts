import { describe, expect, it } from 'vitest';
import { sortMessagesWithCanonicalOrdering } from '../messageEventModel';

describe('messageEventModel ordering', () => {
  it('sorts out-of-order realtime events by created_at then id', () => {
    const sorted = sortMessagesWithCanonicalOrdering([
      { id: 'm3', created_at: '2026-05-24T10:00:02.000Z' } as any,
      { id: 'm1', created_at: '2026-05-24T10:00:01.000Z' } as any,
      { id: 'm2', created_at: '2026-05-24T10:00:01.000Z' } as any,
    ]);

    expect(sorted.map(m => m.id)).toEqual(['m1', 'm2', 'm3']);
  });
});

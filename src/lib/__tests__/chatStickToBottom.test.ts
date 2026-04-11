import { describe, it, expect } from 'vitest';
import { isScrollNearBottom } from '../chatStickToBottom';

describe('isScrollNearBottom', () => {
  it('returns true when at bottom (within default threshold)', () => {
    const el = { scrollTop: 920, scrollHeight: 1000, clientHeight: 100 };
    expect(isScrollNearBottom(el)).toBe(true);
  });

  it('returns false when scrolled up beyond threshold', () => {
    const el = { scrollTop: 0, scrollHeight: 1000, clientHeight: 100 };
    expect(isScrollNearBottom(el)).toBe(false);
  });

  it('respects custom threshold', () => {
    const scrolledUp = { scrollTop: 800, scrollHeight: 1000, clientHeight: 100 };
    expect(isScrollNearBottom(scrolledUp, 60)).toBe(false);
    const nearBottom = { scrollTop: 850, scrollHeight: 1000, clientHeight: 100 };
    expect(isScrollNearBottom(nearBottom, 160)).toBe(true);
  });
});

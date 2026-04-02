import { describe, expect, it } from 'vitest';
import { getTouchActivationConstraint } from './touchActivationConstraint';

describe('getTouchActivationConstraint', () => {
  it('uses immediate drag activation while in mobile reorder mode', () => {
    expect(getTouchActivationConstraint({ isMobile: true, reorderMode: true })).toEqual({
      distance: 6,
      tolerance: 8,
    });
  });

  it('uses hold delay on mobile before reorder mode', () => {
    expect(getTouchActivationConstraint({ isMobile: true, reorderMode: false })).toEqual({
      delay: 180,
      tolerance: 12,
    });
  });

  it('uses pointer-like distance behavior on desktop', () => {
    expect(getTouchActivationConstraint({ isMobile: false, reorderMode: false })).toEqual({
      distance: 8,
    });
  });
});

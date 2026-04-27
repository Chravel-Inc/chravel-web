import { describe, expect, it } from 'vitest';
import { getPlanFlags } from '../planFlags';

describe('getPlanFlags', () => {
  it('returns no paid access flags when inactive', () => {
    expect(getPlanFlags('pro-starter', false)).toEqual({
      isPaid: false,
      isExplorer: false,
      isFrequentChraveler: false,
      isOrgPro: false,
    });
  });

  it('distinguishes explorer and org pro semantics', () => {
    expect(getPlanFlags('explorer', true)).toEqual({
      isPaid: true,
      isExplorer: true,
      isFrequentChraveler: false,
      isOrgPro: false,
    });

    expect(getPlanFlags('pro-growth', true)).toEqual({
      isPaid: true,
      isExplorer: false,
      isFrequentChraveler: false,
      isOrgPro: true,
    });
  });
});

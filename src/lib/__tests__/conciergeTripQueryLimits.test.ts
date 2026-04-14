import { describe, expect, it } from 'vitest';

import {
  CONCIERGE_TRIP_QUERY_LIMITS,
  getConciergeTripQueryLimit,
} from '../conciergeTripQueryLimits';

describe('conciergeTripQueryLimits', () => {
  it('defines canonical per-trip limits for each plan', () => {
    expect(CONCIERGE_TRIP_QUERY_LIMITS).toEqual({
      free: 10,
      explorer: 25,
      frequent_chraveler: null,
    });
  });

  it('resolves the limit for each supported plan', () => {
    expect(getConciergeTripQueryLimit('free')).toBe(10);
    expect(getConciergeTripQueryLimit('explorer')).toBe(25);
    expect(getConciergeTripQueryLimit('frequent_chraveler')).toBeNull();
  });
});

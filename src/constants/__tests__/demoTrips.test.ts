import { describe, expect, it } from 'vitest';
import { isDemoChannelTripId } from '../demoTrips';

describe('isDemoChannelTripId', () => {
  it('returns true for named pro demo trip ids', () => {
    expect(isDemoChannelTripId('lakers-road-trip')).toBe(true);
  });

  it('returns true for numeric seeded demo ids', () => {
    expect(isDemoChannelTripId('13')).toBe(true);
    expect(isDemoChannelTripId('4')).toBe(true);
  });

  it('returns false for non-demo ids', () => {
    expect(isDemoChannelTripId('trip-prod-1')).toBe(false);
  });
});

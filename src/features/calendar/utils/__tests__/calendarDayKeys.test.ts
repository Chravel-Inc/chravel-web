import { describe, expect, it } from 'vitest';
import { eventDayKey, localDayKey, utcDayKey } from '../calendarDayKeys';

/**
 * Regression: all-day events rendered one day early for viewers at negative UTC offsets.
 * All-day events are stored as a UTC-midnight instant; normalizing them with local getters
 * (setHours(0,0,0,0) on the local date) moved them to the previous calendar day whenever the
 * local offset was behind UTC.
 */
describe('calendar day keys', () => {
  it('keys an all-day UTC-midnight instant to its UTC calendar day', () => {
    const allDayAug1 = new Date('2026-08-01T00:00:00.000Z');
    expect(eventDayKey(allDayAug1, true)).toBe(Date.UTC(2026, 7, 1));
  });

  it('matches the selected local day for an all-day event regardless of viewer offset', () => {
    // A viewer at UTC-5 sees this instant as Jul 31 19:00 local; the all-day event must still
    // resolve to Aug 1, matching an Aug 1 selection in the local calendar grid.
    const allDayAug1 = new Date('2026-08-01T00:00:00.000Z');
    const selectedAug1Local = new Date(2026, 7, 1); // local midnight Aug 1
    expect(eventDayKey(allDayAug1, true)).toBe(localDayKey(selectedAug1Local));
  });

  it('keys a timed event by its local calendar day', () => {
    const timed = new Date(2026, 7, 1, 18, 30);
    expect(eventDayKey(timed, false)).toBe(localDayKey(timed));
    expect(eventDayKey(timed, false)).toBe(Date.UTC(2026, 7, 1));
  });

  it('distinguishes adjacent days', () => {
    expect(eventDayKey(new Date('2026-08-01T00:00:00.000Z'), true)).not.toBe(
      eventDayKey(new Date('2026-08-02T00:00:00.000Z'), true),
    );
  });

  it('utcDayKey ignores the time-of-day component', () => {
    expect(utcDayKey(new Date('2026-08-01T23:59:59.999Z'))).toBe(
      utcDayKey(new Date('2026-08-01T00:00:00.000Z')),
    );
  });
});

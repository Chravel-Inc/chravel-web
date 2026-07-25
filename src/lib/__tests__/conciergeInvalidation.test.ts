import { describe, expect, it } from 'vitest';

import { getConciergeInvalidationKeys, isConciergeWriteAction } from '../conciergeInvalidation';

describe('conciergeInvalidation', () => {
  it('returns trip-scoped query keys for standard write actions', () => {
    expect(getConciergeInvalidationKeys('createTask', 'trip-123')[0]).toEqual([
      'tripTasks',
      'trip-123',
    ]);
    expect(getConciergeInvalidationKeys('createPoll', 'trip-123')[0]).toEqual([
      'tripPolls',
      'trip-123',
    ]);
    expect(getConciergeInvalidationKeys('addToCalendar', 'trip-123')[0]).toEqual([
      'calendarEvents',
      'trip-123',
    ]);
  });

  it('invalidates the shared trips cache for setTripHeaderImage', () => {
    expect(getConciergeInvalidationKeys('setTripHeaderImage', 'trip-123')[0]).toEqual(['trips']);
  });

  it('identifies concierge write tools correctly', () => {
    expect(isConciergeWriteAction('setTripHeaderImage')).toBe(true);
    expect(isConciergeWriteAction('searchPlaces')).toBe(false);
  });

  it('returns no invalidation keys for tools with no mapping', () => {
    expect(getConciergeInvalidationKeys('searchPlaces', 'trip-123')).toHaveLength(0);
  });

  it('invalidates the live event-agenda cache for addToAgenda (not the orphaned eventAgenda key)', () => {
    // In the event context the concierge tripId is the eventId; the live agenda
    // cache (useEventAgenda) is keyed ['event-agenda', eventId]. A prior bug keyed
    // this ['eventAgenda', tripId], which never matched, so agenda stayed stale.
    expect(getConciergeInvalidationKeys('addToAgenda', 'evt-1')[0]).toEqual([
      'event-agenda',
      'evt-1',
    ]);
  });

  it('invalidates the calendar cache for makeReservation (it writes a dated calendar event)', () => {
    const keys = getConciergeInvalidationKeys('makeReservation', 'trip-123');
    expect(keys).toContainEqual(['calendarEvents', 'trip-123']);
  });
});

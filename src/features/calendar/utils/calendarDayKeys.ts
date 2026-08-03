/**
 * Canonical calendar-day keys for comparing events to a selected date.
 *
 * All-day events are persisted as a UTC-midnight instant so their calendar date is
 * timezone-invariant (see calendarService.convertToCalendarEvent). Reading such an instant with
 * local getters shifts it to the previous day for viewers at negative UTC offsets — UTC-midnight
 * Aug 1 is Jul 31 19:00 at UTC-5 — which made all-day events render one day early. Key all-day
 * events by their UTC day and timed events by their local day so both compare correctly against a
 * locally-selected calendar day.
 */

/** Canonical key for a calendar day, from the date's LOCAL components. */
export const localDayKey = (value: Date): number =>
  Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());

/** Canonical key for a calendar day, from the date's UTC components. */
export const utcDayKey = (value: Date): number =>
  Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

/** Day key for an event date: UTC-based when all-day, local otherwise. */
export const eventDayKey = (value: Date, isAllDay: boolean): number =>
  isAllDay ? utcDayKey(value) : localDayKey(value);

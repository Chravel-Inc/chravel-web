/**
 * Date-picker bounds for task due dates.
 *
 * Calendar cells are local midnight, so comparing a cell against `new Date()` (i.e. "now")
 * disables today's cell for the rest of the day — users could not set a task due today. Compare
 * against the START of today instead.
 */

/** Start of the given day (local midnight). Defaults to today. */
export const startOfLocalDay = (value: Date = new Date()): Date => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * True when `date` falls on a calendar day before today — the predicate for disabling past days
 * in a due-date picker. Today is always selectable, at any time of day.
 */
export const isBeforeToday = (date: Date, now: Date = new Date()): boolean =>
  startOfLocalDay(date).getTime() < startOfLocalDay(now).getTime();

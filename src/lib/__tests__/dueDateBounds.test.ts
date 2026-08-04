import { describe, expect, it } from 'vitest';
import { isBeforeToday, startOfLocalDay } from '../dueDateBounds';

/**
 * Regression: the task due-date picker disabled days with `date < new Date()`. Calendar cells are
 * local midnight, so from 00:01 onward today's own cell compared as "before now" and users could
 * not set a task due today.
 */
describe('due-date bounds', () => {
  it('keeps today selectable late in the day', () => {
    const now = new Date(2026, 7, 1, 23, 45); // 23:45 local
    const todaysCell = new Date(2026, 7, 1); // local midnight — how the picker renders today
    expect(isBeforeToday(todaysCell, now)).toBe(false);
  });

  it('keeps today selectable immediately after midnight', () => {
    const now = new Date(2026, 7, 1, 0, 1);
    expect(isBeforeToday(new Date(2026, 7, 1), now)).toBe(false);
  });

  it('still disables past days', () => {
    const now = new Date(2026, 7, 1, 9, 0);
    expect(isBeforeToday(new Date(2026, 6, 31), now)).toBe(true);
  });

  it('allows future days', () => {
    const now = new Date(2026, 7, 1, 9, 0);
    expect(isBeforeToday(new Date(2026, 7, 2), now)).toBe(false);
  });

  it('startOfLocalDay strips the time component', () => {
    const d = startOfLocalDay(new Date(2026, 7, 1, 17, 30, 15, 250));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
    expect(d.getDate()).toBe(1);
  });
});

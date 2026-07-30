import type { ProSchedule } from '@/types/pro';

export type CalendarEventLike = {
  id?: string;
  title?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  description?: string | null;
  event_category?: string | null;
};

const SCHEDULE_TYPES: ProSchedule['type'][] = [
  'load-in',
  'sound-check',
  'rehearsal',
  'show',
  'load-out',
  'travel',
  'meeting',
];

function inferScheduleType(
  title: string,
  category: string | null | undefined,
): ProSchedule['type'] {
  const haystack = `${category || ''} ${title}`.toLowerCase();
  for (const type of SCHEDULE_TYPES) {
    if (haystack.includes(type.replace('-', ' ')) || haystack.includes(type)) {
      return type;
    }
  }
  if (haystack.includes('sound')) return 'sound-check';
  if (haystack.includes('load in') || haystack.includes('load-in')) return 'load-in';
  if (haystack.includes('load out') || haystack.includes('load-out')) return 'load-out';
  if (haystack.includes('travel') || haystack.includes('flight') || haystack.includes('transfer')) {
    return 'travel';
  }
  if (haystack.includes('show') || haystack.includes('performance') || haystack.includes('game')) {
    return 'show';
  }
  return 'meeting';
}

/**
 * Maps live `trip_events` rows into Pro day-sheet schedule entries.
 * Used so Pro export / day-sheet UI read calendar truth instead of empty converter stubs.
 */
export function mapCalendarEventsToProSchedule(events: CalendarEventLike[]): ProSchedule[] {
  return events
    .filter(event => typeof event.start_time === 'string' && event.start_time.length > 0)
    .map((event, index) => {
      const title = (event.title && event.title.trim()) || 'Untitled';
      const startTime = event.start_time as string;
      const endTime =
        typeof event.end_time === 'string' && event.end_time.length > 0
          ? event.end_time
          : startTime;
      return {
        id: event.id || `cal-${index}-${startTime}`,
        type: inferScheduleType(title, event.event_category),
        title,
        startTime,
        endTime,
        location: (event.location && event.location.trim()) || '',
        participants: [],
        priority: 'medium' as const,
        notes: event.description?.trim() || undefined,
      };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Events whose start falls on the local calendar day of `day` (default: today). */
export function filterScheduleForLocalDay(
  schedule: ProSchedule[],
  day: Date = new Date(),
): ProSchedule[] {
  const y = day.getFullYear();
  const m = day.getMonth();
  const d = day.getDate();
  return schedule.filter(item => {
    const start = new Date(item.startTime);
    if (Number.isNaN(start.getTime())) return false;
    return start.getFullYear() === y && start.getMonth() === m && start.getDate() === d;
  });
}

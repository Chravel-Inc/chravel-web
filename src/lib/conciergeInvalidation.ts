export type ConciergeInvalidationQueryKey = string[];

const CONCIERGE_WRITE_ACTIONS = new Set<string>([
  'createPoll',
  'extractReceipt' |
  'createTask',
  'addToCalendar',
  'bulkDeleteCalendarEvents',
  'savePlace',
  'setBasecamp',
  'addToAgenda',
  'setTripHeaderImage',
]);

export function isConciergeWriteAction(name: string): boolean {
  return CONCIERGE_WRITE_ACTIONS.has(name);
}

export function getConciergeInvalidationQueryKey(
  name: string,
  tripId: string,
): ConciergeInvalidationQueryKey | null {
  switch (name) {
    case 'extractReceipt':
      return ['payments', tripId];
    case 'createTask':
      return ['tripTasks', tripId];
    case 'createPoll':
      return ['tripPolls', tripId];
    case 'addToCalendar':
    case 'bulkDeleteCalendarEvents':
      return ['calendarEvents', tripId];
    case 'savePlace':
      return ['tripPlaces', tripId];
    case 'setBasecamp':
      return ['tripBasecamp', tripId];
    case 'addToAgenda':
      return ['eventAgenda', tripId];
    case 'setTripHeaderImage':
      // Trip cards on the homepage render from the shared ['trips'] query.
      return ['trips'];
    default:
      return null;
  }
}

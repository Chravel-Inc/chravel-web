export type ConciergeInvalidationQueryKey = string[];

/**
 * All concierge tools that mutate trip state.
 * Must stay in sync with toolRegistry.ts write tools.
 *
 * Grouped by domain for readability:
 *   Calendar: addToCalendar, updateCalendarEvent, deleteCalendarEvent,
 *             bulkDeleteCalendarEvents, emitBulkDeletePreview, emitSmartImportPreview,
 *             duplicateCalendarEvent, moveCalendarEvent, cloneActivity
 *   Tasks:    createTask, updateTask, deleteTask, splitTaskAssignments, bulkMarkTasksDone
 *   Polls:    createPoll, closePoll
 *   Places:   savePlace, emitReservationDraft, makeReservation
 *   Payments: settleExpense, addExpense, setTripBudget
 *   Comms:    createBroadcast, createNotification, addReminder
 *   Trip:     setBasecamp, addToAgenda, setTripHeaderImage, generateTripImage, updateTripDetails
 */
const CONCIERGE_WRITE_ACTIONS = new Set<string>([
  // Calendar
  'addToCalendar',
  'updateCalendarEvent',
  'deleteCalendarEvent',
  'bulkDeleteCalendarEvents',
  'emitBulkDeletePreview',
  'emitSmartImportPreview',
  'duplicateCalendarEvent',
  'moveCalendarEvent',
  'cloneActivity',
  // Tasks
  'createTask',
  'updateTask',
  'deleteTask',
  'splitTaskAssignments',
  'bulkMarkTasksDone',
  // Polls
  'createPoll',
  'closePoll',
  // Places / Reservations
  'savePlace',
  'emitReservationDraft',
  'makeReservation',
  // Payments / Expenses
  'settleExpense',
  'addExpense',
  'setTripBudget',
  // Broadcasts / Notifications / Reminders
  'createBroadcast',
  'createNotification',
  'addReminder',
  // Trip-level
  'setBasecamp',
  'addToAgenda',
  'setTripHeaderImage',
  'generateTripImage',
  'updateTripDetails',
]);

export function isConciergeWriteAction(name: string): boolean {
  return CONCIERGE_WRITE_ACTIONS.has(name);
}

export function getConciergeInvalidationQueryKey(
  name: string,
  tripId: string,
): ConciergeInvalidationQueryKey | null {
  switch (name) {
    // Calendar
    case 'addToCalendar':
    case 'updateCalendarEvent':
    case 'deleteCalendarEvent':
    case 'bulkDeleteCalendarEvents':
    case 'emitBulkDeletePreview':
    case 'emitSmartImportPreview':
    case 'duplicateCalendarEvent':
    case 'moveCalendarEvent':
    case 'cloneActivity':
      return ['calendarEvents', tripId];

    // Tasks
    case 'createTask':
    case 'updateTask':
    case 'deleteTask':
    case 'splitTaskAssignments':
    case 'bulkMarkTasksDone':
      return ['tripTasks', tripId];

    // Polls
    case 'createPoll':
    case 'closePoll':
      return ['tripPolls', tripId];

    // Places / Reservations
    case 'savePlace':
    case 'emitReservationDraft':
    case 'makeReservation':
      return ['tripPlaces', tripId];

    // Payments / Expenses
    case 'settleExpense':
    case 'addExpense':
    case 'setTripBudget':
      return ['tripPayments', tripId];

    // Broadcasts
    case 'createBroadcast':
      return ['tripBroadcasts', tripId];

    // Notifications — no dedicated query key; realtime handles updates.
    // Listed in write set so isConciergeWriteAction() returns true.
    case 'createNotification':
      return null;

    // Reminders — no dedicated query key; calendar is closest.
    case 'addReminder':
      return ['calendarEvents', tripId];

    // Trip-level
    case 'setBasecamp':
      return ['tripBasecamp', tripId];
    case 'addToAgenda':
      return ['eventAgenda', tripId];
    case 'setTripHeaderImage':
    case 'generateTripImage':
    case 'updateTripDetails':
      return ['trips'];

    default:
      return null;
  }
}

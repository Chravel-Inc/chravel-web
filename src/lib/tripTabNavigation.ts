/** Consumer trip tab ids supported by TripTabs / MobileTripTabs. */
export const CONSUMER_TRIP_TAB_IDS = [
  'chat',
  'calendar',
  'concierge',
  'media',
  'payments',
  'places',
  'polls',
  'tasks',
] as const;

export type ConsumerTripTabId = (typeof CONSUMER_TRIP_TAB_IDS)[number];

const CONSUMER_TRIP_TAB_SET = new Set<string>(CONSUMER_TRIP_TAB_IDS);

/**
 * Resolve the initial trip tab from a URL search string.
 * Used by mobile and desktop trip shells for notification deep links (`?tab=calendar`).
 */
export function getInitialTripTabFromSearch(
  search: string,
  fallback: ConsumerTripTabId = 'chat',
): string {
  const urlTab = new URLSearchParams(search).get('tab');
  if (urlTab && CONSUMER_TRIP_TAB_SET.has(urlTab)) return urlTab;
  return fallback;
}

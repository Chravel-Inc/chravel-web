import type { EventData } from '@/types/events';

/**
 * Event screens assume `itinerary` is iterable; Supabase converters and stale caches may omit it.
 */
export function normalizeEventItinerary(
  itinerary: EventData['itinerary'] | undefined | null,
): NonNullable<EventData['itinerary']> {
  return Array.isArray(itinerary) ? itinerary : [];
}

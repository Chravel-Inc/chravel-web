export const PRO_DEMO_TRIP_IDS = [
  'lakers-road-trip',
  'beyonce-cowboy-carter-tour',
  'eli-lilly-c-suite-retreat-2026',
] as const;

export const NUMERIC_DEMO_TRIP_IDS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
] as const;

const PRO_DEMO_TRIP_ID_SET = new Set<string>(PRO_DEMO_TRIP_IDS);
const NUMERIC_DEMO_TRIP_ID_SET = new Set<string>(NUMERIC_DEMO_TRIP_IDS);

/**
 * Demo IDs used by role-channel and pro-channel chat transport routing.
 * Includes named Pro demos plus numeric seeded demos.
 */
export const isDemoChannelTripId = (tripId: string | null | undefined): boolean => {
  if (!tripId) return false;
  return PRO_DEMO_TRIP_ID_SET.has(tripId) || NUMERIC_DEMO_TRIP_ID_SET.has(tripId);
};

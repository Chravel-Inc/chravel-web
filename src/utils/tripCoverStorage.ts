export const TRIP_COVER_BUCKET = 'trip-covers';

export function buildTripCoverStoragePath(tripId: string, fileName: string): string {
  return `${tripId}/${fileName}`;
}

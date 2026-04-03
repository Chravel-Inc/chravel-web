export const TRIP_COVER_BUCKET = 'trip-media';
export const TRIP_COVER_FOLDER = 'trip-covers';

export function buildTripCoverStoragePath(tripId: string, fileName: string): string {
  return `${TRIP_COVER_FOLDER}/${tripId}/${fileName}`;
}

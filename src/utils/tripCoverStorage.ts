import { isBlobOrDataUrl } from './mediaUtils';

export const TRIP_COVER_BUCKET = 'trip-covers';

export function buildTripCoverStoragePath(tripId: string, fileName: string): string {
  return `${tripId}/${fileName}`;
}

/**
 * Normalize legacy/signed cover URLs into stable public cover URLs when possible.
 *
 * Why:
 * - Historical rows sometimes stored signed object URLs (`/object/sign/...`) that expire.
 * - `trip-covers/*` objects are intentionally public-read, so signed URLs are unnecessary.
 * - Converting to `/object/public/...` prevents "works once then breaks later" cover loads.
 */
export function normalizeTripCoverUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (isBlobOrDataUrl(url)) return url;

  try {
    const parsed = new URL(url);
    const signedPrefix = `/storage/v1/object/sign/${TRIP_COVER_BUCKET}/`;
    const publicPrefix = `/storage/v1/object/public/${TRIP_COVER_BUCKET}/`;

    if (!parsed.pathname.includes(signedPrefix)) {
      return url;
    }

    const uploadPath = decodeURIComponent(parsed.pathname.split(signedPrefix)[1] ?? '');
    if (!uploadPath) {
      return url;
    }

    return `${parsed.origin}${publicPrefix}${encodeURIComponent(uploadPath).replace(/%2F/g, '/')}`;
  } catch {
    return url;
  }
}

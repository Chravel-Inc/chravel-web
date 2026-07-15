export type TripCoverImageFields = {
  cover_image_url?: string | null;
  cover_photo_url?: string | null;
  coverPhotoUrl?: string | null;
  coverPhoto?: string | null;
  hero_image?: string | null;
  trip_cover?: string | null;
  image_url?: string | null;
};

export interface TripCoverResolutionOptions {
  fallbackUrl?: string | null;
}

const normalizeCoverCandidate = (candidate: unknown): string | undefined => {
  if (typeof candidate !== 'string') return undefined;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Canonical client-side resolver for trip cover images.
 *
 * Prefer the durable database field (`cover_image_url`) and only fall back to
 * legacy aliases or a caller-provided brand/demo fallback when no assigned cover
 * exists. This keeps cards, headers, and share previews from independently
 * deciding that the splash image should override a real trip cover.
 */
export const resolveTripCoverImageUrl = (
  trip: TripCoverImageFields | null | undefined,
  options: TripCoverResolutionOptions = {},
): string | undefined => {
  if (trip) {
    const assignedCover = [
      trip.cover_image_url,
      trip.cover_photo_url,
      trip.coverPhotoUrl,
      trip.coverPhoto,
      trip.hero_image,
      trip.trip_cover,
      trip.image_url,
    ]
      .map(normalizeCoverCandidate)
      .find(Boolean);

    if (assignedCover) return assignedCover;
  }

  return normalizeCoverCandidate(options.fallbackUrl);
};

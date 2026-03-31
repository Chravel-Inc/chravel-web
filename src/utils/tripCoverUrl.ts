/**
 * Resolves the public cover image URL from a Supabase `trips` row.
 * Canonical field is `cover_image_url`; some code paths historically read `cover_photo`.
 */
export function getCoverImageUrlFromTripRow(row: Record<string, unknown>): string | undefined {
  const raw = row.cover_image_url ?? row.cover_photo;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

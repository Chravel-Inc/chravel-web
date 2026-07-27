#!/usr/bin/env node
/**
 * One-off data migration: rescue legacy trip cover photos.
 *
 * PROBLEM
 * Older cover uploads were written to the `trip-media` bucket under a
 * `trip-covers/<tripId>/<file>` prefix, and `trips.cover_image_url` was set to the
 * bucket's *public* URL form:
 *
 *   .../storage/v1/object/public/trip-media/trip-covers/<tripId>/<file>.jpg
 *
 * That URL can never resolve, for two independent reasons:
 *   1. `trip-media` is a PRIVATE bucket (storage.buckets.public = false), so the
 *      /object/public/ route 404s.
 *   2. The bucket's SELECT policy is
 *        is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
 *      and for these objects foldername[1] is the literal string 'trip-covers'
 *      rather than a trip id -- so even a signed URL is not authorised.
 *
 * Current uploads are already correct: `generate-trip-cover` writes to the PUBLIC
 * `trip-covers` bucket. This script backfills the stragglers.
 *
 * WHAT IT DOES
 * For every trip whose cover_image_url matches the legacy shape:
 *   - downloads the object from `trip-media` using the service role,
 *   - uploads it to the public `trip-covers` bucket at <tripId>/<file>,
 *   - rewrites trips.cover_image_url to the new public URL.
 * The source object is left in place so the change is reversible.
 *
 * USAGE
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-legacy-trip-covers.ts [--apply]
 *
 * Runs as a dry run by default and prints the plan. Pass --apply to write.
 * Safe to re-run: trips already pointing at the public bucket are skipped.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');

const LEGACY_PREFIX = '/storage/v1/object/public/trip-media/';
const SOURCE_BUCKET = 'trip-media';
const TARGET_BUCKET = 'trip-covers';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Strip the legacy public prefix and any cache-busting query string. */
function legacyObjectPath(coverUrl: string): string | null {
  const idx = coverUrl.indexOf(LEGACY_PREFIX);
  if (idx === -1) return null;
  const withQuery = coverUrl.slice(idx + LEGACY_PREFIX.length);
  return decodeURIComponent(withQuery.split('?')[0]);
}

async function main(): Promise<void> {
  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, name, cover_image_url')
    .like('cover_image_url', `%${LEGACY_PREFIX}trip-covers/%`);

  if (error) {
    console.error('Failed to list trips:', error.message);
    process.exit(1);
  }

  if (!trips || trips.length === 0) {
    console.log('No legacy cover URLs found. Nothing to do.');
    return;
  }

  console.log(`${trips.length} trip(s) with a legacy cover URL.`);
  console.log(APPLY ? 'Mode: APPLY\n' : 'Mode: DRY RUN (pass --apply to write)\n');

  let migrated = 0;
  const failures: string[] = [];

  for (const trip of trips) {
    const sourcePath = legacyObjectPath(trip.cover_image_url as string);
    if (!sourcePath) {
      failures.push(`${trip.id}: could not parse cover_image_url`);
      continue;
    }

    // trip-covers/<tripId>/<file> -> <tripId>/<file>
    const targetPath = sourcePath.replace(/^trip-covers\//, '');

    console.log(`- ${trip.name}`);
    console.log(`    from ${SOURCE_BUCKET}/${sourcePath}`);
    console.log(`    to   ${TARGET_BUCKET}/${targetPath}`);

    if (!APPLY) continue;

    const { data: file, error: downloadError } = await supabase.storage
      .from(SOURCE_BUCKET)
      .download(sourcePath);

    if (downloadError || !file) {
      failures.push(`${trip.id}: download failed - ${downloadError?.message ?? 'no body'}`);
      continue;
    }

    const { error: uploadError } = await supabase.storage
      .from(TARGET_BUCKET)
      .upload(targetPath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      failures.push(`${trip.id}: upload failed - ${uploadError.message}`);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(TARGET_BUCKET).getPublicUrl(targetPath);

    const { error: updateError } = await supabase
      .from('trips')
      .update({ cover_image_url: publicUrl })
      .eq('id', trip.id);

    if (updateError) {
      failures.push(`${trip.id}: cover_image_url update failed - ${updateError.message}`);
      continue;
    }

    migrated += 1;
  }

  console.log(`\nMigrated: ${migrated}/${trips.length}`);
  if (failures.length > 0) {
    console.log('Failures:');
    for (const failure of failures) console.log(`  ${failure}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

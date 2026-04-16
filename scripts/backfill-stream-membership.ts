/**
 * backfill-stream-membership.ts
 *
 * Adds every active Supabase trip member as a Stream channel_member in
 * both the `chravel-trip` and `chravel-broadcast` channels for their trip.
 *
 * Run once after Stream integration to restore membership for existing users.
 * Safe to re-run — addMembers is idempotent.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   STREAM_API_KEY=... STREAM_API_SECRET=... \
 *   npx tsx scripts/backfill-stream-membership.ts
 */

import { createClient } from '@supabase/supabase-js';
import { StreamChat } from 'stream-chat';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const STREAM_API_KEY = process.env.STREAM_API_KEY ?? '';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STREAM_API_KEY || !STREAM_API_SECRET) {
  console.error('Missing required environment variables.');
  console.error(
    'Required: VITE_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, STREAM_API_KEY, STREAM_API_SECRET',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

interface TripMember {
  trip_id: string;
  user_id: string;
}

async function fetchAllTripMembers(): Promise<TripMember[]> {
  const PAGE = 1000;
  const members: TripMember[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('trip_members')
      .select('trip_id, user_id')
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error('Failed to fetch trip_members:', error.message);
      break;
    }

    if (!data || data.length === 0) break;

    members.push(...(data as TripMember[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return members;
}

async function batchAddMembers(
  channelType: string,
  channelId: string,
  userIds: string[],
): Promise<{ ok: number; failed: number }> {
  // Stream allows up to 100 members per addMembers call
  const BATCH = 100;
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < userIds.length; i += BATCH) {
    const batch = userIds.slice(i, i + BATCH);
    try {
      const channel = streamClient.channel(channelType, channelId);
      await channel.addMembers(batch);
      ok += batch.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ addMembers failed for ${channelType}:${channelId} (batch ${i}): ${msg}`);
      failed += batch.length;
    }
  }

  return { ok, failed };
}

async function main() {
  console.log('Starting Stream membership backfill...\n');

  const members = await fetchAllTripMembers();
  console.log(`Found ${members.length} trip_member rows.\n`);

  if (members.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  // Group by trip_id
  const byTrip = new Map<string, string[]>();
  for (const { trip_id, user_id } of members) {
    if (!byTrip.has(trip_id)) byTrip.set(trip_id, []);
    byTrip.get(trip_id)!.push(user_id);
  }

  console.log(`Processing ${byTrip.size} trips...\n`);

  let totalOk = 0;
  let totalFailed = 0;
  let tripsProcessed = 0;

  for (const [tripId, userIds] of byTrip) {
    const tripChannelId = `trip-${tripId}`;
    const broadcastChannelId = `broadcast-${tripId}`;

    // First upsert all users so Stream knows about them
    try {
      const userUpserts = userIds.map(id => ({ id }));
      await streamClient.upsertUsers(userUpserts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ⚠ upsertUsers failed for trip ${tripId}: ${msg}`);
    }

    // Add to trip chat channel
    const tripResult = await batchAddMembers('chravel-trip', tripChannelId, userIds);
    totalOk += tripResult.ok;
    totalFailed += tripResult.failed;

    // Add to broadcast channel (best-effort)
    await batchAddMembers('chravel-broadcast', broadcastChannelId, userIds).catch(() => {});

    tripsProcessed++;
    if (tripsProcessed % 10 === 0) {
      console.log(`  Processed ${tripsProcessed}/${byTrip.size} trips...`);
    }
  }

  console.log(`\nBackfill complete.`);
  console.log(`  ✓ ${totalOk} user-channel memberships added`);
  if (totalFailed > 0) {
    console.log(`  ✗ ${totalFailed} failed (re-run to retry)`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

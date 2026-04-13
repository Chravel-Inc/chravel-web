#!/usr/bin/env node
/**
 * Stream Membership Backfill
 *
 * One-time migration script: syncs all existing Supabase trip_members
 * into GetStream channel membership.
 *
 * The primary sync path (streamMembershipSync.ts) only handles NEW joins
 * after the GetStream migration. This script back-fills members who joined
 * trips BEFORE the migration so they can see and send messages.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   STREAM_API_KEY=... STREAM_API_SECRET=... \
 *   npx tsx scripts/backfill-stream-members.ts
 *
 *   Options:
 *     --dry-run    Print what would be synced without making changes
 *     --trip-id=X  Only backfill a single trip (for testing)
 *
 * Safe to re-run: addMembers is idempotent in GetStream.
 */

import { createClient } from '@supabase/supabase-js';
import { StreamChat } from 'stream-chat';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STREAM_API_KEY = process.env.STREAM_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || '';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SINGLE_TRIP = args.find(a => a.startsWith('--trip-id='))?.split('=')[1];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STREAM_API_KEY || !STREAM_API_SECRET) {
  console.error('Missing required environment variables.');
  console.error(
    'Ensure VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STREAM_API_KEY, and STREAM_API_SECRET are set.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

interface TripMember {
  trip_id: string;
  user_id: string;
}

async function backfill() {
  if (DRY_RUN) console.log('[DRY RUN] No changes will be made.\n');

  // 1. Fetch all trip memberships from Supabase
  let query = supabase.from('trip_members').select('trip_id, user_id').not('user_id', 'is', null);

  if (SINGLE_TRIP) {
    query = query.eq('trip_id', SINGLE_TRIP);
  }

  const { data: members, error } = await query;

  if (error) {
    console.error('Failed to fetch trip_members:', error.message);
    process.exit(1);
  }

  if (!members || members.length === 0) {
    console.log('No trip members found. Nothing to backfill.');
    return;
  }

  // 2. Group by trip_id
  const tripMembers = new Map<string, string[]>();
  for (const m of members as TripMember[]) {
    const existing = tripMembers.get(m.trip_id) || [];
    existing.push(m.user_id);
    tripMembers.set(m.trip_id, existing);
  }

  console.log(`Found ${members.length} memberships across ${tripMembers.size} trips.\n`);

  let totalSynced = 0;
  let totalFailed = 0;

  for (const [tripId, userIds] of tripMembers) {
    const tripChannelId = `trip-${tripId}`;
    const broadcastChannelId = `broadcast-${tripId}`;

    if (DRY_RUN) {
      console.log(
        `[DRY RUN] Trip ${tripId}: would add ${userIds.length} members to ${tripChannelId} + ${broadcastChannelId}`,
      );
      totalSynced += userIds.length;
      continue;
    }

    try {
      // Add members to trip channel (idempotent — safe to re-run)
      const tripChannel = streamClient.channel('chravel-trip', tripChannelId, {
        trip_id: tripId,
      });
      await tripChannel.addMembers(userIds);

      // Add members to broadcast channel
      const broadcastChannel = streamClient.channel('chravel-broadcast', broadcastChannelId, {
        trip_id: tripId,
      });
      await broadcastChannel.addMembers(userIds);

      totalSynced += userIds.length;
      console.log(`  Trip ${tripId}: synced ${userIds.length} members`);
    } catch (err: any) {
      totalFailed += userIds.length;
      console.error(`  Trip ${tripId}: FAILED — ${err.message || err}`);
    }
  }

  console.log(`\nBackfill complete.`);
  console.log(`  Synced: ${totalSynced}`);
  console.log(`  Failed: ${totalFailed}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Re-run without --dry-run to apply changes.');
  }
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});

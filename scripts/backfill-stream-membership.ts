/**
 * Backfill Stream channel membership for all existing trip_members.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... STREAM_API_KEY=... STREAM_API_SECRET=... \
 *     npx tsx scripts/backfill-stream-membership.ts
 *
 * Idempotent: adding an already-present member is a no-op in Stream.
 */

import { createClient } from '@supabase/supabase-js';
import { StreamChat } from 'stream-chat';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STREAM_API_KEY = process.env.STREAM_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STREAM_API_KEY || !STREAM_API_SECRET) {
  console.error(
    'Missing env vars. Need: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STREAM_API_KEY, STREAM_API_SECRET',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

async function backfill() {
  console.log('Fetching all trip_members...');

  // Fetch all memberships (no status column exists)
  const { data: memberships, error } = await supabase
    .from('trip_members')
    .select('trip_id, user_id');

  if (error) {
    console.error('Failed to fetch trip_members:', error);
    process.exit(1);
  }

  if (!memberships || memberships.length === 0) {
    console.log('No memberships found.');
    return;
  }

  // Group by trip_id
  const tripMap = new Map<string, string[]>();
  for (const m of memberships) {
    const list = tripMap.get(m.trip_id) || [];
    list.push(m.user_id);
    tripMap.set(m.trip_id, list);
  }

  console.log(`Found ${memberships.length} memberships across ${tripMap.size} trips.`);

  let successCount = 0;
  let errorCount = 0;

  for (const [tripId, userIds] of tripMap.entries()) {
    const tripChannelId = `trip-${tripId}`;
    const broadcastChannelId = `broadcast-${tripId}`;

    try {
      // Add members to trip channel
      const tripChannel = streamClient.channel('chravel-trip', tripChannelId);
      await tripChannel.addMembers(userIds);

      // Add members to broadcast channel
      const broadcastChannel = streamClient.channel('chravel-broadcast', broadcastChannelId);
      await broadcastChannel.addMembers(userIds);

      successCount++;
      console.log(`✓ ${tripId}: ${userIds.length} members synced`);
    } catch (err: any) {
      errorCount++;
      console.error(`✗ ${tripId}: ${err.message || err}`);
    }
  }

  console.log(`\nDone. Success: ${successCount}, Failed: ${errorCount}`);
}

backfill().catch(console.error);

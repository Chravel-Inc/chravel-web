import { createClient } from '@supabase/supabase-js';
import { StreamChat } from 'stream-chat';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STREAM_API_KEY = process.env.STREAM_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STREAM_API_KEY || !STREAM_API_SECRET) {
  console.error('Missing required environment variables.');
  console.error(
    'Ensure VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STREAM_API_KEY, and STREAM_API_SECRET are set.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

async function migrate() {
  console.log('Starting chat migration from Supabase to Stream...');

  // 1. Fetch all unique trip IDs that have messages
  const { data: trips, error: tripsError } = await supabase
    .from('trip_chat_messages')
    .select('trip_id')
    .not('trip_id', 'is', null);

  if (tripsError) {
    console.error('Failed to fetch trips', tripsError);
    return;
  }

  const uniqueTripIds = [...new Set(trips.map(t => t.trip_id))];
  console.log(`Found ${uniqueTripIds.length} trips with messages.`);

  for (const tripId of uniqueTripIds) {
    console.log(`Migrating trip ${tripId}...`);

    // Fetch messages for this trip, ordered by creation time
    const { data: messages, error: messagesError } = await supabase
      .from('trip_chat_messages')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error(`Failed to fetch messages for trip ${tripId}`, messagesError);
      continue;
    }

    if (!messages || messages.length === 0) continue;

    // Create or get the channel
    const channelId = `trip-${tripId}`;
    const channel = streamClient.channel('chravel-trip', channelId, {
      trip_id: tripId,
      created_by_id: messages[0].user_id || 'system',
    });

    await channel.create();

    // Process messages in batches to avoid rate limits
    let totalSuccess = 0;
    const batchSize = 50;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      const streamMessages = batch.map(msg => ({
        id: msg.id,
        text: msg.content || '',
        user_id: msg.user_id || 'system',
        // created_at / updated_at are reserved by Stream — store originals as custom data
        original_created_at: new Date(msg.created_at).toISOString(),
        original_updated_at: new Date(msg.updated_at || msg.created_at).toISOString(),
        // Custom fields
        message_type: msg.message_type || 'text',
        privacy_mode: msg.privacy_mode || 'standard',
        // Attachments
        ...(msg.media_url
          ? {
              attachments: [
                {
                  type: msg.media_type || 'file',
                  asset_url: msg.media_url,
                },
              ],
            }
          : {}),
      }));

      let successCount = 0;
      for (const streamMsg of streamMessages) {
        try {
          await channel.sendMessage(streamMsg as any);
          successCount++;
        } catch (e: any) {
          // Skip if already exists (idempotent re-run)
          if (e.message?.includes('already exists')) {
            successCount++;
          } else {
            console.error(`Failed to insert message ${streamMsg.id}: ${e.message}`);
          }
        }
      }
      totalSuccess += successCount;
    }

    console.log(`Migrated ${totalSuccess} / ${messages.length} messages for trip ${tripId}.`);
  }

  console.log('Migration complete.');
}

migrate().catch(console.error);

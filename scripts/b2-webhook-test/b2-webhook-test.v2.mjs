// B2 webhook test v2 — real auth.users + real trip_members, no synthetic ids.
//
// Run locally with:
//   STREAM_API_KEY=...          (rotated key)
//   STREAM_API_SECRET=...       (rotated secret)
//   SUPABASE_URL=https://jmjiyekmxwsxkfnqwyaa.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=...
//   node b2-webhook-test.v2.mjs

import { StreamChat } from 'stream-chat';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const { STREAM_API_KEY, STREAM_API_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!STREAM_API_KEY || !STREAM_API_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing env: STREAM_API_KEY, STREAM_API_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const runId = randomUUID().slice(0, 8);
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const stream = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

const tripId = randomUUID();
const createdUsers = [];

async function createAuthUser(role) {
  const email = `b2+${role}+${runId}@chravel.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { b2_run: runId, b2_role: role },
  });
  if (error) throw new Error(`createUser(${role}): ${error.message}`);
  createdUsers.push({ role, authId: data.user.id });
  return data.user.id;
}

async function teardown() {
  for (const u of createdUsers.reverse()) {
    await admin.auth.admin
      .deleteUser(u.authId)
      .catch(err => console.warn(`deleteUser(${u.role}=${u.authId}) failed: ${err.message}`));
  }
  await admin
    .from('trips')
    .delete()
    .eq('id', tripId)
    .catch(() => {});
}

process.on('unhandledRejection', async err => {
  console.error('unhandledRejection:', err);
  await teardown();
  process.exit(1);
});

try {
  console.log('run', runId, 'trip', tripId);

  const senderId = await createAuthUser('sender');
  const recipAId = await createAuthUser('recipA');
  const recipBId = await createAuthUser('recipB');
  const bystanderId = await createAuthUser('bystander');

  // Current trips schema accepts id/name/created_by for minimum valid insert.
  const { error: tripErr } = await admin.from('trips').insert({
    id: tripId,
    name: `B2 ${runId}`,
    created_by: senderId,
  });
  if (tripErr) throw new Error(`insert trip: ${tripErr.message}`);

  const tripMembers = [senderId, recipAId, recipBId, bystanderId].map(user_id => ({
    trip_id: tripId,
    user_id,
  }));
  const { error: tmErr } = await admin.from('trip_members').insert(tripMembers);
  if (tmErr) throw new Error(`insert trip_members: ${tmErr.message}`);

  await stream.upsertUsers([
    { id: senderId, name: `Sender ${runId}` },
    { id: recipAId, name: `RecipA ${runId}` },
    { id: recipBId, name: `RecipB ${runId}` },
    { id: bystanderId, name: `Bystander ${runId}` },
  ]);

  const channelType = 'chravel-trip';
  const channelId = `trip-${tripId}`;
  const channel = stream.channel(channelType, channelId, {
    members: [senderId, recipAId, recipBId, bystanderId],
    created_by_id: senderId,
  });
  await channel.create();

  const mentionMessageId = `b2-mention-${runId}-${randomUUID()}`;
  console.log('mentionMessageId', mentionMessageId);

  const payload = {
    id: mentionMessageId,
    text: `hey @recipA @recipB — test ${runId}`,
    user_id: senderId,
    mentioned_users: [recipAId, recipBId],
  };

  await channel.sendMessage(payload);
  await channel.sendMessage(payload).catch(err => {
    console.log('retry send rejected by Stream (expected for same id):', err.message);
  });

  await new Promise(r => setTimeout(r, 5000));

  console.log('\nB2 RESULTS');
  console.log(
    JSON.stringify(
      {
        runId,
        tripId,
        channelType,
        channelId,
        senderId,
        recipientIds: [recipAId, recipBId],
        bystanderId,
        mentionMessageId,
      },
      null,
      2,
    ),
  );
} finally {
  await teardown();
}

/**
 * Server-side Stream trip/broadcast channel membership helpers.
 * Pattern copied from stream-join-channel (create + addMembers).
 */

import type { StreamChat } from 'npm:stream-chat';

export function tripStreamChannelId(tripId: string): string {
  return `trip-${tripId}`;
}

export function broadcastStreamChannelId(tripId: string): string {
  return `broadcast-${tripId}`;
}

export async function addUserToTripStreamChannels(
  stream: StreamChat,
  params: {
    tripId: string;
    userId: string;
    name?: string | null;
    image?: string | null;
  },
): Promise<void> {
  const upsert: { id: string; role: string; name?: string; image?: string } = {
    id: params.userId,
    role: 'user',
  };
  if (params.name) upsert.name = params.name;
  if (params.image) upsert.image = params.image;
  await stream.upsertUser(upsert);

  const tripChannel = stream.channel('chravel-trip', tripStreamChannelId(params.tripId), {
    trip_id: params.tripId,
    created_by_id: params.userId,
  });
  await tripChannel.create();
  await tripChannel.addMembers([params.userId]);

  try {
    const broadcastChannel = stream.channel(
      'chravel-broadcast',
      broadcastStreamChannelId(params.tripId),
      {
        trip_id: params.tripId,
        created_by_id: params.userId,
      },
    );
    await broadcastChannel.create();
    await broadcastChannel.addMembers([params.userId]);
  } catch {
    // Non-fatal: broadcast may not exist yet for some trips
  }
}

export async function removeUserFromTripStreamChannels(
  stream: StreamChat,
  params: { tripId: string; userId: string },
): Promise<void> {
  try {
    const tripChannel = stream.channel('chravel-trip', tripStreamChannelId(params.tripId));
    await tripChannel.removeMembers([params.userId]);
  } catch {
    // Channel may not exist
  }
  try {
    const broadcastChannel = stream.channel(
      'chravel-broadcast',
      broadcastStreamChannelId(params.tripId),
    );
    await broadcastChannel.removeMembers([params.userId]);
  } catch {
    // Channel may not exist
  }
}

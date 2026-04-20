export const HANDLED_STREAM_EVENT_TYPES = new Set<string>([
  'message.new',
  'message.updated',
  'message.deleted',
]);

export const HANDLED_STREAM_CHANNEL_TYPES = new Set<string>([
  'chravel-trip',
  'chravel-broadcast',
  'chravel-channel',
]);

export type ResolvedStreamChannel = {
  channelType: string | null;
  channelId: string | null;
};

// UUID v1-5 canonical form. Matches auth.users.id shape.
export const UUID_V1_TO_V5 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_V1_TO_V5.test(value);
}

export function parseStreamCid(cid?: string): ResolvedStreamChannel {
  if (!cid || !cid.includes(':')) {
    return { channelType: null, channelId: null };
  }

  const [channelType, ...idParts] = cid.split(':');
  const channelId = idParts.join(':').trim();

  return {
    channelType: channelType?.trim() || null,
    channelId: channelId || null,
  };
}

export function resolveTripIdFromChannel(
  channelType: string | null,
  channelId: string | null,
): string | null {
  if (!channelType || !channelId) return null;

  if (channelType === 'chravel-trip' && channelId.startsWith('trip-')) {
    return channelId.replace('trip-', '');
  }

  if (channelType === 'chravel-broadcast' && channelId.startsWith('broadcast-')) {
    return channelId.replace('broadcast-', '');
  }

  return null;
}

export function dedupeRecipients(
  userIds: Array<string | null | undefined>,
  senderId?: string,
): string[] {
  const unique = new Set<string>();

  for (const userId of userIds) {
    if (!userId || userId === senderId) continue;
    unique.add(userId);
  }

  return Array.from(unique);
}

type StreamMentionedUser =
  | string
  | {
      id?: string;
      user_id?: string;
      user?: { id?: string };
    };

/**
 * Stream webhook payloads can provide mentions as either raw user-id strings
 * or user objects (shape varies by SDK/webhook version). Normalize to IDs.
 */
export function normalizeMentionedUserIds(
  mentionedUsers?: Array<StreamMentionedUser | null | undefined> | null,
): string[] {
  if (!mentionedUsers || mentionedUsers.length === 0) return [];

  const normalized = new Set<string>();

  for (const mentionedUser of mentionedUsers) {
    if (!mentionedUser) continue;

    if (typeof mentionedUser === 'string') {
      normalized.add(mentionedUser);
      continue;
    }

    const candidateId = mentionedUser.id || mentionedUser.user_id || mentionedUser.user?.id;
    if (candidateId) {
      normalized.add(candidateId);
    }
  }

  return Array.from(normalized);
}

export const HANDLED_STREAM_EVENT_TYPES = new Set([
  'message.new',
  'message.updated',
  'message.deleted',
] as const);

export const HANDLED_STREAM_CHANNEL_TYPES = new Set([
  'chravel-trip',
  'chravel-broadcast',
  'chravel-channel',
  'chravel-concierge',
] as const);

export type ResolvedStreamChannel = {
  channelType: string | null;
  channelId: string | null;
};

const UUID_SUFFIX_REGEX =
  /-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

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

export function resolveConciergeUserId(
  channelType: string | null,
  channelId: string | null,
): string | null {
  if (channelType !== 'chravel-concierge' || !channelId || !channelId.startsWith('concierge-')) {
    return null;
  }

  const trimmed = channelId.replace('concierge-', '');
  const uuidMatch = trimmed.match(UUID_SUFFIX_REGEX);
  if (uuidMatch?.[1]) {
    return uuidMatch[1];
  }

  const parts = trimmed.split('-').filter(Boolean);
  if (parts.length < 2) return null;

  return parts[parts.length - 1] || null;
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

import { getOrCreateTripChannel } from './streamChannelFactory';
import { getStreamClient } from './streamClient';
import { isStreamChatActive } from './streamTransportGuards';
import type { Channel } from 'stream-chat';

type UnknownRecord = Record<string, unknown>;

interface LinkPreviewInput {
  url?: string;
  title?: string;
  image?: string;
  description?: string;
}

export interface TripMessageTransportInput {
  tripId: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  privacyMode?: string;
  messageType?: string;
  attachments?: unknown[];
  linkPreview?: LinkPreviewInput;
}

const normalizeAttachment = (attachment: unknown): UnknownRecord | null => {
  if (!attachment || typeof attachment !== 'object') return null;

  const row = attachment as UnknownRecord;
  const type = typeof row.type === 'string' ? row.type : 'file';
  const directAssetUrl = typeof row.asset_url === 'string' ? row.asset_url : null;
  const directUrl = typeof row.url === 'string' ? row.url : null;
  const assetUrl = directAssetUrl || directUrl;

  if (!assetUrl) return null;

  return {
    type,
    asset_url: assetUrl,
    title: typeof row.title === 'string' ? row.title : undefined,
  };
};

const buildStreamAttachments = (input: TripMessageTransportInput): UnknownRecord[] => {
  const normalized = (input.attachments || [])
    .map(normalizeAttachment)
    .filter((value): value is UnknownRecord => Boolean(value));

  if (input.mediaUrl) {
    normalized.push({
      type: input.mediaType || 'file',
      asset_url: input.mediaUrl,
    });
  }

  if (input.linkPreview?.url) {
    normalized.push({
      type: 'link',
      og_scrape_url: input.linkPreview.url,
      title: input.linkPreview.title,
      text: input.linkPreview.description,
      asset_url: input.linkPreview.image,
    });
  }

  return normalized;
};

export async function sendTripMessageViaStream(
  input: TripMessageTransportInput,
): Promise<{ id: string } | null> {
  const streamClient = getStreamClient();
  if (!isStreamChatActive(streamClient?.userID)) return null;

  const channel = await getOrCreateTripChannel(input.tripId);
  if (!channel) return null;

  const message: Record<string, unknown> = {
    text: input.content ?? '',
  };

  if (input.privacyMode && input.privacyMode !== 'standard') {
    message.privacy_mode = input.privacyMode;
  }

  if (input.messageType && input.messageType !== 'text') {
    message.message_type = input.messageType;
  }

  const attachments = buildStreamAttachments(input);
  if (attachments.length > 0) {
    message.attachments = attachments;
  }

  const response = await channel.sendMessage(message as Parameters<Channel['sendMessage']>[0]);
  const id = response.message?.id;
  if (!id) return null;

  return { id };
}

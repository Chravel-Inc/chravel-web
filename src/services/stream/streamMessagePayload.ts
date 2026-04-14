import type { Channel } from 'stream-chat';

type UnknownRecord = Record<string, unknown>;

export interface StreamLinkPreviewInput {
  url?: string;
  title?: string;
  image?: string;
  description?: string;
}

export interface BuildTripStreamPayloadInput {
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  privacyMode?: string;
  messageType?: 'text' | 'broadcast' | 'payment' | 'system' | string;
  replyToId?: string;
  mentionedUserIds?: string[];
  attachments?: unknown[];
  linkPreview?: StreamLinkPreviewInput;
}

export interface BuildTripStreamPayloadResult {
  ok: true;
  payload: Parameters<Channel['sendMessage']>[0];
  normalizedContent: string;
}

export interface BuildTripStreamPayloadError {
  ok: false;
  error: 'empty_content' | 'content_too_long';
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

function buildAttachments(input: BuildTripStreamPayloadInput): UnknownRecord[] {
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
}

export function buildTripStreamMessagePayload(
  input: BuildTripStreamPayloadInput,
): BuildTripStreamPayloadResult | BuildTripStreamPayloadError {
  const normalizedContent = input.content.trim();

  if (!normalizedContent) return { ok: false, error: 'empty_content' };
  if (normalizedContent.length > 4000) return { ok: false, error: 'content_too_long' };

  const payload: Record<string, unknown> = {
    text: normalizedContent,
  };

  if (input.privacyMode && input.privacyMode !== 'standard') {
    payload.privacy_mode = input.privacyMode;
  }

  if (input.messageType && input.messageType !== 'text') {
    payload.message_type = input.messageType;
  }

  if (input.replyToId && !input.replyToId.startsWith('legacy-')) {
    payload.parent_id = input.replyToId;
  }

  if (input.mentionedUserIds && input.mentionedUserIds.length > 0) {
    payload.mentioned_users = input.mentionedUserIds;
  }

  const attachments = buildAttachments(input);
  if (attachments.length > 0) {
    payload.attachments = attachments;
  }

  return {
    ok: true,
    normalizedContent,
    payload: payload as Parameters<Channel['sendMessage']>[0],
  };
}

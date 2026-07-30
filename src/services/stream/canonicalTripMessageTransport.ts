import { sendChatMessage } from '@/services/chatService';
import { isStreamConfigured } from './streamTransportGuards';
import { sendProChannelMessageViaStream, sendTripMessageViaStream } from './tripMessageTransport';

export async function sendTripMessageWithCanonicalTransport(
  tripId: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const streamResult = await sendTripMessageViaStream({
    tripId,
    content: (payload.content as string) || '',
    mediaType: payload.media_type as string | undefined,
    mediaUrl: payload.media_url as string | undefined,
    privacyMode: payload.privacy_mode as string | undefined,
    messageType: payload.message_type as string | undefined,
    attachments: payload.attachments as unknown[] | undefined,
    linkPreview: payload.link_preview as
      | { url?: string; title?: string; image?: string; description?: string }
      | undefined,
  });

  if (streamResult) return streamResult;

  if (isStreamConfigured()) {
    throw new Error('Chat connection unavailable. Please try again.');
  }

  return sendChatMessage(payload);
}

/**
 * Canonical send for Pro sub-channels. Channels are Stream-only (no legacy
 * Postgres chat fallback exists for them), so a failed Stream send is a hard
 * error rather than a silent fall-through to the main trip chat — falling
 * through would deliver the message to the wrong audience.
 */
export async function sendChannelMessageWithCanonicalTransport(
  channelId: string,
  channelName: string | undefined,
  tripId: string,
  payload: Record<string, unknown>,
): Promise<{ id: string }> {
  const streamResult = await sendProChannelMessageViaStream({
    channelId,
    channelName,
    tripId,
    content: (payload.content as string) || '',
    mediaType: payload.media_type as string | undefined,
    mediaUrl: payload.media_url as string | undefined,
    privacyMode: payload.privacy_mode as string | undefined,
    messageType: payload.message_type as string | undefined,
    attachments: payload.attachments as unknown[] | undefined,
    linkPreview: payload.link_preview as
      | { url?: string; title?: string; image?: string; description?: string }
      | undefined,
  });

  if (streamResult) return streamResult;

  throw new Error('Channel connection unavailable. Please try again.');
}

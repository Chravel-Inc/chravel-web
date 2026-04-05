/**
 * Message Mapper
 *
 * Bidirectional transform between Chravel's TripChatMessage shape
 * (used by all UI components) and Stream's MessageResponse.
 *
 * This is the critical adapter that lets us keep the existing UI
 * while swapping the messaging backend.
 */

import type { MessageResponse, UserResponse } from 'stream-chat';

/**
 * Chravel's message shape (matches useTripChat return type).
 * This is what UI components expect.
 */
export interface ChrravelChatMessage {
  id: string;
  trip_id: string;
  content: string;
  author_name: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  media_type?: string;
  media_url?: string;
  sentiment?: string;
  link_preview?: unknown;
  privacy_mode?: string;
  privacy_encrypted?: boolean;
  message_type?: string;
  is_edited?: boolean;
  edited_at?: string;
  client_message_id?: string;
  reply_to_id?: string;
  mentioned_user_ids?: string[];
  reactions?: Record<string, { count: number; userReacted: boolean; users: string[] }>;
}

/**
 * Convert a Stream MessageResponse to a Chravel TripChatMessage.
 */
export function streamMessageToChravel(msg: MessageResponse, tripId: string): ChrravelChatMessage {
  const user = msg.user as UserResponse | undefined;

  // Extract media from Stream attachments
  let mediaType: string | undefined;
  let mediaUrl: string | undefined;
  let linkPreview: unknown = null;

  if (msg.attachments && msg.attachments.length > 0) {
    const firstAttachment = msg.attachments[0];
    if (firstAttachment.type === 'image') {
      mediaType = 'image';
      mediaUrl = firstAttachment.image_url || firstAttachment.asset_url;
    } else if (firstAttachment.type === 'video') {
      mediaType = 'video';
      mediaUrl = firstAttachment.asset_url;
    } else if (firstAttachment.type === 'file') {
      mediaType = 'file';
      mediaUrl = firstAttachment.asset_url;
    }

    // URL enrichment attachment = link preview
    const urlAttachment = msg.attachments.find(
      (a: Record<string, unknown>) => a.og_scrape_url || a.title_link,
    );
    if (urlAttachment) {
      linkPreview = {
        url: urlAttachment.og_scrape_url || urlAttachment.title_link,
        title: urlAttachment.title,
        description: urlAttachment.text,
        image: urlAttachment.image_url || urlAttachment.thumb_url,
      };
    }
  }

  const custom = (msg as unknown as Record<string, unknown>) || {};

  // Extract reactions
  const reactions: Record<string, { count: number; userReacted: boolean; users: string[] }> = {};
  if (msg.reaction_counts) {
    for (const [type, count] of Object.entries(msg.reaction_counts)) {
      reactions[type] = {
        count: count as number,
        userReacted: false,
        users: [],
      };
    }
  }

  // Populate users from latest_reactions
  if (msg.latest_reactions) {
    for (const reaction of msg.latest_reactions) {
      const type = reaction.type;
      if (!reactions[type]) {
        reactions[type] = { count: 0, userReacted: false, users: [] };
      }
      if (reaction.user?.id && !reactions[type].users.includes(reaction.user.id)) {
        reactions[type].users.push(reaction.user.id);
      }
    }
  }

  // Set own reaction flags
  if (msg.own_reactions) {
    for (const reaction of msg.own_reactions) {
      const type = reaction.type;
      if (!reactions[type]) {
        reactions[type] = { count: 0, userReacted: false, users: [] };
      }
      reactions[type].userReacted = true;
      if (reaction.user?.id && !reactions[type].users.includes(reaction.user.id)) {
        reactions[type].users.push(reaction.user.id);
      }
    }
  }

  return {
    id: msg.id,
    trip_id: tripId,
    content: msg.text || '',
    author_name: user?.name || user?.id || 'Unknown',
    user_id: user?.id,
    created_at: msg.created_at || new Date().toISOString(),
    updated_at: msg.updated_at || msg.created_at || new Date().toISOString(),
    media_type: mediaType,
    media_url: mediaUrl,
    link_preview: linkPreview,
    sentiment: custom.sentiment as string | undefined,
    privacy_mode: custom.privacy_mode as string | undefined,
    privacy_encrypted: false, // No encryption in Stream path
    message_type: custom.message_type as string | undefined,
    is_edited: msg.created_at !== msg.updated_at,
    edited_at: msg.created_at !== msg.updated_at ? msg.updated_at : undefined,
    client_message_id: msg.id, // Stream uses message ID for dedup
    reply_to_id: msg.parent_id || undefined,
    mentioned_user_ids: msg.mentioned_users?.map((u: UserResponse) => u.id),
    reactions: Object.keys(reactions).length > 0 ? reactions : undefined,
  };
}

/**
 * Build Stream message payload from Chravel send parameters.
 */
export function chravelMessageToStreamPayload(params: {
  content: string;
  userId: string;
  privacyMode?: string;
  messageType?: string;
  replyToId?: string;
  mentionedUserIds?: string[];
  mediaType?: string;
  mediaUrl?: string;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    text: params.content,
    user_id: params.userId,
  };

  // Custom data
  if (params.privacyMode && params.privacyMode !== 'standard') {
    payload.privacy_mode = params.privacyMode;
  }
  if (params.messageType && params.messageType !== 'text') {
    payload.message_type = params.messageType;
  }

  // Thread reply
  if (params.replyToId) {
    payload.parent_id = params.replyToId;
  }

  // Mentions
  if (params.mentionedUserIds && params.mentionedUserIds.length > 0) {
    payload.mentioned_users = params.mentionedUserIds;
  }

  // Attachments
  if (params.mediaUrl) {
    payload.attachments = [
      {
        type: params.mediaType || 'file',
        asset_url: params.mediaUrl,
      },
    ];
  }

  return payload;
}

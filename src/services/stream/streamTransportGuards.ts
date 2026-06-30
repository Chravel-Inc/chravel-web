/**
 * Stream transport guard helpers.
 *
 * Keep Stream-canonical transport checks in one place so queue/sync services
 * cannot drift on cutover semantics.
 *
 * NOTE: Stream's public key may be resolved at runtime from the authenticated
 * stream-token response because Lovable reserves user-created VITE_ secrets.
 * Only an explicit disable flag should send chat through legacy sync paths.
 */
function isStreamDisabled(): boolean {
  return import.meta.env.VITE_STREAM_CHAT_DISABLED === 'true';
}

export function isStreamConfigured(): boolean {
  return !isStreamDisabled();
}

export function shouldUseLegacyChatSync(): boolean {
  return !isStreamConfigured();
}

export function isStreamChatActive(streamUserId?: string | null): boolean {
  return isStreamConfigured() && Boolean(streamUserId);
}

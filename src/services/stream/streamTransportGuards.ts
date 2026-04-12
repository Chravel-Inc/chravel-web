/**
 * Stream transport guard helpers.
 *
 * Keep Stream-canonical transport checks in one place so queue/sync services
 * cannot drift on cutover semantics.
 */
export function isStreamConfigured(): boolean {
  const apiKey = import.meta.env.VITE_STREAM_API_KEY;
  return typeof apiKey === 'string' && apiKey.trim().length > 0;
}

export function shouldUseLegacyChatSync(): boolean {
  return !isStreamConfigured();
}

export function isStreamChatActive(streamUserId?: string | null): boolean {
  return isStreamConfigured() && Boolean(streamUserId);
}

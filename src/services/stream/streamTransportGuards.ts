/**
 * Stream transport guard helpers.
 *
 * Keep Stream-canonical transport checks in one place so queue/sync services
 * cannot drift on cutover semantics.
 *
 * NOTE: The fallback key must match the one in streamClient.ts to keep
 * guard checks aligned with the actual client connection.
 */
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || 'k2dbmuesv2a9';

export function isStreamConfigured(): boolean {
  return typeof STREAM_API_KEY === 'string' && STREAM_API_KEY.trim().length > 0;
}

export function shouldUseLegacyChatSync(): boolean {
  return !isStreamConfigured();
}

export function isStreamChatActive(streamUserId?: string | null): boolean {
  return isStreamConfigured() && Boolean(streamUserId);
}

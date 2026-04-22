/**
 * Stream transport guard helpers.
 *
 * Keep Stream-canonical transport checks in one place so queue/sync services
 * cannot drift on cutover semantics.
 *
 * NOTE: Guard checks are intentionally env-driven so blank/absent keys can
 * disable Stream paths in tests and staged rollouts.
 */
function getStreamApiKeyFromEnv(): string {
  return import.meta.env.VITE_STREAM_API_KEY ?? '';
}

export function isStreamConfigured(): boolean {
  return getStreamApiKeyFromEnv().trim().length > 0;
}

export function shouldUseLegacyChatSync(): boolean {
  return !isStreamConfigured();
}

export function isStreamChatActive(streamUserId?: string | null): boolean {
  return isStreamConfigured() && Boolean(streamUserId);
}

const CONCIERGE_STREAM_UNSUPPORTED_MESSAGE =
  'Unsupported concierge transport: concierge messaging is SSE/DB-backed, not Stream-backed.';

export function getUnsupportedConciergeTransportMessage(): string {
  return CONCIERGE_STREAM_UNSUPPORTED_MESSAGE;
}

export function assertConciergeStreamTransportUnsupported(): never {
  throw new Error(CONCIERGE_STREAM_UNSUPPORTED_MESSAGE);
}

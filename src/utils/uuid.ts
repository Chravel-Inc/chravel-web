/**
 * Generates a UUID-like identifier using the strongest browser API available.
 *
 * Why this exists:
 * - `crypto.randomUUID()` is unavailable in some older iOS WKWebView builds.
 * - Calling `crypto.randomUUID()` unguarded can throw at app startup.
 */
export const generateSafeUuid = (): string => {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);

      // RFC 4122 v4 variant/version bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
  }

  // Last-resort fallback for very old/non-standard runtimes.
  // Kept UUID-shaped so UUID-expecting code paths don't throw.
  const randomHex = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
    .padEnd(32, '0')
    .slice(0, 32);
  return `${randomHex.slice(0, 8)}-${randomHex.slice(8, 12)}-4${randomHex.slice(13, 16)}-a${randomHex.slice(17, 20)}-${randomHex.slice(20, 32)}`;
};

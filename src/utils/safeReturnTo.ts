/**
 * Validate a returnTo value against same-origin relative-path rules.
 * Rejects absolute URLs, protocol-relative URLs, and anything that does not
 * start with a single forward slash. Used by AuthPage and OAuth flows so the
 * post-sign-in redirect cannot be hijacked into an off-domain destination.
 */
export function getSafeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  return value;
}

/**
 * Map opaque provider / WKWebView / network strings to user-facing guidance.
 *
 * Native shells surface raw strings like "Load failed" (WKWebView), "Failed to fetch"
 * (browser network layer), or "Network request failed" (Capacitor / Expo bridges) when
 * the OAuth handoff stalls. Passing those through to the AuthModal red banner leaves
 * users stuck on "Redirecting…" with no idea what happened. This normalizer keeps the
 * original Supabase / provider message when it's actually informative and replaces the
 * opaque ones with actionable copy.
 */
export const normalizeAuthErrorMessage = (rawMessage: string | null | undefined): string => {
  if (!rawMessage) {
    return 'Something went wrong. Please try again.';
  }
  const msg = String(rawMessage);
  if (/load failed|failed to fetch|network request failed|networkerror/i.test(msg)) {
    return 'Network issue while signing in. Please check your connection and try again.';
  }
  if (/timed out|timeout/i.test(msg)) {
    return 'Sign-in timed out. Please try again.';
  }
  return msg;
};

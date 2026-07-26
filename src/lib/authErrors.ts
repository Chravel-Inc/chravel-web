/**
 * Enumeration-safe auth messaging.
 *
 * GoTrue distinguishes "Invalid login credentials" from "Email not confirmed", and sign-up
 * reports "already registered". Surfacing those differences — or passing raw `error.message`
 * through — turns the auth form into an account-existence oracle: an attacker submits an address
 * with a junk password and learns from the response whether it belongs to a real user.
 *
 * Every failure on an existence-revealing path must therefore collapse to one constant string.
 * Errors that do NOT depend on whether the account exists (password complexity, network failure)
 * can stay specific, because they leak nothing.
 *
 * These are UI strings only. They are not an authorization control — the server-side gates are
 * GoTrue's own rate limits and leaked-password protection.
 */

/**
 * Covers both wrong-password and unconfirmed-account. The confirmation hint is shown to everyone
 * regardless of account state, so it preserves the recovery path for legitimate users without
 * distinguishing the two cases.
 */
export const GENERIC_SIGN_IN_ERROR =
  'Invalid email or password. If you recently signed up, check your inbox for a confirmation link.';

/**
 * Returned whether or not the address is already registered. Phrased conditionally so it is not a
 * false claim of success when the address was already taken.
 */
export const GENERIC_SIGN_UP_RESULT =
  'If an account can be created with this email, a confirmation link is on its way. Check your inbox.';

/** Returned for every password-reset request, valid address or not. */
export const GENERIC_PASSWORD_RESET_RESULT =
  'If an account exists for that email, a password reset link has been sent.';

/** Fallback for unexpected auth failures — never surface raw provider text. */
export const GENERIC_AUTH_ERROR = 'Something went wrong. Please try again.';

/**
 * Password complexity is independent of account existence, so it is safe to report precisely.
 * Anything else collapses to the generic string.
 */
export function toSafeSignUpError(providerMessage: string): string {
  return /password/i.test(providerMessage)
    ? 'Password must be at least 6 characters long.'
    : GENERIC_AUTH_ERROR;
}

/**
 * Progressive delay applied after repeated failed sign-in attempts in a single session.
 *
 * This is a UX speed bump, not a security control — it lives in the browser and is trivially
 * bypassed by calling GoTrue directly. Password auth goes browser->GoTrue without passing through
 * any edge function, so the enforceable throttle is GoTrue's own rate limit configuration.
 */
export function signInBackoffMs(failedAttempts: number): number {
  if (failedAttempts < 3) return 0;
  if (failedAttempts < 5) return 3_000;
  if (failedAttempts < 8) return 10_000;
  return 30_000;
}

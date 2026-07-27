/**
 * Mention regex: matches @Name or @First Last (up to two tokens).
 * Supports hyphens and apostrophes within tokens (@Anne-Marie, @O'Brien).
 * Second token must start with uppercase to avoid capturing trailing words.
 * Negative lookbehind prevents false positives on emails (foo@bar.com).
 */
export const MENTION_REGEX = /((?<!\w)@[\w'-]+(?:\s[A-Z][\w'-]*)?)/g;

/**
 * Mention styling: bold white with a subtle white chip — one rule, every bubble.
 *
 * All three bubbles are dark and now theme-independent (the light-mode override
 * of --chat-bubble-other was removed, so the gray bubble no longer flips to
 * cream). White therefore clears AA everywhere with no theme branching:
 *
 *   white on #383838 other ....... 11.73:1
 *   white on #B91C1C broadcast .... 6.47:1
 *   white on #007AFF own .......... 4.02:1  (identical to the bubble's own body
 *                                            text, which is already white on blue)
 *
 * Color alone cannot carry the distinction, since surrounding body text is also
 * white. Weight plus a low-opacity chip does it without introducing a hue that
 * fails on one of the bubbles — red text, for instance, is 1.07:1 on the own
 * bubble, worse than the black-on-gray bug this replaced.
 */
export const getMentionClassName = (_opts: {
  isOwnMessage: boolean;
  isBroadcast?: boolean;
}): string => 'font-semibold text-white bg-white/20 rounded px-1 py-0.5';

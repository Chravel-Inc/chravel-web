/**
 * Mention regex: matches @Name or @First Last (up to two tokens).
 * Supports hyphens and apostrophes within tokens (@Anne-Marie, @O'Brien).
 * Second token must start with uppercase to avoid capturing trailing words.
 * Negative lookbehind prevents false positives on emails (foo@bar.com).
 */
export const MENTION_REGEX = /((?<!\w)@[\w'-]+(?:\s[A-Z][\w'-]*)?)/g;

/**
 * Bubble-aware mention styling.
 *
 * Mentions must stay legible on every bubble color in BOTH themes, so the class
 * is derived from the bubble's own foreground token rather than a fixed color:
 *
 * - own (`--chat-bubble-own`, #007AFF blue) and broadcast (dark red) bubbles are
 *   dark in both themes, so white text is correct for both.
 * - other bubbles flip with the theme (#383838 in dark, cream in light), so they
 *   use `--chat-bubble-other-foreground`, which flips with them.
 *
 * A low-opacity chip derived from the same foreground keeps the mention distinct
 * from surrounding text without relying on color alone.
 */
export const getMentionClassName = (opts: {
  isOwnMessage: boolean;
  isBroadcast?: boolean;
}): string => {
  const base = 'font-semibold rounded px-0.5';

  // Both own and broadcast bubbles are dark in light and dark themes.
  if (opts.isOwnMessage || opts.isBroadcast) {
    return `${base} text-chat-own-foreground bg-white/20`;
  }

  return `${base} text-chat-other-foreground bg-chat-other-foreground/15`;
};

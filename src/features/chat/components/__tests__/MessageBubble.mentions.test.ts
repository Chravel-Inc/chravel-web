import { describe, expect, it } from 'vitest';
import { getMentionClassName, MENTION_REGEX } from '../messageMentions';

describe('MessageBubble mention styling', () => {
  it('uses light mention text on the dark blue own-message bubble', () => {
    const className = getMentionClassName({ isOwnMessage: true, isBroadcast: false });

    expect(className).toContain('text-chat-own-foreground');
    expect(className).toContain('font-semibold');
    expect(className).not.toContain('text-black');
  });

  it('uses light mention text on the dark red broadcast bubble', () => {
    const className = getMentionClassName({ isOwnMessage: false, isBroadcast: true });

    expect(className).toContain('text-chat-own-foreground');
    expect(className).toContain('font-semibold');
    expect(className).not.toContain('text-black');
  });

  it('uses the theme-flipping foreground token on other users bubbles', () => {
    const className = getMentionClassName({ isOwnMessage: false, isBroadcast: false });

    // Must follow the bubble, which is #383838 in dark and cream in light.
    // A hardcoded color is invisible in one theme or the other.
    expect(className).toContain('text-chat-other-foreground');
    expect(className).toContain('font-semibold');
    expect(className).not.toContain('text-black');
    expect(className).not.toContain('text-white');
  });

  it('matches two-word mention names', () => {
    const content = 'Hey @Alex Rivera and @Sam, check this';
    MENTION_REGEX.lastIndex = 0;
    const parts = content.split(MENTION_REGEX);
    const mentionParts = parts.filter(part => {
      MENTION_REGEX.lastIndex = 0;
      return MENTION_REGEX.test(part);
    });

    expect(mentionParts).toEqual(['@Alex Rivera', '@Sam']);
  });

  it('matches hyphenated names like @Anne-Marie', () => {
    const content = 'cc @Anne-Marie please';
    MENTION_REGEX.lastIndex = 0;
    const parts = content.split(MENTION_REGEX);
    const mentionParts = parts.filter(part => {
      MENTION_REGEX.lastIndex = 0;
      return MENTION_REGEX.test(part);
    });

    expect(mentionParts).toEqual(['@Anne-Marie']);
  });

  it('does not match email addresses like foo@bar.com', () => {
    const content = 'Email me at foo@bar.com';
    MENTION_REGEX.lastIndex = 0;
    const parts = content.split(MENTION_REGEX);
    const mentionParts = parts.filter(part => {
      MENTION_REGEX.lastIndex = 0;
      return MENTION_REGEX.test(part);
    });

    expect(mentionParts).toEqual([]);
  });
});

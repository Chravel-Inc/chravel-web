import { describe, expect, it } from 'vitest';
import { getMentionClassName, MENTION_REGEX } from '../messageMentions';

describe('MessageBubble mention styling', () => {
  const ALL_BUBBLES = [
    { isOwnMessage: true, isBroadcast: false },
    { isOwnMessage: false, isBroadcast: false },
    { isOwnMessage: false, isBroadcast: true },
  ];

  it('uses bold white text on every bubble', () => {
    // All three bubbles are dark and theme-independent, so white clears AA
    // everywhere: 11.73:1 on #383838, 6.47:1 on #B91C1C, 4.02:1 on #007AFF.
    for (const opts of ALL_BUBBLES) {
      const className = getMentionClassName(opts);
      expect(className).toContain('text-white');
      expect(className).toContain('font-semibold');
    }
  });

  it('carries a chip so mentions are distinguishable from white body text', () => {
    // Color alone cannot separate the mention from surrounding text, which is
    // also white — weight plus a chip does.
    for (const opts of ALL_BUBBLES) {
      expect(getMentionClassName(opts)).toContain('bg-white/20');
    }
  });

  it('never uses a hue that fails on one of the bubbles', () => {
    // Red text is 1.07:1 on the own bubble and gold is 1.50:1 — both worse than
    // the black-on-gray bug this styling replaced.
    for (const opts of ALL_BUBBLES) {
      const className = getMentionClassName(opts);
      expect(className).not.toContain('text-red');
      expect(className).not.toContain('text-gold');
      expect(className).not.toContain('text-black');
    }
  });

  it('needs no theme-dependent branching', () => {
    // Every bubble renders identically in light and dark, so one class is correct
    // for all of them. If this ever diverges, the light-mode bubble override has
    // been reintroduced in index.css.
    const classNames = ALL_BUBBLES.map(getMentionClassName);
    expect(new Set(classNames).size).toBe(1);
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

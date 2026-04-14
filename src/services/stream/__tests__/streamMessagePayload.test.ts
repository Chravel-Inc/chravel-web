import { describe, expect, it } from 'vitest';
import { buildTripStreamMessagePayload } from '../streamMessagePayload';

describe('buildTripStreamMessagePayload', () => {
  it('builds normalized payload with metadata fields', () => {
    const result = buildTripStreamMessagePayload({
      content: '  hello world  ',
      messageType: 'broadcast',
      privacyMode: 'friends',
      replyToId: 'msg-1',
      mentionedUserIds: ['u1', 'u2'],
      mediaType: 'image',
      mediaUrl: 'https://cdn.example/image.png',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.normalizedContent).toBe('hello world');
    expect(result.payload).toMatchObject({
      text: 'hello world',
      message_type: 'broadcast',
      privacy_mode: 'friends',
      parent_id: 'msg-1',
      mentioned_users: ['u1', 'u2'],
    });
    expect(result.payload.attachments).toEqual([
      { type: 'image', asset_url: 'https://cdn.example/image.png' },
    ]);
  });

  it('rejects empty content', () => {
    const result = buildTripStreamMessagePayload({ content: '   ' });
    expect(result).toEqual({ ok: false, error: 'empty_content' });
  });

  it('rejects content over 4000 chars', () => {
    const result = buildTripStreamMessagePayload({ content: 'x'.repeat(4001) });
    expect(result).toEqual({ ok: false, error: 'content_too_long' });
  });
});

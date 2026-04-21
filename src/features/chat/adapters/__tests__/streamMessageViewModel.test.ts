import { describe, expect, it } from 'vitest';
import type { MessageResponse } from 'stream-chat';
import {
  buildStreamMessageViewModels,
  mapStreamMessageToViewModel,
} from '../streamMessageViewModel';

const members = [
  { id: 'user-1', name: 'Alex', avatar: 'alex.png' },
  { id: 'user-2', name: 'Bailey', avatar: 'bailey.png' },
  { id: 'user-3', name: 'Casey', avatar: 'casey.png' },
];

const baseMessage = (overrides: Partial<MessageResponse> = {}): MessageResponse =>
  ({
    id: 'm1',
    text: 'hello',
    user: { id: 'user-1', name: 'Alex' },
    created_at: '2026-04-20T10:00:00.000Z',
    updated_at: '2026-04-20T10:00:00.000Z',
    ...overrides,
  }) as MessageResponse;

describe('buildStreamMessageViewModels', () => {
  it('marks edited messages when updated_at differs', () => {
    const results = buildStreamMessageViewModels({
      messages: [
        baseMessage({
          updated_at: '2026-04-20T10:05:00.000Z',
        }),
      ],
      tripMembers: members,
    });

    expect(results[0].isEdited).toBe(true);
    expect(results[0].editedAt).toBe('2026-04-20T10:05:00.000Z');
  });

  it('extracts media attachment and link preview from stream attachments', () => {
    const results = buildStreamMessageViewModels({
      messages: [
        baseMessage({
          attachments: [
            { type: 'image', image_url: 'https://cdn/image.png' },
            {
              type: 'file',
              og_scrape_url: 'https://example.com',
              title: 'Example',
              text: 'desc',
              thumb_url: 'https://cdn/thumb.png',
            },
          ] as unknown as MessageResponse['attachments'],
        }),
      ],
      tripMembers: members,
    });

    expect(results[0].mediaType).toBe('image');
    expect(results[0].mediaUrl).toBe('https://cdn/image.png');
    expect(results[0].linkPreview).toMatchObject({
      url: 'https://example.com',
      title: 'Example',
      description: 'desc',
      image: 'https://cdn/thumb.png',
    });
  });

  it('maps reaction counts, user reacted flag, and users list', () => {
    const results = buildStreamMessageViewModels({
      messages: [
        baseMessage({
          reaction_counts: { love: 2 } as unknown as MessageResponse['reaction_counts'],
          own_reactions: [
            { type: 'love', user: { id: 'user-1' } },
          ] as unknown as MessageResponse['own_reactions'],
          latest_reactions: [
            { type: 'love', user: { id: 'user-1' } },
            { type: 'love', user: { id: 'user-2' } },
          ] as unknown as MessageResponse['latest_reactions'],
        }),
      ],
      tripMembers: members,
    });

    expect(results[0].reactions?.love).toEqual({
      count: 2,
      userReacted: true,
      users: ['user-1', 'user-2'],
    });
  });

  it('resolves parent reply context from parent message', () => {
    const parent = baseMessage({
      id: 'parent-1',
      text: 'parent text',
      user: { id: 'user-2', name: 'Bailey' },
    });
    const child = baseMessage({ id: 'child-1', parent_id: 'parent-1', text: 'child text' });
    const membersById = new Map(members.map(member => [member.id, member]));
    const messageById = new Map([
      [parent.id, parent],
      [child.id, child],
    ]);

    const vm = mapStreamMessageToViewModel({
      message: child,
      membersById,
      messageById,
    });

    expect(vm.replyTo).toEqual({
      id: 'parent-1',
      text: 'parent text',
      sender: 'Bailey',
    });
  });

  it('projects read-state for eligible members only', () => {
    const results = buildStreamMessageViewModels({
      messages: [baseMessage()],
      tripMembers: members,
      currentUserId: 'user-1',
      channelReadState: {
        'user-1': { last_read: '2026-04-20T10:10:00.000Z' },
        'user-2': { last_read: '2026-04-20T10:11:00.000Z' },
        'user-4': { last_read: '2026-04-20T10:12:00.000Z' },
      },
    });

    expect(results[0].readStatuses).toEqual([
      {
        id: 'm1:user-2',
        message_id: 'm1',
        user_id: 'user-2',
        read_at: '2026-04-20T10:11:00.000Z',
        created_at: '2026-04-20T10:11:00.000Z',
      },
    ]);
  });

  it('keeps TripChat timeline to top-level stream messages', () => {
    const parent = baseMessage({ id: 'p1', text: 'Original' });
    const topLevel = baseMessage({
      id: 'm2',
      text: 'Visible',
      reply_to_id: 'p1',
    } as unknown as MessageResponse);

    const results = buildStreamMessageViewModels({
      messages: [parent, topLevel],
      tripMembers: members,
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p1');
  });
});

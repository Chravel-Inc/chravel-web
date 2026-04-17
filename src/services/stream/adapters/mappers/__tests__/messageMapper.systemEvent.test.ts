import { describe, it, expect } from 'vitest';
import {
  streamMessageToChravel,
  chravelMessageToStreamPayload,
} from '@/services/stream/adapters/mappers/messageMapper';
import type { MessageResponse } from 'stream-chat';

describe('messageMapper system_event_type passthrough', () => {
  it('preserves system_event_type and system_payload from Stream response', () => {
    const streamMsg = {
      id: 'm1',
      text: 'Alice created a poll: "Where to dinner?"',
      user: { id: 'user-1', name: 'Alice' },
      created_at: '2026-04-17T12:00:00Z',
      updated_at: '2026-04-17T12:00:00Z',
      message_type: 'system',
      system_event_type: 'poll_created',
      system_payload: { pollId: 'poll-7', pollQuestion: 'Where to dinner?' },
      attachments: [],
    } as unknown as MessageResponse;

    const mapped = streamMessageToChravel(streamMsg, 'trip-abc');

    expect(mapped.message_type).toBe('system');
    expect(mapped.system_event_type).toBe('poll_created');
    expect(mapped.system_payload).toEqual({
      pollId: 'poll-7',
      pollQuestion: 'Where to dinner?',
    });
  });

  it('writer payload includes system_event_type + system_payload when provided', () => {
    const payload = chravelMessageToStreamPayload({
      content: 'Bob completed: "Book hotel"',
      userId: 'user-2',
      messageType: 'system',
      systemEventType: 'task_completed',
      systemPayload: { taskId: 't1', taskTitle: 'Book hotel' },
    });

    expect(payload.message_type).toBe('system');
    expect(payload.system_event_type).toBe('task_completed');
    expect(payload.system_payload).toEqual({ taskId: 't1', taskTitle: 'Book hotel' });
    expect(payload.text).toBe('Bob completed: "Book hotel"');
  });

  it('writer payload omits system_event_type when not provided', () => {
    const payload = chravelMessageToStreamPayload({
      content: 'hi',
      userId: 'user-3',
    });
    expect(payload.system_event_type).toBeUndefined();
    expect(payload.system_payload).toBeUndefined();
  });
});

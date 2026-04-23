import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatTypingIndicators } from '../useChatTypingIndicators';
import { TypingIndicatorService } from '@/services/typingIndicatorService';

const initializeMock = vi.fn(() => Promise.resolve());
const cleanupMock = vi.fn(() => Promise.resolve());

vi.mock('@/services/typingIndicatorService', () => ({
  TypingIndicatorService: vi.fn().mockImplementation(function MockTypingIndicatorService() {
    return {
      initialize: initializeMock,
      cleanup: cleanupMock,
    };
  }),
}));

class MockStreamChannel {
  private listeners = new Map<string, Set<(event: unknown) => void>>();
  keystroke = vi.fn(async () => undefined);
  stopTyping = vi.fn(async () => undefined);

  on(eventType: string, listener: (event: unknown) => void) {
    const current = this.listeners.get(eventType) ?? new Set<(event: unknown) => void>();
    current.add(listener);
    this.listeners.set(eventType, current);
  }

  off(eventType: string, listener: (event: unknown) => void) {
    this.listeners.get(eventType)?.delete(listener);
  }

  emit(eventType: string, event: unknown) {
    this.listeners.get(eventType)?.forEach(listener => listener(event));
  }
}

describe('useChatTypingIndicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not initialize legacy TypingIndicatorService in stream mode when channel is unavailable', () => {
    renderHook(() =>
      useChatTypingIndicators(
        false,
        'trip-1',
        { id: 'me-1', displayName: 'Me' },
        'everyone',
        3,
        null,
        'stream',
      ),
    );

    expect(TypingIndicatorService).not.toHaveBeenCalled();
  });

  it('uses legacy TypingIndicatorService only in explicit legacy transport mode', async () => {
    const { unmount } = renderHook(() =>
      useChatTypingIndicators(
        false,
        'trip-1',
        { id: 'me-1', displayName: 'Me' },
        'everyone',
        3,
        null,
        'legacy',
      ),
    );

    await waitFor(() => {
      expect(TypingIndicatorService).toHaveBeenCalledTimes(1);
      expect(initializeMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    await waitFor(() => {
      expect(cleanupMock).toHaveBeenCalledTimes(1);
    });
  });

  it('handles typing.start/typing.stop across reconnect and channel switch transitions', async () => {
    const channelA = new MockStreamChannel();
    const channelB = new MockStreamChannel();

    const { result, rerender } = renderHook(
      ({ activeChannel }) =>
        useChatTypingIndicators(
          false,
          'trip-1',
          { id: 'me-1', displayName: 'Me' },
          'everyone',
          5,
          activeChannel,
          'stream',
        ),
      {
        initialProps: { activeChannel: channelA },
      },
    );

    act(() => {
      channelA.emit('typing.start', { user: { id: 'user-2', name: 'Alice' } });
    });

    expect(result.current.typingUsers).toEqual([{ userId: 'user-2', userName: 'Alice' }]);

    act(() => {
      channelA.emit('connection.changed', { online: false });
    });

    expect(result.current.typingUsers).toEqual([]);

    rerender({ activeChannel: channelB });

    act(() => {
      channelA.emit('typing.start', { user: { id: 'user-3', name: 'Stale User' } });
      channelB.emit('typing.start', { user: { id: 'user-4', name: 'Bob' } });
      channelB.emit('typing.stop', { user: { id: 'user-4', name: 'Bob' } });
    });

    expect(result.current.typingUsers).toEqual([]);

    act(() => {
      channelB.emit('typing.start', { user: { id: 'user-4', name: 'Bob' } });
    });

    expect(result.current.typingUsers).toEqual([{ userId: 'user-4', userName: 'Bob' }]);
  });

  it('throttles outbound stream keystroke signals and sends stopTyping on false', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00.000Z'));

    const channel = new MockStreamChannel();
    const { result } = renderHook(() =>
      useChatTypingIndicators(
        false,
        'trip-1',
        { id: 'me-1', displayName: 'Me' },
        'everyone',
        3,
        channel,
        'stream',
      ),
    );

    act(() => {
      result.current.handleTypingChange(true);
      result.current.handleTypingChange(true);
    });

    expect(channel.keystroke).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1300);
      result.current.handleTypingChange(true);
      result.current.handleTypingChange(false);
      vi.advanceTimersByTime(200);
    });

    expect(channel.keystroke).toHaveBeenCalledTimes(2);
    expect(channel.stopTyping).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useConciergeStreaming } from '../useConciergeStreaming';
import type { ChatMessage } from '@/features/concierge/types';

const { invokeConciergeStreamMock } = vi.hoisted(() => ({
  invokeConciergeStreamMock: vi.fn(),
}));

vi.mock('@/services/conciergeGateway', async () => {
  const actual = await vi.importActual<typeof import('@/services/conciergeGateway')>(
    '@/services/conciergeGateway',
  );
  return {
    ...actual,
    invokeConciergeStream: invokeConciergeStreamMock,
  };
});

describe('useConciergeStreaming', () => {
  beforeEach(() => {
    invokeConciergeStreamMock.mockReset();
  });

  it('returns early for empty input with no attachments', async () => {
    let messages: ChatMessage[] = [];
    const setMessages = vi.fn(updater => {
      messages = updater(messages);
    });

    const { result } = renderHook(() =>
      useConciergeStreaming({
        tripId: 'trip-1',
        isDemoMode: false,
        userId: 'user-1',
        isOffline: false,
        isLimitedPlan: false,
        inputMessage: '   ',
        setInputMessage: vi.fn(),
        isTyping: false,
        messages,
        setMessages,
        messagesRef: { current: messages },
        isMounted: { current: true },
        streamAbortRef: { current: null },
        setIsTyping: vi.fn(),
        setAiStatus: vi.fn(),
        incrementUsageOnSuccess: vi.fn(async () => ({ incremented: true })),
        buildLimitReachedMessage: vi.fn(() => ({
          id: 'limit',
          type: 'assistant' as const,
          content: 'limit',
          timestamp: new Date().toISOString(),
        })),
        effectivePreferences: undefined,
        attachedImages: [],
        attachedDocuments: [],
        attachmentIntent: 'smart_import',
        clearAttachments: vi.fn(),
        streamConciergeEnabled: false,
        queryClient: new QueryClient(),
      }),
    );

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(setMessages).not.toHaveBeenCalled();
    expect(invokeConciergeStreamMock).not.toHaveBeenCalled();
  });

  it('pushes offline fallback messages and does not start streaming when offline', async () => {
    let messages: ChatMessage[] = [];
    const setMessages = vi.fn(updater => {
      messages = updater(messages);
    });

    const { result } = renderHook(() =>
      useConciergeStreaming({
        tripId: 'trip-1',
        isDemoMode: false,
        userId: 'user-1',
        isOffline: true,
        isLimitedPlan: false,
        inputMessage: 'Where are we staying?',
        setInputMessage: vi.fn(),
        isTyping: false,
        messages,
        setMessages,
        messagesRef: { current: messages },
        isMounted: { current: true },
        streamAbortRef: { current: null },
        setIsTyping: vi.fn(),
        setAiStatus: vi.fn(),
        incrementUsageOnSuccess: vi.fn(async () => ({ incremented: true })),
        buildLimitReachedMessage: vi.fn(() => ({
          id: 'limit',
          type: 'assistant' as const,
          content: 'limit',
          timestamp: new Date().toISOString(),
        })),
        effectivePreferences: undefined,
        attachedImages: [],
        attachedDocuments: [],
        attachmentIntent: 'smart_import',
        clearAttachments: vi.fn(),
        streamConciergeEnabled: true,
        queryClient: new QueryClient(),
      }),
    );

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].type).toBe('user');
    expect(messages[1].type).toBe('assistant');
    expect(messages[1].content).toContain('Offline Mode');
    expect(invokeConciergeStreamMock).not.toHaveBeenCalled();
  });
});

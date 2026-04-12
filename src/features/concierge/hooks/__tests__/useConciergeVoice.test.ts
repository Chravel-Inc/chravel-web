import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConciergeVoice } from '../useConciergeVoice';

vi.mock('@/hooks/useWebSpeechVoice', () => ({
  useWebSpeechVoice: () => ({ voiceState: 'idle', toggleVoice: vi.fn() }),
}));

vi.mock('@/hooks/useVoiceToolHandler', () => ({
  useVoiceToolHandler: () => ({ handleToolCall: vi.fn() }),
}));

vi.mock('@/hooks/useLiveKitVoice', () => ({
  useLiveKitVoice: () => ({
    state: 'ready',
    error: null,
    userTranscript: 'user live transcript',
    assistantTranscript: 'assistant live transcript',
    conversationHistory: [],
    diagnostics: null,
    startSession: vi.fn(),
    endSession: vi.fn(async () => {}),
    circuitBreakerOpen: false,
    resetCircuitBreaker: vi.fn(),
  }),
}));

describe('useConciergeVoice', () => {
  it('exposes live transcripts from useLiveKitVoice for inline UI wiring', () => {
    const { result } = renderHook(() =>
      useConciergeVoice({
        tripId: 'trip-1',
        userId: 'user-1',
        isDemoMode: false,
        isLimitedPlan: false,
        incrementUsageOnSuccess: vi.fn(async () => ({ incremented: true })),
        setMessages: vi.fn(),
        setInputMessage: vi.fn(),
        buildLimitReachedMessage: vi.fn(() => ({
          id: 'limit',
          type: 'assistant' as const,
          content: 'limit',
          timestamp: new Date().toISOString(),
        })),
      }),
    );

    expect(result.current.liveUserTranscript).toBe('user live transcript');
    expect(result.current.liveAssistantTranscript).toBe('assistant live transcript');
    expect(result.current.liveState).toBe('ready');
  });
});

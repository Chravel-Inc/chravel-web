import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConciergeVoice } from '../useConciergeVoice';

const toggleVoice = vi.fn();

vi.mock('@/hooks/useWebSpeechVoice', () => ({
  useWebSpeechVoice: ({ onUserMessage: _ }: { onUserMessage?: (text: string) => void }) => ({
    voiceState: 'idle' as const,
    toggleVoice,
    userTranscript: '',
    errorMessage: null,
  }),
}));

describe('useConciergeVoice', () => {
  beforeEach(() => {
    toggleVoice.mockReset();
  });

  it('exposes dictation voice state and toggle handler', () => {
    const { result } = renderHook(() =>
      useConciergeVoice({ inputMessage: '', setInputMessage: vi.fn() }),
    );

    expect(result.current.convoVoiceState).toBe('idle');
    result.current.handleConvoToggle();
    expect(toggleVoice).toHaveBeenCalledTimes(1);
  });
});

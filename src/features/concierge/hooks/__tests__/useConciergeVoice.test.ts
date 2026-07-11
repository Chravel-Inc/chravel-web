import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConciergeVoice } from '../useConciergeVoice';

const toggleVoice = vi.fn();
const stopVoice = vi.fn();

vi.mock('@/hooks/useWebSpeechVoice', () => ({
  useWebSpeechVoice: () => ({
    voiceState: 'idle' as const,
    toggleVoice,
    stopVoice,
    userTranscript: '',
    errorMessage: null,
  }),
}));

describe('useConciergeVoice', () => {
  beforeEach(() => {
    toggleVoice.mockReset();
    stopVoice.mockReset();
  });

  it('exposes dictation voice state and toggle handler', () => {
    const { result } = renderHook(() =>
      useConciergeVoice({ inputMessage: '', setInputMessage: vi.fn() }),
    );

    expect(result.current.convoVoiceState).toBe('idle');
    result.current.handleConvoToggle();
    expect(toggleVoice).toHaveBeenCalledTimes(1);
  });

  it('stopDictation is a no-op while idle', () => {
    const { result } = renderHook(() =>
      useConciergeVoice({ inputMessage: '', setInputMessage: vi.fn() }),
    );

    result.current.stopDictation();
    expect(stopVoice).not.toHaveBeenCalled();
  });
});

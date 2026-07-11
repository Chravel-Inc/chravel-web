import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWebSpeechVoice } from '@/hooks/useWebSpeechVoice';
import type { VoiceState } from '@/hooks/useWebSpeechVoice';
import { useConciergeLanguagePreference } from '@/features/concierge/hooks/useConciergeLanguagePreference';

const ENABLED = (import.meta.env?.VITE_CONCIERGE_VOICE_ENABLED ?? 'true') !== 'false';

interface Params {
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
}

export function useConciergeVoice({ inputMessage, setInputMessage }: Params) {
  const dictationBaseRef = useRef('');
  const inputMessageRef = useRef(inputMessage);
  inputMessageRef.current = inputMessage;

  const handleTranscript = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const base = dictationBaseRef.current;
      const separator = base && !base.endsWith(' ') ? ' ' : '';
      dictationBaseRef.current = '';
      setInputMessage(base + separator + trimmed);
    },
    [setInputMessage],
  );

  const { bcp47 } = useConciergeLanguagePreference();
  const { voiceState, toggleVoice, stopVoice, userTranscript, errorMessage } = useWebSpeechVoice(
    handleTranscript,
    undefined,
    bcp47 ?? undefined,
  );

  useEffect(() => {
    if (!errorMessage) return;
    try {
      toast.error(errorMessage);
    } catch {
      /* toast unavailable in tests */
    }
  }, [errorMessage]);

  const isDictating = voiceState === 'listening' || voiceState === 'connecting';

  useEffect(() => {
    if (!isDictating) return;

    const base = dictationBaseRef.current;
    const interim = userTranscript.trim();
    if (!interim) return;

    const separator = base && !base.endsWith(' ') ? ' ' : '';
    setInputMessage(base + separator + interim);
  }, [isDictating, setInputMessage, userTranscript]);

  const convoVoiceState: VoiceState = ENABLED ? voiceState : 'idle';

  const handleConvoToggle = useCallback(() => {
    if (!ENABLED) {
      try {
        toast.error('Dictation is unavailable', {
          description: 'Voice input is turned off in this build.',
        });
      } catch {
        /* toast unavailable in tests */
      }
      return;
    }

    if (voiceState === 'idle' || voiceState === 'error') {
      dictationBaseRef.current = inputMessageRef.current;
    }

    toggleVoice();
  }, [toggleVoice, voiceState]);

  // Stop in-field dictation so it never contends with realtime voice for the mic.
  const stopDictation = useCallback(() => {
    if (voiceState === 'idle') return;
    stopVoice();
  }, [stopVoice, voiceState]);

  return {
    convoVoiceState,
    handleConvoToggle,
    stopDictation,
  };
}

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useConciergeVoiceInput } from './useConciergeVoiceInput';
import type { VoiceState } from '@/hooks/useWebSpeechVoice';

const ENABLED = (import.meta.env?.VITE_CONCIERGE_VOICE_ENABLED ?? 'true') !== 'false';

interface Params {
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
}

export function useConciergeVoice({ setInputMessage }: Params) {
  const handleTranscript = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setInputMessage(prev => {
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + trimmed;
      });
    },
    [setInputMessage],
  );

  const handleError = useCallback((message: string) => {
    try {
      toast.error(message);
    } catch {
      /* toast unavailable in tests */
    }
  }, []);

  const { voiceState, toggleVoice } = useConciergeVoiceInput({
    onTranscript: handleTranscript,
    onError: handleError,
  });

  const convoVoiceState: VoiceState = ENABLED ? voiceState : 'idle';

  const handleConvoToggle = useCallback(() => {
    if (!ENABLED) return;
    toggleVoice();
  }, [toggleVoice]);

  return {
    convoVoiceState,
    handleConvoToggle,
  };
}

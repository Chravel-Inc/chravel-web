/**
 * useRealtimeDictationCaptions — live, word-by-word captions of what the user is
 * currently saying, for the full-screen realtime voice overlay.
 *
 * Why this exists: the OpenAI Realtime stack behind `useRealtimeVoice` only surfaces
 * the user's transcription *once*, after the utterance finishes (there is no interim /
 * delta event for input audio at this SDK version, unlike the assistant side which
 * streams). So without this, the overlay shows "Your words appear here" the entire time
 * you speak and only fills in per-sentence — spoken words never register live. The
 * browser Web Speech API *does* emit interim results word-by-word, so we run it purely
 * as a read-only caption feed while the realtime session remains the source of truth for
 * the committed transcript and the actual conversation.
 *
 * This is deliberately separate from `useWebSpeechVoice`, which is a *dictation* engine
 * (auto-finalizes on 2s of silence, auto-sends the text, and raises a "no audio" error
 * after a few seconds of quiet). A live voice conversation has long listening gaps while
 * the assistant talks, so those behaviors are wrong here — this hook stays quiet, never
 * errors on silence, and just keeps a rolling caption until the caller resets it when the
 * authoritative turn lands.
 *
 * Enabled only where a second, recognition-only mic consumer is safe: it is skipped on
 * iOS, where opening SpeechRecognition alongside the realtime capture races for the single
 * mic slot and can break the primary audio session (see `useWebSpeechVoice` header notes).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IS_IOS,
  accumulateFinalText,
  getSpeechRecognitionCtor,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionEvent,
  type SpeechRecognitionInstance,
} from '@/lib/webSpeech';

const SpeechRecognitionClass = getSpeechRecognitionCtor();

export interface UseRealtimeDictationCaptionsResult {
  /** True when live captions can run in this browser (feature-detected, non-iOS). */
  supported: boolean;
  /** Live text of the current utterance (final + interim words), or '' when idle. */
  caption: string;
  /** True while speech is actively being recognized. */
  listening: boolean;
  /** Begin captioning. No-op if unsupported or already running. */
  start: () => void;
  /** Stop captioning and release the recognizer. */
  stop: () => void;
  /** Clear the current caption — call once the authoritative turn has committed. */
  reset: () => void;
}

export function useRealtimeDictationCaptions(): UseRealtimeDictationCaptionsResult {
  const supported = Boolean(SpeechRecognitionClass) && !IS_IOS;
  const [caption, setCaption] = useState('');
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(false);
  // Pending relaunch timer (onend / synchronous-start retry). Tracked so stop() can cancel
  // it — otherwise a stale timer firing after a quick stop→start could spawn a second,
  // concurrent recognizer fighting the first for the mic.
  const relaunchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Finalized text accrued since the last reset(); interim words are appended live but
  // not persisted here until the recognizer marks them final.
  const finalTextRef = useRef('');

  const clearRelaunchTimer = useCallback(() => {
    if (relaunchTimerRef.current) {
      clearTimeout(relaunchTimerRef.current);
      relaunchTimerRef.current = null;
    }
  }, []);

  const teardownRecognition = useCallback(() => {
    clearRelaunchTimer();
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    }
  }, [clearRelaunchTimer]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setListening(false);
    teardownRecognition();
  }, [teardownRecognition]);

  const reset = useCallback(() => {
    finalTextRef.current = '';
    setCaption('');
  }, []);

  const start = useCallback(() => {
    if (!supported || activeRef.current || !SpeechRecognitionClass) return;
    activeRef.current = true;
    finalTextRef.current = '';
    setCaption('');
    clearRelaunchTimer();

    const launch = () => {
      relaunchTimerRef.current = null;
      if (!activeRef.current || !SpeechRecognitionClass) return;
      let recognition: SpeechRecognitionInstance;
      try {
        recognition = new SpeechRecognitionClass();
      } catch {
        activeRef.current = false;
        return;
      }
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!activeRef.current) return;
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTextRef.current = accumulateFinalText(finalTextRef.current, result[0].transcript);
          } else {
            interim += result[0].transcript;
          }
        }
        setListening(true);
        const composed = (finalTextRef.current + (interim ? ' ' + interim : '')).trim();
        setCaption(composed);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Permission problems are terminal — stop looping. Everything else (no-speech,
        // network blips, aborted) is transient and onend will relaunch while active.
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          activeRef.current = false;
          setListening(false);
        }
      };

      recognition.onend = () => {
        setListening(false);
        if (!activeRef.current) return;
        // Recognizers stop themselves on pauses / time limits. Relaunch after a short
        // beat so captions keep flowing for the whole session without a manual restart.
        relaunchTimerRef.current = setTimeout(launch, 250);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        // A synchronous start() failure (e.g. mic slot briefly busy) — onend won't fire,
        // so retry once on the same cadence.
        relaunchTimerRef.current = setTimeout(launch, 250);
      }
    };

    launch();
  }, [supported, clearRelaunchTimer]);

  // Never let a recognizer outlive the hook.
  useEffect(() => () => stop(), [stop]);

  return { supported, caption, listening, start, stop, reset };
}

/**
 * webSpeech — shared browser Web Speech API plumbing.
 *
 * The Web Speech API isn't in TypeScript's lib.dom and is vendor-prefixed
 * (`webkitSpeechRecognition`) on Safari/Chrome. Multiple hooks need the same feature
 * detection, iOS check, type surface, and final-text accumulation — the composer dictation
 * hook (`useWebSpeechVoice`) and the realtime caption hook (`useRealtimeDictationCaptions`).
 * This module is the single source so a browser-quirk fix reaches both. Each hook keeps its
 * own start/stop policy (dictate-and-send vs. rolling caption); only the plumbing is shared.
 */

// ---------- Web Speech API types ----------
// These interfaces cover the subset we use, avoiding `any` throughout.
export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: { readonly transcript: string; readonly confidence: number };
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: (() => void) | null;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onnomatch: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// ---------- Platform detection ----------
/** True on iOS devices (iPhone/iPad/iPod), where running a second concurrent recognizer is unsafe. */
export const IS_IOS =
  typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent);

// ---------- Browser support ----------
/**
 * Resolve the platform SpeechRecognition constructor (standard or `webkit`-prefixed), or
 * `null` when the browser doesn't expose it (Firefox, some iOS PWAs, SSR). Read from
 * `window` on each call so callers can feature-detect at the moment they need it.
 */
export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    (w.webkitSpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    null
  );
}

/**
 * Append a newly finalized chunk to accumulated transcript text, inserting a single space
 * between words when the previous text doesn't already end in one (never doubling spaces).
 */
export function accumulateFinalText(prev: string, addition: string): string {
  const separator = prev && !prev.endsWith(' ') ? ' ' : '';
  return prev + separator + addition;
}

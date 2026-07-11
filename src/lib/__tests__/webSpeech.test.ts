import { describe, it, expect, afterEach, vi } from 'vitest';
import { accumulateFinalText, getSpeechRecognitionCtor } from '../webSpeech';

describe('getSpeechRecognitionCtor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null on an unsupported browser (no SpeechRecognition globals)', () => {
    // jsdom exposes neither `SpeechRecognition` nor `webkitSpeechRecognition`.
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    expect(getSpeechRecognitionCtor()).toBeNull();
  });

  it('returns the standard constructor when present', () => {
    class StandardRecognition {}
    vi.stubGlobal('SpeechRecognition', StandardRecognition);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    expect(getSpeechRecognitionCtor()).toBe(StandardRecognition);
  });

  it('falls back to the webkit-prefixed constructor', () => {
    class WebkitRecognition {}
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', WebkitRecognition);
    expect(getSpeechRecognitionCtor()).toBe(WebkitRecognition);
  });
});

describe('accumulateFinalText', () => {
  it('returns the addition unchanged when there is no prior text', () => {
    expect(accumulateFinalText('', 'hello')).toBe('hello');
  });

  it('inserts a single space between words', () => {
    expect(accumulateFinalText('book a', 'table')).toBe('book a table');
  });

  it('does not double a trailing space', () => {
    expect(accumulateFinalText('book a ', 'table')).toBe('book a table');
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

/**
 * Proves the core of the "spoken words don't appear immediately" fix: an *interim*
 * (not-yet-final) Web Speech result must surface in the caption right away, because the
 * realtime SDK itself never streams the user's words while they speak.
 */

// A controllable fake of the Web Speech recognizer we can drive from the test.
class FakeSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  static instances: FakeSpeechRecognition[] = [];
  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  emitInterim(transcript: string) {
    this.onresult?.({
      resultIndex: 0,
      results: { length: 1, 0: { isFinal: false, 0: { transcript } } },
    });
  }
  emitFinal(transcript: string) {
    this.onresult?.({
      resultIndex: 0,
      results: { length: 1, 0: { isFinal: true, 0: { transcript } } },
    });
  }
}

async function loadHook() {
  const mod = await import('../useRealtimeDictationCaptions');
  return mod.useRealtimeDictationCaptions;
}

describe('useRealtimeDictationCaptions', () => {
  beforeEach(() => {
    FakeSpeechRecognition.instances = [];
    vi.resetModules();
    vi.stubGlobal('SpeechRecognition', FakeSpeechRecognition);
    // jsdom's default userAgent is not iOS, so live captions are "supported".
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is supported when SpeechRecognition exists and platform is not iOS', async () => {
    const useCaptions = await loadHook();
    const { result } = renderHook(() => useCaptions());
    expect(result.current.supported).toBe(true);
  });

  it('surfaces an interim word immediately, before it is finalized', async () => {
    const useCaptions = await loadHook();
    const { result } = renderHook(() => useCaptions());

    act(() => result.current.start());
    const rec = FakeSpeechRecognition.instances[0];
    expect(rec).toBeTruthy();
    expect(rec.interimResults).toBe(true);

    act(() => rec.emitInterim('hello'));
    // The word shows up live — no waiting for the utterance to complete.
    expect(result.current.caption).toBe('hello');
    expect(result.current.listening).toBe(true);
  });

  it('accumulates finalized words and keeps interim words appended live', async () => {
    const useCaptions = await loadHook();
    const { result } = renderHook(() => useCaptions());

    act(() => result.current.start());
    const rec = FakeSpeechRecognition.instances[0];

    act(() => rec.emitFinal('book a'));
    act(() => rec.emitInterim('table'));
    expect(result.current.caption).toBe('book a table');
  });

  it('reset() clears the caption so the next utterance starts fresh', async () => {
    const useCaptions = await loadHook();
    const { result } = renderHook(() => useCaptions());

    act(() => result.current.start());
    const rec = FakeSpeechRecognition.instances[0];
    act(() => rec.emitFinal('previous sentence'));
    expect(result.current.caption).toBe('previous sentence');

    act(() => result.current.reset());
    expect(result.current.caption).toBe('');
  });

  it('cancels a pending relaunch on stop so start() cannot spawn a duplicate recognizer', async () => {
    vi.useFakeTimers();
    try {
      const useCaptions = await loadHook();
      const { result } = renderHook(() => useCaptions());

      act(() => result.current.start());
      const first = FakeSpeechRecognition.instances[0];
      // The recognizer ends on a pause → schedules a relaunch timer (250ms).
      act(() => first.onend?.());
      expect(FakeSpeechRecognition.instances).toHaveLength(1);

      // A reconnect stops then immediately restarts captions before the timer fires.
      act(() => result.current.stop());
      act(() => result.current.start());
      // The fresh start() created exactly one new recognizer...
      expect(FakeSpeechRecognition.instances).toHaveLength(2);

      // ...and the stale relaunch timer must NOT fire a third one.
      act(() => vi.advanceTimersByTime(500));
      expect(FakeSpeechRecognition.instances).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops looping on a permission-denied error', async () => {
    const useCaptions = await loadHook();
    const { result } = renderHook(() => useCaptions());

    act(() => result.current.start());
    const rec = FakeSpeechRecognition.instances[0];
    act(() => rec.onerror?.({ error: 'not-allowed' }));
    // onend after a terminal error must NOT relaunch a new recognizer.
    act(() => rec.onend?.());
    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    expect(result.current.listening).toBe(false);
  });
});

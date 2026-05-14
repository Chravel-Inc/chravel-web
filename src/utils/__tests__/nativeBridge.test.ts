import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetNativeBridgeForTests, notifyNativeShellReady } from '../nativeBridge';

describe('notifyNativeShellReady', () => {
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetNativeBridgeForTests();
    postMessage = vi.fn();
    vi.stubGlobal('window', {
      location: { pathname: '/auth' },
    } as Window);
    (
      window as unknown as { ChravelNative: { isNative: boolean; postMessage: typeof postMessage } }
    ).ChravelNative = {
      isNative: true,
      postMessage,
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    __resetNativeBridgeForTests();
  });

  it('posts ready payload with surface option', () => {
    notifyNativeShellReady({ surface: 'auth' });
    expect(postMessage).toHaveBeenCalledTimes(1);
    const raw = postMessage.mock.calls[0][0] as string;
    const payload = JSON.parse(raw) as { type: string; source: string; surface: string };
    expect(payload.type).toBe('ready');
    expect(payload.source).toBe('chravel-web');
    expect(payload.surface).toBe('auth');
  });

  it('dedupes same surface within the quiet window', () => {
    notifyNativeShellReady({ surface: 'auth' });
    notifyNativeShellReady({ surface: 'auth' });
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it('allows same surface again after the quiet window', () => {
    vi.useFakeTimers();
    notifyNativeShellReady({ surface: 'auth' });
    expect(postMessage).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(500);
    notifyNativeShellReady({ surface: 'auth' });
    expect(postMessage).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('does not dedupe different surfaces within the quiet window', () => {
    notifyNativeShellReady({ surface: 'auth' });
    notifyNativeShellReady({ surface: 'trip' });
    expect(postMessage).toHaveBeenCalledTimes(2);
  });
});

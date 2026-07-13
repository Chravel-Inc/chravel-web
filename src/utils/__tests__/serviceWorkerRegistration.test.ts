import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  UPDATE_TAKEOVER_RELOAD_WINDOW_MS,
  installUpdateTakeoverReload,
} from '../serviceWorkerRegistration';

type Listener = () => void;

/** Stub navigator.serviceWorker with a controllable controllerchange event. */
function stubServiceWorker(controller: object | null) {
  const listeners: Listener[] = [];
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller,
      addEventListener: (type: string, cb: Listener) => {
        if (type === 'controllerchange') listeners.push(cb);
      },
    },
  });
  return { fireControllerChange: () => listeners.forEach(cb => cb()) };
}

afterEach(() => {
  // Remove the stub so other suites see jsdom's default navigator.
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
});

describe('installUpdateTakeoverReload', () => {
  it('reloads once when an updated worker takes over shortly after boot', () => {
    const sw = stubServiceWorker({});
    const reload = vi.fn();

    installUpdateTakeoverReload({ reload, now: () => 0 });
    sw.fireControllerChange();
    sw.fireControllerChange();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload on a first-time install (page was uncontrolled at boot)', () => {
    const sw = stubServiceWorker(null);
    const reload = vi.fn();

    installUpdateTakeoverReload({ reload, now: () => 0 });
    sw.fireControllerChange();

    expect(reload).not.toHaveBeenCalled();
  });

  it('leaves mid-session takeovers to the update toast (outside the boot window)', () => {
    const sw = stubServiceWorker({});
    const reload = vi.fn();
    let clock = 0;

    installUpdateTakeoverReload({ reload, now: () => clock });
    clock = UPDATE_TAKEOVER_RELOAD_WINDOW_MS + 1;
    sw.fireControllerChange();

    expect(reload).not.toHaveBeenCalled();
  });
});

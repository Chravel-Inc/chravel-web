import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissChravelBootSplash } from '../bootSplash';

describe('dismissChravelBootSplash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('hides and removes the boot splash element', () => {
    const splash = document.createElement('div');
    splash.id = 'chravel-boot-splash';
    document.body.appendChild(splash);

    dismissChravelBootSplash();
    expect(splash.classList.contains('chravel-boot-splash--hide')).toBe(true);

    vi.advanceTimersByTime(280);
    expect(document.getElementById('chravel-boot-splash')).toBeNull();
  });

  it('is a no-op when the element is missing', () => {
    expect(() => dismissChravelBootSplash()).not.toThrow();
  });
});

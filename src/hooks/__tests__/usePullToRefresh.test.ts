import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MutableRefObject } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

describe('usePullToRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not arm pull-to-refresh when a scoped scroll container is not at the top', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const scrollContainerRef = {
      current: null,
    } as MutableRefObject<HTMLDivElement | null>;
    const scrollContainer = document.createElement('div');
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 120,
      writable: true,
    });
    scrollContainerRef.current = scrollContainer;

    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh,
        scrollContainerRef,
      }),
    );

    act(() => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          touches: [{ clientY: 100 } as Touch],
        }),
      );
      document.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [{ clientY: 180 } as Touch],
        }),
      );
      document.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
    });

    expect(result.current.pullDistance).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('arms pull-to-refresh when a scoped scroll container is at the top', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const scrollContainerRef = {
      current: null,
    } as MutableRefObject<HTMLDivElement | null>;
    const scrollContainer = document.createElement('div');
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    });
    scrollContainerRef.current = scrollContainer;

    renderHook(() =>
      usePullToRefresh({
        onRefresh,
        scrollContainerRef,
        threshold: 40,
      }),
    );

    await act(async () => {
      document.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          touches: [{ clientY: 100 } as Touch],
        }),
      );
      document.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [{ clientY: 200 } as Touch],
        }),
      );
      document.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      await Promise.resolve();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

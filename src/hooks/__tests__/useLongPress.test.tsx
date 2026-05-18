import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLongPress } from '@/hooks/useLongPress';

vi.mock('@/services/hapticService', () => ({
  hapticService: {
    medium: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('clears pending long-press on touch cancel', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, threshold: 100 }));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 10, clientY: 10 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.onTouchCancel();
      vi.advanceTimersByTime(200);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('clears pending long-press on unmount', () => {
    const onLongPress = vi.fn();
    const { result, unmount } = renderHook(() => useLongPress({ onLongPress, threshold: 100 }));

    act(() => {
      result.current.onMouseDown({ clientX: 10, clientY: 10 } as React.MouseEvent);
    });

    act(() => {
      unmount();
      vi.advanceTimersByTime(200);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });
});

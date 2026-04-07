import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { isFileDragEvent, useModalFileDropGuard } from '../useModalFileDropGuard';

describe('isFileDragEvent', () => {
  it('returns true when drag payload contains files', () => {
    expect(
      isFileDragEvent({
        dataTransfer: {
          types: ['Files', 'text/plain'],
        },
      }),
    ).toBe(true);
  });

  it('returns false when drag payload does not contain files', () => {
    expect(
      isFileDragEvent({
        dataTransfer: {
          types: ['text/plain'],
        },
      }),
    ).toBe(false);
  });
});

describe('useModalFileDropGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers and unregisters window guards when enabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useModalFileDropGuard({ enabled: true }));

    expect(addSpy).toHaveBeenCalledWith('dragover', expect.any(Function), true);
    expect(addSpy).toHaveBeenCalledWith('drop', expect.any(Function), true);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('dragover', expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith('drop', expect.any(Function), true);
  });

  it('prevents default on file drag events', () => {
    const { result } = renderHook(() => useModalFileDropGuard({ enabled: false }));
    const preventDefault = vi.fn();

    result.current.onDragOverCapture({
      dataTransfer: { types: ['Files'] },
      preventDefault,
    } as unknown as React.DragEvent<HTMLElement>);

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('does not prevent default for non-file drags', () => {
    const { result } = renderHook(() => useModalFileDropGuard({ enabled: false }));
    const preventDefault = vi.fn();

    result.current.onDropCapture({
      dataTransfer: { types: ['text/plain'] },
      preventDefault,
    } as unknown as React.DragEvent<HTMLElement>);

    expect(preventDefault).not.toHaveBeenCalled();
  });
});

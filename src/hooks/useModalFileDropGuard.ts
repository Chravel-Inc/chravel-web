import { useCallback, useEffect } from 'react';
import type { DragEventHandler } from 'react';

type DragDataTransferLike = {
  dataTransfer?: {
    types?: readonly string[];
  } | null;
};

export function isFileDragEvent(event: DragDataTransferLike): boolean {
  const transferTypes = event.dataTransfer?.types;
  return Boolean(transferTypes && Array.from(transferTypes).includes('Files'));
}

interface UseModalFileDropGuardOptions {
  enabled: boolean;
}

interface UseModalFileDropGuardReturn {
  onDragOverCapture: DragEventHandler<HTMLElement>;
  onDropCapture: DragEventHandler<HTMLElement>;
}

/**
 * Guards modal drag/drop surfaces so desktop file drags are routed to nested dropzones
 * instead of triggering browser default file-open navigation.
 */
export function useModalFileDropGuard({
  enabled,
}: UseModalFileDropGuardOptions): UseModalFileDropGuardReturn {
  useEffect(() => {
    if (!enabled) return;

    const preventBrowserFileDrop = (event: DragEvent) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
    };

    window.addEventListener('dragover', preventBrowserFileDrop, true);
    window.addEventListener('drop', preventBrowserFileDrop, true);

    return () => {
      window.removeEventListener('dragover', preventBrowserFileDrop, true);
      window.removeEventListener('drop', preventBrowserFileDrop, true);
    };
  }, [enabled]);

  const onDragOverCapture = useCallback<DragEventHandler<HTMLElement>>(event => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
  }, []);

  const onDropCapture = useCallback<DragEventHandler<HTMLElement>>(event => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
  }, []);

  return {
    onDragOverCapture,
    onDropCapture,
  };
}

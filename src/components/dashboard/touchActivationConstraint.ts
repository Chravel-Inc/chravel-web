import type { TouchActivationConstraint } from '@dnd-kit/core';

export function getTouchActivationConstraint({
  isMobile,
  reorderMode,
}: {
  isMobile: boolean;
  reorderMode: boolean;
}): TouchActivationConstraint {
  if (!isMobile) {
    return { distance: 8 };
  }

  // In reorder mode, drag should feel immediate (like iOS home screen edit mode).
  if (reorderMode) {
    return { distance: 6, tolerance: 8 };
  }

  // Outside reorder mode, require a short hold to avoid scroll-vs-drag conflicts.
  return { delay: 180, tolerance: 12 };
}

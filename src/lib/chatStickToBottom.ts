/**
 * Returns true when the scroll container is within `thresholdPx` of the bottom.
 * Used for "stick to bottom" chat behavior without fighting manual scroll-up.
 */
export function isScrollNearBottom(
  el: Pick<HTMLElement, 'scrollTop' | 'scrollHeight' | 'clientHeight'>,
  thresholdPx = 80,
): boolean {
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  return distanceFromBottom <= thresholdPx;
}

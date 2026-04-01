/**
 * True when two lists contain the same items in the same order (by getId).
 * Used to avoid resetting @dnd-kit sortable state when parent re-renders with a new array reference.
 */
export function sameIdSequence<T>(prev: T[], next: T[], getId: (item: T) => string): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((item, i) => getId(item) === getId(next[i]));
}

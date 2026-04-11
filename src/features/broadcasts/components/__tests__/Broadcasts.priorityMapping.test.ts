import { describe, expect, it } from 'vitest';
import { mapCategoryToPriority, mapPriorityToCategory } from '../Broadcasts';

describe('Broadcasts priority/category mapping', () => {
  it('maps outgoing logistics category to canonical reminder priority', () => {
    expect(mapCategoryToPriority('logistics')).toBe('reminder');
    expect(mapCategoryToPriority('urgent')).toBe('urgent');
    expect(mapCategoryToPriority('chill')).toBe('fyi');
  });

  it('maps incoming legacy and canonical priorities to render categories', () => {
    expect(mapPriorityToCategory('important')).toBe('logistics');
    expect(mapPriorityToCategory('reminder')).toBe('logistics');
    expect(mapPriorityToCategory('urgent')).toBe('urgent');
    expect(mapPriorityToCategory('fyi')).toBe('chill');
  });
});

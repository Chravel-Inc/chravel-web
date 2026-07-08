import { describe, expect, it } from 'vitest';
import { getInitialTripTabFromSearch } from '../tripTabNavigation';

describe('getInitialTripTabFromSearch', () => {
  it('returns the tab from ?tab= when valid', () => {
    expect(getInitialTripTabFromSearch('?tab=calendar')).toBe('calendar');
    expect(getInitialTripTabFromSearch('?tab=tasks&focus=1')).toBe('tasks');
  });

  it('falls back to chat for unknown tabs', () => {
    expect(getInitialTripTabFromSearch('?tab=unknown')).toBe('chat');
    expect(getInitialTripTabFromSearch('')).toBe('chat');
  });
});

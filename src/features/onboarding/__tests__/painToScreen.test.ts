import { describe, it, expect } from 'vitest';
import { painToScreen, CAROUSEL_SCREEN } from '../lib/painToScreen';
import type { BiggestChaos } from '../types';

describe('painToScreen', () => {
  it('maps each biggest-chaos answer to the feature screen that solves it', () => {
    const cases: Array<[BiggestChaos, number]> = [
      ['no_schedule', CAROUSEL_SCREEN.calendar],
      ['miss_updates', CAROUSEL_SCREEN.chat],
      ['side_chats', CAROUSEL_SCREEN.polls],
      ['splitting_costs', CAROUSEL_SCREEN.payments],
      ['saved_places', CAROUSEL_SCREEN.places],
      ['lost_media', CAROUSEL_SCREEN.media],
      ['no_response', CAROUSEL_SCREEN.tasks],
    ];
    for (const [chaos, screen] of cases) {
      expect(painToScreen(chaos)).toBe(screen);
    }
  });

  it('defaults to Concierge when biggest chaos is unanswered (defensive fallback)', () => {
    expect(painToScreen(null)).toBe(CAROUSEL_SCREEN.concierge);
  });
});

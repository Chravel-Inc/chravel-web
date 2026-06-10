/**
 * Maps the user's stated biggest pain to the OnboardingCarousel screen that best
 * answers it, so the tour opens by showing the feature solving their problem.
 *
 * Carousel screen indices (see OnboardingCarousel.tsx `screens`):
 *   0 Welcome · 1 Chat · 2 Calendar · 3 Concierge · 4 Media ·
 *   5 Payments · 6 Places · 7 Polls · 8 Tasks · 9 FinalCTA
 */

import type { BiggestChaos } from '../types';

export const CAROUSEL_SCREEN = {
  welcome: 0,
  chat: 1,
  calendar: 2,
  concierge: 3,
  media: 4,
  payments: 5,
  places: 6,
  polls: 7,
  tasks: 8,
  finalCta: 9,
} as const;

const BIGGEST_CHAOS_TO_SCREEN: Record<BiggestChaos, number> = {
  no_schedule: CAROUSEL_SCREEN.calendar,
  miss_updates: CAROUSEL_SCREEN.chat,
  side_chats: CAROUSEL_SCREEN.polls,
  splitting_costs: CAROUSEL_SCREEN.payments,
  saved_places: CAROUSEL_SCREEN.places,
  lost_media: CAROUSEL_SCREEN.media,
  no_response: CAROUSEL_SCREEN.tasks,
};

/**
 * Resolve the carousel screen to open on from the user's "biggest chaos" answer.
 * That question is required before the result screen, so the null fallback is
 * defensive only — it leads with the Concierge ("What time is dinner Friday?"),
 * the most universally impressive screen.
 */
export function painToScreen(biggestChaos: BiggestChaos | null): number {
  if (biggestChaos) return BIGGEST_CHAOS_TO_SCREEN[biggestChaos];
  return CAROUSEL_SCREEN.concierge;
}

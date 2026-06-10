/**
 * Chaos score — a playful 0–100 "how chaotic was your last group trip" number.
 *
 * The score is intentionally generous so most respondents land high enough to feel
 * recognized ("your tools are scattered, not you"). Weights mirror the product spec.
 */

import type { ChaosSurveyAnswers, FrustrationLevel, ScrollPain } from '../types';

const FRUSTRATION_POINTS: Record<FrustrationLevel, number> = {
  every_time: 25,
  sometimes: 12,
  not_really: 0,
};

const SCROLL_PAIN_POINTS: Record<ScrollPain, number> = {
  yes_painful: 20,
  yes_findable: 10,
  no: 0,
};

const SCATTERED_APP_WEIGHT = 8;
const BIGGEST_CHAOS_POINTS = 15;
const MAX_SCORE = 100;

/**
 * Compute the chaos score from (possibly partial) answers. Unanswered fields
 * contribute zero, so the function is safe to call mid-survey for a live preview.
 */
export function computeChaosScore(answers: ChaosSurveyAnswers): number {
  const frustrationPoints = answers.frustration_level
    ? FRUSTRATION_POINTS[answers.frustration_level]
    : 0;

  const scatteredPoints = answers.scattered_apps.length * SCATTERED_APP_WEIGHT;

  const scrollPoints = answers.scroll_pain ? SCROLL_PAIN_POINTS[answers.scroll_pain] : 0;

  const chaosPoints = answers.biggest_chaos ? BIGGEST_CHAOS_POINTS : 0;

  const total = frustrationPoints + scatteredPoints + scrollPoints + chaosPoints;

  return Math.min(MAX_SCORE, total);
}

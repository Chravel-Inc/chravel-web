import { describe, it, expect } from 'vitest';
import { computeChaosScore } from '../lib/computeChaosScore';
import type { ChaosSurveyAnswers } from '../types';

const base: ChaosSurveyAnswers = {
  frustration_level: null,
  scattered_apps: [],
  scroll_pain: null,
  biggest_chaos: null,
  desired_solution: null,
};

describe('computeChaosScore', () => {
  it('returns 0 for an empty survey', () => {
    expect(computeChaosScore(base)).toBe(0);
  });

  it('matches the product spec example (25 + 5*8 + 20 + 15 = 100)', () => {
    const answers: ChaosSurveyAnswers = {
      frustration_level: 'every_time', // 25
      scattered_apps: ['group_texts', 'email', 'calendar', 'venmo', 'notes_docs'], // 5 * 8 = 40
      scroll_pain: 'yes_painful', // 20
      biggest_chaos: 'splitting_costs', // 15
      desired_solution: 'payment_tracking', // unscored
    };
    expect(computeChaosScore(answers)).toBe(100);
  });

  it('caps the score at 100', () => {
    const answers: ChaosSurveyAnswers = {
      frustration_level: 'every_time', // 25
      // 8 apps * 8 = 64
      scattered_apps: [
        'group_texts',
        'email',
        'calendar',
        'venmo',
        'notes_docs',
        'social_links',
        'photos',
        'forgot',
      ],
      scroll_pain: 'yes_painful', // 20
      biggest_chaos: 'no_schedule', // 15
      desired_solution: null,
    };
    // raw = 25 + 64 + 20 + 15 = 124 → capped to 100
    expect(computeChaosScore(answers)).toBe(100);
  });

  it('weights each field independently', () => {
    expect(computeChaosScore({ ...base, frustration_level: 'sometimes' })).toBe(12);
    expect(computeChaosScore({ ...base, scroll_pain: 'yes_findable' })).toBe(10);
    expect(computeChaosScore({ ...base, scattered_apps: ['email', 'calendar'] })).toBe(16);
    expect(computeChaosScore({ ...base, biggest_chaos: 'miss_updates' })).toBe(15);
    expect(computeChaosScore({ ...base, frustration_level: 'not_really' })).toBe(0);
  });
});

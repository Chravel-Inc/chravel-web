/**
 * Trip Chaos Diagnostic — shared types
 *
 * The survey captures five answers that map 1:1 to columns on the
 * `onboarding_responses` table. Option values are stable string keys (not labels)
 * so they survive copy changes and can be analyzed later.
 */

export type FrustrationLevel = 'every_time' | 'sometimes' | 'not_really';

export type ScatteredApp =
  | 'group_texts'
  | 'email'
  | 'calendar'
  | 'venmo'
  | 'notes_docs'
  | 'social_links'
  | 'photos'
  | 'forgot';

export type ScrollPain = 'yes_painful' | 'yes_findable' | 'no';

export type BiggestChaos =
  | 'no_schedule'
  | 'miss_updates'
  | 'side_chats'
  | 'splitting_costs'
  | 'saved_places'
  | 'lost_media'
  | 'no_response';

export type DesiredSolution =
  | 'shared_calendar'
  | 'links_reservations'
  | 'ai_summary'
  | 'polls'
  | 'payment_tracking'
  | 'announcements';

export type ChaosQuestionId =
  | 'frustration_level'
  | 'scattered_apps'
  | 'scroll_pain'
  | 'biggest_chaos'
  | 'desired_solution';

/**
 * In-progress answer state. Single-select fields are nullable until answered;
 * `scattered_apps` is always an array (possibly empty).
 */
export interface ChaosSurveyAnswers {
  frustration_level: FrustrationLevel | null;
  scattered_apps: ScatteredApp[];
  scroll_pain: ScrollPain | null;
  biggest_chaos: BiggestChaos | null;
  desired_solution: DesiredSolution | null;
}

/** Payload persisted to Supabase (user_id is filled server-side via auth.uid()). */
export interface ChaosSurveySubmission extends ChaosSurveyAnswers {
  chaos_score: number;
}

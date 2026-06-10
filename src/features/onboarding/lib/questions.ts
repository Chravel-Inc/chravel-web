/**
 * Trip Chaos Diagnostic — question configuration.
 *
 * Order here defines the survey flow. Each question's `id` matches a column on
 * `onboarding_responses`; each option `value` is a stable key (see types.ts).
 */

import type { ChaosQuestionId } from '../types';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface ChaosQuestion {
  id: ChaosQuestionId;
  type: 'single' | 'multi';
  /** The emotional hook headline. */
  prompt: string;
  /** Optional supporting line under the prompt. */
  subcopy?: string;
  options: QuestionOption[];
}

export const CHAOS_QUESTIONS: ChaosQuestion[] = [
  {
    id: 'frustration_level',
    type: 'single',
    prompt: 'Have you ever gotten frustrated planning a group trip?',
    options: [
      { value: 'every_time', label: 'Yes, every time' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'not_really', label: 'Not really' },
    ],
  },
  {
    id: 'scattered_apps',
    type: 'multi',
    prompt: "Where was your last trip's info scattered?",
    subcopy: 'Pick all that apply.',
    options: [
      { value: 'group_texts', label: 'Group texts' },
      { value: 'email', label: 'Email' },
      { value: 'calendar', label: 'Calendar' },
      { value: 'venmo', label: 'Venmo / Zelle' },
      { value: 'notes_docs', label: 'Notes / Google Docs' },
      { value: 'social_links', label: 'Instagram / TikTok links' },
      { value: 'photos', label: 'Photos / iCloud / Google Photos' },
      { value: 'forgot', label: 'Somewhere I forgot' },
    ],
  },
  {
    id: 'scroll_pain',
    type: 'single',
    prompt: 'Ever had to scroll through old texts to find trip info from weeks ago?',
    options: [
      { value: 'yes_painful', label: "Yes, and it's painful" },
      { value: 'yes_findable', label: 'Yes, but I usually find it' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'biggest_chaos',
    type: 'single',
    prompt: 'What usually causes the most chaos?',
    options: [
      { value: 'no_schedule', label: 'Nobody knows the schedule' },
      { value: 'miss_updates', label: 'People miss updates' },
      { value: 'side_chats', label: 'Too many side chats' },
      { value: 'splitting_costs', label: 'Splitting costs' },
      { value: 'saved_places', label: 'Finding saved places' },
      { value: 'lost_media', label: 'Photos and files getting lost' },
      { value: 'no_response', label: 'People not responding' },
    ],
  },
  {
    id: 'desired_solution',
    type: 'single',
    prompt: 'What would have helped most?',
    options: [
      { value: 'shared_calendar', label: 'One shared calendar' },
      { value: 'links_reservations', label: 'One place for links and reservations' },
      { value: 'ai_summary', label: 'AI summary of everything' },
      { value: 'polls', label: 'Polls to make decisions faster' },
      { value: 'payment_tracking', label: 'Payment tracking' },
      { value: 'announcements', label: "Announcements that don't get buried" },
    ],
  },
];

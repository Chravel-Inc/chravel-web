/**
 * Chaos Survey Store
 *
 * Tracks whether the Trip Chaos Diagnostic has been completed (or skipped) within
 * the current onboarding flow, plus the carousel screen the answers personalized to.
 *
 * Both the completion flag AND the personalized screen are cached in localStorage,
 * keyed PER USER, so that:
 *   - a refresh between the survey and the tour resumes at the tour on the same
 *     personalized screen (rather than re-asking or dropping to screen 0), and
 *   - a different user signing in on a shared device is NOT suppressed by the
 *     previous user's completion flag (avoids cross-user contamination).
 *
 * This is intentionally separate from the `has_seen_onboarding` flag (Supabase) —
 * that one is only set when the tour itself completes, preserving the existing
 * deep-link / pending-destination flow.
 */

import { create } from 'zustand';

const KEY_PREFIX = 'chravel_onboarding_survey';

interface PersistedSurveyState {
  completed: boolean;
  personalizedScreen: number | null;
}

const EMPTY_STATE: PersistedSurveyState = { completed: false, personalizedScreen: null };

/** Per-user storage key (falls back to a shared key for the anonymous case). */
function storageKey(userId: string | null): string {
  return userId ? `${KEY_PREFIX}_${userId}` : KEY_PREFIX;
}

function readPersisted(userId: string | null): PersistedSurveyState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedSurveyState>;
    return {
      completed: parsed.completed === true,
      personalizedScreen:
        typeof parsed.personalizedScreen === 'number' ? parsed.personalizedScreen : null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

export interface ChaosSurveyStoreState {
  /** Whether this user's survey state has been loaded yet (gate render until true). */
  isInitialized: boolean;
  /** Which user the current state was loaded for. */
  initializedUserId: string | null;
  surveyCompleted: boolean;
  /** Carousel screen to open the tour on; null = no personalization (start at 0). */
  personalizedScreen: number | null;

  /** Load the survey state for a given user (idempotent per user id). */
  initForUser: (userId: string | null) => void;
  /** Mark the survey done and record the personalized starting screen (or null on skip). */
  markCompleted: (personalizedScreen: number | null) => void;
  /** Reset state (for testing / re-running onboarding). */
  reset: () => void;
}

export const useChaosSurveyStore = create<ChaosSurveyStoreState>((set, get) => ({
  isInitialized: false,
  initializedUserId: null,
  surveyCompleted: false,
  personalizedScreen: null,

  initForUser: userId => {
    if (get().isInitialized && get().initializedUserId === userId) return;
    const persisted = readPersisted(userId);
    set({
      isInitialized: true,
      initializedUserId: userId,
      surveyCompleted: persisted.completed,
      personalizedScreen: persisted.personalizedScreen,
    });
  },

  markCompleted: personalizedScreen => {
    try {
      localStorage.setItem(
        storageKey(get().initializedUserId),
        JSON.stringify({ completed: true, personalizedScreen }),
      );
    } catch {
      // localStorage unavailable — completion still holds for this session via state
    }
    set({ surveyCompleted: true, personalizedScreen });
  },

  reset: () => {
    try {
      localStorage.removeItem(storageKey(get().initializedUserId));
    } catch {
      // ignore
    }
    set({
      isInitialized: false,
      initializedUserId: null,
      surveyCompleted: false,
      personalizedScreen: null,
    });
  },
}));

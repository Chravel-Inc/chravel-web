/**
 * Chaos Survey Store
 *
 * Tracks the user's onboarding path choice ("choose your own adventure": survey,
 * demo, or straight to the app), whether the Trip Chaos Diagnostic has been
 * completed, and the carousel screen the answers personalized to.
 *
 * Path, completion flag, AND personalized screen are cached in localStorage,
 * keyed PER USER, so that:
 *   - a refresh mid-flow resumes where the user left off (survey path stays on the
 *     survey, demo path stays on the tour, personalization is never dropped), and
 *   - a different user signing in on a shared device is NOT suppressed by the
 *     previous user's choices (avoids cross-user contamination).
 *
 * This is intentionally separate from the `has_seen_onboarding` flag (Supabase) —
 * that one is only set when the tour completes or the user skips onboarding
 * entirely, preserving the existing deep-link / pending-destination flow.
 */

import { create } from 'zustand';

const KEY_PREFIX = 'chravel_onboarding_survey';

/** Which onboarding door the user picked; null = still on the choice screen. */
export type OnboardingPath = 'survey' | 'demo' | null;

interface PersistedSurveyState {
  path: OnboardingPath;
  completed: boolean;
  personalizedScreen: number | null;
}

const EMPTY_STATE: PersistedSurveyState = {
  path: null,
  completed: false,
  personalizedScreen: null,
};

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
      path: parsed.path === 'survey' || parsed.path === 'demo' ? parsed.path : null,
      completed: parsed.completed === true,
      personalizedScreen:
        typeof parsed.personalizedScreen === 'number' ? parsed.personalizedScreen : null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

function writePersisted(userId: string | null, state: PersistedSurveyState): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // localStorage unavailable — state still holds for this session via the store
  }
}

export interface ChaosSurveyStoreState {
  /** Whether this user's survey state has been loaded yet (gate render until true). */
  isInitialized: boolean;
  /** Which user the current state was loaded for. */
  initializedUserId: string | null;
  /** The onboarding door the user picked; null = show the choice screen. */
  path: OnboardingPath;
  surveyCompleted: boolean;
  /** Carousel screen to open the tour on; null = no personalization (start at 0). */
  personalizedScreen: number | null;

  /** Load the survey state for a given user (idempotent per user id). */
  initForUser: (userId: string | null) => void;
  /** Record the chosen path (null returns the user to the choice screen). */
  setPath: (path: OnboardingPath) => void;
  /** Mark the survey done and record the personalized starting screen (or null on skip). */
  markCompleted: (personalizedScreen: number | null) => void;
  /** Reset state (for testing / re-running onboarding). */
  reset: () => void;
}

export const useChaosSurveyStore = create<ChaosSurveyStoreState>((set, get) => ({
  isInitialized: false,
  initializedUserId: null,
  path: null,
  surveyCompleted: false,
  personalizedScreen: null,

  initForUser: userId => {
    if (get().isInitialized && get().initializedUserId === userId) return;
    const persisted = readPersisted(userId);
    set({
      isInitialized: true,
      initializedUserId: userId,
      path: persisted.path,
      surveyCompleted: persisted.completed,
      personalizedScreen: persisted.personalizedScreen,
    });
  },

  setPath: path => {
    const { initializedUserId, surveyCompleted, personalizedScreen } = get();
    writePersisted(initializedUserId, {
      path,
      completed: surveyCompleted,
      personalizedScreen,
    });
    set({ path });
  },

  markCompleted: personalizedScreen => {
    const { initializedUserId, path } = get();
    writePersisted(initializedUserId, { path, completed: true, personalizedScreen });
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
      path: null,
      surveyCompleted: false,
      personalizedScreen: null,
    });
  },
}));

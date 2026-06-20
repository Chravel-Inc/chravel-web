import { beforeEach, describe, expect, it } from 'vitest';
import { useChaosSurveyStore } from '../hooks/useChaosSurveyStore';

const USER_A = 'user-aaaa';
const USER_B = 'user-bbbb';

describe('useChaosSurveyStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useChaosSurveyStore.getState().reset();
  });

  it('starts uninitialized with no path', () => {
    const s = useChaosSurveyStore.getState();
    expect(s.isInitialized).toBe(false);
    expect(s.path).toBeNull();
    expect(s.surveyCompleted).toBe(false);
    expect(s.personalizedScreen).toBeNull();
  });

  it('persists the chosen path and survives re-init for the same user', () => {
    useChaosSurveyStore.getState().initForUser(USER_A);
    useChaosSurveyStore.getState().setPath('survey');

    // Simulate a refresh: reset in-memory state, re-init for the same user.
    useChaosSurveyStore.setState({ isInitialized: false, initializedUserId: null, path: null });
    useChaosSurveyStore.getState().initForUser(USER_A);

    expect(useChaosSurveyStore.getState().path).toBe('survey');
  });

  it('persists completion + personalized screen across a refresh', () => {
    useChaosSurveyStore.getState().initForUser(USER_A);
    useChaosSurveyStore.getState().setPath('survey');
    useChaosSurveyStore.getState().markCompleted(5);

    useChaosSurveyStore.setState({
      isInitialized: false,
      initializedUserId: null,
      path: null,
      surveyCompleted: false,
      personalizedScreen: null,
    });
    useChaosSurveyStore.getState().initForUser(USER_A);

    const s = useChaosSurveyStore.getState();
    expect(s.path).toBe('survey');
    expect(s.surveyCompleted).toBe(true);
    expect(s.personalizedScreen).toBe(5);
  });

  it("does not leak one user's choices to another user on the same device", () => {
    useChaosSurveyStore.getState().initForUser(USER_A);
    useChaosSurveyStore.getState().setPath('demo');
    useChaosSurveyStore.getState().markCompleted(null);

    // A different user signs in — state must come up empty for them.
    useChaosSurveyStore.getState().initForUser(USER_B);

    const s = useChaosSurveyStore.getState();
    expect(s.initializedUserId).toBe(USER_B);
    expect(s.path).toBeNull();
    expect(s.surveyCompleted).toBe(false);
    expect(s.personalizedScreen).toBeNull();
  });

  it('setPath(null) returns the user to the choice screen and persists that', () => {
    useChaosSurveyStore.getState().initForUser(USER_A);
    useChaosSurveyStore.getState().setPath('survey');
    useChaosSurveyStore.getState().setPath(null);

    useChaosSurveyStore.setState({ isInitialized: false, initializedUserId: null });
    useChaosSurveyStore.getState().initForUser(USER_A);

    expect(useChaosSurveyStore.getState().path).toBeNull();
  });

  it('ignores malformed persisted JSON', () => {
    localStorage.setItem(`chravel_onboarding_survey_${USER_A}`, 'not-json{');
    useChaosSurveyStore.getState().initForUser(USER_A);

    const s = useChaosSurveyStore.getState();
    expect(s.isInitialized).toBe(true);
    expect(s.path).toBeNull();
    expect(s.surveyCompleted).toBe(false);
  });
});

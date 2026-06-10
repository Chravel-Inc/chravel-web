/**
 * Trip Chaos Diagnostic — public surface of the onboarding survey feature.
 */

export { TripChaosDiagnostic } from './components/TripChaosDiagnostic';
export { OnboardingChoiceScreen } from './components/OnboardingChoiceScreen';
export { useChaosSurveyStore } from './hooks/useChaosSurveyStore';
export type { OnboardingPath } from './hooks/useChaosSurveyStore';
export { computeChaosScore } from './lib/computeChaosScore';
export { painToScreen, CAROUSEL_SCREEN } from './lib/painToScreen';
export type { ChaosSurveyAnswers } from './types';

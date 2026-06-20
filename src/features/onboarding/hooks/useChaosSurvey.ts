/**
 * useChaosSurvey — local state machine for the Trip Chaos Diagnostic.
 *
 * Holds the current step, the in-progress answers, and derives the live chaos score.
 * No persistence here — submission is handled by useSubmitChaosSurvey, and completion
 * tracking by useChaosSurveyStore.
 */

import { useCallback, useMemo, useState } from 'react';
import { CHAOS_QUESTIONS } from '../lib/questions';
import { computeChaosScore } from '../lib/computeChaosScore';
import type { ChaosQuestionId, ChaosSurveyAnswers, ScatteredApp } from '../types';

const EMPTY_ANSWERS: ChaosSurveyAnswers = {
  frustration_level: null,
  scattered_apps: [],
  scroll_pain: null,
  biggest_chaos: null,
  desired_solution: null,
};

/** Index of the synthetic "result" step that follows the last question. */
export const RESULT_STEP = CHAOS_QUESTIONS.length;

export function useChaosSurvey() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ChaosSurveyAnswers>(EMPTY_ANSWERS);

  const isResultStep = step === RESULT_STEP;
  const currentQuestion = isResultStep ? null : CHAOS_QUESTIONS[step];

  /** Set a single-select answer (frustration_level, scroll_pain, biggest_chaos, desired_solution). */
  const setSingleAnswer = useCallback((id: ChaosQuestionId, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  /** Toggle a value in the multi-select scattered_apps answer. */
  const toggleScatteredApp = useCallback((value: ScatteredApp) => {
    setAnswers(prev => {
      const has = prev.scattered_apps.includes(value);
      return {
        ...prev,
        scattered_apps: has
          ? prev.scattered_apps.filter(v => v !== value)
          : [...prev.scattered_apps, value],
      };
    });
  }, []);

  /** Whether the current question has a usable answer (gates the Continue button). */
  const isCurrentAnswered = useMemo(() => {
    if (!currentQuestion) return true;
    if (currentQuestion.id === 'scattered_apps') {
      return answers.scattered_apps.length > 0;
    }
    return answers[currentQuestion.id] !== null;
  }, [currentQuestion, answers]);

  const goNext = useCallback(() => {
    setStep(s => Math.min(RESULT_STEP, s + 1));
  }, []);

  const goPrev = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
  }, []);

  const chaosScore = useMemo(() => computeChaosScore(answers), [answers]);

  return {
    step,
    totalQuestions: CHAOS_QUESTIONS.length,
    currentQuestion,
    isResultStep,
    answers,
    chaosScore,
    isCurrentAnswered,
    setSingleAnswer,
    toggleScatteredApp,
    goNext,
    goPrev,
  };
}

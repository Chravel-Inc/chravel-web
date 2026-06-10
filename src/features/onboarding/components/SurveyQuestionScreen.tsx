/**
 * SurveyQuestionScreen — renders one diagnostic question as full-width selectable
 * option cards. Single-select uses radio semantics; multi-select uses checkboxes.
 * The entire row is tappable (label-wrapped control) for comfortable touch targets.
 */

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ChaosQuestion } from '../lib/questions';
import type { ChaosSurveyAnswers, ScatteredApp } from '../types';

interface SurveyQuestionScreenProps {
  question: ChaosQuestion;
  answers: ChaosSurveyAnswers;
  onSelectSingle: (id: ChaosQuestion['id'], value: string) => void;
  onToggleMulti: (value: ScatteredApp) => void;
}

export const SurveyQuestionScreen = ({
  question,
  answers,
  onSelectSingle,
  onToggleMulti,
}: SurveyQuestionScreenProps) => {
  const optionBaseClass =
    'flex items-center gap-3 w-full rounded-enterprise border px-4 py-3.5 cursor-pointer transition-colors text-left';

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink-1 mb-1">{question.prompt}</h1>
      {question.subcopy && <p className="text-sm text-ink-2 mb-5">{question.subcopy}</p>}
      {!question.subcopy && <div className="mb-5" />}

      {question.type === 'single' ? (
        <RadioGroup
          value={(answers[question.id] as string | null) ?? ''}
          onValueChange={value => onSelectSingle(question.id, value)}
          className="gap-2.5"
        >
          {question.options.map(option => {
            const selected = answers[question.id] === option.value;
            const id = `${question.id}-${option.value}`;
            return (
              <Label
                key={option.value}
                htmlFor={id}
                className={cn(
                  optionBaseClass,
                  selected
                    ? 'border-primary bg-primary/10 text-ink-1'
                    : 'border-hairline-strong bg-surface-1 text-ink-1 hover:bg-surface-1/70',
                )}
              >
                <RadioGroupItem id={id} value={option.value} />
                <span className="text-base font-medium">{option.label}</span>
              </Label>
            );
          })}
        </RadioGroup>
      ) : (
        <div className="grid gap-2.5">
          {question.options.map(option => {
            const value = option.value as ScatteredApp;
            const selected = answers.scattered_apps.includes(value);
            const id = `${question.id}-${option.value}`;
            return (
              <Label
                key={option.value}
                htmlFor={id}
                className={cn(
                  optionBaseClass,
                  selected
                    ? 'border-primary bg-primary/10 text-ink-1'
                    : 'border-hairline-strong bg-surface-1 text-ink-1 hover:bg-surface-1/70',
                )}
              >
                <Checkbox id={id} checked={selected} onCheckedChange={() => onToggleMulti(value)} />
                <span className="text-base font-medium">{option.label}</span>
              </Label>
            );
          })}
        </div>
      )}
    </div>
  );
};

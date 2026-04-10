import { beforeEach, describe, expect, it, vi } from 'vitest';

let actionPlanMode: string | undefined;

vi.stubGlobal('Deno', {
  env: {
    get: (key: string) => {
      if (key === 'CONCIERGE_ACTION_PLAN_MODE') {
        return actionPlanMode;
      }
      return undefined;
    },
  },
});

import { assemblePrompt } from '../concierge/promptAssembler.ts';

const tripContext = {
  tripMetadata: {
    id: 'trip_123',
    name: 'Spring Break',
    destination: 'Miami',
    startDate: '2026-03-12',
    endDate: '2026-03-18',
  },
  places: {
    tripBasecamp: null,
  },
  userPreferences: null,
  calendar: [],
};

describe('Prompt Assembler — action plan mode', () => {
  beforeEach(() => {
    actionPlanMode = undefined;
  });

  it('keeps write-intent tool requirements in tool_first mode', () => {
    actionPlanMode = 'tool_first';

    const prompt = assemblePrompt({
      queryClass: 'task_action',
      tripContext,
    });

    expect(prompt).toContain('you MUST include a `createTask` tool call');
    expect(prompt).toContain('call all required tools directly and sequentially');
  });

  it('does not leak legacy mandatory JSON preamble in tool_first mode', () => {
    actionPlanMode = 'tool_first';

    const prompt = assemblePrompt({
      queryClass: 'booking_reservation',
      tripContext,
    });

    expect(prompt).not.toContain('You MUST output an Action Plan JSON block first');
    expect(prompt).not.toContain('```json');
    expect(prompt).toContain('Do NOT output any Action Plan JSON preamble before tool calls.');
  });

  it('reduces write-class prompt length in tool_first mode', () => {
    actionPlanMode = 'legacy';
    const legacyPrompt = assemblePrompt({
      queryClass: 'task_action',
      tripContext,
    });

    actionPlanMode = 'tool_first';
    const toolFirstPrompt = assemblePrompt({
      queryClass: 'task_action',
      tripContext,
    });

    expect(toolFirstPrompt.length).toBeLessThan(legacyPrompt.length);
  });
});

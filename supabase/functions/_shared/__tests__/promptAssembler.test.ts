import { describe, expect, it } from 'vitest';
import { assemblePrompt } from '../concierge/promptAssembler.ts';

const tripContext = {
  tripMetadata: {
    id: 'trip-1',
    name: 'Team Tour',
    destination: 'Los Angeles',
    startDate: '2026-04-01',
    endDate: '2026-04-07',
    type: 'pro',
  },
  collaborators: [],
  teamsAndChannels: { memberRoles: [], channels: [] },
  messages: [],
  calendar: [],
  tasks: [],
  payments: [],
  polls: [],
  broadcasts: [],
  places: { savedPlaces: [] },
  media: { files: [], links: [] },
};

describe('promptAssembler action plan mode', () => {
  it('defaults to tool-first mode without JSON action plan mandate', () => {
    const prompt = assemblePrompt({
      queryClass: 'task_action',
      tripContext: tripContext as any,
    });

    expect(prompt).not.toContain('ACTION PLAN FORMAT');
    expect(prompt).toContain('MULTI-TOOL EXECUTION');
  });
});

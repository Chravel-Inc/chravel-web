import { describe, expect, it } from 'vitest';

import {
  isPendingActionEnvelope,
  normalizeToolResult,
} from '../concierge/toolResultContracts.ts';

describe('toolResultContracts', () => {
  it('recognizes pending action envelopes', () => {
    const payload = {
      pending: true,
      pendingActionId: 'pending-1',
      actionType: 'create_task',
      message: 'Please confirm this task.',
    };

    expect(isPendingActionEnvelope(payload)).toBe(true);
  });

  it('fails closed when write tools skip the pending action envelope', () => {
    const result = normalizeToolResult('createTask', {
      success: true,
      actionType: 'create_task',
      message: 'Task created',
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/pending action envelope/i);
  });

  it('preserves valid pending results for write tools', () => {
    const result = normalizeToolResult('createTask', {
      pending: true,
      pendingActionId: 'pending-2',
      actionType: 'create_task',
      message: 'Please confirm this task.',
    });

    expect(result).toEqual({
      success: true,
      pending: true,
      pendingActionId: 'pending-2',
      actionType: 'create_task',
      message: 'Please confirm this task.',
    });
  });

  it('marks non-object tool payloads invalid', () => {
    const result = normalizeToolResult('searchPlaces', 'bad-payload');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid result payload/i);
  });
});

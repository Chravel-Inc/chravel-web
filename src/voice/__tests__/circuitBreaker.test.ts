import { beforeEach, describe, expect, it } from 'vitest';
import {
  classifyError,
  getState,
  isOpen,
  recordFailure,
  recordSuccess,
  reset,
} from '../circuitBreaker';

describe('voice circuitBreaker', () => {
  beforeEach(() => {
    localStorage.clear();
    reset();
  });

  it('opens only after threshold fatal failures (5)', () => {
    recordFailure('err-1', {}, 'fatal');
    recordFailure('err-2', {}, 'fatal');
    recordFailure('err-3', {}, 'fatal');
    recordFailure('err-4', {}, 'fatal');
    expect(isOpen()).toBe(false);

    expect(recordFailure('err-5', {}, 'fatal')).toBe(true);
    expect(isOpen()).toBe(true);
  });

  it('resets on success after being open', () => {
    for (let i = 0; i < 5; i++) recordFailure(`err-${i}`, {}, 'fatal');
    expect(isOpen()).toBe(true);

    recordSuccess();
    expect(isOpen()).toBe(false);
    expect(getState().failureCount).toBe(0);
  });

  it('resets fully with reset()', () => {
    recordFailure('a', {}, 'fatal');
    recordFailure('b', {}, 'fatal');
    reset();
    const state = getState();
    expect(state.failureCount).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(state.phase).toBe('closed');
  });

  // ── Error classification tests ──────────────────────────────────────────

  it('classifies mic permission denial as user error', () => {
    expect(classifyError('NotAllowedError: Permission denied')).toBe('user');
    expect(classifyError('User denied microphone access')).toBe('user');
    expect(classifyError('Not authenticated')).toBe('user');
  });

  it('classifies transient errors correctly', () => {
    expect(classifyError('429 Too Many Requests')).toBe('transient');
    expect(classifyError('Rate limit exceeded')).toBe('transient');
    expect(classifyError('Connection timeout')).toBe('transient');
    expect(classifyError('reconnect_failed')).toBe('transient');
    expect(classifyError('503 Service temporarily unavailable')).toBe('transient');
  });

  it('classifies unknown errors as fatal', () => {
    expect(classifyError('Gemini API internal error')).toBe('fatal');
    expect(classifyError('agent_error')).toBe('fatal');
  });

  it('user errors do not count toward threshold', () => {
    recordFailure('NotAllowedError: Permission denied', {}, 'user');
    recordFailure('NotAllowedError: Permission denied', {}, 'user');
    recordFailure('NotAllowedError: Permission denied', {}, 'user');
    recordFailure('NotAllowedError: Permission denied', {}, 'user');
    recordFailure('NotAllowedError: Permission denied', {}, 'user');
    recordFailure('NotAllowedError: Permission denied', {}, 'user');
    expect(isOpen()).toBe(false);
    expect(getState().failureCount).toBe(0);
  });

  it('transient errors count at 0.5x weight', () => {
    // 10 transient failures = 5.0 weighted count (threshold is 5)
    for (let i = 0; i < 9; i++) {
      recordFailure('reconnect_failed', {}, 'transient');
    }
    expect(isOpen()).toBe(false);

    expect(recordFailure('reconnect_failed', {}, 'transient')).toBe(true);
    expect(isOpen()).toBe(true);
  });

  it('mixed error types accumulate correctly', () => {
    // 3 fatal (3.0) + 3 transient (1.5) = 4.5 < 5 threshold
    recordFailure('fatal-1', {}, 'fatal');
    recordFailure('fatal-2', {}, 'fatal');
    recordFailure('fatal-3', {}, 'fatal');
    recordFailure('timeout-1', {}, 'transient');
    recordFailure('timeout-2', {}, 'transient');
    recordFailure('timeout-3', {}, 'transient');
    expect(isOpen()).toBe(false);

    // 1 more fatal brings it to 5.5 >= 5
    expect(recordFailure('fatal-4', {}, 'fatal')).toBe(true);
    expect(isOpen()).toBe(true);
  });

  it('auto-classifies errors from message when no category provided', () => {
    // Should auto-classify as transient (contains "429")
    recordFailure('Server returned 429 Too Many Requests');
    expect(getState().failureCount).toBe(0.5);
  });
});

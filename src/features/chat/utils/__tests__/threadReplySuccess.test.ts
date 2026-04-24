import { describe, expect, it, vi } from 'vitest';
import { createThreadReplySuccessState, handleThreadReplySuccessCta } from '../threadReplySuccess';

describe('thread reply success CTA helpers', () => {
  it('creates CTA state only for thread replies', () => {
    expect(createThreadReplySuccessState('parent-1')).toEqual({ parentMessageId: 'parent-1' });
    expect(createThreadReplySuccessState(null)).toBeNull();
    expect(createThreadReplySuccessState(undefined)).toBeNull();
  });

  it('opens parent thread and clears CTA state when CTA is clicked', () => {
    const onViewThread = vi.fn();

    const nextState = handleThreadReplySuccessCta({ parentMessageId: 'parent-2' }, onViewThread);

    expect(onViewThread).toHaveBeenCalledWith('parent-2');
    expect(nextState).toBeNull();
  });

  it('is a no-op when CTA state is missing', () => {
    const onViewThread = vi.fn();

    const nextState = handleThreadReplySuccessCta(null, onViewThread);

    expect(onViewThread).not.toHaveBeenCalled();
    expect(nextState).toBeNull();
  });
});

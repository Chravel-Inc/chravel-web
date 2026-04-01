import { describe, expect, it } from 'vitest';
import { sameIdSequence } from './sameIdSequence';

describe('sameIdSequence', () => {
  const getId = (x: { id: string }) => x.id;

  it('returns true when ids match in order', () => {
    const a = [{ id: '1' }, { id: '2' }];
    const b = [{ id: '1' }, { id: '2' }];
    expect(sameIdSequence(a, b, getId)).toBe(true);
  });

  it('returns false when order differs', () => {
    const a = [{ id: '1' }, { id: '2' }];
    const b = [{ id: '2' }, { id: '1' }];
    expect(sameIdSequence(a, b, getId)).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(sameIdSequence([{ id: '1' }], [{ id: '1' }, { id: '2' }], getId)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { resolveGradualFeatureEnabled } from '../featureFlags';

const KEY = 'my_feature';

type FlagRow = NonNullable<Parameters<typeof resolveGradualFeatureEnabled>[0]>;

function makeRow(overrides: Partial<FlagRow> = {}): FlagRow {
  return {
    key: KEY,
    enabled: true,
    rollout_percentage: 0,
    cohort_domains: null,
    cohort_user_ids: null,
    ...overrides,
  };
}

// Mirror of the module-private hash so the test can compute the expected per-user
// bucket and assert the percentage boundary precisely.
function bucketFor(flagKey: string, userId: string): number {
  let hash = 0;
  const str = `${flagKey}:${userId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

describe('resolveGradualFeatureEnabled', () => {
  it('is OFF when the flag row is absent (fail closed)', () => {
    expect(resolveGradualFeatureEnabled(null, { id: 'u-1' }, KEY)).toBe(false);
  });

  it('is OFF when the flag is disabled, even at 100% or with a cohort match', () => {
    expect(
      resolveGradualFeatureEnabled(
        makeRow({ enabled: false, rollout_percentage: 100, cohort_domains: ['chravelapp.com'] }),
        { id: 'u-1', email: 'a@chravelapp.com' },
        KEY,
      ),
    ).toBe(false);
  });

  it('grants cohort domains regardless of a 0% rollout (case-insensitive)', () => {
    const row = makeRow({ rollout_percentage: 0, cohort_domains: ['chravelapp.com'] });
    expect(resolveGradualFeatureEnabled(row, { id: 'u-1', email: 'eng@chravelapp.com' }, KEY)).toBe(
      true,
    );
    expect(resolveGradualFeatureEnabled(row, { id: 'u-2', email: 'ENG@ChravelApp.COM' }, KEY)).toBe(
      true,
    );
    expect(resolveGradualFeatureEnabled(row, { id: 'u-3', email: 'someone@gmail.com' }, KEY)).toBe(
      false,
    );
  });

  it('grants named cohort user ids regardless of a 0% rollout', () => {
    const row = makeRow({ rollout_percentage: 0, cohort_user_ids: ['beta-1', 'beta-2'] });
    expect(resolveGradualFeatureEnabled(row, { id: 'beta-2' }, KEY)).toBe(true);
    expect(resolveGradualFeatureEnabled(row, { id: 'nobody' }, KEY)).toBe(false);
  });

  it('grants everyone at 100%, including anonymous callers', () => {
    const row = makeRow({ rollout_percentage: 100 });
    expect(resolveGradualFeatureEnabled(row, { id: 'u-1' }, KEY)).toBe(true);
    expect(resolveGradualFeatureEnabled(row, { id: null, email: null }, KEY)).toBe(true);
    expect(resolveGradualFeatureEnabled(row, null, KEY)).toBe(true);
  });

  it('excludes anonymous users from a partial rollout', () => {
    const row = makeRow({ rollout_percentage: 50 });
    expect(resolveGradualFeatureEnabled(row, { id: null }, KEY)).toBe(false);
    expect(resolveGradualFeatureEnabled(row, undefined, KEY)).toBe(false);
  });

  it('buckets a user deterministically at the percentage boundary (strict <)', () => {
    const userId = 'user-boundary-test';
    const b = bucketFor(KEY, userId); // 0..99
    // At rollout == bucket the user is OUT; at bucket + 1 they are IN.
    expect(
      resolveGradualFeatureEnabled(makeRow({ rollout_percentage: b }), { id: userId }, KEY),
    ).toBe(false);
    expect(
      resolveGradualFeatureEnabled(makeRow({ rollout_percentage: b + 1 }), { id: userId }, KEY),
    ).toBe(true);
  });

  it('is deterministic — identical inputs yield identical results', () => {
    const row = makeRow({ rollout_percentage: 40 });
    const first = resolveGradualFeatureEnabled(row, { id: 'ramp-user' }, KEY);
    const second = resolveGradualFeatureEnabled(row, { id: 'ramp-user' }, KEY);
    expect(first).toBe(second);
  });

  it('clamps out-of-range rollout percentages', () => {
    expect(
      resolveGradualFeatureEnabled(makeRow({ rollout_percentage: 150 }), { id: 'u-1' }, KEY),
    ).toBe(true);
    expect(
      resolveGradualFeatureEnabled(makeRow({ rollout_percentage: -10 }), { id: 'u-1' }, KEY),
    ).toBe(false);
  });
});

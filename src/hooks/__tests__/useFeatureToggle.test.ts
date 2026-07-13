import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFeatureToggle } from '../useFeatureToggle';

describe('useFeatureToggle showTeam', () => {
  it('shows Team for pro trips even when enabled_features omits "team"', () => {
    // Both default enabled_features lists predate 'team' and omit it — the
    // Team tab must not disappear for those real pro trips.
    const { result } = renderHook(() =>
      useFeatureToggle({
        trip_type: 'pro',
        enabled_features: ['chat', 'calendar', 'media'],
      }),
    );
    expect(result.current.showTeam).toBe(true);
  });

  it('shows Team for pro trips with no enabled_features at all', () => {
    const { result } = renderHook(() => useFeatureToggle({ trip_type: 'pro' }));
    expect(result.current.showTeam).toBe(true);
  });

  it('hides Team for event trips', () => {
    const { result } = renderHook(() =>
      useFeatureToggle({ trip_type: 'event', enabled_features: ['chat', 'team'] }),
    );
    expect(result.current.showTeam).toBe(false);
  });

  it('hides Team for consumer trips', () => {
    const { result } = renderHook(() => useFeatureToggle({ trip_type: 'consumer' }));
    expect(result.current.showTeam).toBe(false);
  });

  it('still honors enabled_features for non-intrinsic features', () => {
    const { result } = renderHook(() =>
      useFeatureToggle({ trip_type: 'pro', enabled_features: ['chat'] }),
    );
    expect(result.current.showChat).toBe(true);
    expect(result.current.showPolls).toBe(false);
  });
});

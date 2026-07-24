import { describe, it, expect } from 'vitest';
import { shouldRequireAuth, createMockDemoUser } from '../authGate';
import type { DemoView } from '@/store/demoModeStore';

/**
 * Security-invariant regression tests for the demo-mode auth gate (audit C1/C2).
 *
 * `shouldRequireAuth` is a CLIENT-SIDE presentation gate only — it decides whether
 * the UI prompts for sign-in. It is NOT the security boundary: real data is
 * protected by RLS (demo mode holds no Supabase session, so requests run on the
 * anon key with auth.uid() = null) and by the numeric-vs-UUID demo-id split
 * (see demoModeNoLeak.test.ts). These tests lock the gate's intended behavior so a
 * refactor can't silently widen it, and confirm the demo user object carries no
 * privilege.
 */
describe('shouldRequireAuth', () => {
  it('never requires auth in app-preview (investor/marketing demo shell)', () => {
    expect(shouldRequireAuth('app-preview', null)).toBe(false);
    expect(shouldRequireAuth('app-preview', { id: 'anything' })).toBe(false);
  });

  it('never requires auth for a logged-in user', () => {
    expect(shouldRequireAuth('off', { id: 'user-1' })).toBe(false);
    expect(shouldRequireAuth('marketing', { id: 'user-1' })).toBe(false);
  });

  it('requires auth for protected features in marketing mode without a user', () => {
    expect(shouldRequireAuth('marketing', null)).toBe(true);
  });

  it('does not require auth when demo is off and no user (public surface)', () => {
    expect(shouldRequireAuth('off', null)).toBe(false);
  });

  it('treats every non-app-preview view without a user by the marketing rule', () => {
    const views: DemoView[] = ['off', 'marketing', 'app-preview'];
    for (const view of views) {
      expect(shouldRequireAuth(view, null)).toBe(view === 'marketing');
    }
  });
});

describe('createMockDemoUser', () => {
  it('uses a random, non-guessable id per call', () => {
    const a = createMockDemoUser();
    const b = createMockDemoUser();
    expect(typeof a.id).toBe('string');
    expect(a.id.length).toBeGreaterThan(0);
    expect(a.id).not.toBe(b.id);
  });

  it('is a fixed demo identity with no privilege escalation fields', () => {
    const demo = createMockDemoUser() as Record<string, unknown>;
    expect(demo.email).toBe('demo@chravel.com');
    // The lightweight demo mock must never carry entitlement/role fields that
    // could grant write/admin UI affordances (audit C2).
    expect(demo.isPro).toBeUndefined();
    expect(demo.proRole).toBeUndefined();
    expect(demo.permissions).toBeUndefined();
  });
});

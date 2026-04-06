import { describe, it, expect } from 'vitest';
import { buildSessionDerivedUser } from '../sessionDerivedUser';
import type { User as SupabaseUser } from '@supabase/supabase-js';

describe('buildSessionDerivedUser', () => {
  it('uses email local-part when metadata is empty', () => {
    const u = {
      id: 'u1',
      email: 'jane@example.com',
      user_metadata: {},
    } as SupabaseUser;

    const app = buildSessionDerivedUser(u);
    expect(app.id).toBe('u1');
    expect(app.displayName).toBe('jane');
    expect(app.permissions).toEqual(['read']);
    expect(app.isPro).toBe(false);
  });

  it('prefers display_name from metadata', () => {
    const u = {
      id: 'u2',
      email: 'jane@example.com',
      user_metadata: { display_name: 'Jane D.' },
    } as SupabaseUser;

    expect(buildSessionDerivedUser(u).displayName).toBe('Jane D.');
  });
});

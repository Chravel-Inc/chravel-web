import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

describe('2026-07-23 trip cover-editors UPDATE privilege escalation fix', () => {
  const migration = read(
    'supabase/migrations/20260723190000_pin_trip_cover_editors_update_policy.sql',
  );
  const priorCoverEditors = read(
    'supabase/migrations/20260703132320_95ce0fa3-f225-45f6-85df-d8e01e12731d.sql',
  );

  it('documents the unpinned cover-editors policy that created the escape hatch', () => {
    expect(priorCoverEditors).toContain('Trip cover editors can update cover image');
    expect(priorCoverEditors).toContain('public.can_edit_trip_cover(id, auth.uid())');
    // Prior policy had no jsonb / column pinning — only the helper gate.
    expect(priorCoverEditors).not.toContain('to_jsonb(trips.*)');
  });

  it('drops the unpinned cover-editors policy and restores allowlisted details UPDATE', () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Trip cover editors can update cover image" ON public.trips',
    );
    expect(migration).toContain('Authorized users can update trip details');
    expect(migration).toContain('to_jsonb(trips.*)');
    // Sensitive fields must remain pinned (absent from the editable subtraction set).
    expect(migration).not.toContain("- 'created_by'");
    expect(migration).not.toContain("- 'trip_type'");
    expect(migration).not.toContain("- 'is_archived'");
  });

  it('hardens can_edit_trip_cover against former members and NULL trip_type', () => {
    expect(migration).toContain("COALESCE(t.trip_type, 'consumer') = 'consumer'");
    expect(migration).toContain("COALESCE(t.trip_type, 'consumer') IN ('pro', 'event')");
    expect(migration).toContain("(tm.status IS NULL OR tm.status = 'active')");
  });

  it('keeps safe EditTripModal / hide fields editable', () => {
    for (const field of [
      'name',
      'description',
      'destination',
      'start_date',
      'end_date',
      'card_color',
      'organizer_display_name',
      'categories',
      'is_hidden',
      'cover_image_url',
      'cover_display_mode',
      'updated_at',
    ]) {
      expect(migration).toContain(`- '${field}'`);
    }
  });
});

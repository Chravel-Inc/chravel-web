import { describe, it, expect } from 'vitest';
import { canRemoveRosterMember } from '../CollaboratorsModal';

// Regression guard for the self-removal contract bug: the roster's per-member remove
// button routes to remove_trip_member_safe, which rejects self-removal by design
// ("use leave_trip"). So the button must never render for the current user — leaving a
// trip is handled by the header's dedicated "Leave Trip" action (leave_trip).
describe('canRemoveRosterMember', () => {
  const base = { currentUserId: 'me', tripCreatorId: 'creator', hasRemoveHandler: true };

  it('never offers self-removal — even to an admin (would call the wrong RPC and error)', () => {
    expect(canRemoveRosterMember({ ...base, collaboratorId: 'me', isAdmin: true })).toBe(false);
    expect(canRemoveRosterMember({ ...base, collaboratorId: 'me', isAdmin: false })).toBe(false);
  });

  it('never removes the trip creator', () => {
    expect(canRemoveRosterMember({ ...base, collaboratorId: 'creator', isAdmin: true })).toBe(
      false,
    );
  });

  it('admins can remove other members; non-admins cannot', () => {
    expect(canRemoveRosterMember({ ...base, collaboratorId: 'other', isAdmin: true })).toBe(true);
    expect(canRemoveRosterMember({ ...base, collaboratorId: 'other', isAdmin: false })).toBe(false);
  });

  it('is disabled entirely when no remove handler is provided', () => {
    expect(
      canRemoveRosterMember({
        ...base,
        collaboratorId: 'other',
        isAdmin: true,
        hasRemoveHandler: false,
      }),
    ).toBe(false);
  });
});

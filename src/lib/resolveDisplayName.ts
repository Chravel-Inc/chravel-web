/**
 * Internal sentinel returned when no profile name could be resolved.
 * Uses a prefix that cannot collide with real user-entered names.
 * Consumers should compare against this constant — never against
 * a user-visible string like "Former Member".
 */
export const UNRESOLVED_NAME_SENTINEL = '__chravel_unresolved_name__';

/**
 * Neutral user-facing label for the rare case where no name is recoverable from
 * any source — not even a stored snapshot.
 *
 * This intentionally replaces the old "Former Member" label. A person's name must
 * never be swapped for a membership status: leaving a trip or deleting an account
 * does not change who wrote a message or who was on the roster. Name snapshots
 * (`trip_members.display_name_snapshot`, `trip_chat_messages.sender_display_name`)
 * keep the real name available in both cases, so this is a last resort only.
 */
export const UNKNOWN_MEMBER_LABEL = 'Chravel User';

/**
 * @deprecated Use {@link UNKNOWN_MEMBER_LABEL}. Kept as an alias so any straggling
 * import keeps compiling, but it no longer renders "Former Member" to users.
 */
export const FORMER_MEMBER_LABEL = UNKNOWN_MEMBER_LABEL;

/**
 * Resolves the display name for a trip member, preferring the durable snapshot
 * captured on `trip_members` over a live profile read.
 *
 * The snapshot is what makes names survive both `profiles` RLS (which only lets a
 * user read their own row) and account deletion.
 */
export function resolveMemberDisplayName(input: {
  snapshotName?: string | null;
  profile?: ProfileForDisplay | null;
}): string {
  const snapshot = input.snapshotName?.trim();
  if (snapshot) return snapshot;

  return getEffectiveDisplayName(input.profile, UNKNOWN_MEMBER_LABEL);
}

/** Profile shape for name resolution (from profiles_public or raw profile) */
export interface ProfileForDisplay {
  resolved_display_name?: string | null;
  real_name?: string | null;
  display_name?: string | null;
  name_preference?: 'real' | 'display' | null;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  show_job_title?: boolean | null;
}

/**
 * Client-side effective display name formula.
 * Use when profile comes from non-DB source (e.g. useAuth user).
 * For profiles from profiles_public, resolved_display_name is already correct.
 *
 * DISPLAY_NAME_FORMULA:
 *   if (name_preference == 'display' AND display_name non-empty) -> display_name
 *   else if (real_name non-empty) -> real_name
 *   else if (display_name non-empty) -> display_name
 *   else -> fallback
 */
export function getEffectiveDisplayName(
  profile: ProfileForDisplay | null | undefined,
  fallback: string = UNRESOLVED_NAME_SENTINEL,
): string {
  if (!profile) return fallback;

  // Prefer DB-computed resolved_display_name (from profiles_public)
  if (profile.resolved_display_name) return profile.resolved_display_name;

  const pref = profile.name_preference ?? 'display';
  const real = profile.real_name?.trim();
  const display = profile.display_name?.trim();

  if (pref === 'display' && display) return display;
  if (real) return real;
  if (display) return display;

  const first = profile.first_name?.trim();
  const last = profile.last_name?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;

  return fallback;
}

/**
 * Resolves a user's display name from profile data.
 *
 * Priority:
 *   1. resolved_display_name (DB-computed, respects name_preference)
 *   2. display_name (explicit user-chosen name)
 *   3. first_name + last_name (auto-populated from auth)
 *   4. first_name alone
 *   5. UNRESOLVED_NAME_SENTINEL (caller decides how to display)
 *
 * Callers should check `result === UNRESOLVED_NAME_SENTINEL` to decide
 * whether to fall back to a snapshot name, "Former Member", or "System".
 */
export function resolveDisplayName(
  profile: ProfileForDisplay | null | undefined,
  fallback: string = UNRESOLVED_NAME_SENTINEL,
): string {
  return getEffectiveDisplayName(profile, fallback);
}

/**
 * Returns display name with optional job title in parentheses when show_job_title is enabled.
 * Used in organization directory and contact information.
 */
export function formatDisplayNameWithJobTitle(
  profile: ProfileForDisplay | null | undefined,
  fallback: string = UNRESOLVED_NAME_SENTINEL,
): string {
  const name = getEffectiveDisplayName(profile, fallback);
  if (name === fallback) return name;
  if (profile?.show_job_title && profile?.job_title?.trim()) {
    return `${name} (${profile.job_title.trim()})`;
  }
  return name;
}

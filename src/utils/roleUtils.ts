/**
 * Pro trip role limit: Maximum 10 roles per Pro trip
 * Increased from 5 to accommodate larger organizations (e.g., college football programs)
 * with multiple distinct groups: players, coaches, media, press, staff, etc.
 */
export const MAX_ROLES_PER_TRIP = 10;

/**
 * Get unique roles from a list of participants
 */
export const extractUniqueRoles = (participants: Array<{ role: string }>): string[] => {
  const roles = participants.map(p => p.role).filter(Boolean);
  return [...new Set(roles)].sort();
};

/**
 * Validate a role name
 */
export const validateRole = (role: string): { isValid: boolean; error?: string } => {
  if (!role || !role.trim()) {
    return { isValid: false, error: 'Role cannot be empty' };
  }

  if (role.length > 50) {
    return { isValid: false, error: 'Role name must be 50 characters or less' };
  }

  if (!/^[a-zA-Z0-9\s\-&.,()]+$/.test(role)) {
    return { isValid: false, error: 'Role contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Normalize role name (trim whitespace, proper case)
 */
export const normalizeRole = (role: string): string => {
  return role.trim().replace(/\s+/g, ' ');
};

/**
 * Role badge class for regular (non-admin, non-coordinator) team roles. Neutral
 * glass treatment — gold is reserved for admin/coordinator pills so those retain
 * visual priority over a plain team role.
 */
export const ROLE_BADGE_CLASS = 'bg-white/10 text-ink-2 border border-white/15';

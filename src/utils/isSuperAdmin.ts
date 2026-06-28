/**
 * Canonical Super Admin Check
 *
 * Single source of truth for determining if a user is a super admin.
 * Super admins get unlimited access to all features.
 */

import { SUPER_ADMIN_EMAILS } from '@/constants/admins';

/**
 * Check if an email belongs to a super admin
 */
export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};
